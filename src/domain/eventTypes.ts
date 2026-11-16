import { newId } from './ids'
import type { EventKey, EventType, InputKind, LogEvent } from './types'
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

/** Orden por defecto de la rejilla. */
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
]

export function seedEventTypes(petId: string, nowIso: string): EventType[] {
  return BUILTIN_TYPES.map((d, i) => ({
    id: newId(),
    petId,
    key: d.key,
    label: d.label,
    emoji: d.emoji,
    input: d.input,
    unit: d.unit,
    order: i,
    hidden: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  }))
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
    default:
      return '¿Intensidad?'
  }
}

export const DOSE_UNITS = ['mg', 'ml', 'comprimido', 'cápsula', 'gotas', 'UI', 'g', 'sobre'] as const
