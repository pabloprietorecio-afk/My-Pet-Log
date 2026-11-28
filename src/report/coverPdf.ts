/**
 * Portada del informe en PDF (página 1): la misma infografía que `coverHtml.ts`,
 * dibujada en vectorial con jsPDF. Iconos y gráficas son SVG (vía svg2pdf).
 */
import type { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import type { ReportModel } from '../domain/report'
import { pawPath, type ReportArt } from './art'
import { coverCharts, fichaRows, LIMITS, nameSize, NAVY as NAVY_HEX, POSTER as P, rest, SECTIONS, statIcon, typeIconSvg, type SectionKey } from './cover'
import { HERO_PAWS, titleSize } from './coverHtml'
import { glyph } from './glyphs'
import { pdfSafe } from './pdfText'
import { tl } from '../i18n'

type RGB = [number, number, number]
const rgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const INK = rgb('#101a36')
const NAVY = rgb(NAVY_HEX)
const MUTED = rgb('#4a556f')
const SOFT_INK = rgb('#27324f')
const M = 10
/** Milímetros por unidad de diseño del cartel (780 de ancho → 190 mm). */
const U = 190 / P.W
const X = (px: number) => M + px * U
const Y = (px: number) => M + px * U
/** Tamaño de letra: unidades de diseño → puntos. */
const PT = (px: number) => px * U * 2.8346

/** Pega un SVG (cadena) en el PDF, ajustado a la caja (como `xMidYMid meet`). */
async function placeSvg(doc: jsPDF, svg: string, x: number, y: number, w: number, h: number) {
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden'
  holder.innerHTML = svg
  document.body.appendChild(holder)
  try {
    const el = holder.querySelector('svg') as SVGSVGElement | null
    if (!el) return
    const vb = (el.getAttribute('viewBox') ?? '0 0 100 100').split(/[\s,]+/).map(Number)
    const r = vb[3] / vb[2]
    let dw = w
    let dh = w * r
    if (dh > h) {
      dh = h
      dw = h / r
    }
    // svg2pdf usa width/height del propio SVG si los tiene: se quitan para que obedezca a la caja.
    el.removeAttribute('width')
    el.removeAttribute('height')
    await svg2pdf(el, doc, { x: x + (w - dw) / 2, y: y + (h - dh) / 2, width: dw, height: dh })
  } finally {
    holder.remove()
  }
}

interface TextOpts {
  size: number
  style?: 'normal' | 'bold' | 'italic' | 'bolditalic'
  color?: RGB
  maxW: number
  maxLines?: number
  align?: 'left' | 'center' | 'right'
  lh?: number
}

/** Escribe texto con ajuste de línea y «…» si no cabe. Devuelve la altura usada (mm). */
function text(doc: jsPDF, s: string, x: number, y: number, o: TextOpts): number {
  doc.setFont('helvetica', o.style ?? 'normal')
  doc.setFontSize(o.size)
  doc.setTextColor(...(o.color ?? INK))
  const lh = o.lh ?? o.size * 0.41
  let lines = doc.splitTextToSize(pdfSafe(s) || ' ', o.maxW) as string[]
  if (o.maxLines && lines.length > o.maxLines) {
    lines = lines.slice(0, o.maxLines)
    let last = lines[lines.length - 1]
    while (last.length > 1 && doc.getTextWidth(`${last}...`) > o.maxW) last = last.slice(0, -1)
    lines[lines.length - 1] = `${last.trimEnd()}...`
  }
  const ax = o.align === 'center' ? x + o.maxW / 2 : o.align === 'right' ? x + o.maxW : x
  lines.forEach((l, i) => doc.text(l, ax, y + lh * 0.78 + i * lh, { align: o.align ?? 'left' }))
  return lines.length * lh
}

/** Una línea recortada con «…». */
function fit(doc: jsPDF, s: string, maxW: number, size: number, style: TextOpts['style'] = 'normal'): string {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  let t = pdfSafe(s)
  if (doc.getTextWidth(t) <= maxW) return t
  while (t.length > 1 && doc.getTextWidth(`${t}...`) > maxW) t = t.slice(0, -1)
  return `${t.trimEnd()}...`
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Texto en unidades del cartel. Devuelve la altura usada (en unidades). */
function T(doc: jsPDF, s: string, x: number, y: number, o: Omit<TextOpts, 'size' | 'maxW' | 'lh'> & { size: number; maxW: number; lh?: number }): number {
  return text(doc, s, X(x), Y(y), { ...o, size: PT(o.size), maxW: o.maxW * U, lh: (o.lh ?? o.size * 1.22) * U }) / U
}
const icon = (doc: jsPDF, svg: string, x: number, y: number, size: number) => placeSvg(doc, svg, X(x), Y(y), size * U, size * U)

/** Marco de tarjeta con cabecera de color; devuelve la caja del contenido (unidades del cartel). */
async function cardFrame(doc: jsPDF, k: SectionKey, b: Box, title = SECTIONS[k].title, extra = ''): Promise<Box> {
  const s = SECTIONS[k]
  const R = 18
  doc.setFillColor(...rgb(s.soft))
  doc.setDrawColor(...rgb(s.border))
  doc.setLineWidth(2 * U)
  doc.roundedRect(X(b.x), Y(b.y), b.w * U, b.h * U, R * U, R * U, 'FD')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.w} ${P.head}"><path d="M0 ${R}A${R} ${R} 0 0 1 ${R} 0H${b.w - R}A${R} ${R} 0 0 1 ${b.w} ${R}V${P.head}H0Z" fill="${s.color}"/></svg>`
  await placeSvg(doc, head, X(b.x), Y(b.y), b.w * U, P.head * U)
  await icon(doc, glyph(s.glyph, s.ink, 2.1), b.x + 14, b.y + (P.head - 27) / 2, 27)
  const fs = titleSize(title, b.w)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PT(fs))
  doc.setTextColor(...rgb(s.ink))
  doc.text(pdfSafe(title), X(b.x + 51), Y(b.y + P.head / 2 + fs * 0.35))
  if (extra) {
    doc.setFontSize(PT(12.5))
    doc.text(pdfSafe(extra), X(b.x + b.w - 14), Y(b.y + P.head / 2 + 4.5), { align: 'right' })
  }
  return { x: b.x + 14, y: b.y + P.head + 10, w: b.w - 28, h: b.h - P.head - 20 }
}

