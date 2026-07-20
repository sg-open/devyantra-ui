<template>
  <div class="home-view">
    <!-- Segmented Control Navigation -->
    <div class="seg-navigation">
      <div class="seg-track" role="tablist" aria-label="Developer tools navigation">
        <router-link
          v-for="(tool, index) in tools"
          :key="index"
          :to="tool.route"
          @keydown.arrow-right="navigateTab(index + 1)"
          @keydown.arrow-left="navigateTab(index - 1)"
          @keydown.home="navigateTab(0)"
          @keydown.end="navigateTab(tools.length - 1)"
          :class="['seg-item', { active: $route.path === tool.route }]"
          :aria-label="tool.title"
          :aria-selected="$route.path === tool.route"
          :aria-controls="`panel-${index}`"
          :id="`tab-${index}`"
          role="tab"
        >
          <i :class="tool.icon" aria-hidden="true"></i>
          <span>{{ tool.title }}</span>
        </router-link>
      </div>
    </div>

    <!-- Active Tool Content -->
    <div class="tool-content" role="tabpanel" :id="`panel-${activeTabIndex}`" :aria-labelledby="`tab-${activeTabIndex}`">
      <ErrorBoundary>
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </ErrorBoundary>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSEO } from '@/composables/useSEO'
import { SEO_CONFIG } from '@/config/seo'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { TOOLS, toolPath } from '@/tools/registry'

const router = useRouter()
const route = useRoute()

const { setMetaTags, addOrganizationSchema, addWebSiteSchema } = useSEO()

onMounted(() => {
  // Set homepage SEO
  // Only set homepage-level SEO when on the root path (before redirect).
  // Child routes handle their own title/description/canonical via the router guard.
  if (router.currentRoute.value.path === '/') {
    setMetaTags({
      title: SEO_CONFIG.site.title,
      description: SEO_CONFIG.site.description,
      keywords: SEO_CONFIG.site.keywords,
      ogTitle: SEO_CONFIG.site.title,
      ogDescription: SEO_CONFIG.site.description,
      ogType: 'website',
      ogImage: `${window.location.origin}/og-image.png`,
      twitterTitle: SEO_CONFIG.site.title,
      twitterDescription: SEO_CONFIG.site.description,
      twitterCard: 'summary_large_image',
      twitterImage: `${window.location.origin}/og-image.png`
    })
  }

  // Add organization and website schemas for homepage
  addOrganizationSchema()
  addWebSiteSchema()

  // If on home page, redirect to first tool
  if (router.currentRoute.value.path === '/') {
    router.push('/tools/text-compare')
  }
})

// Keyboard navigation for tabs
const navigateTab = (targetIndex: number) => {
  const maxIndex = tools.length - 1
  let newIndex = targetIndex
  if (targetIndex < 0) {
    newIndex = maxIndex
  } else if (targetIndex > maxIndex) {
    newIndex = 0
  }

  // Navigate to the tool route
  router.push(tools[newIndex]!.route)

  // Focus the newly active tab
  nextTick(() => {
    const activeTabElement = document.querySelector(`#tab-${newIndex}`) as HTMLElement
    activeTabElement?.focus()
  })
}

const tools = TOOLS.map(t => ({ title: t.name, subtitle: t.description, icon: t.icon, route: toolPath(t) }))

const activeTabIndex = computed(() => {
  const idx = tools.findIndex(t => t.route === route.path)
  return idx >= 0 ? idx : 0
})
</script>

<style scoped>
.home-view {
  width: 100%;
}

/* Segmented control navigation — sticky below header */
.seg-navigation {
  position: sticky;
  top: 48px;
  z-index: 50;
  background: var(--dt-background);
  border-bottom: 1px solid var(--dt-border);
  padding: 8px 0;
  margin: 0 calc(-1 * var(--space-lg));
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

.seg-track {
  display: flex;
  gap: 2px;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-lg, 10px);
  padding: 3px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.seg-track::-webkit-scrollbar {
  display: none;
}

.seg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: var(--dt-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md, 8px);
  white-space: nowrap;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.seg-item i {
  font-size: 14px;
}

.seg-item:hover {
  color: var(--dt-text-primary);
  background: var(--dt-surface-3);
}

.seg-item.active {
  color: var(--dt-brand);
  background: var(--dt-surface-1);
  font-weight: 600;
  border-color: var(--dt-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.seg-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Simplified page transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 100ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tool-content {
  padding-top: var(--space-lg);
}

@media (max-width: 768px) {
  .seg-navigation {
    margin: 0 calc(-1 * var(--space-md));
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .seg-item {
    font-size: 12px;
    padding: 6px 10px;
  }

  .seg-item i {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .seg-navigation {
    margin: 0 calc(-1 * var(--space-sm));
    padding-left: var(--space-sm);
    padding-right: var(--space-sm);
  }

  .seg-item span {
    display: none;
  }

  .seg-item i {
    font-size: 16px;
  }

  .seg-item {
    padding: 8px 12px;
  }
}
</style>
