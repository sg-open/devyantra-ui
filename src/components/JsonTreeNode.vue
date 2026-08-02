<!--
  JsonTreeNode.vue — recursive tree row for the JSON Explorer (spec D3).

  One instance renders one JsonNode (src/lib/jsonModel.ts): an expand/collapse
  toggle (containers only, `aria-expanded`), a clickable key that copies this
  node's JSON path via copyWithFeedback, a type badge, and a preview/value.
  Children render as further JsonTreeNode instances — Vue 3.5's <script
  setup> SFCs can reference themselves by their inferred (filename) name, so
  no manual recursive registration is needed.

  Search (`searchMatches`/`searchExpand`) is computed ONCE up in
  JsonExplorer.vue (via jsonModel's searchJsonTree) and threaded down as
  plain props through every level — this component never re-derives matching
  itself, it only reads the two Sets by this node's own `path`.
-->
<template>
  <div class="jx-node" :class="`jx-node--${node.type}`">
    <div class="jx-row">
      <button
        v-if="isContainer"
        type="button"
        class="jx-toggle"
        :aria-expanded="isExpanded"
        :aria-label="(isExpanded ? 'Collapse ' : 'Expand ') + (displayKey || 'root')"
        @click="toggle"
      >
        <i class="pi" :class="isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'" aria-hidden="true"></i>
      </button>
      <span v-else class="jx-toggle-spacer" aria-hidden="true"></span>

      <template v-if="node.key !== null">
        <button
          type="button"
          class="jx-key"
          :class="{ 'jx-match': isMatch }"
          :data-path="node.path"
          :title="node.path"
          @click="copyPath"
        >{{ displayKey }}</button>
        <span class="jx-colon" aria-hidden="true">:</span>
      </template>

      <span class="jx-type-badge" :class="`jx-type-badge--${node.type}`">{{ node.type }}</span>
      <span
        class="jx-value"
        :class="[`jx-value--${node.type}`, { 'jx-match': isMatch }]"
        :data-path="node.path"
      >{{ node.preview }}</span>
    </div>

    <div v-if="isContainer && isExpanded && node.children!.length > 0" class="jx-children">
      <JsonTreeNode
        v-for="child in visibleChildren"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :is-array-item="node.type === 'array'"
        :search-matches="searchMatches"
        :search-expand="searchExpand"
      />
      <button
        v-if="remainingCount > 0"
        type="button"
        class="jx-more"
        @click="showMore"
      >
        Show {{ nextPageSize.toLocaleString() }} more ({{ remainingCount.toLocaleString() }} remaining)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { JsonNode } from '@/lib/jsonModel'
import { useClipboard } from '@/composables/useClipboard'

interface Props {
  node: JsonNode
  depth: number
  /** True when this node's own `key` is an array index rather than an object property name — controls "[0]" vs "name" display only, never the copied path (always `node.path`). */
  isArrayItem: boolean
  searchMatches: Set<string>
  searchExpand: Set<string>
}

const props = defineProps<Props>()

const { copyWithFeedback } = useClipboard()

const isContainer = computed(() => props.node.type === 'object' || props.node.type === 'array')

const displayKey = computed(() => {
  if (props.node.key === null) return ''
  return props.isArrayItem ? `[${props.node.key}]` : props.node.key
})

// Render cap (F1): a container with more children than this renders only
// the first CHILDREN_PAGE_SIZE, plus a "show more" row to reveal the next
// page — a flat array of hundreds of thousands of items must never mount
// one component per item up front (that's what froze the tab: ~900k
// mounted components for a 1.8MB flat array with no cap at all).
const CHILDREN_PAGE_SIZE = 1000

// Default-expanded rule (component contract): a container starts open when
// ITS OWN depth is <= 2 (root = 0) AND it has at most 200 children — a
// large node (> 200 children) starts collapsed regardless of depth, so an
// eagerly-expanded huge array can't itself defeat the render cap above by
// auto-opening every node down to depth 2. Set once per instance — neither
// depth nor node.children ever change for a mounted node, so this never
// needs to be a computed.
const localExpanded = ref(props.depth <= 2 && (props.node.children?.length ?? 0) <= 200)

// Search-forced expansion ORs in on top of the manual/default state so an
// active search always reveals its matches, even under a node the user
// collapsed by hand; clearing the query (which empties searchExpand) hands
// control back to whatever the user last toggled.
const isExpanded = computed(() => localExpanded.value || props.searchExpand.has(props.node.path))

const isMatch = computed(() => props.searchMatches.has(props.node.path))

const toggle = (): void => {
  localExpanded.value = !localExpanded.value
}

// How many of this node's children are currently mounted — starts at one
// page, grows by one page per "show more" click. A plain per-instance ref
// (not derived from anything reactive on `node`) is enough: `node.children`
// never changes size for a mounted node.
const visibleCount = ref(Math.min(CHILDREN_PAGE_SIZE, props.node.children?.length ?? 0))

const visibleChildren = computed(() => props.node.children?.slice(0, visibleCount.value) ?? [])

const remainingCount = computed(() => (props.node.children?.length ?? 0) - visibleCount.value)

// The size of the NEXT page specifically (the last page is often smaller
// than CHILDREN_PAGE_SIZE) — keeps the button's "Show N more" number honest
// about exactly how many a click is about to reveal.
const nextPageSize = computed(() => Math.min(CHILDREN_PAGE_SIZE, remainingCount.value))

const showMore = (): void => {
  visibleCount.value = Math.min(visibleCount.value + CHILDREN_PAGE_SIZE, props.node.children?.length ?? 0)
}

// Search must never point at an UNMOUNTED child (verifier follow-up): a
// match at a direct-child index >= visibleCount would force-expand this
// node's ancestors (searchExpand) while the matched row itself stayed
// beyond the page boundary — silently invisible. Whenever the search sets
// change, grow visibleCount just enough to cover the HIGHEST direct child
// the search needs rendered: one that matched itself (searchMatches), or a
// container that must be expanded because a deeper descendant matched
// (searchExpand). Growth only — clearing the search never shrinks the page
// back, matching how manual "show more" growth also persists.
watch(
  () => [props.searchMatches, props.searchExpand] as const,
  ([matches, expand]) => {
    const children = props.node.children
    if (!children || children.length <= visibleCount.value) return
    if (matches.size === 0 && expand.size === 0) return
    // Scan from the top down to the current boundary: the first hit IS the
    // highest index the search needs, so the loop can stop there.
    for (let i = children.length - 1; i >= visibleCount.value; i--) {
      const path = children[i]!.path
      if (matches.has(path) || expand.has(path)) {
        visibleCount.value = i + 1
        return
      }
    }
  },
  { immediate: true }
)

const copyPath = (): void => {
  void copyWithFeedback(props.node.path, 'Path')
}
</script>

<style scoped>
.jx-node {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.jx-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-height: 1.75rem;
  border-radius: var(--radius-sm, 4px);
}

.jx-row:hover {
  background: var(--dt-surface-2);
}

.jx-toggle,
.jx-toggle-spacer {
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
}

.jx-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--dt-text-tertiary);
  cursor: pointer;
  border-radius: 3px;
}

