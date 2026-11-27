/**
 * Primera página del informe en formato infografía: piezas comunes a HTML y PDF.
 *
 * Solo presenta datos ya contados en `ReportModel` (nada de valoraciones ni
 * «puntos clave» interpretados). Los dos renderizadores usan estas mismas
 * secciones, colores, límites y gráficas para que el veterinario vea lo mismo
 * en pantalla, en HTML y en PDF.
 */
import { barChart, lineChart, PALETTE_LIGHT, type ChartPalette } from '../charts/svg'
import type { CoverStat, ReportModel } from '../domain/report'
import { formatDayMonth, formatNumber } from '../domain/time'
import { fallbackTypeSvg, TYPE_TONE, type ReportArt } from './art'
import { glyph, type Glyph } from './glyphs'

export type SectionKey = 'sum' | 'weight' | 'inc' | 'freq' | 'med' | 'vet' | 'notes'

/** Color de cabecera de cada tarjeta. Todos dan ≥ 4,5:1 con texto blanco. */
export const SECTIONS: Record<SectionKey, { title: string; color: string; glyph: Glyph }> = {
  sum: { title: 'Resumen del periodo', color: '#c4560b', glyph: 'clipboard' },
  weight: { title: 'Evolución del peso', color: '#6a45d6', glyph: 'line' },
  inc: { title: 'Episodios por día', color: '#2f44a0', glyph: 'bars' },
  freq: { title: 'Registros por tipo', color: '#0f7d5c', glyph: 'list' },
  med: { title: 'Medicación actual', color: '#3c50d8', glyph: 'pill' },
  vet: { title: 'Consulta veterinaria', color: '#0e7672', glyph: 'steth' },
  notes: { title: 'Observaciones', color: '#b8325f', glyph: 'note' },
}

/** Cuántos elementos caben en cada tarjeta de la portada (el resto está en las páginas siguientes). */
export const LIMITS = { stats: 8, freq: 6, meds: 3, vet: 2, notes: 3 }

/** Mezcla un color hex con blanco (t = 0 → color, 1 → blanco). */
export function tint(hex: string, t: number): string {
  const h = hex.replace('#', '')
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `#${c.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/** Icono de un dato o tipo: ilustración de la app si la hay; si no, círculo con inicial. */
export function typeIconSvg(art: ReportArt | undefined, key: string, label: string, emoji?: string): string {
  if (key === 'days') {
    const c = TYPE_TONE.days
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${tint(c, 0.86)}"/><g transform="translate(26 26) scale(2)">${glyph('calendar', c, 1.7).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`
  }
  const k = key as Parameters<ReportArt['type']>[0]
  return art?.type(k, emoji) ?? fallbackTypeSvg(key, label)
}

export function statIcon(art: ReportArt | undefined, s: CoverStat): string {
  return typeIconSvg(art, s.key, s.label, s.emoji)
}

/** Texto de cabecera: «Últimos 7 días» o el rango personalizado. */
export function periodTitle(m: ReportModel): string {
  return m.period.label
}

/** Datos visibles de la ficha en la portada. */
export function fichaRows(m: ReportModel): { glyph: Glyph; label: string; value: string }[] {
  const p = m.pet
  const sexGlyph: Glyph = p.sex === 'Macho' ? 'male' : p.sex === 'Hembra' ? 'female' : 'sex'
  const rows: { glyph: Glyph; label: string; value: string }[] = [
    { glyph: 'paw', label: 'Especie', value: p.breed ? `${p.species} · ${p.breed}` : p.species },
    { glyph: sexGlyph, label: 'Sexo', value: p.sex },
  ]
  if (p.age || p.birthDate) rows.push({ glyph: 'cake', label: 'Edad', value: [p.age, p.birthDate ? `(${p.birthDate})` : ''].filter(Boolean).join(' ') })
  if (p.weight) rows.push({ glyph: 'scale', label: 'Último peso', value: `${p.weight.text} (${p.weight.date})` })
  rows.push({ glyph: 'heart', label: 'Patologías', value: p.conditions.length ? p.conditions.join(', ') : 'Ninguna registrada' })
  rows.push({ glyph: 'alert', label: 'Alergias', value: p.allergies.length ? p.allergies.join(', ') : 'Ninguna registrada' })
  const vet = [p.vet.name, p.vet.clinic].filter(Boolean).join(' · ')
  if (vet) rows.push({ glyph: 'steth', label: 'Veterinario', value: vet })
  return rows
}

/** Gráficas de la portada (más grandes y con área). `w`/`h` en unidades del viewBox. */
export function coverCharts(m: ReportModel, o: { weightW: number; weightH: number; incW: number; incH: number; fontSize: number }, p: ChartPalette = PALETTE_LIGHT) {
  const pts = m.weight.points
  const weight = pts.length
    ? lineChart({
        points: pts.map((q) => ({ t: q.t, v: q.v })),
        palette: p,
        width: o.weightW,
        height: o.weightH,
        color: SECTIONS.weight.color,
        area: true,
        fontSize: o.fontSize,
        formatX: (t) => formatDayMonth(new Date(t)),
        formatY: (v) => `${formatNumber(v)} ${m.weight.unit}`,
        ariaLabel: `Evolución del peso: ${pts.length} mediciones.`,
      })
    : undefined
  const inc = m.incidents
  const incidents = barChart({
    labels: inc.labels,
    series: inc.series.map((s) => ({ label: s.label, values: s.counts })),
    palette: p,
    width: o.incW,
    height: o.incH,
    fontSize: o.fontSize,
    emptyText: 'Sin vómitos, deposiciones blandas ni síntomas registrados',
    ariaLabel: `Episodios ${inc.bin === 'day' ? 'por día' : 'por semana'}.`,
  })
  const legend = inc.series.map((s, i) => ({ label: s.label, color: p.series[i % p.series.length] }))
  return { weight, incidents, legend, incTitle: inc.bin === 'day' ? 'Episodios por día' : 'Episodios por semana' }
}

/** Cuántos quedan fuera de una lista recortada. */
export const rest = (total: number, shown: number) => Math.max(0, total - shown)
