// @vitest-environment node
// (Env override only — assertions below are unmodified/brief-verbatim. Under
// the project-default jsdom env, Vite rewrites `new URL(x, import.meta.url)`
// to an http://localhost dev-server URL, which fs.readFileSync then rejects.
// See task-1-report.md for the full root-cause writeup.)
import { describe, it, expect } from 'vitest'
import { TOOLS, PAGES, toolPath } from '../registry'
import { SEO_CONFIG } from '@/config/seo'

describe('tool registry invariants', () => {
  it('has exactly 8 tools with unique slugs and paths', () => {
    expect(TOOLS).toHaveLength(8)
    expect(new Set(TOOLS.map(t => t.slug)).size).toBe(8)
    expect(new Set(TOOLS.map(toolPath)).size).toBe(8)
  })

  it('every seoKey resolves in SEO_CONFIG.tools', () => {
    for (const t of TOOLS) {
      expect(SEO_CONFIG.tools[t.seoKey as keyof typeof SEO_CONFIG.tools], t.seoKey).toBeDefined()
    }
  })

  it('every icon is a PrimeIcons class', () => {
    for (const t of TOOLS) expect(t.icon).toMatch(/^pi pi-[a-z-]+$/)
  })

  it('meta strings are non-empty and titles carry the site suffix', () => {
    for (const t of TOOLS) {
      expect(t.metaTitle).toContain('| DEVYANTRA')
      expect(t.metaDescription.length).toBeGreaterThan(50)
      expect(t.metaKeywords.length).toBeGreaterThan(10)
    }
  })

  it('footer groups partition all tools 4/4', () => {
    expect(TOOLS.filter(t => t.footerGroup === 'text')).toHaveLength(4)
    expect(TOOLS.filter(t => t.footerGroup === 'encoding')).toHaveLength(4)
  })

  it('pages include feedback and privacy', () => {
    expect(PAGES.map(p => p.slug).sort()).toEqual(['feedback', 'privacy'])
  })

  it('routed reflects which pages have a live route (feedback yes, privacy not yet)', () => {
    const routed = Object.fromEntries(PAGES.map(p => [p.slug, p.routed]))
    expect(routed.feedback).toBe(true)
    expect(routed.privacy).toBe(false)
  })

  it('module is pure data (no vue imports)', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(new URL('../registry.ts', import.meta.url), 'utf8'))
    expect(src).not.toMatch(/from ['"]vue/)
    expect(src).not.toMatch(/import\.meta\.env/)
  })
})
