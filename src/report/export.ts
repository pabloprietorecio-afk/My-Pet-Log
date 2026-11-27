import type { ReportModel } from '../domain/report'
import type { ReportArt } from './art'
import { renderHtml } from './html'

const safe = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function reportFileName(m: ReportModel, ext: 'pdf' | 'html', now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  return `PetLog-${safe(m.pet.name) || 'mascota'}-informe-${date}.${ext}`
}

export const htmlBlob = (m: ReportModel, art?: ReportArt) => new Blob([renderHtml(m, art)], { type: 'text/html;charset=utf-8' })
/** El generador de PDF (jsPDF + svg2pdf) se carga solo al pedir un PDF. */
export const pdfBlob = async (m: ReportModel, art?: ReportArt) => (await import('./pdf')).renderPdf(m, art)
