/**
 * Primera página del informe en formato infografía: piezas comunes a HTML y PDF.
 *
 * Es un cartel de tamaño fijo (780 unidades de ancho) que se escala entero: se ve igual
 * en la app, en el HTML y en el PDF. Solo presenta datos ya contados en `ReportModel`
 * (sin valoraciones). Las medidas de este archivo están en unidades de ese cartel.
 */
import { barChart, esc, PALETTE_LIGHT, type ChartPalette } from '../charts/svg'
import type { CoverStat, ReportModel } from '../domain/report'
import { formatDayMonth, formatNumber } from '../domain/time'
import { fallbackTypeSvg, TYPE_TONE, type ReportArt } from './art'
import { glyph, type Glyph } from './glyphs'
import { tl } from '../i18n'

export type SectionKey = 'sum' | 'weight' | 'inc' | 'freq' | 'vet' | 'notes' | 'key'

/** Cabecera de cada tarjeta: color de fondo, color del texto y del borde. */
export const SECTIONS: Record<SectionKey, { title: string; color: string; ink: string; border: string; soft: string; glyph: Glyph }> = {
  sum: { title: tl('Resumen del periodo'), color: '#f28a1a', ink: '#ffffff', border: '#f9c98f', soft: '#fffaf3', glyph: 'clipboard' },
  weight: { title: tl('Evolución del peso'), color: '#173a7a', ink: '#ffffff', border: '#a9bfe6', soft: '#ffffff', glyph: 'scale' },
  inc: { title: tl('Episodios por día'), color: '#173a7a', ink: '#ffffff', border: '#a9bfe6', soft: '#ffffff', glyph: 'bars' },
  freq: { title: tl('Frecuencia por tipo'), color: '#3d8b40', ink: '#ffffff', border: '#a9d3ab', soft: '#ffffff', glyph: 'list' },
  vet: { title: tl('Consulta veterinaria'), color: '#5b3fb0', ink: '#ffffff', border: '#c3b5ec', soft: '#f3efff', glyph: 'steth' },
  notes: { title: tl('Observaciones'), color: '#3f9150', ink: '#ffffff', border: '#a9d3b1', soft: '#f3faf4', glyph: 'note' },
  key: { title: tl('Datos clave'), color: '#ffb52e', ink: '#2a1d00', border: '#ffd88a', soft: '#fffaf0', glyph: 'bulb' },
}

/** Cuántos elementos caben en cada tarjeta (el resto está en las páginas siguientes). */
export const LIMITS = { stats: 8, freq: 5, vet: 2, notes: 2, key: 4 }

/** Medidas del cartel (unidades de diseño). */
export const POSTER = {
  W: 780,
  hero: { h: 250, photo: 250, titlesX: 268, titlesW: 250, fichaX: 532 },
  gap: 12,
  head: 46,
  r1: { y: 264, h: 300, split: 388 },
  r2: { y: 576, h: 262, split: 470 },
  r3: { y: 850, h: 226, a: 236, b: 520 },
  discY: 1088,
  H: 1124,
}

export const NAVY = '#101d4f'
export const BLUE = '#1f5fd0'

/** Tamaño del nombre según su longitud (para que quepa en una línea). */
export function nameSize(name: string): number {
  const n = name.trim().length
  return n <= 4 ? 88 : n <= 6 ? 68 : n <= 8 ? 52 : n <= 11 ? 40 : 30
}

/** Mezcla un color hex con blanco (t = 0 → color, 1 → blanco). */
export function tint(hex: string, t: number): string {
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `#${c.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/** Icono de un dato o tipo: ilustración de la app si la hay; si no, círculo con inicial. */
export function typeIconSvg(art: ReportArt | undefined, key: string, label: string, emoji?: string): string {
  if (key === 'days') {
    const c = '#2e9d57'
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="22" fill="${tint(c, 0.84)}"/><g transform="translate(22 22) scale(2.35)">${glyph('calcheck', c, 2).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`
  }
  const k = key as Parameters<ReportArt['type']>[0]
  return art?.type(k, emoji) ?? fallbackTypeSvg(key, label)
}

