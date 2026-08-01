import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'
import { TOOLS } from '@/tools/registry'

describe('AppFooter', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(AppFooter, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a :href="to"><slot/></a>',
            props: ['to']
          }
        }
      }
    })
  })

  describe('Semantic HTML Structure', () => {
    it('uses semantic footer element with correct role', () => {
      const footer = wrapper.find('footer')
      expect(footer.exists()).toBe(true)
      expect(footer.attributes('role')).toBe('contentinfo')
      expect(footer.attributes('aria-label')).toBe('Site footer')
    })

    it('has footer class', () => {
      const footer = wrapper.find('footer')
      expect(footer.classes()).toContain('footer')
    })
  })

  describe('Content', () => {
    it('has footer container', () => {
      const container = wrapper.find('.footer-container')
      expect(container.exists()).toBe(true)
    })

    it('has credit text', () => {
      const credit = wrapper.find('.footer-credit')
      expect(credit.exists()).toBe(true)
      expect(credit.text()).toContain('DevYantra')
      expect(credit.text()).toContain('Free developer tools')
    })

    it('has compact credit text', () => {
      const credit = wrapper.find('.footer-credit')
      expect(credit.text().length).toBeLessThan(50)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on footer', () => {
      const footer = wrapper.find('footer')
      expect(footer.attributes('role')).toBe('contentinfo')
      expect(footer.attributes('aria-label')).toBe('Site footer')
    })
  })

  describe('Registry parity', () => {
    it('renders every tool exactly once across the two tool navs', () => {
      const links = wrapper.findAll('.footer-section nav a')
      const toolLinks = links.filter(l => {
        const href = l.attributes('href')
        return href && href.startsWith('/tools/')
      })
      expect(toolLinks).toHaveLength(TOOLS.length)
      const hrefs = toolLinks.map(l => l.attributes('href'))
      expect(new Set(hrefs).size).toBe(TOOLS.length)
    })
  })
})

export {}
