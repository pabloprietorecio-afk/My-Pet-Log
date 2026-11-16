import { describe, expect, it } from 'vitest'
import { reportCharts } from '../src/charts/reportCharts'
import { PALETTE_LIGHT, barChart, esc } from '../src/charts/svg'
import { seedEventTypes } from '../src/domain/eventTypes'
import { buildReport, makePeriod } from '../src/domain/report'
import { countPerDay, countPerWeek, levelAveragePerDay } from '../src/domain/stats'
import type { DoseLog, LogEvent, Pet, Treatment } from '../src/domain/types'
import { renderHtml } from '../src/report/html'
import { reportToText } from '../src/report/text'
import { pdfSafe } from '../src/report/pdfText'
import { d } from './helpers'

const NOW = d('2026-11-16 12:00')
const iso = (s: string) => d(s).toISOString()
const stamp = { createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z' }

const pet: Pet = {
  id: 'p1', name: 'Luna <b>', species: 'cat', sex: 'female', birthDate: '2012-05-10',
  vet: { name: 'Dra. Pérez', clinic: 'Clínica Sur' }, conditions: ['Insuficiencia renal'], allergies: ['Pollo'],
  notes: 'Come mejor con comida húmeda', ...stamp,
}
const types = seedEventTypes('p1', stamp.createdAt)
const T = (k: string) => types.find((t) => t.key === k)!.id
const ev = (key: string, at: string, extra: Partial<LogEvent> = {}): LogEvent => ({
  id: `${key}-${at}`, petId: 'p1', typeId: T(key), at: iso(at), ...stamp, ...extra,
})
const treatment: Treatment = {
  id: 't1', petId: 'p1', name: 'Prednisona', dose: 5, unit: 'mg', mode: 'scheduled', times: ['08:00', '20:00'],
  everyDays: 1, startDate: '2026-11-10', graceMinutes: 60, ...stamp,
}
const dose = (sched: string, at: string, over: Partial<DoseLog> = {}): DoseLog => ({
  id: `d-${sched}`, petId: 'p1', treatmentId: 't1', scheduledAt: iso(sched), at: iso(at), status: 'given', ...stamp, ...over,
})

const events: LogEvent[] = [
  ev('vomit', '2026-11-15 10:32', { level: 2, note: 'tras desayunar' }),
  ev('vomit', '2026-11-15 17:20', { level: 1 }),
  ev('food', '2026-11-15 14:10', { level: 1 }),
  ev('food', '2026-11-16 09:00', { level: 2 }),
  ev('stool', '2026-11-15 19:00', { level: 3 }),
  ev('weight', '2026-11-10 09:00', { value: 4.2, unit: 'kg' }),
  ev('weight', '2026-11-16 09:00', { value: 4.0, unit: 'kg' }),
  ev('other', '2026-11-14 22:00', { note: 'Estuvo escondida toda la tarde' }),
]
const logs: DoseLog[] = [
  dose('2026-11-15 08:00', '2026-11-15 08:05'),
  dose('2026-11-15 20:00', '2026-11-15 22:30'),
  dose('2026-11-14 20:00', '2026-11-14 20:00', { status: 'skipped' }),
]

const build = (preset: '24h' | '7d' | '30d' = '7d') =>
  buildReport({ pet, types, events, treatments: [treatment], doseLogs: logs, period: makePeriod(preset, NOW), now: NOW })

describe('estadísticas', () => {
  it('cuenta por día incluyendo ceros y por semana (lunes)', () => {
    const vomits = events.filter((e) => e.typeId === T('vomit'))
    const days = countPerDay(vomits, d('2026-11-14 00:00'), d('2026-11-16 23:59'))
    expect(days.map((x) => x.count)).toEqual([0, 2, 0])
    expect(days[1].byLevel).toEqual({ 1: 1, 2: 1 })
    const weeks = countPerWeek(vomits, d('2026-11-09 00:00'), d('2026-11-16 23:59'))
    expect(weeks.map((w) => [w.date, w.count])).toEqual([['2026-11-09', 2], ['2026-11-16', 0]])
  })
  it('media de nivel por día con huecos', () => {
    const r = levelAveragePerDay(events.filter((e) => e.typeId === T('food')), d('2026-11-14 00:00'), d('2026-11-16 23:59'))
    expect(r.map((x) => x.avg)).toEqual([null, 1, 2])
  })
})

describe('informe', () => {
  const m = build()
  it('resume solo hechos con recuentos y niveles', () => {
    const get = (l: string) => m.summary.find((s) => s.label === l)?.value
    expect(get('Vómito')).toBe('2 episodios (Leve ×1 · Moderado ×1)')
    expect(get('Deposición')).toBe('1 registro (Diarrea ×1)')
    expect(get('Peso')).toContain('4,2 kg')
    expect(get('Peso')).toContain('4 kg')
    expect(get('Días con algún registro')).toBe('4 de 7')
  })
  it('ordena la cronología por día y hora', () => {
    const day = m.timeline.find((x) => x.date === '2026-11-15')!
    expect(day.items.map((i) => i.time)).toEqual(['08:05', '10:32', '14:10', '17:20', '19:00', '22:30'])
    expect(day.items.find((i) => i.kind === 'dose' && i.time === '22:30')!.detail).toContain('con retraso (prevista 20:00)')
  })
  it('tabla de medicación: toma omitida, con retraso y sin registrar', () => {
    const r = m.medication.rows[0]
    // huecos pasados 10→16/11 12:00: 6 días*2 + 08:00 de hoy = 13; con registro 3
    expect(r).toMatchObject({ given: 1, late: 1, skipped: 1 })
    expect(r.planned).toBe(r.given + r.late + r.skipped + r.unrecorded)
    expect(r.unrecorded).toBe(r.planned - 3)
  })
  it('incluye ficha, medicación actual, notas y el aviso de no diagnóstico', () => {
    expect(m.pet.age).toMatch(/14 años/)
    expect(m.currentTreatments[0].name).toBe('Prednisona')
    expect(m.ownerNotes.map((n) => n.text)).toContain('Estuvo escondida toda la tarde')
    expect(m.disclaimer).toMatch(/no contiene diagn/)
  })
  it('no emite lenguaje de diagnóstico, valoración ni recomendación', () => {
    const html = renderHtml(m)
    const text = reportToText(m)
    const body = (s: string) => s.replace(m.disclaimer, '').replace(/Generado con PetLog[^\n<]*/g, '')
    const banned = /(diagnostic|sospech|probablement|recomend|deber[ií]a|empeor|mejor[óo]|grave\b|preocupant|urgente|tratamiento sugerido)/i
    // "mejor" aparece en una nota literal del propietario: se excluye ese texto
    const clean = (s: string) => body(s).replace('Come mejor con comida húmeda', '')
    expect(clean(html)).not.toMatch(banned)
    expect(clean(text)).not.toMatch(banned)
  })
  it('escapa HTML del propietario y es autónomo (sin recursos externos)', () => {
    const html = renderHtml(m)
    expect(html).toContain('Luna &lt;b&gt;')
    expect(html).not.toContain('<b>Luna')
    expect(html).not.toMatch(/(src|href)="https?:/)
    expect(html).not.toMatch(/<script/i)
  })
  it('periodos: 24 h, 7 d, 30 d y personalizado', () => {
    expect(makePeriod('24h', NOW).from.getTime()).toBe(NOW.getTime() - 86_400_000)
    expect(makePeriod('7d', NOW).from).toEqual(d('2026-11-10 00:00'))
    expect(makePeriod('30d', NOW).from).toEqual(d('2026-10-18 00:00'))
    const c = makePeriod('custom', NOW, { from: '2026-11-05', to: '2026-11-01' })
    expect(c.from).toEqual(d('2026-11-01 00:00'))
    expect(c.label).toBe('Del 01/11/2026 al 05/11/2026')
  })
  it('un periodo sin datos no rompe nada', () => {
    const empty = buildReport({ pet, types, events: [], treatments: [], doseLogs: [], period: makePeriod('24h', NOW), now: NOW })
    expect(empty.timeline).toEqual([])
    expect(renderHtml(empty)).toContain('No hay registros')
    expect(reportCharts(empty, PALETTE_LIGHT).length).toBeGreaterThan(0)
  })
})

describe('gráficas SVG', () => {
  it('genera SVG válido y con etiqueta accesible', () => {
    const charts = reportCharts(build(), PALETTE_LIGHT)
    expect(charts.map((c) => c.key)).toEqual(expect.arrayContaining(['weight', 'incidents', 'frequency', 'appetite', 'adherence']))
    for (const c of charts) {
      expect(c.svg).toMatch(/^<svg [^>]*role="img" aria-label="[^"]+"/)
      expect(c.svg).not.toMatch(/NaN|undefined|Infinity/)
    }
  })
  it('barras vacías muestran un mensaje en vez de un eje roto', () => {
    expect(barChart({ labels: ['a'], series: [{ label: 'x', values: [0] }], palette: PALETTE_LIGHT, ariaLabel: 'v' })).toContain('Sin registros')
  })
  it('esc y pdfSafe', () => {
    expect(esc(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
    expect(pdfSafe('Vómito → 🤮 «ñ» …')).toBe('Vómito -> "ñ" ...')
  })
})
