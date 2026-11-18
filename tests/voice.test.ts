import { describe, expect, it } from 'vitest'
import { seedEventTypes } from '../src/domain/eventTypes'
import type { EventType, Treatment } from '../src/domain/types'
import { parseTime, parseVoice, wordsToNumbers, norm, type VoiceAction, type VoiceContext } from '../src/voice/parse'

const NOW = new Date(2026, 10, 18, 15, 30) // 18/11/2026 15:30 hora local
const iso = NOW.toISOString()

const lunaTypes: EventType[] = [
  ...seedEventTypes('luna', iso, 'cat'),
  { id: 'pis', petId: 'luna', key: 'custom', label: 'Pis', emoji: '🚽', input: 'level', order: 20, hidden: false, createdAt: iso, updatedAt: iso },
  { id: 'cepillado', petId: 'luna', key: 'custom', label: 'Cepillado', emoji: '🪮', input: 'none', order: 21, hidden: false, createdAt: iso, updatedAt: iso },
]
const tobyTypes = seedEventTypes('toby', iso, 'dog')
const tr = (id: string, name: string, petId = 'luna'): Treatment => ({
  id, petId, name, dose: 5, unit: 'mg', mode: 'scheduled', times: ['08:00', '20:00'], everyDays: 1, startDate: '2026-11-01', graceMinutes: 60, createdAt: iso, updatedAt: iso,
})
const ctx: VoiceContext = {
  now: NOW,
  pets: [
    { id: 'luna', name: 'Luna' },
    { id: 'toby', name: 'Toby' },
  ],
  currentPetId: 'luna',
  types: (p) => (p === 'luna' ? lunaTypes : tobyTypes),
  treatments: (p) => (p === 'luna' ? [tr('pred', 'Prednisona'), tr('sem', 'Semintra')] : [tr('apo', 'Apoquel', 'toby')]),
}
const typeId = (k: string, types = lunaTypes) => types.find((t) => t.key === k)!.id

