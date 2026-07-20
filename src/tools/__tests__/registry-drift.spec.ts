// Pins the router to the registry: every ToolDef in TOOLS must have a
// corresponding /tools/* route whose name, path, and SEO meta match the
// registry verbatim, and no /tools/* route may exist that isn't backed by
// a ToolDef. Mounts nothing — inspects router.getRoutes() only.
import { describe, it, expect } from 'vitest'
import router from '@/router'
import { TOOLS, toolPath } from '@/tools/registry'

describe('router / registry drift', () => {
  const routes = router.getRoutes()

  it('every tool has a matching route (name, path, meta.title, meta.toolCategory)', () => {
    for (const t of TOOLS) {
      const route = routes.find((r) => r.name === t.slug)
      expect(route, `expected a route named "${t.slug}"`).toBeDefined()
      expect(route!.path, `path for "${t.slug}"`).toBe(toolPath(t))
      expect(route!.meta?.title, `meta.title for "${t.slug}"`).toBe(t.metaTitle)
      expect(route!.meta?.toolCategory, `meta.toolCategory for "${t.slug}"`).toBe(t.toolCategory)
    }
  })

  it('has no /tools/* route that is not in TOOLS', () => {
    const toolPaths = new Set(TOOLS.map(toolPath))
    const strayRoutes = routes
      .filter((r) => r.path.startsWith('/tools/'))
      .map((r) => r.path)
      .filter((p) => !toolPaths.has(p))

    expect(strayRoutes).toEqual([])
  })
})
