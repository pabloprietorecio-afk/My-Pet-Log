import { describe, expect, it } from 'vitest'
import { SPECIES_ORDER } from '../src/domain/eventTypes'
import { TIP_TOPICS, TIPS } from '../src/domain/tips'

describe('Consejos', () => {
  it('cada especie tiene consejos en todos los temas', () => {
    for (const sp of SPECIES_ORDER) {
      for (const { key } of TIP_TOPICS) expect(TIPS[sp].some((t) => t.topic === key), `${sp}/${key}`).toBe(true)
    }
  })
  it('cada ficha tiene fuente https, id único y texto corto para caber sin scroll', () => {
    const ids = new Set<string>()
    for (const sp of SPECIES_ORDER) {
      for (const t of TIPS[sp]) {
        expect(ids.has(t.id), t.id).toBe(false)
        ids.add(t.id)
        expect(t.sources.length).toBeGreaterThan(0)
        for (const s of t.sources) expect(s.url).toMatch(/^https:\/\//)
        expect(t.text.length, t.id).toBeLessThanOrEqual(220)
        expect(t.title.length, t.id).toBeLessThanOrEqual(30)
      }
    }
  })
  it('no da dosis de medicamentos', () => {
    const all = SPECIES_ORDER.flatMap((sp) => TIPS[sp]).map((t) => t.text).join(' ')
    expect(all).not.toMatch(/\b\d+(?:[.,]\d+)?\s?(mg|ml|mcg|µg|UI)\b/i)
  })
})