export function statIcon(art: ReportArt | undefined, s: CoverStat): string {
  return typeIconSvg(art, s.key, s.label, s.emoji)
}

/** Datos de la ficha en la portada. */
export function fichaRows(m: ReportModel): { glyph: Glyph; label: string; value: string }[] {
  const p = m.pet
  const sexGlyph: Glyph = p.sex === 'Macho' ? 'male' : p.sex === 'Hembra' ? 'female' : 'sex'
  const rows: { glyph: Glyph; label: string; value: string }[] = [{ glyph: 'paw', label: tl('Especie'), value: p.species }]
  if (p.breed) rows.push({ glyph: 'tag', label: tl('Raza'), value: p.breed })
  rows.push({ glyph: sexGlyph, label: tl('Sexo'), value: p.sex })
  if (p.age) rows.push({ glyph: 'cake', label: tl('Edad'), value: p.age })
  if (p.birthDate) rows.push({ glyph: 'calendar', label: tl('Nacimiento'), value: p.birthDate })
  if (p.weight) rows.push({ glyph: 'scale', label: tl('Último peso'), value: `${p.weight.text} (${p.weight.date})` })
  if (p.conditions.length) rows.push({ glyph: 'heart', label: tl('Patologías'), value: p.conditions.join(', ') })
  if (p.allergies.length) rows.push({ glyph: 'alert', label: tl('Alergias'), value: p.allergies.join(', ') })
  return rows.slice(0, 8)
}

const FONT = 'Figtree Variable, Figtree, Helvetica, Arial, sans-serif'
const n1 = (n: number) => Math.round(n * 10) / 10

function niceStep(span: number, ticks: number): number {
  const raw = span / ticks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow
}