const more = (doc: jsPDF, s: string, b: Box) => T(doc, s, b.x, b.y + b.h - 13, { size: 12, color: MUTED, maxW: b.w, maxLines: 1 })

/** Dibuja la portada (el mismo cartel que `coverHtml.ts`) en la página actual. */
export async function drawCover(doc: jsPDF, m: ReportModel, art?: ReportArt) {
  const p = m.pet
  const c = m.cover
  const H = P.hero

  // ── Cabecera ────────────────────────────────────────────────────────────
  const paws = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 ${H.h + 40}">${HERO_PAWS.map(([x, y, r, a]) => `<path d="${pawPath(x, y, r)}" fill="#fbe3c8" transform="rotate(${a} ${x} ${y})"/>`).join('')}</svg>`
  await placeSvg(doc, paws, X(-20), Y(-20), 820 * U, (H.h + 40) * U)

  let drewPhoto = false
  if (p.photo) {
    try {
      const props = doc.getImageProperties(p.photo)
      const r = props.width / props.height
      const box = H.photo * U
      const iw = r >= 1 ? box * r : box
      const ih = r >= 1 ? box : box / r
      doc.saveGraphicsState()
      doc.roundedRect(X(0), Y(0), box, box, 30 * U, 30 * U, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(p.photo, props.fileType, X(0) - (iw - box) / 2, Y(0) - (ih - box) / 2, iw, ih)
      doc.restoreGraphicsState()
      drewPhoto = true
    } catch {
      /* foto ilegible: se usa la ilustración */
    }
  }
  if (!drewPhoto) {
    const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><defs><linearGradient id="av" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#ffe9cf"/><stop offset="1" stop-color="#ffd5a6"/></linearGradient></defs><rect width="250" height="250" rx="30" fill="url(#av)"/></svg>`
    await icon(doc, bg, 0, 0, H.photo)
    await icon(doc, art ? art.pet(p.speciesKey) : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${pawPath(50, 56, 26)}" fill="#f2a65e"/></svg>`, 0, 0, H.photo)
  }

  // Títulos (bloque centrado en vertical)
  const tx = H.titlesX
  const tw = H.titlesW
  let ns = nameSize(p.name)
  doc.setFont('helvetica', 'bold')
  for (; ns > 22; ns -= 2) {
    doc.setFontSize(PT(ns))
    if (doc.getTextWidth(pdfSafe(p.name)) <= tw * U) break
  }
  const blockH = ns * 0.95 + 8 + 29 * 1.12 * 2 + 12 + 26 + 4 + 18
  let ty = (H.h - blockH) / 2
  ty += T(doc, p.name, tx, ty, { size: ns, style: 'bold', color: NAVY, maxW: tw + 12, maxLines: 1, lh: ns * 0.95 }) + 8
  ty += T(doc, tl('Informe de salud ·'), tx, ty, { size: 27, style: 'bold', color: NAVY, maxW: tw + 12, maxLines: 1, lh: 32 })
  ty += T(doc, m.period.label, tx, ty, { size: m.period.label.length > 18 ? 19 : 27, style: 'bold', color: NAVY, maxW: tw + 12, maxLines: 1, lh: 32 }) + 12
  await icon(doc, glyph('calendar', NAVY_HEX, 2), tx, ty, 26)
  T(doc, `${m.period.fromDay} - ${m.period.toDay}`, tx + 33, ty + 2, { size: 18, color: NAVY, maxW: tw, maxLines: 1 })
  ty += 30
  T(doc, tl('Generado: {0}', m.generatedAt), tx + 33, ty, { size: 14, color: rgb('#33405e'), maxW: tw, maxLines: 1 })

  // Ficha
  const fx = H.fichaX
  const fw = P.W - fx
  doc.setFillColor(...rgb('#dce8fb'))
  doc.roundedRect(X(fx), Y(0), fw * U, H.h * U, 26 * U, 26 * U, 'F')
  const rows = fichaRows(m)
  const fs = rows.length <= 6 ? 15.5 : rows.length === 7 ? 14 : 13
  const slot = (H.h - 24) / rows.length
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const cy = 12 + slot * i + slot / 2
    const isz = rows.length <= 6 ? 27 : 23
    await icon(doc, glyph(r.glyph, NAVY_HEX, 2.2), fx + 16, cy - isz / 2, isz)
    const x0 = fx + 16 + isz + 12
    const w0 = fw - (x0 - fx) - 12
    doc.setFontSize(PT(fs))
    doc.setFont('helvetica', 'normal')
    const lab = pdfSafe(`${r.label}:`)
    const lw = doc.getTextWidth(lab) / U + 5
    doc.setFont('helvetica', 'bold')
    const val = pdfSafe(r.value)
    const one = doc.getTextWidth(val) / U + lw <= w0
    const y0 = one ? cy - fs * 0.6 : cy - fs * 1.2
    T(doc, lab, x0, y0, { size: fs, color: NAVY, maxW: w0, maxLines: 1 })
    if (one) T(doc, val, x0 + lw, y0, { size: fs, style: 'bold', color: NAVY, maxW: w0 - lw, maxLines: 1 })
    else {
      // Primera línea tras la etiqueta; el resto, debajo (recortado).
      const words = val.split(' ')
      let first = ''
      while (words.length && doc.getTextWidth(`${first}${first ? ' ' : ''}${words[0]}`) / U <= w0 - lw) first += `${first ? ' ' : ''}${words.shift()}`
      T(doc, first, x0 + lw, y0, { size: fs, style: 'bold', color: NAVY, maxW: w0 - lw + 4, maxLines: 1 })
      T(doc, words.join(' '), x0, y0 + fs * 1.2, { size: fs, style: 'bold', color: NAVY, maxW: w0, maxLines: 1 })
    }
  }

  const r1 = P.r1
  const r2 = P.r2
  const r3 = P.r3
  const wW = P.W - r1.split - P.gap
  const charts = coverCharts(m, { weightW: wW - 32, weightH: r1.h - P.head - 24, incW: r2.split - 32, incH: r2.h - P.head - 50 })

  // ── Resumen ─────────────────────────────────────────────────────────────
  {
    const b = await cardFrame(doc, 'sum', { x: 0, y: r1.y, w: r1.split, h: r1.h })
    const stats = c.stats.slice(0, LIMITS.stats)
    const left = rest(c.stats.length, stats.length)
    const half = Math.ceil(stats.length / 2)
    const dense = half >= 4
    const bodyH = b.h - (left ? 16 : 0)
    const rh = half ? bodyH / half : bodyH
    const cw = (b.w - 22) / 2
    doc.setDrawColor(...rgb('#f6c48b'))
    doc.setLineWidth(2 * U)
    doc.line(X(b.x + b.w / 2), Y(b.y + 4), X(b.x + b.w / 2), Y(b.y + bodyH - 4))
    const isz = dense ? 34 : 38
    const [fl, fv, fd] = dense ? [12.5, 15.5, 11.5] : [13.5, 16.5, 12.5]
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i]
      const col = i < half ? 0 : 1
      const row = i < half ? i : i - half
      const x = b.x + col * (cw + 22)
      const cy = b.y + row * rh + rh / 2
      await icon(doc, statIcon(art, s), x, cy - isz / 2, isz)
      const xt = x + isz + 9
      const wt = cw - isz - 9
      const hh = fl * 1.2 + fv * 1.2 + (s.detail ? fd * 1.2 : 0)
      let y = cy - hh / 2
      y += T(doc, s.label, xt, y, { size: fl, color: SOFT_INK, maxW: wt, maxLines: 1, lh: fl * 1.2 })
      y += T(doc, s.value, xt, y, { size: fv, style: 'bold', maxW: wt, maxLines: 1, lh: fv * 1.2 })
      if (s.detail) T(doc, `(${s.detail})`, xt, y, { size: fd, color: SOFT_INK, maxW: wt, maxLines: 1, lh: fd * 1.2 })
    }
    if (left) more(doc, tl('Y {0} más en "Resumen del periodo".', left), b)
  }

  // ── Peso ────────────────────────────────────────────────────────────────
  {
    const six = !!m.weight.sixMonths && m.weight.points.length > 1
    const b = await cardFrame(doc, 'weight', { x: r1.split + P.gap, y: r1.y, w: wW, h: r1.h }, undefined, six ? tl('Últimos 6 meses') : '')
    if (charts.weight) await placeSvg(doc, charts.weight, X(b.x), Y(b.y), b.w * U, b.h * U)
    else T(doc, tl('Sin pesos registrados.'), b.x, b.y, { size: 15, style: 'italic', color: MUTED, maxW: b.w })
  }

  // ── Episodios ───────────────────────────────────────────────────────────
  {
    const b = await cardFrame(doc, 'inc', { x: 0, y: r2.y, w: r2.split, h: r2.h }, charts.incTitle, tl('Vómitos, deposiciones y síntomas'))
    let ly = b.y
    if (charts.legend.length) {
      let lx = b.x
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(PT(13))
      for (const l of charts.legend) {
        const lab = pdfSafe(l.label)
        const lw = 19 + doc.getTextWidth(lab) / U + 16
        if (lx + lw > b.x + b.w + 16 && lx > b.x) {
          lx = b.x
          ly += 18
        }
        doc.setFillColor(...rgb(l.color))
        doc.circle(X(lx + 6.5), Y(ly + 8), 6.5 * U, 'F')
        doc.setTextColor(...SOFT_INK)
        doc.text(lab, X(lx + 19), Y(ly + 12.5))
        lx += lw
      }
      ly += 22
    }
    await placeSvg(doc, charts.incidents, X(b.x), Y(ly), b.w * U, (b.y + b.h - ly) * U)
  }

  // ── Frecuencia ──────────────────────────────────────────────────────────
  {
    const fwid = P.W - r2.split - P.gap
    const b = await cardFrame(doc, 'freq', { x: r2.split + P.gap, y: r2.y, w: fwid, h: r2.h })
    const items = m.frequency.slice(0, LIMITS.freq)
    const left = rest(m.frequency.length, items.length)
    if (!items.length) T(doc, tl('Sin registros en el periodo.'), b.x, b.y, { size: 15, style: 'italic', color: MUTED, maxW: b.w })
    const rh = items.length ? (b.h - (left ? 16 : 0)) / Math.max(items.length, 4) : 0
    for (let i = 0; i < items.length; i++) {
      const f = items[i]
      const cy = b.y + i * rh + rh / 2
      await icon(doc, typeIconSvg(art, f.key, f.label, f.emoji), b.x + 4, cy - 16, 32)
      T(doc, f.label, b.x + 50, cy - 10.5, { size: 17, maxW: b.w - 90, maxLines: 1 })
      T(doc, String(f.count), b.x, cy - 12, { size: 19, style: 'bold', maxW: b.w - 4, align: 'right', maxLines: 1 })
      if (i < items.length - 1) {
        doc.setDrawColor(...rgb('#e3e8ef'))
        doc.setLineWidth(1.5 * U)
        doc.line(X(b.x), Y(b.y + (i + 1) * rh), X(b.x + b.w), Y(b.y + (i + 1) * rh))
      }
    }
    if (left) more(doc, tl('Y {0} tipos más.', left), b)
  }

  // ── Fila inferior ───────────────────────────────────────────────────────
  const listCard = async (k: 'vet' | 'notes', bx: Box, items: { when: string; tag?: string; body: string }[], total: number, empty: string, moreText: (n: number) => string) => {
    const b = await cardFrame(doc, k, bx)
    const s = SECTIONS[k]
    if (!items.length) return void T(doc, empty, b.x, b.y, { size: 15, style: 'italic', color: MUTED, maxW: b.w })
    let y = b.y
    let shown = 0
    for (const it of items) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(PT(15.5))
      const lines = Math.min(3, (doc.splitTextToSize(pdfSafe(it.body || tl('Sin nota')), (b.w - 12) * U) as string[]).length)
      const need = 24 + lines * 19
      if (shown > 0 && y + need > b.y + b.h - (total > shown + 1 ? 16 : 0)) break
      await icon(doc, glyph('calendar', s.color, 2), b.x, y, 21)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(PT(13.5))
      doc.setTextColor(...SOFT_INK)
      const w1 = pdfSafe(it.when + (it.tag ? ' · ' : ''))
      doc.text(w1, X(b.x + 28), Y(y + 15))
      if (it.tag) {
        doc.setTextColor(...rgb(s.color))
        doc.text(fit(doc, it.tag, (b.w - 28) * U - doc.getTextWidth(w1), PT(13.5), 'bold'), X(b.x + 28) + doc.getTextWidth(w1) + 3.5 * U, Y(y + 15))
      }
      y += 25
      const th = T(doc, it.body || tl('Sin nota'), b.x + 12, y, { size: 15.5, style: it.body ? 'bold' : 'italic', maxW: b.w - 12, maxLines: 3, lh: 19 })
      doc.setDrawColor(...rgb(s.border))
      doc.setLineWidth(2.5 * U)
      doc.line(X(b.x + 2), Y(y), X(b.x + 2), Y(y + th))
      y += th + 11
      shown++
    }
    const left = rest(total, shown)
    if (left) more(doc, moreText(left), b)
  }
  await listCard(
    'vet',
    { x: 0, y: r3.y, w: r3.a, h: r3.h },
    c.vetVisits.slice(0, LIMITS.vet).map((v) => ({ when: v.when, body: v.text })),
    c.vetVisits.length,
    tl('Sin visitas veterinarias registradas en el periodo.'),
    (n) => tl('Y {0} más en la cronología.', n),
  )
  await listCard(
    'notes',
    { x: r3.a + P.gap, y: r3.y, w: r3.b - r3.a - P.gap, h: r3.h },
    c.notes.slice(0, LIMITS.notes).map((n) => ({ when: n.when, tag: n.label, body: n.text })),
    c.notes.length,
    tl('Sin notas en el periodo.'),
    (n) => tl('Y {0} más en el informe detallado.', n),
  )
  {
    const b = await cardFrame(doc, 'key', { x: r3.b + P.gap, y: r3.y, w: P.W - r3.b - P.gap, h: r3.h })
    const facts = c.keyFacts.slice(0, LIMITS.key)
    const rh = facts.length ? b.h / facts.length : 0
    for (let i = 0; i < facts.length; i++) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(PT(14.5))
      const n = Math.min(2, (doc.splitTextToSize(pdfSafe(facts[i]), (b.w - 31) * U) as string[]).length)
      const cy = b.y + i * rh + rh / 2
      await icon(doc, glyph('check', '#2e9d57', 2.4), b.x, cy - (n * 17.5) / 2 - 1, 22)
      T(doc, facts[i], b.x + 31, cy - (n * 17.5) / 2, { size: 14.5, style: 'bold', maxW: b.w - 31, maxLines: 2, lh: 17.5 })
    }
  }

  T(doc, m.disclaimer, 30, P.discY, { size: 12, style: 'italic', color: MUTED, maxW: P.W - 60, align: 'center', lh: 15.5 })
}
