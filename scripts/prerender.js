#!/usr/bin/env node
/**
 * Pre-renders all tool routes to static HTML after build.
 * Uses Playwright (already a dev dependency) to render each page
 * and saves the fully-rendered HTML so crawlers get complete content.
 *
 * Run: node scripts/prerender.js
 * Expects `dist/` to exist (run `npm run build-only` first).
 */
import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import handler from 'serve-handler'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')
const PROD_ORIGIN = 'https://devyantra.app'
const LOCAL_ORIGIN = 'http://localhost:4567'

const ROUTES = [
  '/tools/text-compare',
  '/tools/format-text',
  '/tools/hash-generator',
  '/tools/base64-tools',
  '/tools/jwt-decoder',
  '/tools/timestamp-converter',
  '/tools/character-count',
  '/tools/delimiter',
  '/feedback',
]

async function prerender() {
  if (!existsSync(distDir)) {
    console.error('dist/ not found. Run "npm run build-only" first.')
    process.exit(1)
  }

  // Start a static file server for the dist directory
  const server = createServer((req, res) => {
    return handler(req, res, {
      public: distDir,
      rewrites: [{ source: '**', destination: '/index.html' }],
    })
  })

  await new Promise((resolve) => server.listen(4567, resolve))
  console.log('Preview server running on http://localhost:4567')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  let rendered = 0

  for (const route of ROUTES) {
    const page = await context.newPage()
    const url = `http://localhost:4567${route}`

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
      // Wait a bit for Vue to mount and SEO composables to run
      await page.waitForTimeout(500)

      let html = await page.content()

      // Replace localhost URLs with production domain in all meta tags
      html = html.replaceAll(LOCAL_ORIGIN, PROD_ORIGIN)

      // Create directory structure in dist
      const outPath = resolve(distDir, route.slice(1), 'index.html')
      const outDir = dirname(outPath)
      mkdirSync(outDir, { recursive: true })
      writeFileSync(outPath, html, 'utf-8')

      rendered++
      console.log(`  [${rendered}/${ROUTES.length}] ${route}`)
    } catch (err) {
      console.error(`  Failed: ${route} — ${err.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  server.close()

  console.log(`\nPre-rendered ${rendered}/${ROUTES.length} routes into dist/`)
}

prerender().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