/** Gráfica de peso de la portada: curva suave, área en degradado y burbujas en el primer y último valor. */
export function weightChart(m: ReportModel, W: number, H: number): string | undefined {
  const pts = m.weight.points.filter((q): q is typeof q & { v: number } => q.v !== null)
  if (!pts.length) return undefined
  const unit = m.weight.unit
  const mg = { l: 66, r: 26, t: 44, b: 30 }
  const vs = pts.map((q) => q.v)
  const a = Math.min(...vs)
  const b = Math.max(...vs)
  const pad = a === b ? Math.max(0.5, Math.abs(a) * 0.05) : (b - a) * 0.18
  const lo = a - pad
  const hi = b + pad
  let t0 = pts[0].t
  let t1 = pts[pts.length - 1].t
  if (t0 === t1) {
    t0 -= 43_200_000
    t1 += 43_200_000
  }
  const iw = W - mg.l - mg.r
  const ih = H - mg.t - mg.b
  const x = (t: number) => mg.l + ((t - t0) / (t1 - t0)) * iw
  const y = (v: number) => mg.t + ih - ((v - lo) / (hi - lo)) * ih
  let s = `<defs><linearGradient id="warea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity=".22"/><stop offset="1" stop-color="${BLUE}" stop-opacity=".02"/></linearGradient></defs>`
  const step = niceStep(hi - lo, 3)
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
    s += `<line x1="${mg.l}" y1="${n1(y(v))}" x2="${W - mg.r}" y2="${n1(y(v))}" stroke="#dfe5f0" stroke-width="1.2"/>`
    s += `<text x="${mg.l - 8}" y="${n1(y(v) + 5)}" text-anchor="end" font-family="${FONT}" font-size="15" fill="#3b4763">${esc(`${formatNumber(v)} ${unit}`)}</text>`
  }
  s += `<line x1="${mg.l}" y1="${mg.t - 8}" x2="${mg.l}" y2="${mg.t + ih}" stroke="#8793ad" stroke-width="1.2"/><line x1="${mg.l}" y1="${mg.t + ih}" x2="${W - mg.r}" y2="${mg.t + ih}" stroke="#8793ad" stroke-width="1.2"/>`
  const P = pts.map((q) => [x(q.t), y(q.v)] as const)
  // Curva suave (Catmull-Rom → Bézier), sin pasarse de los valores.
  let d = `M${n1(P[0][0])} ${n1(P[0][1])}`
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)]
    const p1 = P[i]
    const p2 = P[i + 1]
    const p3 = P[Math.min(P.length - 1, i + 2)]
    const k = 1 / 6
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, Math.min(Math.max(p1[1] + (p2[1] - p0[1]) * k, Math.min(p1[1], p2[1])), Math.max(p1[1], p2[1]))]
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, Math.min(Math.max(p2[1] - (p3[1] - p1[1]) * k, Math.min(p1[1], p2[1])), Math.max(p1[1], p2[1]))]
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`
  }
  if (P.length > 1) {
    s += `<path d="${d}L${n1(P[P.length - 1][0])} ${mg.t + ih}L${n1(P[0][0])} ${mg.t + ih}Z" fill="url(#warea)"/>`
    s += `<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  if (P.length <= 40) for (const q of P) s += `<circle cx="${n1(q[0])}" cy="${n1(q[1])}" r="5.5" fill="${BLUE}" stroke="#ffffff" stroke-width="2"/>`
  const bubble = (q: readonly [number, number], label: string, strong: boolean) => {
    const w = label.length * (strong ? 10.4 : 9.6) + 20
    const h = strong ? 32 : 28
    const bx = Math.min(Math.max(q[0] - w / 2, mg.l + 4), W - w - 4)
    const by = Math.max(2, q[1] - h - 11)
    return `<rect x="${n1(bx)}" y="${n1(by)}" width="${n1(w)}" height="${h}" rx="8" fill="${strong ? BLUE : '#dfe9fb'}"/><text x="${n1(bx + w / 2)}" y="${n1(by + h / 2 + (strong ? 6.5 : 5.5))}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${strong ? 19 : 16}" fill="${strong ? '#ffffff' : NAVY}">${esc(label)}</text>`
  }
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (P.length > 1 && P[P.length - 1][0] - P[0][0] > 110) s += bubble(P[0], `${formatNumber(first.v)} ${unit}`, false)
  s += bubble(P[P.length - 1], `${formatNumber(last.v)} ${unit}`, true)
  s += `<text x="${n1(P[0][0])}" y="${H - 8}" text-anchor="middle" font-family="${FONT}" font-size="15" fill="#3b4763">${esc(formatDayMonth(new Date(first.t)))}</text>`
  if (P.length > 1) s += `<text x="${n1(P[P.length - 1][0])}" y="${H - 8}" text-anchor="middle" font-family="${FONT}" font-size="15" fill="#3b4763">${esc(formatDayMonth(new Date(last.t)))}</text>`
  const label = tl('Evolución del peso: {0} mediciones, la última {1} {2}.', pts.length, formatNumber(last.v), unit)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${s}</svg>`
}

/** Gráficas de la portada. */
export function coverCharts(m: ReportModel, o: { weightW: number; weightH: number; incW: number; incH: number }, p: ChartPalette = PALETTE_LIGHT) {
  const inc = m.incidents
  const palette: ChartPalette = { ...p, series: ['#f28a1a', BLUE, '#1baf7a', '#8a62f0'], ink: NAVY, muted: '#3b4763', grid: '#dfe5f0' }
  const incidents = barChart({
    labels: inc.labels,
    series: inc.series.map((s) => ({ label: s.label, values: s.counts })),
    palette,
    width: o.incW,
    height: o.incH,
    fontSize: 14,
    emptyText: tl('Sin vómitos, deposiciones blandas ni síntomas registrados'),
    ariaLabel: tl('Episodios {0}.', inc.bin === 'day' ? tl('por día') : tl('por semana')),
  })
  const legend = inc.series.map((s, i) => ({ label: s.label, color: palette.series[i % palette.series.length] }))
  return { weight: weightChart(m, o.weightW, o.weightH), incidents, legend, incTitle: inc.bin === 'day' ? tl('Episodios por día') : tl('Episodios por semana') }
}

export { TYPE_TONE }

/** Cuántos quedan fuera de una lista recortada. */
export const rest = (total: number, shown: number) => Math.max(0, total - shown)
