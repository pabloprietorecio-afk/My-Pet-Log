import { newId } from './ids'
import type { EventKey, EventType, InputKind, LogEvent, Species } from './types'
import { formatNumber } from './time'

export interface LevelOption {
  value: number
  label: string
  /** Texto para frases ("poca cantidad"). Si falta, se usa label en minúsculas. */
  phrase?: string
}

const SEVERITY: LevelOption[] = [
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Intenso' },
]

const LEVELS: Partial<Record<EventKey, LevelOption[]>> = {
  vomit: SEVERITY,
  symptom: SEVERITY,
  custom: SEVERITY,
  stool: [
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Blanda' },
    { value: 3, label: 'Diarrea' },
  ],
  food: [
    { value: 0, label: 'Nada', phrase: 'no comió' },
    { value: 1, label: 'Poca', phrase: 'poca cantidad' },
    { value: 2, label: 'Normal', phrase: 'cantidad normal' },
    { value: 3, label: 'Mucha', phrase: 'mucha cantidad' },
  ],
  water: [
    { value: 1, label: 'Poca', phrase: 'poca cantidad' },
    { value: 2, label: 'Normal', phrase: 'cantidad normal' },
    { value: 3, label: 'Mucha', phrase: 'mucha cantidad' },
  ],
  mood: [
    { value: 1, label: 'Decaído' },
    { value: 2, label: 'Normal' },
    { value: 3, label: 'Activo' },
  ],
  activity: [
    { value: 1, label: 'Poca', phrase: 'poca actividad' },
    { value: 2, label: 'Normal', phrase: 'actividad normal' },
    { value: 3, label: 'Mucha', phrase: 'mucha actividad' },
  ],
  shed: [
    { value: 1, label: 'Empieza', phrase: 'empieza la muda' },
    { value: 2, label: 'En curso', phrase: 'muda en curso' },
    { value: 3, label: 'Completa', phrase: 'muda completa' },
  ],
}

export function levelOptions(type: Pick<EventType, 'key' | 'input'>): LevelOption[] {
  if (type.input !== 'level') return []
  return LEVELS[type.key] ?? SEVERITY
}

export function levelPhrase(type: Pick<EventType, 'key' | 'input'>, level: number | undefined): string | undefined {
  if (level === undefined) return undefined
  const o = levelOptions(type).find((x) => x.value === level)
  return o ? (o.phrase ?? o.label.toLowerCase()) : undefined
}

export function levelLabel(type: Pick<EventType, 'key' | 'input'>, level: number | undefined): string | undefined {
  if (level === undefined) return undefined
  return levelOptions(type).find((x) => x.value === level)?.label
}

interface BuiltinDef {
  key: Exclude<EventKey, 'custom'>
  label: string
  emoji: string
  input: InputKind
  unit?: string
}

/** Todos los botones de serie (la etiqueta y la unidad pueden variar por especie). */
export const BUILTIN_TYPES: BuiltinDef[] = [
  { key: 'medication', label: 'Medicación', emoji: '💊', input: 'none' },
  { key: 'vomit', label: 'Vómito', emoji: '🤮', input: 'level' },
  { key: 'stool', label: 'Deposición', emoji: '💩', input: 'level' },
  { key: 'food', label: 'Comida', emoji: '🍽️', input: 'level', unit: 'g' },
  { key: 'water', label: 'Agua', emoji: '💧', input: 'level', unit: 'ml' },
  { key: 'weight', label: 'Peso', emoji: '⚖️', input: 'number', unit: 'kg' },
  { key: 'mood', label: 'Estado', emoji: '❤️', input: 'level' },
  { key: 'symptom', label: 'Síntoma', emoji: '🌡️', input: 'level' },
  { key: 'vet', label: 'Veterinario', emoji: '🩺', input: 'text' },
  { key: 'other', label: 'Otro', emoji: '📝', input: 'text' },
  { key: 'shed', label: 'Muda', emoji: '🦎', input: 'level' },
  { key: 'temperature', label: 'Temperatura', emoji: '☀️', input: 'number', unit: '°C' },
  { key: 'activity', label: 'Actividad', emoji: '⚡', input: 'level' },
]

type BuiltinKey = BuiltinDef['key']

interface SpeciesDef {
  /** Nombre corto (cabecera, listas). */
  label: string
  /** Nombre en el selector de la ficha. */
  pick: string
  /** Botones visibles, en orden. El resto de botones de serie se crean ocultos (se activan en «Personalizar»). */
  buttons: BuiltinKey[]
  /** Unidad del peso. */
  weightUnit: 'kg' | 'g'
  /** Cambios de nombre para esta especie. */
  labels?: Partial<Record<BuiltinKey, string>>
}

/**
 * Botones de serie por especie. Son atajos de registro, no indicaciones clínicas:
 * el propietario puede ocultar, mostrar, reordenar o crear los suyos.
 * (Conejos y roedores no vomitan, por eso no llevan «Vómito»; en reptiles y aves se habla de regurgitación.)
 */
