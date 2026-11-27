/**
 * Gráficas como cadenas SVG puras. Las usan la app, el informe HTML y el PDF
 * (vía svg2pdf), así que solo usan atributos básicos y colores en hex.
 */
import { formatNumber } from '../domain/time'

export interface ChartPalette {
  ink: string
  muted: string
  grid: string
  surface: string
  /** Colores categóricos en orden fijo. */
  series: string[]
}

/** Paleta validada (dataviz): azul, naranja, aguamarina, amarillo. */
export const PALETTE_LIGHT: ChartPalette = {
  ink: '#1a2420',
  muted: '#59645e',
  grid: '#e1e5de',
  surface: '#ffffff',
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
}

export const PALETTE_DARK: ChartPalette = {
  ink: '#e8eee9',
  muted: '#a4aea8',
  grid: '#2f3934',
  surface: '#1b2220',
  series: ['#3987e5', '#d95926', '#199e70', '#c98500'],
}

const FONT = "Figtree Variable, Figtree, Helvetica, Arial, sans-serif"

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

const n1 = (n: number) => Math.round(n * 10) / 10

function text(x: number, y: number, s: string, o: { fill: string; size?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number }) {
  return `<text x="${n1(x)}" y="${n1(y)}" fill="${o.fill}" font-family="${FONT}" font-size="${o.size ?? 11}" font-weight="${o.weight ?? 400}" text-anchor="${o.anchor ?? 'start'}">${esc(s)}</text>`
}

