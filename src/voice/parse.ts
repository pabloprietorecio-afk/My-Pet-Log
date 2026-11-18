/**
 * Intérprete de órdenes de voz en español (sin red, sin IA): convierte lo dictado en acciones de PetLog.
 *
 * Ejemplos: «agua», «vómito leve», «Luna ha comido poco», «le he dado la prednisona», «pesa 4 coma 2 kilos»,
 * «vómito a las 8 y media», «diarrea hace dos horas», «agua y comida», «deshacer», «¿cuántos vómitos lleva hoy?».
 *
 * Solo organiza lo que dice el usuario: no interpreta síntomas ni da consejos.
 */
import { levelOptions } from '../domain/eventTypes'
import type { EventKey, EventType, Treatment } from '../domain/types'

export interface VoicePet {
  id: string
  name: string
}

export interface VoiceContext {
  now: Date
  pets: VoicePet[]
  currentPetId: string
  /** Botones (visibles u ocultos) de cada mascota. */
  types: (petId: string) => EventType[]
  /** Tratamientos activos de cada mascota. */
  treatments: (petId: string) => Treatment[]
}

export type VoiceAction =
  | { kind: 'event'; typeId: string; at: Date; level?: number; value?: number; unit?: string; note?: string; timeSaid: boolean }
  | { kind: 'dose'; treatmentId?: string; status: 'given' | 'skipped'; at: Date; timeSaid: boolean }
  | { kind: 'adhoc'; name: string; dose?: number; unit?: string; at: Date; timeSaid: boolean }

export type VoiceQuery =
  | { kind: 'count'; typeId: string; range: 'today' | 'yesterday' | 'week' }
  | { kind: 'last'; typeId?: string; medication?: boolean; treatmentId?: string }

export type VoiceResult =
  | { kind: 'actions'; petId: string; actions: VoiceAction[]; ignored: string[] }
  | { kind: 'query'; petId: string; query: VoiceQuery }
  | { kind: 'undo' }
  | { kind: 'none'; text: string }

// ── Normalización ─────────────────────────────────────────────────────────

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d):(\d)/g, '$1h$2')
    .replace(/(\d)\.(\d)/g, '$1d$2')
    .replace(/[¿?¡!«»"“”.;:]/g, ' ')
    .replace(/,/g, ' , ')
    .replace(/(\d)d(\d)/g, '$1.$2')
    .replace(/(\d)h(\d)/g, '$1:$2')
    .replace(/\s+/g, ' ')
    .trim()
}

const UNITS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintiun: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
}
const TENS: Record<string, number> = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 }
const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800,
  ochocientas: 800, novecientos: 900, novecientas: 900,
}

