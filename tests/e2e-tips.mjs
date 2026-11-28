// Prueba de Consejos: recorre todas las fichas de cada especie, temas, deslizamiento y enlaces a fuentes.
// Uso: npm run dev -- --port 5199  y después  node tests/e2e-tips.mjs
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const opened = []
ctx.on('page', (p) => opened.push(p.url()))
await ctx.route(/^https:\/\/(?!localhost)/, (r) => r.fulfill({ status: 200, body: 'ok' }))

await page.goto(BASE); await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 }).catch(() => {})
await page.evaluate(() => window.__petlog.repo.wipeAll())
const counts = await page.evaluate(async () => {
  const m = await import('/src/domain/tips.ts')
  return Object.fromEntries(Object.entries(m.TIPS).map(([k, v]) => [k, v.length]))
})
for (const species of ['dog', 'cat', 'rabbit', 'rodent', 'bird', 'reptile']) {
  console.log('\n' + species)
  const id = await page.evaluate(async (species) => (await window.__petlog.repo.createPet({ name: 'Prueba', species, sex: 'unknown', conditions: [], allergies: [] })).id, species)
  await page.goto(`${BASE}#/pet/${id}/hoy`); await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 }).catch(() => {})
  await page.getByRole('link', { name: 'Consejos para Prueba' }).click()
  await page.waitForSelector('.tip-card')
  const seen = new Set()
  for (let k = 0; k < counts[species]; k++) {
    const t = await page.locator('.tip-card h2').innerText()
    seen.add(t)
    const src = await page.locator('.tip-src .link').count()
    if (!src) fails.push(`${species}: «${t}» sin fuente`)
    await page.getByRole('button', { name: 'Ficha siguiente' }).click()
  }
  ok(seen.size === counts[species], `recorre las ${counts[species]} fichas con «siguiente» (${seen.size} distintas)`)
  const first = await page.locator('.tip-card h2').innerText()
  ok(seen.has(first), 'al final vuelve al principio')
  await page.getByRole('tab', { name: 'Salud' }).click()
  ok((await page.getByRole('tab', { name: 'Salud' }).getAttribute('aria-selected')) === 'true', 'pestaña Salud seleccionada')
  const before = await page.locator('.tip-card h2').innerText()
  const box = await page.locator('.tip-band').boundingBox()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(150)
  const after = await page.locator('.tip-card h2').innerText()
  ok(after !== before, `deslizar cambia de ficha («${before}» → «${after}»)`)
  await page.getByRole('button', { name: 'Ficha anterior' }).click()
  ok((await page.locator('.tip-card h2').innerText()) === before, '«anterior» vuelve a la ficha previa')
}
await page.locator('.tip-src .link').first().click()
await page.waitForTimeout(300)
ok(opened.some((u) => u.startsWith('https://')), `la fuente se abre en una pestaña nueva (${opened.at(-1)})`)
ok(fails.filter((f) => f.includes('sin fuente')).length === 0, 'todas las fichas tienen fuente')
ok(errors.length === 0, 'sin errores de página ' + errors.join('; '))
await browser.close()
console.log(`\n${pass} correctas, ${fails.length} fallos`)
process.exit(fails.length ? 1 : 0)
