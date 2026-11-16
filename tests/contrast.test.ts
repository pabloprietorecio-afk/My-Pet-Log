import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PALETTE_DARK, PALETTE_LIGHT } from '../src/charts/svg'

const css = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8')

function vars(selector: string): Record<string, string> {
  const start = css.indexOf(selector + ' {')
  const block = css.slice(start, css.indexOf('}', start))
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2]
  return out
}
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

for (const [name, sel] of [['claro', ':root'], ['oscuro', ":root[data-theme='dark']"]] as const) {
  describe(`contraste WCAG AA (${name})`, () => {
    const v = { ...vars(':root'), ...(name === 'oscuro' ? vars(sel) : {}) }
    const pairs: [string, string][] = [
      ['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['muted', 'surface-2'],
      ['on-primary', 'primary'], ['primary', 'surface'], ['primary', 'bg'], ['primary', 'primary-soft'],
      ['danger', 'danger-soft'], ['danger', 'surface'], ['ok', 'ok-soft'], ['warn', 'warn-soft'],
      ...Object.keys(v).filter((k) => k.startsWith('t-')).map((k) => ['ink', k] as [string, string]),
    ]
    for (const [fg, bg] of pairs) {
      it(`${fg} sobre ${bg} ≥ 4,5`, () => {
        expect(v[fg], `falta --${fg}`).toBeTruthy()
        expect(v[bg], `falta --${bg}`).toBeTruthy()
        expect(ratio(v[fg], v[bg])).toBeGreaterThanOrEqual(4.5)
      })
    }
  })
}

describe('gráficas', () => {
  it('texto de ejes legible sobre la superficie de la gráfica (≥ 4,5)', () => {
    for (const p of [PALETTE_LIGHT, PALETTE_DARK]) {
      expect(ratio(p.muted, p.surface)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(p.ink, p.surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('las marcas de datos superan 3:1 frente a la superficie salvo las de relieve declarado', () => {
    // Regla de dataviz: por debajo de 3:1 (aguamarina/amarillo en claro) hay etiquetas visibles y tabla de datos.
    const r = PALETTE_LIGHT.series.map((c) => ratio(c, PALETTE_LIGHT.surface))
    expect(r[0]).toBeGreaterThanOrEqual(3)
  })
})
