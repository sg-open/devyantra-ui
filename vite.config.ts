import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const SITE_URL = 'https://devyantra.app'

const SITE_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/tools/text-compare', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/format-text', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/hash-generator', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/base64-tools', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/jwt-decoder', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/timestamp-converter', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/character-count', priority: '0.9', changefreq: 'monthly' },
  { path: '/tools/delimiter', priority: '0.9', changefreq: 'monthly' },
  { path: '/feedback', priority: '0.3', changefreq: 'yearly' },
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
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
