// Recorre las pantallas principales en cada idioma: sin scroll vertical, sin texto que se salga en horizontal
// y sin restos en español a la vista. Uso: npm run dev -- --port 5199  y después  node tests/e2e-langs.mjs
import { chromium } from 'playwright-core'

const BASE = process.env.PETLOG_URL ?? 'http://localhost:5199/'
const SHOTS = process.env.SHOTS ?? '/tmp/l10n'
const LANGS = (process.env.LANGS ?? 'en,fr,de,it,pt').split(',')
const ROUTES = ['hoy', 'historial', 'medicacion', 'graficas', 'informe', 'ficha', 'botones', 'consejos']
// Palabras españolas que no deberían verse en otros idiomas (sí en los ejemplos de voz, que van en español).
const ES = /\b(Hoy|Historial|Gráficas|Informe|Ajustes|Mascota|Añadir|Registro|Consejos|Tomas)\b/

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const problems = []
for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, locale: lang })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => problems.push(`${lang} @${page.url()}: error ${e.message} ${(e.stack||'').split('\n').slice(1,4).join(' | ')}`))
  await page.addInitScript((l) => { try { localStorage.setItem('petlog-lang', l) } catch {} }, lang)
  await page.goto(BASE)
  await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 })
  const id = await page.evaluate(async () => {
    const r = window.__petlog.repo
    await r.wipeAll()
    const p = await r.createPet({ name: 'Luna', species: 'dog', sex: 'female', conditions: ['Artrosis'], allergies: [], vet: {} })
    const t = (await r.listEventTypes(p.id)).find((x) => x.key === 'vomit')
    await r.addEvent({ petId: p.id, typeId: t.id, level: 2 })
    return p.id
  })
  const check = async (name) => {
    await page.waitForTimeout(700)
    const r = await page.evaluate(() => {
      const de = document.scrollingElement
      const vScroll = de.scrollHeight - innerHeight
      const over = []
      for (const el of document.querySelectorAll('button, a, h1, h2, h3, label, .chip, [role=tab]')) {
        const s = getComputedStyle(el)
        if (el.getClientRects().length && el.scrollWidth > el.clientWidth + 2 && s.overflow !== 'visible' && s.textOverflow !== 'ellipsis') over.push(el.innerText.slice(0, 40))
      }
      return { vScroll, over, text: document.body.innerText }
    })
    if (r.vScroll > 1) problems.push(`${lang} ${name}: scroll vertical ${r.vScroll}px`)
    for (const o of r.over) problems.push(`${lang} ${name}: se sale «${o}»`)
    const m = r.text.match(ES)
    if (m) problems.push(`${lang} ${name}: español «${m[0]}»`)
    await page.screenshot({ path: `${SHOTS}/${lang}-${name}.png` })
  }
  await page.goto(`${BASE}#/`)
  await check('inicio')
  for (const r of ROUTES) {
    await page.goto(`${BASE}#/pet/${id}/${r}`)
    await check(r)
  }
  for (const r of ['ajustes', 'premium', 'compartir']) {
    await page.goto(`${BASE}#/${r}`)
    await check(r)
  }
  await ctx.close()
}
await browser.close()
console.log(problems.length ? problems.join('\n') : 'Sin problemas')
