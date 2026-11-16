import type { ReportModel } from '../domain/report'
import { formatDayMonth, formatNumber, parseLocalDate } from '../domain/time'
import { barChart, hBarChart, lineChart, type ChartPalette } from './svg'

export interface ChartBlock {
  key: string
  title: string
  note?: string
  svg: string
  legend?: { label: string; color: string }[]
  /** Descripción textual equivalente (accesibilidad / tabla alternativa). */
  text: string
}

const NOON = 12 * 3_600_000

/** Todas las gráficas del informe, generadas desde el mismo modelo. */
/** `height` (opcional) ajusta las gráficas de líneas y barras al hueco disponible en pantalla. */
export function reportCharts(m: ReportModel, p: ChartPalette, width = 340, height?: number): ChartBlock[] {
  const out: ChartBlock[] = []

  // Peso
  if (m.weight.points.length > 0) {
    const pts = m.weight.points
    const last = pts[pts.length - 1]
    out.push({
      key: 'weight',
      title: 'Evolución del peso',
      note: `Mediciones registradas (${m.weight.windowLabel}).`,
      svg: lineChart({
        points: pts.map((q) => ({ t: q.t, v: q.v })),
        palette: p,
        width,
        height,
        formatX: (t) => formatDayMonth(new Date(t)),
        formatY: (v) => `${formatNumber(v)} ${m.weight.unit}`,
        ariaLabel: `Evolución del peso: ${pts.length} mediciones, la última ${formatNumber(last.v)} ${m.weight.unit}.`,
      }),
      text: pts.map((q) => `${formatDayMonth(q.date)}: ${formatNumber(q.v)} ${m.weight.unit}`).join('; '),
    })
  }

  // Episodios por día / semana
  const inc = m.incidents
  const incTotal = inc.series.reduce((s, x) => s + x.counts.reduce((a, b) => a + b, 0), 0)
  out.push({
    key: 'incidents',
    title: inc.bin === 'day' ? 'Episodios por día' : 'Episodios por semana',
    note: inc.bin === 'week' ? 'Vómitos, deposiciones y síntomas registrados. Cada barra es una semana (fecha del lunes).' : 'Vómitos, deposiciones y síntomas registrados cada día.',
    svg: barChart({
      labels: inc.labels,
      series: inc.series.map((s) => ({ label: s.label, values: s.counts })),
      palette: p,
      width,
      height,
      emptyText: 'Sin vómitos ni síntomas registrados',
      ariaLabel: `Episodios ${inc.bin === 'day' ? 'por día' : 'por semana'}: ${incTotal} en total.`,
    }),
    legend: inc.series.length > 1 ? inc.series.map((s, i) => ({ label: s.label, color: p.series[i % p.series.length] })) : undefined,
    text:
      inc.series.length === 0
        ? 'Sin episodios registrados.'
        : inc.series
            .map((s) => `${s.label}: ${s.counts.reduce((a, b) => a + b, 0)}`)
            .join('; '),
  })

  // Frecuencia por tipo
  if (m.frequency.length > 0) {
    out.push({
      key: 'frequency',
      title: 'Frecuencia por tipo de registro',
      svg: hBarChart({
        items: m.frequency.map((f) => ({ label: f.label, value: f.count, valueText: String(f.count) })),
        palette: p,
        width,
        ariaLabel: `Frecuencia por tipo: ${m.frequency.map((f) => `${f.label} ${f.count}`).join(', ')}.`,
      }),
      text: m.frequency.map((f) => `${f.label}: ${f.count}`).join('; '),
    })
  }

  // Apetito
  const ap = m.appetite.filter((a) => a.avg !== null)
  if (ap.length > 0) {
    out.push({
      key: 'appetite',
      title: 'Apetito',
      note: 'Nivel medio de «Comida» por día, en la escala que registra el propietario.',
      svg: lineChart({
        points: m.appetite.map((a) => ({ t: parseLocalDate(a.date).getTime() + NOON, v: a.avg })),
        palette: p,
        width,
        height,
        color: p.series[2],
        yDomain: [-0.3, 3.3],
        yTicks: [
          { v: 0, label: 'Nada' },
          { v: 1, label: 'Poca' },
          { v: 2, label: 'Normal' },
          { v: 3, label: 'Mucha' },
        ],
        formatX: (t) => formatDayMonth(new Date(t)),
        formatY: (v) => formatNumber(v, 1),
        ariaLabel: `Apetito: ${ap.length} días con registros de comida.`,
      }),
      text: ap.map((a) => `${formatDayMonth(a.date)}: ${formatNumber(a.avg!, 1)}`).join('; '),
    })
  }

  // Cumplimiento de medicación
  const adh = m.medication.rows.filter((r) => r.planned > 0 && r.pct !== null)
  if (adh.length > 0) {
    out.push({
      key: 'adherence',
      title: 'Cumplimiento de la medicación',
      note: 'Tomas previstas que constan como administradas.',
      svg: hBarChart({
        items: adh.map((r) => ({ label: r.name, value: r.pct!, valueText: `${r.pct}%` })),
        palette: p,
        width,
        max: 100,
        color: p.series[0],
        ariaLabel: `Cumplimiento: ${adh.map((r) => `${r.name} ${r.pct}%`).join(', ')}.`,
      }),
      text: adh.map((r) => `${r.name}: ${r.pct}% (${r.given + r.late} de ${r.planned})`).join('; '),
    })
  }

  // Indicadores propios con valor
  for (const c of m.customValues) {
    out.push({
      key: `custom-${c.label}`,
      title: c.label,
      svg: lineChart({
        points: c.points.map((q) => ({ t: q.t, v: q.v })),
        palette: p,
        width,
        height,
        color: p.series[1],
        formatX: (t) => formatDayMonth(new Date(t)),
        formatY: (v) => `${formatNumber(v)} ${c.unit}`.trim(),
        ariaLabel: `${c.label}: ${c.points.length} mediciones.`,
      }),
      text: c.points.map((q) => `${formatDayMonth(q.date)}: ${formatNumber(q.v)} ${c.unit}`.trim()).join('; '),
    })
  }
  return out
}