function acts(s: string, c = ctx): VoiceAction[] {
  const r = parseVoice(s, c)
  if (r.kind !== 'actions') throw new Error(`«${s}» → ${r.kind}`)
  return r.actions
}
function one(s: string, c = ctx) {
  const a = acts(s, c)
  expect(a).toHaveLength(1)
  return a[0] as any
}
const hm = (d: Date) => `${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

describe('números dichos con palabras', () => {
  it.each([
    ['cuatro coma dos kilos', '4.2 kilos'],
    ['trescientos cincuenta mililitros', '350 mililitros'],
    ['doscientos ml', '200 ml'],
    ['treinta y ocho coma cinco grados', '38.5 grados'],
    ['dos kilos y medio', '2.5 kilos'],
    ['medio kilo', '0.5 kilo'],
    ['mil doscientos gramos', '1200 gramos'],
    ['una pastilla', '1 pastilla'],
    ['ha comido una vez', 'ha comido 1 vez'],
    ['un vómito', 'un vomito'],
  ])('%s', (a, b) => expect(wordsToNumbers(norm(a))).toBe(b))
})

describe('botones', () => {
  it('nombre del botón solo', () => {
    expect(one('Agua')).toMatchObject({ kind: 'event', typeId: typeId('water'), timeSaid: false })
    expect(one('vómito')).toMatchObject({ typeId: typeId('vomit') })
    expect(one('Añadir agua')).toMatchObject({ typeId: typeId('water') })
    expect(one('apunta una deposición')).toMatchObject({ typeId: typeId('stool') })
  })
  it('frases naturales', () => {
    expect(one('ha vomitado')).toMatchObject({ typeId: typeId('vomit') })
    expect(one('ha hecho caca')).toMatchObject({ typeId: typeId('stool') })
    expect(one('ha bebido mucho')).toMatchObject({ typeId: typeId('water'), level: 3 })
    expect(one('ha comido poco')).toMatchObject({ typeId: typeId('food'), level: 1 })
    expect(one('no ha comido nada')).toMatchObject({ typeId: typeId('food'), level: 0 })
    expect(one('está decaída')).toMatchObject({ typeId: typeId('mood'), level: 1 })
    expect(one('tiene tos')).toMatchObject({ typeId: typeId('symptom') })
  })
  it('botones propios por su nombre, sin tildes ni mayúsculas', () => {
    expect(one('ha hecho pis')).toMatchObject({ typeId: 'pis' })
    expect(one('PIS abundante')).toMatchObject({ typeId: 'pis', level: 3 })
    expect(one('cepillado')).toMatchObject({ typeId: 'cepillado' })
  })
  it('intensidad', () => {
    expect(one('vómito leve')).toMatchObject({ level: 1 })
    expect(one('vómito moderado')).toMatchObject({ level: 2 })
    expect(one('ha vomitado mucho')).toMatchObject({ level: 3 })
    expect(one('diarrea')).toMatchObject({ typeId: typeId('stool'), level: 3 })
    expect(one('caca blanda')).toMatchObject({ level: 2 })
    expect(one('deposición normal')).toMatchObject({ level: 1 })
  })
  it('cantidades y unidades, convertidas a la del botón', () => {
    expect(one('agua 200 ml')).toMatchObject({ value: 200, unit: 'ml' })
    expect(one('ha bebido doscientos mililitros')).toMatchObject({ value: 200, unit: 'ml' })
    expect(one('ha bebido medio litro')).toMatchObject({ value: 500, unit: 'ml' })
    expect(one('pesa 4 coma 2 kilos')).toMatchObject({ typeId: typeId('weight'), value: 4.2, unit: 'kg' })
    expect(one('peso cuatro mil doscientos gramos')).toMatchObject({ value: 4.2, unit: 'kg' })
    expect(one('peso 4.5')).toMatchObject({ value: 4.5, unit: 'kg' })
    expect(one('comida 80 gramos')).toMatchObject({ typeId: typeId('food'), value: 80, unit: 'g' })
  })
  it('notas en Veterinario y Otro', () => {
    expect(one('veterinario revisión de tiroides')).toMatchObject({ typeId: typeId('vet'), note: 'revision de tiroides' })
    expect(one('nota se ha escondido debajo de la cama')).toMatchObject({ typeId: typeId('other'), note: 'se ha escondido debajo de la cama' })
    expect(one('vómito leve nota después de comer')).toMatchObject({ level: 1, note: 'despues de comer' })
  })
})

describe('hora', () => {
  it('sin hora: ahora', () => expect(hm(one('agua').at)).toBe('18 15:30'))
  it('hace…', () => {
    expect(hm(one('vómito hace dos horas').at)).toBe('18 13:30')
    expect(hm(one('vómito hace media hora').at)).toBe('18 15:00')
    expect(hm(one('agua hace 10 minutos').at)).toBe('18 15:20')
    expect(hm(one('vómito hace una hora y media').at)).toBe('18 14:00')
    expect(one('vómito hace dos horas').timeSaid).toBe(true)
  })
  it('a las…: la vez pasada más reciente', () => {
    expect(hm(one('vómito a las 8').at)).toBe('18 08:00')
    expect(hm(one('vómito a las 3').at)).toBe('18 15:00')
    expect(hm(one('vómito a las 5').at)).toBe('18 05:00')
    expect(hm(one('vómito a las ocho y media').at)).toBe('18 08:30')
    expect(hm(one('vómito a las nueve menos cuarto').at)).toBe('18 08:45')
    expect(hm(one('vómito a las 14:20').at)).toBe('18 14:20')
    expect(hm(one('vómito a las 10 de la noche').at)).toBe('17 22:00')
    expect(hm(one('vómito a las 2 de la tarde').at)).toBe('18 14:00')
  })
  it('ayer', () => {
    expect(hm(one('vómito ayer a las 10').at)).toBe('17 10:00')
    expect(hm(one('ayer vomitó a las 9 de la noche').at)).toBe('17 21:00')
    expect(hm(one('anoche vomitó a las 11').at)).toBe('17 23:00')
    expect(hm(one('vómito ayer').at)).toBe('17 15:30')
  })
  it('parseTime no confunde cantidades con horas', () => {
    expect(parseTime('agua 200 ml', NOW)).toBeNull()
  })
})

describe('medicación', () => {
  it('por nombre del tratamiento', () => {
    expect(one('le he dado la prednisona')).toMatchObject({ kind: 'dose', treatmentId: 'pred', status: 'given' })
    expect(one('prednisona')).toMatchObject({ kind: 'dose', treatmentId: 'pred', status: 'given' })
    expect(one('semintra a las 8')).toMatchObject({ kind: 'dose', treatmentId: 'sem' })
  })
  it('omitida', () => {
    expect(one('no le he dado la prednisona')).toMatchObject({ treatmentId: 'pred', status: 'skipped' })
    expect(one('se me ha olvidado la semintra')).toMatchObject({ treatmentId: 'sem', status: 'skipped' })
    expect(one('prednisona omitida')).toMatchObject({ status: 'skipped' })
  })
  it('«medicación» sin nombre: con un único tratamiento es ese; con varios, se pregunta', () => {
    expect(one('medicación')).toMatchObject({ kind: 'dose', treatmentId: undefined })
    expect(one('le he dado la medicación', { ...ctx, currentPetId: 'toby' })).toMatchObject({ kind: 'dose', treatmentId: 'apo' })
  })
  it('toma suelta con dosis', () => {
    expect(one('le he dado 5 mg de meloxicam')).toMatchObject({ kind: 'adhoc', name: 'Meloxicam', dose: 5, unit: 'mg' })
    expect(one('le he dado dos gotas de colirio')).toMatchObject({ kind: 'adhoc', name: 'Colirio', dose: 2, unit: 'gotas' })
  })
})

describe('mascota, varias acciones, deshacer y preguntas', () => {
  it('mascota por nombre', () => {
    const r = parseVoice('Toby ha vomitado', ctx)
    expect(r).toMatchObject({ kind: 'actions', petId: 'toby' })
    if (r.kind === 'actions') expect(r.actions[0]).toMatchObject({ typeId: typeId('vomit', tobyTypes) })
    expect(parseVoice('agua', ctx)).toMatchObject({ petId: 'luna' })
  })
  it('varias acciones en una frase', () => {
    const a = acts('agua y comida')
    expect(a.map((x: any) => x.typeId)).toEqual([typeId('water'), typeId('food')])
    const b = acts('ha vomitado y luego ha hecho caca blanda')
    expect(b).toHaveLength(2)
    expect(b[1]).toMatchObject({ typeId: typeId('stool'), level: 2 })
    const c = acts('prednisona y semintra a las 8')
    expect(c.map((x: any) => x.treatmentId)).toEqual(['pred', 'sem'])
    expect(c.every((x) => hm(x.at) === '18 08:00')).toBe(true)
  })
  it('una «y» dentro de una frase no parte la acción', () => {
    const a = acts('vómito a las ocho y media')
    expect(a).toHaveLength(1)
    expect(acts('pesa cuatro kilos y medio')[0]).toMatchObject({ value: 4.5 })
  })
  it('deshacer', () => {
    for (const s of ['deshacer', 'borra el último', 'anula', 'me he equivocado']) expect(parseVoice(s, ctx).kind).toBe('undo')
  })
  it('preguntas', () => {
    expect(parseVoice('¿cuántos vómitos lleva hoy?', ctx)).toMatchObject({ kind: 'query', query: { kind: 'count', typeId: typeId('vomit'), range: 'today' } })
    expect(parseVoice('cuántas veces ha hecho pis esta semana', ctx)).toMatchObject({ query: { kind: 'count', typeId: 'pis', range: 'week' } })
    expect(parseVoice('¿cuándo fue la última toma?', ctx)).toMatchObject({ query: { kind: 'last', medication: true } })
    expect(parseVoice('¿cuándo le di la prednisona?', ctx)).toMatchObject({ query: { kind: 'last', treatmentId: 'pred' } })
    expect(parseVoice('¿cuándo vomitó por última vez?', ctx)).toMatchObject({ query: { kind: 'last', typeId: typeId('vomit') } })
    expect(parseVoice('¿cuánto pesa Toby?', ctx)).toMatchObject({ petId: 'toby', query: { kind: 'last', typeId: typeId('weight', tobyTypes) } })
  })
  it('lo que no entiende no se registra', () => {
    expect(parseVoice('hola qué tal', ctx).kind).toBe('none')
    expect(parseVoice('', ctx).kind).toBe('none')
  })
})

describe('«¿Qué puedo decir?»', () => {
  it('todas las frases de la ayuda se entienden', async () => {
    const { voiceHelp, plain } = await import('../src/voice/help')
    const groups = voiceHelp({ treatment: 'Prednisona', otherPet: 'Toby', custom: 'Pis' })
    for (const g of groups)
      for (const ph of g.phrases) {
        const r = parseVoice(plain(ph), ctx)
        expect(r.kind, `«${plain(ph)}»`).not.toBe('none')
        if (g.id === 'ask') expect(r.kind, plain(ph)).toBe('query')
        if (g.id !== 'ask' && plain(ph) !== 'deshacer') expect(r.kind, plain(ph)).toBe('actions')
      }
    // sin tratamientos ni otras mascotas también
    for (const g of voiceHelp()) for (const ph of g.phrases) expect(parseVoice(plain(ph), ctx).kind, plain(ph)).not.toBe('none')
  })
})
