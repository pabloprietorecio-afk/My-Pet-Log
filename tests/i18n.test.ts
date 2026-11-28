import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en'
import fr from '../src/i18n/fr'
import de from '../src/i18n/de'
import it_ from '../src/i18n/it'
import pt from '../src/i18n/pt'

const DICTS = { en, fr, de, it: it_, pt }

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/[/\\]i18n[/\\]/.test(p) ? [p] : []
  })
}

/** Literales pasados a tl('…') o tl("…") en el código (los casos simples, sin plantillas). */
function literalKeys(): Set<string> {
  const out = new Set<string>()
  const re = /\btl\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
  for (const f of files('src')) {
    const src = readFileSync(f, 'utf8')
    for (const m of src.matchAll(re)) out.add(m[2].replace(/\\(['"\\])/g, '$1'))
  }
  return out
}

const ph = (s: string) => (s.match(/\{\d\}/g) ?? []).sort().join(',')

describe('traducciones', () => {
  const keys = literalKeys()

  it('encuentra textos traducibles en el código', () => {
    expect(keys.size).toBeGreaterThan(600)
  })

  for (const [lang, d] of Object.entries(DICTS)) {
    it(`${lang}: todos los textos del código están traducidos`, () => {
      const missing = [...keys].filter((k) => !(k in d))
      expect(missing).toEqual([])
    })
    it(`${lang}: los marcadores {n} coinciden con el español`, () => {
      const bad = Object.entries(d).filter(([k, v]) => ph(k) !== ph(v))
      expect(bad).toEqual([])
    })
  }

  it('todos los idiomas tienen las mismas claves', () => {
    const ref = Object.keys(en).sort()
    for (const d of Object.values(DICTS)) expect(Object.keys(d).sort()).toEqual(ref)
  })
})