export const SPECIES: Record<Species, SpeciesDef> = {
  dog: {
    label: 'Perro',
    pick: 'Perro',
    weightUnit: 'kg',
    buttons: ['medication', 'vomit', 'stool', 'food', 'water', 'weight', 'mood', 'symptom', 'vet', 'other'],
  },
  cat: {
    label: 'Gato',
    pick: 'Gato',
    weightUnit: 'kg',
    buttons: ['medication', 'vomit', 'stool', 'food', 'water', 'weight', 'mood', 'symptom', 'vet', 'other'],
  },
  rodent: {
    label: 'Roedor',
    pick: 'Hámster / roedor',
    weightUnit: 'g',
    buttons: ['medication', 'food', 'water', 'weight', 'stool', 'activity', 'mood', 'symptom', 'vet', 'other'],
  },
  reptile: {
    label: 'Reptil',
    pick: 'Serpiente / reptil',
    weightUnit: 'g',
    buttons: ['medication', 'food', 'shed', 'stool', 'vomit', 'weight', 'temperature', 'symptom', 'vet', 'other'],
    labels: { vomit: 'Regurgitación', stool: 'Defecación' },
  },
  rabbit: {
    label: 'Conejo',
    pick: 'Conejo',
    weightUnit: 'kg',
    buttons: ['medication', 'food', 'water', 'stool', 'weight', 'activity', 'mood', 'symptom', 'vet', 'other'],
  },
  bird: {
    label: 'Pájaro',
    pick: 'Pájaro',
    weightUnit: 'g',
    buttons: ['medication', 'food', 'water', 'stool', 'weight', 'shed', 'activity', 'symptom', 'vet', 'other'],
    labels: { vomit: 'Regurgitación', stool: 'Excrementos' },
  },
}

export const SPECIES_ORDER: Species[] = ['dog', 'cat', 'rabbit', 'rodent', 'bird', 'reptile']

export function speciesLabel(s: Species): string {
  return SPECIES[s]?.label ?? s
}

/** Crea todos los botones de serie de una mascota: los de su especie visibles y en orden; el resto, ocultos. */
export function seedEventTypes(petId: string, nowIso: string, species: Species = 'dog'): EventType[] {
  const sp = SPECIES[species] ?? SPECIES.dog
  const rest = BUILTIN_TYPES.map((d) => d.key).filter((k) => !sp.buttons.includes(k))
  return [...sp.buttons, ...rest].map((key, i) => {
    const d = BUILTIN_TYPES.find((x) => x.key === key)!
    return {
      id: newId(),
      petId,
      key: d.key,
      label: sp.labels?.[d.key] ?? d.label,
      emoji: d.emoji,
      input: d.input,
      unit: d.key === 'weight' ? sp.weightUnit : d.unit,
      order: i,
      hidden: !sp.buttons.includes(key),
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  })
}

/** Botones de serie que le faltan a una mascota creada con una versión anterior (se añaden ocultos). */
export function missingBuiltinTypes(petId: string, existing: Pick<EventType, 'key' | 'order'>[], nowIso: string, species: Species): EventType[] {
  const have = new Set(existing.map((t) => t.key))
  const maxOrder = existing.reduce((m, t) => Math.max(m, t.order), -1)
  return seedEventTypes(petId, nowIso, species)
    .filter((t) => !have.has(t.key))
    .map((t, i) => ({ ...t, hidden: true, order: maxOrder + 1 + i }))
}

export type TapBehavior = 'medication' | 'sheet' | 'instant'

/** Qué hace el toque en un botón con el modo "un toque". */
export function tapBehavior(type: Pick<EventType, 'key' | 'input'>): TapBehavior {
  if (type.key === 'medication') return 'medication'
  // Un síntoma sin nombre no le sirve al veterinario: se pide cuál (un toque en una sugerencia).
  if (type.key === 'symptom') return 'sheet'
  if (type.input === 'number' || type.input === 'text') return 'sheet'
  return 'instant'
}

/** Texto de detalle de un evento: "moderado · 120 ml · nota". */
export function describeEvent(type: Pick<EventType, 'key' | 'input' | 'unit'>, ev: LogEvent): string {
  const parts: string[] = []
  const phrase = levelPhrase(type, ev.level)
  if (phrase) parts.push(phrase)
  if (ev.value !== undefined && ev.value !== null) {
    parts.push(`${formatNumber(ev.value)} ${ev.unit ?? type.unit ?? ''}`.trim())
  }
  if (ev.note) parts.push(ev.note)
  return parts.join(' · ')
}

/** ¿Es un tipo cuyo recuento interesa como "incidencia" en gráficas de síntomas? */
export function isIncidentKey(key: EventKey): boolean {
  return key === 'vomit' || key === 'stool' || key === 'symptom' || key === 'custom'
}

/** Sugerencias de un toque en la hoja de «Síntoma». No es una lista clínica: solo atajos de texto. */
export const SYMPTOM_SUGGESTIONS = ['Tos', 'Estornudos', 'Picor', 'Cojera', 'Temblores', 'Convulsión', 'Jadeo', 'Dolor'] as const

/** Iconos antiguos que se renderizaban mal (📅 muestra «July 17») → nuevos, solo si el usuario no los cambió. */
export const LEGACY_EMOJI: Partial<Record<EventKey, { from: string; to: string }>> = {
  vet: { from: '📅', to: '🩺' },
  symptom: { from: '🩺', to: '🌡️' },
  other: { from: '➕', to: '📝' },
}

/** Pregunta que acompaña a las opciones de nivel tras registrar. */
export function levelQuestion(key: EventKey): string {
  switch (key) {
    case 'food':
    case 'water':
      return '¿Cuánto?'
    case 'stool':
      return '¿Cómo era?'
    case 'mood':
      return '¿Cómo está?'
    case 'activity':
      return '¿Cuánta?'
    case 'shed':
      return '¿En qué fase?'
    default:
      return '¿Intensidad?'
  }
}

export const DOSE_UNITS = ['mg', 'ml', 'comprimido', 'cápsula', 'gotas', 'UI', 'g', 'sobre'] as const
