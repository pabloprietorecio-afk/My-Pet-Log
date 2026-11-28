// Prueba de especies: crea una mascota de cada especie nueva y comprueba sus botones y unidad de peso.
// Uso: npm run dev -- --port 5199  y después  node tests/e2e-species.mjs
import { chromium } from 'playwright-core'

const BASE = process.env.PETLOG_URL ?? 'http://localhost:5199/'
let pass = 0
const fails = []
const ok = (cond, msg) => {
  if (cond) pass++
  else fails.push(msg)
  console.log(cond ? '  ✓' : '  ✗', msg)
}
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES', timezoneId: 'Europe/Madrid' })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const CASES = [
  { pick: 'Hámster / roedor', name: 'Bola', weight: '120', unit: 'g', must: ['Actividad', 'Comida'], not: ['Vómito'] },
  { pick: 'Serpiente / reptil', name: 'Kaa', weight: '850', unit: 'g', must: ['Muda', 'Temperatura', 'Regurgitación', 'Defecación'], not: ['Agua'] },
  { pick: 'Conejo', name: 'Coco', weight: '1,8', unit: 'kg', must: ['Actividad', 'Deposición'], not: ['Vómito'] },
  { pick: 'Pájaro', name: 'Piu', weight: '35', unit: 'g', must: ['Muda', 'Excrementos'], not: ['Vómito'] },
]
await page.goto(BASE); await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 }).catch(() => {})
await page.evaluate(() => localStorage.setItem('petlog-dev-premium', '1')) // varias mascotas: sin límite de la versión gratis
await page.reload(); await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 })
await page.evaluate(() => window.__petlog.repo.wipeAll())
for (const c of CASES) {
  console.log('\n' + c.pick)
  await page.goto(BASE + '#/nueva'); await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 }).catch(() => {})
  await page.getByLabel('Nombre').fill(c.name)
  await page.getByRole('radio', { name: c.pick }).click()
  ok((await page.getByText(/^Especie: /).innerText()).length > 9, 'la etiqueta muestra la especie elegida')
  ok(await page.getByText(`Peso (${c.unit})`).isVisible(), `peso en ${c.unit}`)
  await page.getByLabel(`Peso (${c.unit})`).fill(c.weight)
  await page.getByRole('button', { name: 'Crear mascota' }).click()
  await page.waitForURL(/\/hoy$/)
  await page.waitForTimeout(400)
  const tiles = await page.locator('.tile').allInnerTexts()
  const text = tiles.join(' | ')
  for (const m of c.must) ok(text.includes(m), `botón «${m}»`)
  for (const n of c.not) ok(!text.includes(n), `sin botón «${n}»`)
  await page.waitForFunction((u) => new RegExp(`\\s${u}\\b`).test(document.querySelector('.who .meta')?.textContent ?? ''), c.unit, { timeout: 4000 }).catch(() => {})
  const meta = await page.locator('.who .meta').innerText()
  ok(meta.includes(`${c.weight} ${c.unit}`), `cabecera con peso inicial (${meta})`)
}
ok(errors.length === 0, 'sin errores de página ' + errors.join('; '))
await browser.close()
console.log(`\n${pass} correctas, ${fails.length} fallos`)
process.exit(fails.length ? 1 : 0)
