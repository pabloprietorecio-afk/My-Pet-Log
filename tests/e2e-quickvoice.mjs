// Ventana flotante «Anotar por voz» (atajo del icono) en Chrome: node tests/e2e-quickvoice.mjs
// Requiere `npm run dev -- --port 5199`. En el navegador se abre con #/voz-rapida (en Android, QuickVoiceActivity).
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const OUT = new URL('./.out/', import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })
let fails = 0
const ok = (c, m) => (console.log(c ? '  ✓' : '  ✗', m), c || fails++)

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-ES', timezoneId: 'Europe/Madrid' })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(e.message))

await page.goto('http://localhost:5199/')
await page.getByRole('link', { name: 'Añadir mi mascota' }).click()
await page.getByLabel('Nombre').fill('Oso')
await page.getByRole('radio', { name: 'Perro' }).click()
await page.getByRole('button', { name: 'Crear mascota' }).click()
await page.waitForURL(/\/hoy$/)

await page.goto('about:blank')
await page.goto('http://localhost:5199/#/voz-rapida')
await page.waitForSelector('.qv-mic')
ok(await page.evaluate(() => document.documentElement.classList.contains('quick')), 'arranca en modo ventana flotante')
ok((await page.locator('.topbar, nav').count()) === 0, 'no abre la app (sin cabecera ni navegación)')
ok(await page.getByText('Para Oso').isVisible(), 'muestra para qué mascota anota')
// Chrome sin micrófono: ofrece escribir la frase
await page.getByLabel('Frase').waitFor({ timeout: 8000 })
await page.screenshot({ path: OUT + 'qv-1-micro.png' })
await page.getByLabel('Frase').fill('vómito leve y agua')
await page.getByRole('button', { name: 'Anotar' }).click()
await page.waitForSelector('.qv-res')
ok(await page.getByText('Anotado para Oso').isVisible(), 'segunda ventana con el resultado')
ok((await page.locator('.qv-res .voice-done li').count()) === 2, 'anota las dos cosas')
ok(await page.locator('.qv-timer').isVisible(), 'cuenta atrás de cierre automático')
await page.screenshot({ path: OUT + 'qv-2-resultado.png' })
const count = () => page.evaluate(async () => { const r = window.__petlog.repo; const [p] = await r.listPets(); return (await r.listEvents(p.id)).filter((e) => !e.deletedAt).length })
ok((await count()) === 2, 'guarda en la misma base de datos que la app')
await page.getByRole('button', { name: 'Deshacer' }).click()
await page.getByText(/Deshecho: Vómito, Agua/).waitFor({ timeout: 3000 }).catch(() => {})
ok((await page.getByText(/Deshecho: Vómito, Agua/).count()) === 1 && (await count()) === 0, 'Deshacer borra lo anotado')
ok((await page.locator('.qv-timer').count()) === 0, 'tras tocar, ya no se cierra sola')
ok(errs.length === 0, `sin errores de página ${errs.join(' | ')}`)
await browser.close()
console.log(fails ? `${fails} fallos` : 'todo correcto')
process.exit(fails ? 1 : 0)
