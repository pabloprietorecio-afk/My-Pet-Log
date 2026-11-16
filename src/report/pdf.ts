import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { PALETTE_LIGHT } from '../charts/svg'
import { reportCharts } from '../charts/reportCharts'
import type { ReportModel } from '../domain/report'
import { pdfSafe } from './pdfText'

const PAGE_W = 210
const PAGE_H = 297
const M = 14
const CW = PAGE_W - M * 2
const BOTTOM = PAGE_H - 16

const INK: [number, number, number] = [15, 42, 38]
const MUTED: [number, number, number] = [83, 102, 95]
const BRAND: [number, number, number] = [28, 92, 171]
const LINE: [number, number, number] = [219, 227, 224]
const SOFT: [number, number, number] = [241, 245, 243]

class Writer {
  y = M
  constructor(readonly doc: jsPDF) {}

  ensure(h: number) {
    if (this.y + h > BOTTOM) {
      this.doc.addPage()
      this.y = M
    }
  }

  lines(text: string, width: number, size: number, style: 'normal' | 'bold' = 'normal'): string[] {
    this.doc.setFont('helvetica', style)
    this.doc.setFontSize(size)
    return this.doc.splitTextToSize(pdfSafe(text) || ' ', width) as string[]
  }

  text(
    text: string,
    o: { x?: number; size?: number; style?: 'normal' | 'bold'; color?: [number, number, number]; width?: number; gap?: number } = {},
  ) {
    const size = o.size ?? 10
    const lh = size * 0.42
    const ls = this.lines(text, o.width ?? CW, size, o.style ?? 'normal')
    this.doc.setTextColor(...(o.color ?? INK))
    for (const l of ls) {
      this.ensure(lh)
      this.doc.text(l, o.x ?? M, this.y + lh * 0.8)
      this.y += lh
    }
    this.y += o.gap ?? 1
  }

  heading(t: string, need = 14) {
    this.ensure(need)
    this.y += 4
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(12)
    this.doc.setTextColor(...BRAND)
    this.doc.text(pdfSafe(t), M, this.y + 4)
    this.y += 6
    this.doc.setDrawColor(...LINE)
    this.doc.setLineWidth(0.3)
    this.doc.line(M, this.y, M + CW, this.y)
    this.y += 3
  }

  kv(rows: [string, string][]) {
    for (const [k, v] of rows) {
      const vl = this.lines(v, CW - 48, 10, 'bold')
      this.ensure(vl.length * 4.2 + 1)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(10)
      this.doc.setTextColor(...MUTED)
      this.doc.text(pdfSafe(k), M, this.y + 3.4)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(...INK)
      vl.forEach((l, i) => this.doc.text(l, M + 48, this.y + 3.4 + i * 4.2))
      this.y += vl.length * 4.2 + 1
    }
  }

  table(cols: { title: string; w: number; right?: boolean }[], rows: string[][]) {
    const total = cols.reduce((s, c) => s + c.w, 0)
    const widths = cols.map((c) => (c.w / total) * CW)
    const size = 8.5
    const pad = 1.6
    const drawHeader = () => {
      this.ensure(8)
      this.doc.setFillColor(...SOFT)
      this.doc.rect(M, this.y, CW, 6.5, 'F')
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(size)
      this.doc.setTextColor(...INK)
      let x = M
      cols.forEach((c, i) => {
        this.doc.text(pdfSafe(c.title), c.right ? x + widths[i] - pad : x + pad, this.y + 4.4, { align: c.right ? 'right' : 'left' })
        x += widths[i]
      })
      this.y += 6.5
    }
    drawHeader()
    for (const r of rows) {
      const cells = r.map((c, i) => this.lines(c, widths[i] - pad * 2, size))
      const h = Math.max(...cells.map((c) => c.length)) * 3.7 + pad * 1.4
      if (this.y + h > BOTTOM) {
        this.doc.addPage()
        this.y = M
        drawHeader()
      }
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(size)
      this.doc.setTextColor(...INK)
      let x = M
      cells.forEach((lines, i) => {
        lines.forEach((l, li) =>
          this.doc.text(l, cols[i].right ? x + widths[i] - pad : x + pad, this.y + pad + 2.6 + li * 3.7, {
            align: cols[i].right ? 'right' : 'left',
          }),
        )
        x += widths[i]
      })
      this.y += h
      this.doc.setDrawColor(...LINE)
      this.doc.setLineWidth(0.2)
      this.doc.line(M, this.y, M + CW, this.y)
    }
    this.y += 2
  }
}

