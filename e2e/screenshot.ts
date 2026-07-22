// Ad-hoc screenshot helper for visual checks against the running app (e.g.
// comparing a screen to its Figma frame). Boots headless Chromium at the
// desktop target width and writes a PNG.
//
// Usage:
//   pnpm shot <route> [outfile]
//   pnpm shot /ai-agents/configuration .shots/config.png
//
// Assumes a dev server is already running on PORT (start one with `pnpm dev`,
// or run `pnpm e2e` which boots its own). Output dir `.shots/` is gitignored.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const PORT = Number(process.env.PORT ?? 5199)
const route = process.argv[2] ?? '/'
const outfile = resolve(process.argv[3] ?? `.shots/${route.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'home'}.png`)

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' })
  await mkdir(dirname(outfile), { recursive: true })
  await page.screenshot({ path: outfile, fullPage: true })
  console.log(`Wrote ${outfile}`)
} finally {
  await browser.close()
}
