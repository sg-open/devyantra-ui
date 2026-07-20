import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

import { TOOLS, PAGES, toolPath } from './src/tools/registry'

const SITE_URL = 'https://devyantra.app'

// Derived from the registry rather than hand-maintained: tools always ship a
// route, pages only once `routed` is true — see registry.ts.
const SITE_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  ...TOOLS.map((t) => ({ path: toolPath(t), priority: t.sitemapPriority, changefreq: 'monthly' })),
  ...PAGES.filter((p) => p.routed).map((p) => ({ path: p.path, priority: p.sitemapPriority, changefreq: p.changefreq })),
]

function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    closeBundle() {
      const today = new Date().toISOString().split('T')[0]
      const urls = SITE_ROUTES.map((route) => {
        return `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
      }).join('\n\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls}

</urlset>
`
      const outDir = resolve(__dirname, 'dist')
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap, 'utf-8')
      console.log('\x1b[32m%s\x1b[0m', `  sitemap.xml generated with ${SITE_ROUTES.length} URLs`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    sitemapPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        globIgnores: ['**/og-image.*'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