/** Convierte números dichos con palabras en cifras («cuatro coma dos» → «4.2», «trescientos cincuenta» → «350»). */
export function wordsToNumbers(text: string): string {
  const w = text.split(' ')
  const out: string[] = []
  let i = 0
  // «un/una» solo cuentan como número si van delante de una unidad o «y medio».
  const UNIT_NEXT = /^(kilo|kg|gramo|g$|ml|mililitro|litro|l$|grado|mg|miligramo|cc|gota|comprimido|pastilla|hora|minuto|cuarto|vez|veces)/
  const readInt = (j: number): [number, number] | null => {
    let n = 0
    let k = j
    let any = false
    if (w[k] === 'mil') {
      const rest = readInt(k + 1)
      return rest ? [1000 + rest[0], rest[1]] : [1000, k + 1]
    }
    if (HUNDREDS[w[k]] !== undefined) {
      n += HUNDREDS[w[k]]
      k++
      any = true
    }
    if (TENS[w[k]] !== undefined) {
      n += TENS[w[k]]
      k++
      any = true
      if (w[k] === 'y' && UNITS[w[k + 1]] !== undefined && UNITS[w[k + 1]] < 10) {
        n += UNITS[w[k + 1]]
        k += 2
      }
    } else if (UNITS[w[k]] !== undefined) {
      n += UNITS[w[k]]
      k++
      any = true
    }
    if (!any) return null
    if (w[k] === 'mil') {
      n *= 1000
      k++
      const rest = readInt(k)
      if (rest) {
        n += rest[0]
        k = rest[1]
      }
    }
    return [n, k]
  }
  while (i < w.length) {
    const word = w[i]
    let r: [number, number] | null = null
    if (/^\d+(\.\d+)?$/.test(word)) r = [Number(word), i + 1]
    else if (word === 'medio' || word === 'media') {
      // «medio kilo», «media hora»: 0,5
      if (i + 1 < w.length && UNIT_NEXT.test(w[i + 1])) r = [0.5, i + 1]
    } else {
      const ri = readInt(i)
      if (ri && !((word === 'un' || word === 'una' || word === 'uno') && ri[1] === i + 1 && !(w[i + 1] && (UNIT_NEXT.test(w[i + 1]) || w[i + 1] === 'y' || w[i + 1] === 'coma')))) r = ri
    }
    if (!r) {
      out.push(word)
      i++
      continue
    }
    let [n, k] = r
    // decimales: «coma dos», «punto cinco», «coma cero cinco»
    if ((w[k] === 'coma' || w[k] === 'punto') && k + 1 < w.length) {
      let digits = ''
      let j = k + 1
      while (j < w.length && (UNITS[w[j]] !== undefined || TENS[w[j]] !== undefined || /^\d+$/.test(w[j]))) {
        const ri = /^\d+$/.test(w[j]) ? ([Number(w[j]), j + 1] as [number, number]) : readInt(j)
        if (!ri) break
        digits += String(ri[0])
        j = ri[1]
        if (ri[0] >= 10) break
      }
      if (digits) {
        n = Number(`${Math.trunc(n)}.${digits}`)
        k = j
      }
    }
    // «dos y medio», «cuatro kilos y medio» (el «y medio» de unidad se trata después)
    if (w[k] === 'y' && (w[k + 1] === 'medio' || w[k + 1] === 'media') && !/^(hora|minuto)/.test(w[k + 2] ?? '')) {
      // «a las ocho y media» lo resuelve el intérprete de hora: no lo convertimos si va tras «las»
      if (out[out.length - 1] !== 'las' && out[out.length - 1] !== 'la') {
        n += 0.5
        k += 2
      }
    }
    out.push(String(n))
    i = k
  }
  return out
    .join(' ')
    .replace(/(\d+(?:\.\d+)?) (kilos?|kilogramos?|kg) y medio\b/g, (_, a, u) => `${Number(a) + 0.5} ${u}`)
}

// ── Unidades ───────────────────────────────────────────────────────────────

const UNIT_RE = /^(kg|kilos?|kilogramos?|g|gr|gramos?|ml|mililitros?|cl|centilitros?|l|litros?|grados?|°c|mg|miligramos?|cc|gotas?|comprimidos?|pastillas?|ui)$/
function unitOf(word: string): string | null {
  if (!UNIT_RE.test(word)) return null
  if (/^(kg|kilo)/.test(word)) return 'kg'
  if (/^(g|gr|gramos?)$/.test(word)) return 'g'
  if (/^(ml|mililitro)/.test(word)) return 'ml'
  if (/^(cl|centilitro)/.test(word)) return 'cl'
  if (/^(l|litro)/.test(word)) return 'l'
  if (/^(grado|°c)/.test(word)) return '°C'
  if (/^(mg|miligramo)/.test(word)) return 'mg'
  if (word === 'cc') return 'ml'
  if (word.startsWith('gota')) return 'gotas'
  if (word.startsWith('comprimido')) return 'comprimidos'
  if (word.startsWith('pastilla')) return 'comprimidos'
  return 'UI'
}
const FACTOR: Record<string, [string, number]> = { kg: ['g', 1000], g: ['g', 1], ml: ['ml', 1], cl: ['ml', 10], l: ['ml', 1000], mg: ['mg', 1] }
function convert(value: number, from: string, to: string | undefined): { value: number; unit: string } {
  if (!to || from === to) return { value, unit: to ?? from }
  const a = FACTOR[from]
  const b = FACTOR[to]
  if (a && b && a[0] === b[0]) return { value: Math.round(((value * a[1]) / b[1]) * 1000) / 1000, unit: to }
  return { value, unit: from }
}

