// Icono 512×512 para Google Play: el icono completo sin esquinas redondeadas (Play aplica su propia máscara).
import { chromium } from 'playwright-core'
const BASE = 'http://localhost:5199/'
const OUT = '/home/claude/store'
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 512, height: 512 } })
await page.goto(`${BASE}#/icono?layer=full&kind=dog`)
await page.waitForTimeout(1200)
await page.evaluate(() => document.querySelectorAll('svg g[clip-path]').forEach((g) => g.removeAttribute('clip-path')))
await page.screenshot({ path: `${OUT}/icon-512.png` })
await browser.close()