function wrap(width: number, height: number, label: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`
}

function niceStep(max: number, ticks = 4): number {
  const raw = max / ticks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nice * pow
}

function emptyNote(w: number, h: number, msg: string, p: ChartPalette): string {
  return text(w / 2, h / 2, msg, { fill: p.muted, size: 12, anchor: 'middle' })
}

// ─── Barras verticales apiladas ───────────────────────────────────────────

export interface BarSeries {
  label: string
  values: number[]
}

export function barChart(o: {
  labels: string[]
  series: BarSeries[]
  palette: ChartPalette
  ariaLabel: string
  width?: number
  height?: number
  emptyText?: string
  fontSize?: number
}): string {
  const W = o.width ?? 340
  const H = o.height ?? 170
  const p = o.palette
  const fs = o.fontSize ?? 10
  const m = { l: 16 + fs, r: 6, t: 12, b: 14 + fs }
  const n = o.labels.length
  const totals = o.labels.map((_, i) => o.series.reduce((s, x) => s + (x.values[i] ?? 0), 0))
  const max = Math.max(0, ...totals)
  const innerW = W - m.l - m.r
  const innerH = H - m.t - m.b
  let body = ''
  if (max === 0 || n === 0) {
    body += `<line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="${p.grid}" stroke-width="1"/>`
    body += emptyNote(W, H - m.b, o.emptyText ?? 'Sin registros en el periodo', p)
    return wrap(W, H, o.ariaLabel, body)
  }
  const step = Math.max(1, Math.ceil(niceStep(max, 3)))
  const yMax = Math.ceil(max / step) * step
  const y = (v: number) => m.t + innerH - (v / yMax) * innerH
  for (let v = 0; v <= yMax; v += step) {
    body += `<line x1="${m.l}" y1="${n1(y(v))}" x2="${W - m.r}" y2="${n1(y(v))}" stroke="${p.grid}" stroke-width="1"/>`
    body += text(m.l - 5, y(v) + 4, String(v), { fill: p.muted, size: fs, anchor: 'end' })
  }
  const band = innerW / n
  const bw = Math.max(3, Math.min(band * 0.68, 26))
  const every = n <= 8 ? 1 : Math.ceil(n / 6)
  for (let i = 0; i < n; i++) {
    const cx = m.l + band * i + band / 2
    let acc = 0
    o.series.forEach((s, si) => {
      const v = s.values[i] ?? 0
      if (v <= 0) return
      const y0 = y(acc)
      const y1 = y(acc + v)
      acc += v
      const h = Math.max(1, y0 - y1 - 2) // 2px de separación entre segmentos
      body += `<rect x="${n1(cx - bw / 2)}" y="${n1(y1)}" width="${n1(bw)}" height="${n1(h)}" rx="${Math.min(3, bw / 2)}" fill="${p.series[si % p.series.length]}"/>`
    })
    if (i % every === 0) body += text(cx, H - 8, o.labels[i], { fill: p.muted, size: fs, anchor: 'middle' })
  }
  body += `<line x1="${m.l}" y1="${y(0)}" x2="${W - m.r}" y2="${y(0)}" stroke="${p.muted}" stroke-width="1"/>`
  return wrap(W, H, o.ariaLabel, body)
}

// ─── Líneas ───────────────────────────────────────────────────────────────

export interface LinePoint {
  t: number
  v: number | null
}

export function lineChart(o: {
  points: LinePoint[]
  palette: ChartPalette
  ariaLabel: string
  color?: string
  formatX: (t: number) => string
  formatY?: (v: number) => string
  /** Etiquetas fijas del eje Y (p. ej. apetito). */
  yTicks?: { v: number; label: string }[]
  yDomain?: [number, number]
  width?: number
  height?: number
  emptyText?: string
  /** Rellena suavemente el área bajo la línea (portada del informe). */
  area?: boolean
  /** Tamaño de letra de ejes y etiquetas (por defecto 10/11). */
  fontSize?: number
}): string {
  const W = o.width ?? 340
  const H = o.height ?? 170
  const p = o.palette
  const color = o.color ?? p.series[0]
  const fs = o.fontSize ?? 10
  const fy = o.formatY ?? ((v: number) => formatNumber(v))
  const real = o.points.filter((q): q is { t: number; v: number } => q.v !== null)
  const m = { l: o.yTicks ? 52 : 36, r: 14, t: 16, b: 14 + fs }
  if (real.length === 0) {
    return wrap(W, H, o.ariaLabel, `<line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="${p.grid}"/>${emptyNote(W, H - m.b, o.emptyText ?? 'Sin registros en el periodo', p)}`)
  }
  const ts = o.points.map((q) => q.t)
  let t0 = Math.min(...ts)
  let t1 = Math.max(...ts)
  if (t0 === t1) {
    t0 -= 43_200_000
    t1 += 43_200_000
  }
  let lo: number
  let hi: number
  if (o.yDomain) [lo, hi] = o.yDomain
  else {
    const vs = real.map((q) => q.v)
    const a = Math.min(...vs)
    const b = Math.max(...vs)
    const pad = a === b ? Math.max(0.5, Math.abs(a) * 0.1) : (b - a) * 0.25
    lo = a - pad
    hi = b + pad
  }
  const ticks = o.yTicks ?? (() => {
    const step = niceStep(hi - lo, 3)
    const out: { v: number; label: string }[] = []
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push({ v, label: fy(v) })
    return out
  })()
  // Margen izquierdo según la etiqueta más larga del eje (p. ej. «12,5 kg» con letra grande).
  m.l = Math.max(m.l, Math.ceil(Math.max(...ticks.map((t) => t.label.length)) * fs * 0.56 + 10))
  const innerW = W - m.l - m.r
  const innerH = H - m.t - m.b
  const x = (t: number) => m.l + ((t - t0) / (t1 - t0)) * innerW
  const y = (v: number) => m.t + innerH - ((v - lo) / (hi - lo)) * innerH
  let body = ''
  for (const tk of ticks) {
    body += `<line x1="${m.l}" y1="${n1(y(tk.v))}" x2="${W - m.r}" y2="${n1(y(tk.v))}" stroke="${p.grid}" stroke-width="1"/>`
    body += text(m.l - 6, y(tk.v) + 4, tk.label, { fill: p.muted, size: fs, anchor: 'end' })
  }
  // x: hasta 4 etiquetas
  const nx = Math.min(4, Math.max(2, o.points.length))
  let prevLabel = ''
  for (let i = 0; i < nx; i++) {
    const t = t0 + ((t1 - t0) * i) / (nx - 1)
    const lab = o.formatX(t)
    if (lab === prevLabel) continue
    prevLabel = lab
    body += text(x(t), H - 8, lab, { fill: p.muted, size: fs, anchor: i === 0 ? 'start' : i === nx - 1 ? 'end' : 'middle' })
  }
  // segmentos (se corta en los huecos)
  let seg: { t: number; v: number }[] = []
  const flush = () => {
    if (o.area && seg.length > 1) {
      const base = n1(m.t + innerH)
      const pts = seg.map((q) => `${n1(x(q.t))},${n1(y(q.v))}`).join(' ')
      body += `<polygon points="${n1(x(seg[0].t))},${base} ${pts} ${n1(x(seg[seg.length - 1].t))},${base}" fill="${color}" fill-opacity="0.12" stroke="none"/>`
    }
    if (seg.length > 1) {
      body += `<polyline points="${seg.map((q) => `${n1(x(q.t))},${n1(y(q.v))}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
    }
    seg = []
  }
  for (const q of o.points) {
    if (q.v === null) flush()
    else seg.push({ t: q.t, v: q.v })
  }
  flush()
  if (real.length <= 45) {
    for (const q of real) {
      body += `<circle cx="${n1(x(q.t))}" cy="${n1(y(q.v))}" r="4" fill="${color}" stroke="${p.surface}" stroke-width="2"/>`
    }
  }
  // etiquetas directas: primero y último
  const first = real[0]
  const last = real[real.length - 1]
  const label = (q: { t: number; v: number }, anchor: 'start' | 'end') =>
    text(Math.min(Math.max(x(q.t), m.l + 4), W - m.r - 2), y(q.v) - 9, fy(q.v), { fill: p.ink, size: fs + 1, weight: 700, anchor })
  if (o.yTicks) {
    // en escalas de niveles basta con la etiqueta del último
    body += label(last, 'end')
  } else {
    body += label(last, 'end')
    if (real.length > 1 && x(last.t) - x(first.t) > 46) body += label(first, 'start')
  }
  return wrap(W, H, o.ariaLabel, body)
}

