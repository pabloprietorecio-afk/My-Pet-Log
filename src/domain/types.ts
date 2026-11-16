/**
 * Modelo de datos de PetLog.
 *
 * Preparado para sincronización opcional futura (NO implementada):
 *  - ids UUID generados en el cliente
 *  - `updatedAt` en cada registro (último-que-escribe)
 *  - borrado lógico con `deletedAt` (los borrados se pueden propagar)
 */

/** Instante UTC en formato ISO-8601 (`Date.toISOString()`). */
export type ISODateTime = string
/** Fecha local "yyyy-mm-dd" (sin zona horaria). */
export type LocalDate = string

export interface Entity {
  id: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  deletedAt?: ISODateTime | null
}

export type Species = 'dog' | 'cat'
export type Sex = 'male' | 'female' | 'unknown'

export interface VetInfo {
  name?: string
  clinic?: string
  phone?: string
}

export interface Pet extends Entity {
  name: string
  species: Species
  breed?: string
  sex: Sex
  birthDate?: LocalDate
  /** Imagen reducida como data-URL. */
  photo?: string
  vet: VetInfo
  /** Patologías (texto libre, las escribe el propietario). */
  conditions: string[]
  allergies: string[]
  notes?: string
}

export type EventKey =
  | 'medication'
  | 'vomit'
  | 'stool'
  | 'food'
  | 'water'
  | 'weight'
  | 'mood'
  | 'symptom'
  | 'vet'
  | 'other'
  | 'custom'

export type InputKind = 'none' | 'level' | 'number' | 'text'

/** Botón de la rejilla de registro rápido (configurable por mascota). */
export interface EventType extends Entity {
  petId: string
  key: EventKey
  label: string
  emoji: string
  input: InputKind
  /** Si existe, el detalle permite una cantidad numérica (ml, g, kg…). */
  unit?: string
  order: number
  hidden: boolean
}

export interface LogEvent extends Entity {
  petId: string
  typeId: string
  at: ISODateTime
  level?: number
  value?: number
  unit?: string
  note?: string
  /** Imagen reducida como data-URL. */
  photo?: string
}

export type ScheduleMode = 'scheduled' | 'asNeeded'

export interface Treatment extends Entity {
  petId: string
  name: string
  dose: number
  unit: string
  mode: ScheduleMode
  /** Horas locales "HH:mm". */
  times: string[]
  /** 1 = cada día, 2 = día sí día no… */
  everyDays: number
  startDate: LocalDate
  endDate?: LocalDate
  /** Margen (min) alrededor de la hora para considerar la toma "a tiempo". */
  graceMinutes: number
  notes?: string
}

export type DoseStatus = 'given' | 'skipped'

export interface DoseLog extends Entity {
  petId: string
  treatmentId?: string
  /** Cuándo se administró (o, si se omitió, la hora programada). */
  at: ISODateTime
  /** Toma programada a la que corresponde (instante exacto del hueco). */
  scheduledAt?: ISODateTime
  status: DoseStatus
  /** Toma suelta, sin tratamiento asociado. */
  adHoc?: { name: string; dose?: number; unit?: string }
  note?: string
}

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  /** instant: el toque registra. sheet: abre la hoja de detalle primero. */
  tapMode: 'instant' | 'sheet'
  deviceId: string
  schemaVersion: number
}

export const SCHEMA_VERSION = 1