// ── Vocabulario por tipo ───────────────────────────────────────────────────

/** Palabras que señalan cada botón de serie (ya normalizadas). Raíces: se comparan como prefijo de palabra. */
const KEYWORDS: Record<Exclude<EventKey, 'custom'>, string[]> = {
  medication: ['medicacion', 'medicamento', 'medicina', 'pastilla', 'toma', 'dosis', 'comprimido'],
  vomit: ['vomit', 'devuelto', 'devolvio', 'ha devuelto'],
  stool: ['deposicion', 'caca', 'heces', 'popo', 'cagad', 'cago', 'diarrea', 'hecho sus necesidades'],
  food: ['comida', 'comido', 'comio', 'come ', 'comer', 'pienso', 'desayun', 'cenado', 'ceno', 'almorz'],
  water: ['agua', 'bebido', 'bebio', 'beber', 'bebe '],
  weight: ['peso', 'pesa', 'pesado'],
  mood: ['estado', 'animo', 'decaid', 'apagad', 'animad', 'contento', 'triste'],
  symptom: ['sintoma', 'tos', 'tose', 'estornud', 'cojea', 'cojera', 'picor', 'se rasca', 'temblor', 'tiembla', 'convulsion', 'jadea'],
  vet: ['veterinari', 'vete ', 'consulta', 'clinica'],
  other: ['nota', 'apunta', 'apuntar', 'observacion', 'otro'],
  shed: ['muda', 'mudando', 'mudado'],
  temperature: ['temperatura', 'grados'],
  activity: ['actividad', 'paseo', 'pasear', 'jugado', 'jugar', 'ejercicio', 'corrido'],
}

/** Sinónimos de intensidad, por valor, según el conjunto de niveles. */
const SEVERITY_WORDS: [number, RegExp][] = [
  [1, /\b(leve|ligero|ligera|poco|poca|pequeno|pequena|suave|un poquito)\b/],
  [2, /\b(moderad[oa]|normal|medio|regular)\b/],
  [3, /\b(intens[oa]|fuerte|muy fuerte|grave|mucho|mucha|bastante|abundante|grande)\b/],
]
const PER_KEY_WORDS: Partial<Record<EventKey, [number, RegExp][]>> = {
  stool: [
    [3, /\b(diarrea|liquid[ao]|muy blanda)\b/],
    [2, /\b(blanda|pastosa)\b/],
    [1, /\b(normal|bien|dura|firme)\b/],
  ],
  food: [
    [0, /\b(nada|no ha comido|no comio|no quiere comer|no ha querido comer|sin comer)\b/],
    [1, /\b(poco|poca|un poco|un poquito|casi nada|la mitad)\b/],
    [3, /\b(mucho|mucha|todo|con ganas|bastante)\b/],
    [2, /\b(normal|bien|lo normal|su racion)\b/],
  ],
  water: [
    [1, /\b(poco|poca|un poco|casi nada)\b/],
    [3, /\b(mucho|mucha|bastante|muchisim[oa])\b/],
    [2, /\b(normal|bien|lo normal)\b/],
  ],
  mood: [
    [1, /\b(decaid[oa]|apagad[oa]|triste|cansad[oa]|bajo de animo|baja de animo|mal)\b/],
    [3, /\b(activ[oa]|contento|contenta|animad[oa]|feliz|juguet[oó]n|juguetona)\b/],
    [2, /\b(normal|bien)\b/],
  ],
  activity: [
    [1, /\b(poc[oa]|apenas)\b/],
    [3, /\b(much[oa]|bastante|largo|larga)\b/],
    [2, /\b(normal)\b/],
  ],
  shed: [
    [1, /\b(empieza|empezado|empezando|inicio)\b/],
    [3, /\b(completa|completo|terminad[oa]|acabad[oa])\b/],
    [2, /\b(en curso|mudando|sigue)\b/],
  ],
}