async function drawSvg(w: Writer, svg: string, width: number) {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  const ratio = m ? Number(m[2]) / Number(m[1]) : 0.5
  const height = width * ratio
  w.ensure(height + 2)
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden'
  holder.innerHTML = svg
  document.body.appendChild(holder)
  try {
    const el = holder.firstElementChild as SVGElement
    await svg2pdf(el, w.doc, { x: M, y: w.y, width, height })
  } finally {
    holder.remove()
  }
  w.y += height + 2
}

/** Informe como PDF vectorial (sin dependencias de red). */
export async function renderPdf(m: ReportModel): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.setProperties({ title: pdfSafe(`Informe de ${m.pet.name}`), subject: 'Informe para el veterinario', creator: 'PetLog' })
  const w = new Writer(doc)
  const p = m.pet

  // Cabecera
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PAGE_W, 3, 'F')
  w.y = 10
  w.text('PetLog · Informe para el veterinario', { size: 9, color: MUTED, gap: 0 })
  w.text(p.name, { size: 22, style: 'bold', gap: 1 })
  w.text(`${m.period.label} (${m.period.fromText} - ${m.period.toText})`, { size: 10, color: MUTED, gap: 0 })
  w.text(`Generado el ${m.generatedAt}`, { size: 9, color: MUTED, gap: 2 })

  w.heading('1. Datos de la mascota')
  const vet = [p.vet.name, p.vet.clinic, p.vet.phone].filter(Boolean).join(' · ')
  const rows: [string, string][] = [['Especie', p.species]]
  if (p.breed) rows.push(['Raza', p.breed])
  rows.push(['Sexo', p.sex])
  if (p.age) rows.push(['Edad', p.age])
  if (p.birthDate) rows.push(['Nacimiento', p.birthDate])
  if (p.weight) rows.push(['Último peso', `${p.weight.text} (${p.weight.date})`])
  if (vet) rows.push(['Veterinario habitual', vet])
  w.kv(rows)

  w.heading('2. Patologías y alergias')
  w.kv([
    ['Patologías', p.conditions.length ? p.conditions.join(', ') : 'Sin datos registrados'],
    ['Alergias', p.allergies.length ? p.allergies.join(', ') : 'Sin datos registrados'],
  ])

  w.heading('3. Medicación actual')
  if (m.currentTreatments.length) {
    w.table(
      [
        { title: 'Medicamento', w: 3 },
        { title: 'Dosis', w: 2 },
        { title: 'Pauta', w: 4 },
        { title: 'Desde', w: 2 },
        { title: 'Notas', w: 4 },
      ],
      m.currentTreatments.map((t) => [t.name, t.dose, t.schedule, t.until ? `${t.since} - ${t.until}` : t.since, t.notes ?? '']),
    )
  } else w.text('Sin tratamientos activos registrados.', { color: MUTED })

  w.heading('4. Resumen del periodo')
  w.kv(m.summary.map((s) => [s.label, s.value] as [string, string]))

  w.heading('5. Cronología de incidencias')
  if (!m.timeline.length) w.text('No hay registros en este periodo.', { color: MUTED })
  for (const day of m.timeline) {
    w.ensure(14)
    w.y += 2
    w.text(day.title, { style: 'bold', size: 10, gap: 0.5 })
    for (const it of day.items) {
      const detail = `${it.label}${it.detail ? ' - ' + it.detail : ''}`
      const ls = w.lines(detail, CW - 18, 9.5)
      w.ensure(ls.length * 4 + 0.6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...MUTED)
      doc.text(it.time, M, w.y + 3.2)
      doc.setTextColor(...INK)
      ls.forEach((l, i) => doc.text(l, M + 16, w.y + 3.2 + i * 4))
      w.y += ls.length * 4 + 0.6
    }
  }

  w.heading('6. Tabla de medicación')
  if (m.medication.rows.length) {
    w.table(
      [
        { title: 'Medicamento', w: 5 },
        { title: 'Prev.', w: 1.4, right: true },
        { title: 'A tiempo', w: 1.8, right: true },
        { title: 'Retraso', w: 1.6, right: true },
        { title: 'Omit.', w: 1.4, right: true },
        { title: 'Sin reg.', w: 1.6, right: true },
        { title: 'Adic.', w: 1.4, right: true },
      ],
      m.medication.rows.map((r) => [
        `${r.name} ${r.dose} (${r.schedule})`,
        String(r.planned),
        String(r.given),
        String(r.late),
        String(r.skipped),
        String(r.unrecorded),
        String(r.extra),
      ]),
    )
    w.text('Prev. = tomas previstas ya vencidas. Retraso = administradas fuera del margen. Sin reg. = sin ningún registro. Adic. = tomas sin hueco programado.', { size: 8, color: MUTED })
  } else w.text('Sin medicación en el periodo.', { color: MUTED })
  if (m.medication.adHoc) w.text(`Además, ${m.medication.adHoc} toma(s) suelta(s) sin tratamiento asociado.`, { size: 9, color: MUTED })

  w.heading('7-8. Peso y gráficas', 75)
  for (const c of reportCharts(m, PALETTE_LIGHT, 340)) {
    w.ensure(12)
    w.text(c.title, { style: 'bold', size: 10, gap: 0.5 })
    if (c.note) w.text(c.note, { size: 8.5, color: MUTED, gap: 0.5 })
    await drawSvg(w, c.svg, 150)
    if (c.legend) {
      w.ensure(6)
      let lx = M
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      for (const l of c.legend) {
        const hex = l.color.replace('#', '')
        doc.setFillColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16))
        doc.roundedRect(lx, w.y + 0.6, 3, 3, 0.6, 0.6, 'F')
        doc.setTextColor(...MUTED)
        const lab = pdfSafe(l.label)
        doc.text(lab, lx + 4.5, w.y + 3.1)
        lx += 4.5 + doc.getTextWidth(lab) + 6
      }
      w.y += 6
    }
  }

  w.heading('9. Observaciones del propietario')
  if (m.ownerNotes.length) {
    w.table(
      [
        { title: 'Fecha', w: 2.6 },
        { title: 'Tipo', w: 2 },
        { title: 'Nota', w: 9 },
      ],
      m.ownerNotes.map((n) => [n.when, n.label, n.text]),
    )
  } else w.text('Sin notas en el periodo.', { color: MUTED })

  if (m.photos.length) {
    w.heading('Fotografías adjuntas')
    const size = 42
    let x = M
    for (const f of m.photos) {
      try {
        const props = doc.getImageProperties(f.dataUrl)
        const r = props.width / props.height
        const iw = r >= 1 ? size : size * r
        const ih = r >= 1 ? size / r : size
        if (x + size > M + CW + 0.1) {
          x = M
          w.y += size + 8
        }
        w.ensure(size + 8)
        doc.addImage(f.dataUrl, props.fileType, x, w.y, iw, ih)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...MUTED)
        doc.text(pdfSafe(`${f.label} · ${f.when}`), x, w.y + size + 3.5, { maxWidth: size })
        x += size + 6
      } catch {
        /* una imagen ilegible no debe impedir el informe */
      }
    }
    w.y += size + 8
  }

  w.ensure(22)
  w.y += 4
  doc.setFillColor(...SOFT)
  const dl = w.lines(m.disclaimer, CW - 6, 8.5)
  doc.rect(M, w.y, CW, dl.length * 3.6 + 5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  dl.forEach((l, i) => doc.text(l, M + 3, w.y + 5 + i * 3.6))

  // Pie con paginación
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(pdfSafe(`PetLog · ${p.name} · ${m.period.label}`), M, PAGE_H - 8)
    doc.text(`Página ${i} de ${n}`, PAGE_W - M, PAGE_H - 8, { align: 'right' })
  }
  return doc.output('blob')
}
