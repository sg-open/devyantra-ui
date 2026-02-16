#!/usr/bin/env node
/**
 * Converts public/og-image.svg to public/og-image.png (1200x630)
 * Run: node scripts/generate-og-image.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svg = readFileSync(join(root, 'public/og-image.svg'), 'utf-8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true }
})

const png = resvg.render().asPng()
writeFileSync(join(root, 'public/og-image.png'), png)
console.log('Generated public/og-image.png (1200x630)')
