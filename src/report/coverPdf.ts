/**
 * Portada del informe en PDF (página 1): la misma infografía que `coverHtml.ts`,
 * dibujada en vectorial con jsPDF. Iconos y gráficas son SVG (vía svg2pdf).
 */
import type { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import type { ReportModel } from '../domain/report'
import { pawPath, TYPE_TONE, type ReportArt } from './art'
import { coverCharts, fichaRows, LIMITS, rest, SECTIONS, statIcon, tint, typeIconSvg, type SectionKey } from './cover'
import { glyph } from './glyphs'
import { pdfSafe } from './pdfText'

type RGB = [number, number, number]
const rgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const INK = rgb('#14231f')
const NAVY = rgb('#13205c')
const MUTED = rgb('#4f5d58')
const PAGE_W = 210
const M = 10
const CW = PAGE_W - 2 * M
const GAP = 3

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

/** Marco de tarjeta con cabecera en degradado; devuelve la caja del contenido. */
async function cardFrame(doc: jsPDF, k: SectionKey, b: Box, title = SECTIONS[k].title): Promise<Box> {
  const s = SECTIONS[k]
  const R = 4
  const HH = 8.5
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...rgb(tint(s.color, 0.7)))
  doc.setLineWidth(0.4)
  doc.roundedRect(b.x, b.y, b.w, b.h, R, R, 'FD')
  // Cabecera: SVG con esquinas superiores redondeadas y degradado horizontal.
  const W = b.w * 10
  const H = HH * 10
  const r = R * 10
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="h${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.5" stop-color="${s.color}"/><stop offset="1" stop-color="${tint(s.color, 0.22)}"/></linearGradient></defs><path d="M0 ${r}A${r} ${r} 0 0 1 ${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H}H0Z" fill="url(#h${k})"/></svg>`
  await placeSvg(doc, head, b.x, b.y, b.w, HH)
  await placeSvg(doc, glyph(s.glyph, '#ffffff', 2), b.x + 3, b.y + (HH - 4.6) / 2, 4.6, 4.6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(fit(doc, title, b.w - 12, 11, 'bold'), b.x + 9.4, b.y + HH / 2 + 1.4)
  return { x: b.x + 3, y: b.y + HH + 2.6, w: b.w - 6, h: b.h - HH - 5 }
}

function more(doc: jsPDF, s: string, b: Box) {
  text(doc, s, b.x, b.y + b.h - 3.4, { size: 7.5, color: MUTED, maxW: b.w, maxLines: 1 })
}

/** Dibuja la portada en la página actual del documento. */
export async function drawCover(doc: jsPDF, m: ReportModel, art?: ReportArt) {
  const p = m.pet
  const c = m.cover

  // ── Cabecera ────────────────────────────────────────────────────────────
  const HERO_H = 58
  const heroW = (CW - GAP) * 0.6
  const fichaX = M + heroW + GAP
  const fichaW = CW - heroW - GAP
  const heroBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${heroW * 10} ${HERO_H * 10}"><defs><linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3e4"/><stop offset=".45" stop-color="#fff8ef"/><stop offset="1" stop-color="#eef1ff"/></linearGradient></defs><rect width="${heroW * 10}" height="${HERO_H * 10}" rx="40" fill="url(#hero)"/>${[
    [50, 80, 30, -18],
    [150, 520, 24, 12],
    [520, 60, 22, 20],
    [1040, 470, 34, -10],
    [930, 80, 20, 30],
    [760, 530, 18, -25],
  ]
    .map(([x, y, r, a]) => `<path d="${pawPath(x, y, r)}" fill="#ffd8ad" fill-opacity=".55" transform="rotate(${a} ${x} ${y})"/>`)
    .join('')}</svg>`
  await placeSvg(doc, heroBg, M, M, heroW, HERO_H)

  // Foto o ilustración
  const AV = 42
  const ax = M + 4
  const ay = M + (HERO_H - AV) / 2
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(ax - 1.2, ay - 1.2, AV + 2.4, AV + 2.4, 8, 8, 'F')
  let drewPhoto = false
  if (p.photo) {
    try {
      const props = doc.getImageProperties(p.photo)
      const r = props.width / props.height
      // «object-fit: cover» con recorte redondeado.
      const iw = r >= 1 ? AV * r : AV
      const ih = r >= 1 ? AV : AV / r
      doc.saveGraphicsState()
      doc.roundedRect(ax, ay, AV, AV, 7, 7, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(p.photo, props.fileType, ax - (iw - AV) / 2, ay - (ih - AV) / 2, iw, ih)
      doc.restoreGraphicsState()
      drewPhoto = true
    } catch {
      /* foto ilegible: se usa la ilustración */
    }
  }
  if (!drewPhoto) {
    const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><defs><linearGradient id="av" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#ffe9cf"/><stop offset="1" stop-color="#ffd5a6"/></linearGradient></defs><rect width="420" height="420" rx="70" fill="url(#av)"/></svg>`
    await placeSvg(doc, bg, ax, ay, AV, AV)
    await placeSvg(doc, art ? art.pet(p.speciesKey) : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${pawPath(50, 56, 26)}" fill="#f2a65e"/></svg>`, ax, ay, AV, AV)
  }

  const tx = ax + AV + 5
  const tw = M + heroW - tx - 4
  let ty = M + 9
  text(doc, 'PETLOG', tx, ty, { size: 8.5, style: 'bold', color: rgb('#a24a0c'), maxW: tw })
  ty += 4.6
  // Nombre: lo más grande posible sin salirse (32 → 18 pt).
  let ns = 32
  doc.setFont('helvetica', 'bold')
  for (; ns > 18; ns -= 1) {
    doc.setFontSize(ns)
    if (doc.getTextWidth(pdfSafe(p.name)) <= tw) break
  }
  ty += text(doc, p.name, tx, ty, { size: ns, style: 'bold', color: NAVY, maxW: tw, maxLines: 1 }) + 1
  ty += text(doc, 'Informe para el veterinario', tx, ty, { size: 12, style: 'bold', color: NAVY, maxW: tw, maxLines: 2 }) + 2
  await placeSvg(doc, glyph('calendar', '#13205c', 1.9), tx, ty - 0.3, 4.4, 4.4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  const pl = pdfSafe(`${m.period.label} · `)
  const range = `${m.period.fromDay} - ${m.period.toDay}`
  const plW = doc.getTextWidth(pl)
  if (plW + doc.getTextWidth(range) <= tw - 6) {
    doc.setTextColor(...rgb('#a24a0c'))
    doc.text(pl, tx + 6, ty + 3.2)
    doc.setTextColor(...NAVY)
    doc.text(range, tx + 6 + plW, ty + 3.2)
    ty += 5
  } else {
    doc.setTextColor(...rgb('#a24a0c'))
    doc.text(fit(doc, m.period.label, tw - 6, 9.5, 'bold'), tx + 6, ty + 3.2)
    doc.setTextColor(...NAVY)
    doc.text(range, tx + 6, ty + 7.2)
    ty += 9
  }
  text(doc, `Generado el ${m.generatedAt}`, tx, ty + 0.6, { size: 8.5, color: MUTED, maxW: tw })

  // Ficha
  doc.setFillColor(...rgb('#eef1ff'))
  doc.roundedRect(fichaX, M, fichaW, HERO_H, 4, 4, 'F')
  const rows = fichaRows(m)
  const lh = 3.6
  // Altura de cada fila (las largas usan dos líneas) para centrar el bloque.
  doc.setFontSize(8.6)
  const rowLines = rows.map((r) => {
    doc.setFont('helvetica', 'normal')
    const lw = doc.getTextWidth(pdfSafe(`${r.label}:`)) + 1.2
    doc.setFont('helvetica', 'bold')
    return doc.getTextWidth(pdfSafe(r.value)) + lw > fichaW - 12 ? 2 : 1
  })
  const gapRow = 1.5
  const totalH = rowLines.reduce((s, n) => s + n * lh + gapRow, -gapRow)
  let fy = M + Math.max(3, (HERO_H - totalH) / 2)
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (fy + rowLines[i] * lh > M + HERO_H - 2) break
    await placeSvg(doc, glyph(r.glyph, '#2f44a0', 1.9), fichaX + 3.5, fy - 0.3, 4.2, 4.2)
    const x0 = fichaX + 9.5
    const w0 = fichaW - 12
    doc.setFontSize(8.6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...rgb('#3d4a6b'))
    const lab = pdfSafe(`${r.label}:`)
    doc.text(lab, x0, fy + 2.9)
    const lw = doc.getTextWidth(lab) + 1.2
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    if (rowLines[i] === 1) doc.text(pdfSafe(r.value), x0 + lw, fy + 2.9)
    else {
      // Primera línea tras la etiqueta; la segunda, debajo y recortada.
      const words = pdfSafe(r.value).split(' ')
      let first = ''
      while (words.length && doc.getTextWidth(`${first}${first ? ' ' : ''}${words[0]}`) <= w0 - lw) first += `${first ? ' ' : ''}${words.shift()}`
      doc.text(first, x0 + lw, fy + 2.9)
      doc.text(fit(doc, words.join(' '), w0, 8.6, 'bold'), x0, fy + 2.9 + lh)
    }
    fy += rowLines[i] * lh + gapRow
  }

  // ── Rejilla ─────────────────────────────────────────────────────────────
  const gy = M + HERO_H + GAP
  const gBottom = 274
  const avail = gBottom - gy - 2 * GAP
  const r1 = (avail * 1.05) / 3
  const r2 = avail / 3
  const r3 = avail - r1 - r2
  const col = (CW - 5 * GAP) / 6
  const span = (n: number) => n * col + (n - 1) * GAP
  const X = (i: number) => M + i * (col + GAP)
  const y2 = gy + r1 + GAP
  const y3 = y2 + r2 + GAP
  const charts = coverCharts(m, { weightW: 300, weightH: 118, incW: 420, incH: 150, fontSize: 11 })

  // Resumen
  {
    const b = await cardFrame(doc, 'sum', { x: X(0), y: gy, w: span(3), h: r1 })
    const rowH = 11.2
    const maxRows = Math.floor((b.h - 4) / rowH)
    const cap = Math.min(LIMITS.stats, maxRows * 2)
    const shown = c.stats.slice(0, cap)
    const nRows = Math.ceil(shown.length / 2)
    const left0 = rest(c.stats.length, shown.length)
    // Las filas se reparten el alto de la tarjeta (sin hueco vacío abajo), hasta 14 mm cada una.
    const rh = nRows ? Math.min(14, (b.h - (left0 ? 5 : 0)) / nRows) : rowH
    const cw = (b.w - 4) / 2
    for (let i = 0; i < shown.length; i++) {
      const s = shown[i]
      const x = b.x + (i % 2) * (cw + 4)
      const y = b.y + Math.floor(i / 2) * rh + (rh - 10.6) / 2 - 0.6
      await placeSvg(doc, statIcon(art, s), x, y + 1, 8, 8)
      const xt = x + 10
      const wt = cw - 10
      text(doc, s.label, xt, y, { size: 7.5, color: MUTED, maxW: wt, maxLines: 1 })
      text(doc, s.value, xt, y + 3, { size: 10.5, style: 'bold', maxW: wt, maxLines: 1 })
      if (s.detail) text(doc, s.detail, xt, y + 7.4, { size: 7.5, color: MUTED, maxW: wt, maxLines: 1 })
    }
    const left = rest(c.stats.length, shown.length)
    if (left) more(doc, `Y ${left} más en "Resumen del periodo".`, b)
  }

  // Peso
  {
    const b = await cardFrame(doc, 'weight', { x: X(3), y: gy, w: span(3), h: r1 })
    const w = c.weight
    if (!w) text(doc, 'Sin pesos registrados.', b.x, b.y, { size: 9, style: 'italic', color: MUTED, maxW: b.w })
    else {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...rgb('#3a1f99'))
      const big = pdfSafe(w.last)
      doc.text(big, b.x, b.y + 6)
      let x = b.x + doc.getTextWidth(big) + 2.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...MUTED)
      doc.text(w.lastDate, x, b.y + 6)
      x += doc.getTextWidth(w.lastDate) + 3
      let top = b.y + 9.5
      if (w.delta) {
        const chip = pdfSafe(`${w.delta} desde el ${w.firstDate}`)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        const cwid = doc.getTextWidth(chip) + 5
        let cx = x
        let cy = b.y + 2
        if (cx + cwid > b.x + b.w) {
          cx = b.x
          cy = b.y + 8.5
          top = cy + 6.5
        }
        doc.setFillColor(...rgb('#efe9ff'))
        doc.roundedRect(cx, cy, cwid, 5, 2.5, 2.5, 'F')
        doc.setTextColor(...rgb('#3a1f99'))
        doc.text(chip, cx + 2.5, cy + 3.5)
      }
      const note = m.weight.windowLabel === 'últimos 6 meses'
      const bottom = b.y + b.h - (note ? 5 : 0)
      if (charts.weight) await placeSvg(doc, charts.weight, b.x, top, b.w, bottom - top)
      if (note) more(doc, 'Gráfica: mediciones de los últimos 6 meses.', b)
    }
  }

  // Episodios
  {
    const b = await cardFrame(doc, 'inc', { x: X(0), y: y2, w: span(4), h: r2 }, charts.incTitle)
    let ly = b.y
    if (charts.legend.length) {
      let lx = b.x
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      for (const l of charts.legend) {
        const lab = pdfSafe(l.label)
        const lw = 4.4 + doc.getTextWidth(lab) + 5
        if (lx + lw > b.x + b.w && lx > b.x) {
          lx = b.x
          ly += 4.2
        }
        doc.setFillColor(...rgb(l.color))
        doc.roundedRect(lx, ly + 0.6, 2.8, 2.8, 0.7, 0.7, 'F')
        doc.setTextColor(...MUTED)
        doc.text(lab, lx + 4.2, ly + 3)
        lx += lw
      }
      ly += 6
    }
    await placeSvg(doc, charts.incidents, b.x, ly, b.w, b.y + b.h - ly)
  }

  // Registros por tipo
  {
    const b = await cardFrame(doc, 'freq', { x: X(4), y: y2, w: span(2), h: r2 })
    const rowH = 7.4
    const fitRows = Math.floor((b.h - 5) / rowH)
    const items = m.frequency.slice(0, Math.min(LIMITS.freq, fitRows))
    if (!items.length) text(doc, 'Sin registros en el periodo.', b.x, b.y, { size: 9, style: 'italic', color: MUTED, maxW: b.w })
    const fmax = Math.max(1, ...items.map((f) => f.count))
    for (let i = 0; i < items.length; i++) {
      const f = items[i]
      const y = b.y + i * rowH
      await placeSvg(doc, typeIconSvg(art, f.key, f.label, f.emoji), b.x, y + 0.3, 6, 6)
      const barW = 12
      const numW = 6
      const lw = b.w - 8 - barW - numW - 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...INK)
      doc.text(fit(doc, f.label, lw, 9.5), b.x + 8, y + 4.4)
      const bx = b.x + b.w - numW - barW - 2
      doc.setFillColor(...rgb('#edf1ee'))
      doc.roundedRect(bx, y + 2.4, barW, 2.4, 1.2, 1.2, 'F')
      doc.setFillColor(...rgb(TYPE_TONE[f.key] ?? TYPE_TONE.custom))
      doc.roundedRect(bx, y + 2.4, Math.max(2.4, (f.count / fmax) * barW), 2.4, 1.2, 1.2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.text(String(f.count), b.x + b.w, y + 4.6, { align: 'right' })
      if (i < items.length - 1) {
        doc.setDrawColor(...rgb('#eef1ee'))
        doc.setLineWidth(0.25)
        doc.line(b.x + 8, y + rowH - 0.4, b.x + b.w, y + rowH - 0.4)
      }
    }
    const left = rest(m.frequency.length, items.length)
    if (left) more(doc, `Y ${left} tipos más.`, b)
  }

  // Fila inferior: listas con texto (medicación, veterinario, observaciones)
  const listCard = async (
    k: SectionKey,
    x: number,
    items: { head?: string; title?: string; body: string; sub?: string }[],
    total: number,
    empty: string,
    moreText: (n: number) => string,
  ) => {
    const b = await cardFrame(doc, k, { x, y: y3, w: span(2), h: r3 })
    if (!items.length) {
      text(doc, empty, b.x, b.y, { size: 9, style: 'italic', color: MUTED, maxW: b.w })
      return
    }
    let y = b.y
    let shown = 0
    const limit = b.y + b.h - (total > 1 ? 5 : 0)
    for (const it of items) {
      // Altura prevista: si no cabe entera, se para (lo que falta se cuenta abajo).
      doc.setFontSize(9)
      const bodyLines = Math.min(3, (doc.splitTextToSize(pdfSafe(`${it.title ? `${it.title} ` : ''}${it.body}`), b.w) as string[]).length)
      const need = (it.head ? 4 : 0) + bodyLines * 3.8 + (it.sub ? 3.6 : 0)
      if (y + need > limit && shown > 0) break
      if (it.head) {
        if (k === 'vet') await placeSvg(doc, glyph('calendar', SECTIONS[k].color, 2), b.x, y + 0.1, 3.2, 3.2)
        text(doc, it.head, b.x + (k === 'vet' ? 4.2 : 0), y, { size: 7.8, style: 'bold', color: rgb(SECTIONS[k].color), maxW: b.w - 4, maxLines: 1 })
        y += 4
      }
      if (it.title) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...INK)
        const t = fit(doc, it.title, b.w * 0.7, 9, 'bold')
        doc.text(t, b.x, y + 3)
        const tw = doc.getTextWidth(t) + 1.6
        text(doc, it.body, b.x + tw, y, { size: 9, maxW: b.w - tw, maxLines: 1 })
        y += 3.8
      } else {
        y += text(doc, it.body || 'Sin nota', b.x, y, { size: 9, maxW: b.w, maxLines: 3, style: it.body ? 'normal' : 'italic', lh: 3.8 })
      }
      if (it.sub) y += text(doc, it.sub, b.x, y, { size: 7.6, color: MUTED, maxW: b.w, maxLines: 1 })
      y += 2.2
      shown++
    }
    const left = rest(total, shown)
    if (left) more(doc, moreText(left), b)
  }

  await listCard(
    'med',
    X(0),
    c.meds.slice(0, LIMITS.meds).map((t) => ({ title: t.name, body: t.dose, sub: `${t.schedule}${t.adherence ? ` · ${t.adherence} dadas` : ''}` })),
    c.meds.length,
    'Sin tratamientos activos registrados.',
    (n) => `Y ${n} más en "Medicación actual".`,
  )
  await listCard(
    'vet',
    X(2),
    c.vetVisits.slice(0, LIMITS.vet).map((v) => ({ head: v.when, body: v.text })),
    c.vetVisits.length,
    'Sin visitas veterinarias registradas en el periodo.',
    (n) => `Y ${n} más en la cronología.`,
  )
  await listCard(
    'notes',
    X(4),
    c.notes.slice(0, LIMITS.notes).map((n) => ({ head: `${n.when} · ${n.label}`, body: n.text })),
    c.notes.length,
    'Sin notas en el periodo.',
    (n) => `Y ${n} más en "Observaciones del propietario".`,
  )

  // Aviso
  text(doc, m.disclaimer, M + 8, gBottom + 2.2, { size: 7.5, style: 'italic', color: MUTED, maxW: CW - 16, align: 'center', lh: 3.2 })
}
