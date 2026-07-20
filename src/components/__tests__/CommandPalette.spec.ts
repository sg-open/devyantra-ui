import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CommandPalette from '../CommandPalette.vue'
import { TOOLS } from '@/tools/registry'

const RECENTS_KEY = 'devyantra:palette:recents'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

// CommandPalette's root is <Teleport to="body">; stubbing teleport renders its
// slot content in place instead of portaling to document.body, so the normal
// wrapper.find()/trigger() API can see it (verified: without this stub,
// wrapper.find() sees only the teleport anchor comments).
async function openPalette(): Promise<VueWrapper> {
  const wrapper = mount(CommandPalette, {
    props: { open: false },
    global: { stubs: { teleport: true } }
  })
  await wrapper.setProps({ open: true })
  return wrapper
}

const itemLabels = (wrapper: VueWrapper) =>
  wrapper.findAll('.palette-item-label').map(el => el.text())

const findItemByLabel = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('.palette-item').find(w => w.text().includes(label))

describe('CommandPalette', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    pushMock.mockClear()
  })

  it('renders every registry tool plus the three built-in actions on open with an empty query', async () => {
    const wrapper = await openPalette()
    expect(wrapper.findAll('.palette-item')).toHaveLength(TOOLS.length + 3)

    const labels = itemLabels(wrapper)
    for (const tool of TOOLS) expect(labels).toContain(tool.name)
    expect(labels).toContain('Toggle Theme')
    expect(labels).toContain('Copy Current URL')
    expect(labels).toContain('Feedback')
  })

  it('fuzzy-matches an abbreviation against label+description (query "jwt")', async () => {
    const wrapper = await openPalette()
    await wrapper.find('.palette-input').setValue('jwt')

    const items = wrapper.findAll('.palette-item')
    expect(items).toHaveLength(1)
    expect(items[0]!.text()).toContain('JWT Decoder')
  })

  it('ranks fuzzy results by score across label+description, not registry order (query "tc")', async () => {
    // NOTE: the task brief's example says 'tc' -> first item Text Compare. Verified
    // directly against the frozen fuzzyScore (landed in Task 1) + this registry data,
    // that does NOT hold once descriptions are folded into the search key:
    // "tc" scores an equal 6 raw points (word-boundary 't' + word-boundary 'c') against
    // both "Timestamp Unix & ISO converter" (30 chars) and "Text Compare Compare & diff
    // text" (32 chars). fuzzyScore divides by target length, so the shorter combined
    // string ("Timestamp") wins the tie under fuzzy.ts's documented "shorter targets
    // win ties" rule. Asserting verified actual behavior here; flagged in the task
    // report for awareness.
    const wrapper = await openPalette()
    await wrapper.find('.palette-input').setValue('tc')

    const labels = itemLabels(wrapper)
    expect(labels[0]).toBe('Timestamp')
    expect(labels[1]).toBe('Text Compare')
  })

  it('shows "No results found" for a query matching nothing', async () => {
    const wrapper = await openPalette()
    await wrapper.find('.palette-input').setValue('xyznonexistent')

    expect(wrapper.findAll('.palette-item')).toHaveLength(0)
    expect(wrapper.find('.palette-empty').exists()).toBe(true)
  })

  it('shows recents first, in recency order, under a "Recent" section label, on empty query', async () => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(['hash-generator', 'jwt-decoder']))
    const wrapper = await openPalette()

    const labels = itemLabels(wrapper)
    expect(labels[0]).toBe('Hash Generator')
    expect(labels[1]).toBe('JWT Decoder')

    const sectionLabels = wrapper.findAll('.palette-section-label')
    const sectionTexts = sectionLabels.map(el => el.text())
    expect(sectionTexts).toContain('Recent')
    expect(sectionTexts).toContain('All')
    for (const el of sectionLabels) expect(el.attributes('aria-hidden')).toBe('true')
  })

  it('renders no section labels when there are no recents', async () => {
    const wrapper = await openPalette()
    expect(wrapper.findAll('.palette-section-label')).toHaveLength(0)
  })

  it('persists an executed command to recents before navigating', async () => {
    const wrapper = await openPalette()
    const delimiterItem = findItemByLabel(wrapper, 'Delimiter')
    expect(delimiterItem).toBeTruthy()

    await delimiterItem!.trigger('click')

    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
    expect(stored).toEqual(['delimiter'])
    expect(pushMock).toHaveBeenCalledWith('/tools/delimiter')
  })

  it('moves a re-executed command back to the front instead of duplicating it', async () => {
    const wrapper = await openPalette()
    const click = async (label: string) => {
      const item = findItemByLabel(wrapper, label)
      await item!.trigger('click')
    }

    await click('Delimiter')
    await click('Text Compare')
    await click('Delimiter')

    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
    expect(stored).toEqual(['delimiter', 'text-compare'])
  })

  it('keeps the keyboard model over the flat filtered list when section labels are present', async () => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(['hash-generator', 'jwt-decoder']))
    const wrapper = await openPalette()
    const items = () => wrapper.findAll('.palette-item')

    expect(items()[0]!.classes()).toContain('selected')

    await wrapper.find('.palette-input').trigger('keydown', { key: 'ArrowDown' })
    expect(items()[1]!.classes()).toContain('selected')
    expect(items()[1]!.text()).toContain('JWT Decoder')

    await wrapper.find('.palette-input').trigger('keydown', { key: 'ArrowUp' })
    expect(items()[0]!.classes()).toContain('selected')
  })
})