.jx-toggle:hover {
  color: var(--dt-brand);
  background: var(--dt-surface-3);
}

.jx-toggle i {
  font-size: 0.7rem;
}

.jx-key {
  border: none;
  background: transparent;
  padding: 1px 4px;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: var(--font-weight-semibold);
  color: var(--dt-text-primary);
  cursor: pointer;
  border-radius: 3px;
}

.jx-key:hover {
  background: rgba(var(--dt-brand-rgb), 0.15);
  color: var(--dt-brand);
  text-decoration: underline;
}

.jx-colon {
  color: var(--dt-text-tertiary);
}

.jx-type-badge {
  flex: 0 0 auto;
  padding: 0 6px;
  font-size: 0.65rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 20px;
  line-height: 1.5;
}

.jx-type-badge--object {
  background: rgba(var(--dt-brand-rgb), 0.14);
  color: var(--dt-brand);
}

.jx-type-badge--array {
  background: var(--dt-surface-3);
  color: var(--dt-text-secondary);
}

.jx-type-badge--string {
  background: rgba(46, 125, 50, 0.14);
  color: var(--dt-success);
}

.jx-type-badge--number {
  background: rgba(212, 130, 10, 0.14);
  color: var(--dt-warning);
}

.jx-type-badge--boolean {
  background: rgba(198, 40, 40, 0.12);
  color: var(--dt-danger);
}

.jx-type-badge--null {
  background: var(--dt-surface-2);
  color: var(--dt-text-tertiary);
}

.jx-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dt-text-secondary);
}

.jx-value--string {
  color: var(--dt-success);
}

.jx-value--number {
  color: var(--dt-warning);
}

.jx-value--boolean {
  color: var(--dt-danger);
}

.jx-match {
  background: rgba(var(--dt-brand-rgb), 0.3);
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(var(--dt-brand-rgb), 0.4);
}

.jx-children {
  margin-left: 0.6rem;
  padding-left: 0.65rem;
  border-left: 1px dashed var(--dt-border);
}

.jx-more {
  display: inline-flex;
  align-items: center;
  margin: var(--space-xs) 0;
  padding: 4px 10px;
  border: 1px dashed var(--dt-border);
  border-radius: var(--radius-md, 6px);
  background: transparent;
  color: var(--dt-brand);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.jx-more:hover {
  background: var(--dt-brand-light);
}
</style>