function levelFor(type: EventType, seg: string): number | undefined {
  const opts = levelOptions(type)
  if (!opts.length) return undefined
  const valid = new Set(opts.map((o) => o.value))
  const table = PER_KEY_WORDS[type.key] ?? SEVERITY_WORDS
  for (const [v, re] of table) if (valid.has(v) && re.test(seg)) return v
  // etiquetas tal cual («moderado», «en curso»)
  for (const o of opts) if (new RegExp(`\\b${norm(o.label)}\\b`).test(seg)) return o.value
  return undefined
}

// ── Hora ───────────────────────────────────────────────────────────────────

interface TimeHit {
  at: Date
  /** Texto reconocido, para quitarlo del resto. */
  match: string
}

export function parseTime(seg: string, now: Date): TimeHit | null {
  // «hace 2 horas», «hace media hora», «hace 10 minutos», «hace una hora y media», «hace un cuarto de hora»
  let m = seg.match(/\bhace (\d+(?:\.\d+)?|una|un|media|medio) (hora|horas|minuto|minutos|min)( y media)?\b/)
  if (m) {
    const n = m[1] === 'una' || m[1] === 'un' ? 1 : m[1] === 'media' || m[1] === 'medio' ? 0.5 : Number(m[1])
    let mins = m[2].startsWith('hora') ? n * 60 : n
    if (m[3]) mins += 30
    return { at: new Date(now.getTime() - mins * 60_000), match: m[0] }
  }
  m = seg.match(/\bhace un cuarto de hora\b/)
  if (m) return { at: new Date(now.getTime() - 15 * 60_000), match: m[0] }

  const yesterday = /\b(ayer|anoche)\b/.test(seg)
  const dayWord = seg.match(/\b(ayer|anoche|hoy|esta manana|esta tarde|esta noche)\b/)
  // «a las 8», «a las 20:30», «a las 8 y media», «a las 9 menos cuarto», «a la 1», «a las 8 de la tarde»
  m = seg.match(
    /\b(?:a las|a la|sobre las|sobre la|hacia las|las|la) (\d{1,2})(?:(?::|\.| )(\d{2}))?(?: (y media|y cuarto|menos cuarto|y (\d{1,2})|menos (\d{1,2})))?(?: (?:de la|por la|en punto de la) (manana|tarde|noche|madrugada)| en punto)?\b/,
  )
  if (m && Number(m[1]) <= 24) {
    let h = Number(m[1])
    let min = m[2] ? Number(m[2]) : 0
    if (m[3] === 'y media') min = 30
    else if (m[3] === 'y cuarto') min = 15
    else if (m[3] === 'menos cuarto') {
      h -= 1
      min = 45
    } else if (m[4]) min = Number(m[4])
    else if (m[5]) {
      h -= 1
      min = 60 - Number(m[5])
    }
    const part = m[6] ?? (dayWord && /manana|tarde|noche/.test(dayWord[1]) ? dayWord[1].split(' ')[1] : undefined) ?? (seg.includes('anoche') ? 'noche' : undefined)
    if (part && h < 12 && (part === 'tarde' || (part === 'noche' && h >= 5))) h += 12
    if (h === 24) h = 0
    if (h > 23 || min > 59) return null
    const base = new Date(now)
    if (yesterday) base.setDate(base.getDate() - 1)
    base.setHours(h, min, 0, 0)
    if (!yesterday && !part && !m[2] && h <= 12) {
      // «a las 8» sin más: la ocurrencia pasada más reciente entre las 8 y las 20
      const pm = new Date(base)
      pm.setHours(h === 12 ? 12 : h + 12)
      const cands = [base, pm].filter((d) => d.getTime() <= now.getTime() + 10 * 60_000)
      if (cands.length) {
        const best = cands.sort((a, b) => b.getTime() - a.getTime())[0]
        return { at: best, match: m[0] }
      }
      const prev = new Date(pm)
      prev.setDate(prev.getDate() - 1)
      return { at: prev, match: m[0] }
    }
    if (!yesterday && base.getTime() > now.getTime() + 10 * 60_000) base.setDate(base.getDate() - 1)
    return { at: base, match: m[0] + (yesterday && dayWord ? '' : '') }
  }
  if (yesterday) {
    // «ayer» sin hora: a la misma hora de ayer (se puede editar después)
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return { at: d, match: dayWord ? dayWord[0] : 'ayer' }
  }
  return null
}

