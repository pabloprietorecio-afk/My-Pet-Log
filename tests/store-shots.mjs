// Capturas para la ficha de Google Play (1080×1920). Datos de ejemplo de una perra ficticia «Luna».
import { chromium } from 'playwright-core'
const BASE = 'http://localhost:5199/'
const OUT = process.env.OUT ?? '/home/claude/store/shots'
const L = {
  es: { cond: 'Insuficiencia renal', med: 'Benazepril', note: 'Después del paseo' },
  en: { cond: 'Kidney disease', med: 'Benazepril', note: 'After the walk' },
  fr: { cond: 'Insuffisance rénale', med: 'Bénazépril', note: 'Après la promenade' },
  de: { cond: 'Niereninsuffizienz', med: 'Benazepril', note: 'Nach dem Spaziergang' },
  it: { cond: 'Insufficienza renale', med: 'Benazepril', note: 'Dopo la passeggiata' },
  pt: { cond: 'Insuficiência renal', med: 'Benazepril', note: 'Depois do passeio' },
}
const langs = (process.env.LANGS ?? 'es,en,fr,de,it,pt').split(',')
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
for (const lang of langs) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: lang, colorScheme: 'light' })
  const page = await ctx.newPage()
  await page.addInitScript((l) => { try { localStorage.setItem('petlog-lang', l) } catch {} }, lang)
  await page.goto(BASE)
  await page.waitForFunction(() => window.__petlog, null, { timeout: 15000 })
  const id = await page.evaluate(async (t) => {
    const r = window.__petlog.repo
    await r.wipeAll()
    const birth = new Date(); birth.setFullYear(birth.getFullYear() - 11)
    const p = await r.createPet({ name: 'Luna', species: 'dog', sex: 'female', breed: 'Beagle', birthDate: birth.toISOString().slice(0, 10), conditions: [t.cond], allergies: [], vet: {} })
    const types = await r.listEventTypes(p.id)
    const ty = (k) => types.find((x) => x.key === k).id
    const day = (d, h, m = 0) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x.toISOString() }
    const start = new Date(); start.setDate(start.getDate() - 34)
    const tr = await r.createTreatment({ petId: p.id, name: t.med, dose: 5, unit: 'mg', mode: 'scheduled', times: ['08:00', '20:00'], everyDays: 1, startDate: start.toISOString().slice(0, 10), graceMinutes: 60 })
    const w = [24.6, 24.5, 24.5, 24.3, 24.2, 24.2, 24.0, 23.9, 24.0]
    for (let i = 0; i < w.length; i++) await r.addEvent({ petId: p.id, typeId: ty('weight'), at: day(32 - i * 4, 9, 15), value: w[i], unit: 'kg' })
    const vom = [[29, 1], [27, 2], [24, 1], [20, 1], [17, 3], [16, 2], [12, 1], [9, 1], [6, 2], [3, 1], [1, 1], [0, 2]]
    for (const [d, lv] of vom) await r.addEvent({ petId: p.id, typeId: ty('vomit'), at: day(d, 10 + (d % 5), 32), level: lv })
    for (let d = 30; d >= 0; d--) {
      await r.addEvent({ petId: p.id, typeId: ty('food'), at: day(d, 14, 10), level: d % 6 === 0 ? 1 : 2 })
      if (d % 2 === 0) await r.addEvent({ petId: p.id, typeId: ty('water'), at: day(d, 17, 40), level: 3 })
      for (const h of d === 0 ? [8] : [8, 20]) {
        const skip = d === 11 && h === 20
        await r.logDose({ petId: p.id, treatmentId: tr.id, at: day(d, h, d % 3 === 0 ? 25 : 5), scheduledAt: day(d, h), status: skip ? 'skipped' : 'given' })
      }
    }
    await r.addEvent({ petId: p.id, typeId: ty('stool'), at: day(0, 7, 50), level: 1 })
    await r.addEvent({ petId: p.id, typeId: ty('mood'), at: day(0, 11, 5), level: 3, note: t.note })
    await r.addEvent({ petId: p.id, typeId: ty('vet'), at: day(13, 18, 0) })
    return p.id
  }, L[lang])
  const shot = async (route, name, after) => {
    await page.goto(`${BASE}#/pet/${id}/${route}`)
    await page.waitForTimeout(1200)
    if (after) await after()
    await page.screenshot({ path: `${OUT}/${lang}-${name}.png` })
  }
  await shot('hoy', '1-hoy')
  await shot('historial', '2-historial')
  await shot('graficas', '3-peso')
  await shot('graficas', '4-vomitos', async () => { await page.locator('button[aria-label]').filter({ hasText: '' }).last().click().catch(() => {}); await page.waitForTimeout(800) })
  await shot('informe', '5-informe')
  await shot('medicacion', '6-medicacion')
  await shot('consejos', '7-consejos')
  await ctx.close()
}
await browser.close()
