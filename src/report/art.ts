/**
 * Ilustraciones para el informe, como cadenas SVG.
 *
 * El informe (HTML y PDF) no depende de React: la app le pasa sus ilustraciones
 * ya convertidas a SVG (`src/ui/art/reportArt.tsx`). Sin ellas, el informe usa
 * iconos sencillos dibujados aquí, así que nunca se rompe.
 */
import type { EventKey, Species } from '../domain/types'

export interface ReportArt {
  /** Ilustración del tipo de registro (caja 100×100) o `null` si no hay. */
  type(key: EventKey, emoji?: string): string | null
  /** Avatar ilustrado de la especie (caja 64×64), para mascotas sin foto. */
  pet(species: Species): string
}

/** Color de cada tipo de registro (el mismo tono que su botón en la app). */
export const TYPE_TONE: Record<string, string> = {
  medication: '#4c62f2',
  vomit: '#66b434',
  stool: '#b47a42',
  food: '#fda821',
  water: '#2a98ef',
  weight: '#8a62f0',
  mood: '#fb5a8c',
  symptom: '#ef5542',
  vet: '#1ba3a0',
  other: '#84909e',
  shed: '#a28f2c',
  temperature: '#f0621a',
  activity: '#be4fe6',
  custom: '#9a84ef',
  days: '#2f44a0',
}

/** Icono sustituto: círculo del color del tipo con su inicial. */
export function fallbackTypeSvg(key: string, label: string): string {
  const c = TYPE_TONE[key] ?? TYPE_TONE.custom
  const ch = (label.trim()[0] ?? '·').toUpperCase().replace(/[<>&"']/g, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${c}"/><text x="50" y="64" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="42" fill="#ffffff">${ch}</text></svg>`
}

/** Silueta de huella (adorno de la portada). Centro de la almohadilla en (cx, cy), tamaño r. */
export function pawPath(cx: number, cy: number, r: number): string {
  const f = (n: number) => Math.round(n * 100) / 100
  const toe = (dx: number, dy: number) => {
    const x = cx + dx * r
    const y = cy + dy * r
    const rx = 0.22 * r
    const ry = 0.27 * r
    return `M${f(x + rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x - rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 0 ${f(x + rx)} ${f(y)}Z`
  }
  const pad = `M${f(cx - 0.62 * r)} ${f(cy + 0.42 * r)}C${f(cx - 0.62 * r)} ${f(cy - 0.12 * r)} ${f(cx - 0.3 * r)} ${f(cy - 0.3 * r)} ${f(cx)} ${f(cy - 0.3 * r)}C${f(cx + 0.3 * r)} ${f(cy - 0.3 * r)} ${f(cx + 0.62 * r)} ${f(cy - 0.12 * r)} ${f(cx + 0.62 * r)} ${f(cy + 0.42 * r)}C${f(cx + 0.62 * r)} ${f(cy + 0.72 * r)} ${f(cx + 0.3 * r)} ${f(cy + 0.66 * r)} ${f(cx)} ${f(cy + 0.66 * r)}C${f(cx - 0.3 * r)} ${f(cy + 0.66 * r)} ${f(cx - 0.62 * r)} ${f(cy + 0.72 * r)} ${f(cx - 0.62 * r)} ${f(cy + 0.42 * r)}Z`
  return [pad, toe(-0.72, -0.32), toe(-0.27, -0.78), toe(0.27, -0.78), toe(0.72, -0.32)].join('')
}
