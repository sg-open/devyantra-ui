#!/usr/bin/env node
/**
 * Converts public/favicon.svg into the PWA icon set (resvg, mirroring generate-og-image.js):
 *   - public/icon-192.png          192x192, icon rendered as-is
 *   - public/icon-512.png          512x512, icon rendered as-is
 *   - public/icon-512-maskable.png 512x512, icon at 80% centered on the site background
 *     color (#F5F0E8) so OS icon masks (circle, squircle, ...) never clip the artwork.
 * Run: node scripts/generate-icons.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const BACKGROUND = '#F5F0E8'
const MASKABLE_SIZE = 512
const SAFE_ZONE_RATIO = 0.8 // icon occupies 80% of the maskable canvas, centered

const svg = readFileSync(join(root, 'public/favicon.svg'), 'utf-8')

function renderPng(svgString, size) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: true }
  })
  return resvg.render().asPng()
}

function writeIcon(filename, svgString, size) {
  writeFileSync(join(root, 'public', filename), renderPng(svgString, size))
  console.log(`Generated public/${filename} (${size}x${size})`)
}

writeIcon('icon-192.png', svg, 192)
writeIcon('icon-512.png', svg, 512)

// favicon.svg's inner markup assumes a 0 0 32 32 canvas (see its viewBox), so
// it can be scaled + translated directly into a larger canvas without touching
// coordinates: wrap it in a new root SVG with a solid background rect and a
// <g> that scales it down to the maskable safe zone, centered.
const innerMarkup = svg
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')

const iconSize = MASKABLE_SIZE * SAFE_ZONE_RATIO
const scale = iconSize / 32
const offset = (MASKABLE_SIZE - iconSize) / 2

const maskableSvg = `<svg width="${MASKABLE_SIZE}" height="${MASKABLE_SIZE}" viewBox="0 0 ${MASKABLE_SIZE} ${MASKABLE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${MASKABLE_SIZE}" height="${MASKABLE_SIZE}" fill="${BACKGROUND}"/>
  <g transform="translate(${offset},${offset}) scale(${scale})">
    ${innerMarkup}
  </g>
</svg>`

writeIcon('icon-512-maskable.png', maskableSvg, MASKABLE_SIZE)