// ── Utilidades ─────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasWord = (seg: string, w: string) => new RegExp(`(^|\\s)${esc(w)}(?=\\s|$)`).test(seg)
const hasStem = (seg: string, stem: string) =>
  stem.endsWith(' ') ? new RegExp(`(^|\\s)${esc(stem.trim())}(\\s|$)`).test(seg) : new RegExp(`(^|\\s)${esc(stem)}`).test(seg)

const FILLER = /\b(apunta|apuntar|anota|anotar|registra|registrar|añade|anade|añadir|anadir|pon|poner|que|ha|he|hecho|tenido|le|la|el|lo|los|las|un|una|de|del|a|al|y|se|su|sus|por|favor|con|en|hoy|esta|este|ahora|mismo|vez|otra)\b/g

function cleanNote(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

// ── Intérprete ─────────────────────────────────────────────────────────────

interface Matcher {
  type: EventType
  /** Palabras o raíces que lo activan, ya normalizadas. */
  words: string[]
  /** Si viene de la etiqueta del botón (más fiable que un sinónimo). */
  byLabel: boolean
}

function matchersFor(types: EventType[]): Matcher[] {
  const out: Matcher[] = []
  const live = types.filter((t) => !t.deletedAt)
  // Etiquetas exactas primero (incluidos los botones propios), de más larga a más corta.
  for (const t of [...live].sort((a, b) => norm(b.label).length - norm(a.label).length)) {
    out.push({ type: t, words: [norm(t.label)], byLabel: true })
  }
  for (const t of live) {
    if (t.key === 'custom') continue
    out.push({ type: t, words: KEYWORDS[t.key], byLabel: false })
  }
  return out
}

function findType(seg: string, matchers: Matcher[]): { type: EventType; at: number } | null {
  let best: { type: EventType; at: number; prio: number } | null = null
  for (const m of matchers) {
    for (const w of m.words) {
      const ok = m.byLabel ? hasWord(seg, w) || (w.length >= 4 && hasStem(seg, w)) : hasStem(seg, w)
      if (!ok) continue
      const at = seg.search(new RegExp(`(^|\\s)${esc(w.trim())}`))
      const prio = m.byLabel ? 0 : 1
      if (!best || prio < best.prio || (prio === best.prio && at < best.at)) best = { type: m.type, at, prio }
    }
  }
  return best && { type: best.type, at: best.at }
}

function findTreatment(seg: string, treatments: Treatment[]): Treatment | null {
  let best: Treatment | null = null
  let bestLen = 0
  for (const t of treatments) {
    const n = norm(t.name)
    const first = n.split(' ')[0]
    if (hasWord(seg, n) && n.length > bestLen) {
      best = t
      bestLen = n.length
    } else if (first.length >= 4 && hasStem(seg, first) && first.length > bestLen) {
      best = t
      bestLen = first.length
    }
  }
  return best
}

const SKIPPED = /\b(no (?:le |se )?(?:he|ha|hemos|han) (?:dado|tomado|podido dar)|no (?:la|lo|se la|se lo) (?:ha|he) tomado|no quiso|no se la quiso|omitid[ao]|saltad[ao]|me (?:la|lo) he saltado|sin dar|olvidad[ao]|se me ha olvidado|se me olvido|la ha escupido|lo ha escupido)\b/
const GIVEN_HINT = /\b(dado|di|dada|tomado|tomada|tomo|administrad[ao]|puesto|puesta|inyectad[ao])\b/

const UNDO = /^(deshacer|deshaz|borra(?:r)? (?:el |lo )?ultimo|elimina(?:r)? (?:el |lo )?ultimo|anula(?:r)?(?: (?:el |lo )?ultimo)?|me he equivocado|quita(?:r)? (?:el |lo )?ultimo)\b/

const SPLIT = /\s*(?:,|\by luego\b|\bluego\b|\bdespues\b|\btambien\b|\bademas\b|\by\b)\s*/

/**
 * Interpreta una frase. Nunca lanza: si no entiende nada devuelve `{ kind: 'none' }`.
 */
export function parseVoice(raw: string, ctx: VoiceContext): VoiceResult {
  let text = wordsToNumbers(norm(raw))
  if (!text) return { kind: 'none', text: raw }
  if (UNDO.test(text)) return { kind: 'undo' }

  // Mascota por nombre
  let petId = ctx.currentPetId
  for (const p of [...ctx.pets].sort((a, b) => b.name.length - a.name.length)) {
    const n = norm(p.name)
    if (n && hasWord(text, n)) {
      petId = p.id
      text = text.replace(new RegExp(`(^|\\s)${esc(n)}(?=\\s|$)`, 'g'), ' ').replace(/\s+/g, ' ').trim()
      break
    }
  }
  const types = ctx.types(petId)
  const treatments = ctx.treatments(petId)
  const matchers = matchersFor(types)

  // Preguntas
  const q = parseQuery(raw, text, matchers, treatments)
  if (q) return { kind: 'query', petId, query: q }

  // Nota al final («… nota después de comer», «… porque estaba nervioso»): se aparta antes de trocear.
  let tailNote: string | undefined
  const nm = text.match(/\s(?:nota|porque|observacion|comentario)\s(.+)$/)
  if (nm) {
    tailNote = cleanNote(nm[1])
    text = text.slice(0, nm.index).trim()
  }

  // Hora común a toda la frase (se aplica a todas las acciones salvo que alguna diga la suya)
  const globalTime = parseTime(text, ctx.now)

  // Trocear «agua y comida», «vómito, luego diarrea»… solo si cada trozo nombra algo.
  const pieces = text.split(SPLIT).filter(Boolean)
  const segs: string[] = []
  for (const p of pieces) {
    const names = findType(p, matchers) || findTreatment(p, treatments) || /\b(\d+(?:\.\d+)?) ?(mg|ml|gotas?|comprimidos?|pastillas?|cc|ui) de\b/.test(p)
    if (segs.length && !names) segs[segs.length - 1] += ` y ${p}`
    else segs.push(p)
  }

  const actions: VoiceAction[] = []
  const ignored: string[] = []
  for (const seg of segs) {
    const t = parseTime(seg, ctx.now) ?? globalTime
    const at = t?.at ?? ctx.now
    const timeSaid = !!t
    const body = t ? seg.replace(t.match, ' ').replace(/\s+/g, ' ').trim() : seg

    // Medicación con nombre de tratamiento
    const tr = findTreatment(body, treatments)
    const skipped = SKIPPED.test(body)
    if (tr) {
      actions.push({ kind: 'dose', treatmentId: tr.id, status: skipped ? 'skipped' : 'given', at, timeSaid })
      continue
    }
    // Toma suelta: «le he dado 5 mg de meloxicam»
    const adhoc = body.match(/\b(\d+(?:\.\d+)?) ?(mg|miligramos?|ml|mililitros?|gotas?|comprimidos?|pastillas?|cc|ui) de ([a-zñ]{3,}(?: [a-zñ]{3,})?)/)
    if (adhoc && !skipped) {
      const name = adhoc[3].replace(/\b(cada|por|al|a las?|hace)\b.*$/, '').trim()
      actions.push({ kind: 'adhoc', name: name.charAt(0).toUpperCase() + name.slice(1), dose: Number(adhoc[1]), unit: unitOf(adhoc[2]) ?? adhoc[2], at, timeSaid })
      continue
    }

    const hit = findType(body, matchers)
    if (!hit) {
      if (body.replace(FILLER, '').trim()) ignored.push(seg)
      continue
    }
    const type = hit.type
    if (type.key === 'medication') {
      // «le he dado la medicación»: si hay un solo tratamiento activo, es ese.
      const one = treatments.length === 1 ? treatments[0] : undefined
      actions.push({ kind: 'dose', treatmentId: one?.id, status: skipped ? 'skipped' : 'given', at, timeSaid })
      void GIVEN_HINT
      continue
    }

    const ev: Extract<VoiceAction, { kind: 'event' }> = { kind: 'event', typeId: type.id, at, timeSaid }
    // Cantidad con unidad o número suelto en botones numéricos
    const qm = body.match(/\b(\d+(?:\.\d+)?) ?([a-z°]+)?/)
    const words = body.split(' ')
    if (qm) {
      const n = Number(qm[1])
      const u = qm[2] ? unitOf(qm[2]) : null
      if (u && u !== 'comprimidos' && u !== 'gotas' && u !== 'UI') {
        if (type.input === 'number' || type.unit) {
          const c = convert(n, u, type.unit)
          ev.value = c.value
          ev.unit = c.unit
        }
      } else if (type.input === 'number' || (type.unit && !u)) {
        // número sin unidad: en la unidad del botón (p. ej. «pesa 4.2»)
        // pero no si es una hora o un «hace»
        const idx = words.indexOf(qm[1])
        const prev = words[idx - 1]
        if (prev !== 'las' && prev !== 'la' && prev !== 'hace') {
          ev.value = n
          if (type.unit) ev.unit = type.unit
        }
      }
    }
    const lvl = levelFor(type, body)
    if (lvl !== undefined) ev.level = lvl
    // Nota: en Veterinario/Otro/botones de texto, lo que sigue a la palabra clave; en el resto, tras «nota»/«porque».
    const noteAfter = body.match(/\b(?:nota|porque|observacion|comentario)\b (.+)$/)
    if (noteAfter) ev.note = cleanNote(noteAfter[1])
    else if (type.input === 'text') {
      const rest = body
        .replace(/^(?:apunta(?:r)?|anota(?:r)?|registra(?:r)?)( que)? /, '')
        .replace(new RegExp(`(^|\\s)(${[norm(type.label), ...(type.key === 'custom' ? [] : KEYWORDS[type.key])].map((w) => esc(w.trim())).join('|')})[a-z]*`, ''), ' ')
        .replace(/^\s*(?:de|del|al|que|en|la|el)\s+/, '')
        .trim()
      if (rest && rest.replace(FILLER, '').trim()) ev.note = cleanNote(rest)
    }
    actions.push(ev)
  }

  if (tailNote) {
    const last = [...actions].reverse().find((a) => a.kind === 'event') as Extract<VoiceAction, { kind: 'event' }> | undefined
    if (last) last.note = last.note ? `${last.note}. ${tailNote}` : tailNote
  }
  if (!actions.length) return { kind: 'none', text: raw }
  return { kind: 'actions', petId, actions, ignored }
}

function parseQuery(raw: string, text: string, matchers: Matcher[], treatments: Treatment[]): VoiceQuery | null {
  const isQ = /\?|¿/.test(raw) || /^(cuantos|cuantas|cuanto|cuanta|cuando|a que hora|que hora|ha (?:vomitado|comido|bebido)\b.*\bhoy)/.test(text)
  if (!isQ) return null
  if (/^(cuanto pesa|que peso|cuanto ha pesado|cual es (?:el|su) peso)/.test(text)) {
    const w = matchers.find((m) => m.type.key === 'weight')
    return w ? { kind: 'last', typeId: w.type.id } : null
  }
  if (/^(cuando|a que hora|que hora)/.test(text)) {
    const tr = findTreatment(text, treatments)
    if (tr) return { kind: 'last', medication: true, treatmentId: tr.id }
    if (/\b(toma|medicacion|pastilla|dosis|medicina)\b/.test(text)) return { kind: 'last', medication: true }
    const hit = findType(text, matchers)
    if (hit) return hit.type.key === 'medication' ? { kind: 'last', medication: true } : { kind: 'last', typeId: hit.type.id }
    return null
  }
  const hit = findType(text, matchers)
  if (!hit) return null
  const range = /\b(semana|7 dias|siete dias)\b/.test(text) ? 'week' : /\b(ayer)\b/.test(text) ? 'yesterday' : 'today'
  return { kind: 'count', typeId: hit.type.id, range }
}