// ─── Barras horizontales ──────────────────────────────────────────────────

export function hBarChart(o: {
  items: { label: string; value: number; valueText: string }[]
  palette: ChartPalette
  ariaLabel: string
  max?: number
  width?: number
  color?: string
  emptyText?: string
}): string {
  const W = o.width ?? 340
  const p = o.palette
  const rowH = 30
  const H = Math.max(60, o.items.length * rowH + 8)
  if (o.items.length === 0) return wrap(W, 60, o.ariaLabel, emptyNote(W, 60, o.emptyText ?? 'Sin registros en el periodo', p))
  const labelW = 112
  const valueW = 52
  const trackW = W - labelW - valueW - 6
  const max = o.max ?? Math.max(...o.items.map((i) => i.value), 1)
  let body = ''
  o.items.forEach((it, i) => {
    const cy = 4 + i * rowH + rowH / 2
    const lab = it.label.length > 17 ? `${it.label.slice(0, 16)}…` : it.label
    body += text(0, cy + 4, lab, { fill: p.ink, size: 12 })
    const w = Math.max(it.value > 0 ? 4 : 0, (it.value / max) * trackW)
    body += `<rect x="${labelW}" y="${cy - 7}" width="${trackW}" height="14" rx="4" fill="${p.grid}"/>`
    if (w > 0) body += `<rect x="${labelW}" y="${cy - 7}" width="${n1(w)}" height="14" rx="4" fill="${o.color ?? p.series[0]}"/>`
    body += text(W, cy + 4, it.valueText, { fill: p.ink, size: 12, weight: 700, anchor: 'end' })
  })
  return wrap(W, H, o.ariaLabel, body)
}
