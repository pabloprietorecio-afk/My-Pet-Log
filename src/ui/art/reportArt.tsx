/**
 * Ilustraciones de la app convertidas a SVG para el informe (HTML y PDF).
 * Así la portada usa los mismos dibujos que los botones de la app.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import type { EventKey, Species } from '../../domain/types'
import type { ReportArt } from '../../report/art'
import { PetIllustration } from './pets'
import { TypeArt } from './TypeArt'

let seq = 0

/**
 * Cada ilustración define degradados con `id`. Al pegar varias en un mismo documento
 * los `id` deben ser únicos (si no, una usaría los degradados de otra), así que se renombran.
 */
function uniqueIds(svg: string): string {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  if (ids.length === 0) return svg
  const n = ++seq
  const map = new Map(ids.map((id, i) => [id, `pa${n}x${i}`]))
  return svg
    .replace(/\sid="([^"]+)"/g, (_, id: string) => ` id="${map.get(id)}"`)
    .replace(/url\(#([^)]+)\)/g, (all, id: string) => (map.has(id) ? `url(#${map.get(id)})` : all))
    .replace(/href="#([^"]+)"/g, (all, id: string) => (map.has(id) ? `href="#${map.get(id)}"` : all))
}

/**
 * El generador de PDF (svg2pdf) no pinta trazos con degradado (`stroke="url(#…)"`).
 * Se sustituyen por el color central del degradado: en el tamaño del informe no se nota.
 */
function solidStrokes(svg: string): string {
  const stops = new Map<string, string[]>()
  for (const g of svg.matchAll(/<(?:linear|radial)Gradient[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/(?:linear|radial)Gradient>/g)) {
    stops.set(g[1], [...g[2].matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]))
  }
  return svg.replace(/stroke="url\(#([^)]+)\)"/g, (all, id: string) => {
    const c = stops.get(id)
    return c && c.length ? `stroke="${c[Math.floor((c.length - 1) / 2)]}"` : all
  })
}

const withNs = (svg: string) => (svg.startsWith('<svg') && !svg.includes('xmlns=') ? svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') : svg)

export const reportArt: ReportArt = {
  type(key: EventKey, emoji?: string) {
    const svg = renderToStaticMarkup(<TypeArt k={key} emoji={emoji} />)
    // Botón propio sin ilustración: la app dibuja el emoji, que el PDF no puede mostrar.
    if (svg.includes('<text')) return null
    return uniqueIds(solidStrokes(withNs(svg)))
  },
  pet(species: Species) {
    return uniqueIds(solidStrokes(withNs(renderToStaticMarkup(<PetIllustration species={species} />))))
  },
}
