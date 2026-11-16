import type { EventType, LocalDate, LogEvent } from './types'
import { addDays, eachLocalDay, startOfLocalDay, startOfWeek, toLocalDate } from './time'

export interface DayCount {
  date: LocalDate
  count: number
  /** Recuento por nivel (1,2,3…). Los eventos sin nivel van en la clave 0. */
  byLevel: Record<number, number>
}

function inRange(events: LogEvent[], from: Date, to: Date): LogEvent[] {
  const f = from.toISOString()
  const t = to.toISOString()
  return events.filter((e) => !e.deletedAt && e.at >= f && e.at <= t)
}

/** Eventos por día natural (incluye días con 0). */
export function countPerDay(events: LogEvent[], from: Date, to: Date): DayCount[] {
  const days = eachLocalDay(from, to)
  const map = new Map<LocalDate, DayCount>(
    days.map((d) => [toLocalDate(d), { date: toLocalDate(d), count: 0, byLevel: {} }]),
  )
  for (const e of inRange(events, from, to)) {
    const row = map.get(toLocalDate(new Date(e.at)))
    if (!row) continue
    row.count++
    const lv = e.level ?? 0
    row.byLevel[lv] = (row.byLevel[lv] ?? 0) + 1
  }
  return days.map((d) => map.get(toLocalDate(d))!)
}

/** Eventos por semana (lunes–domingo). `date` es el lunes. */
export function countPerWeek(events: LogEvent[], from: Date, to: Date): DayCount[] {
  const weeks: Date[] = []
  for (let w = startOfWeek(from); w <= to; w = addDays(w, 7)) weeks.push(w)
  const map = new Map<LocalDate, DayCount>(
    weeks.map((w) => [toLocalDate(w), { date: toLocalDate(w), count: 0, byLevel: {} }]),
  )
  for (const e of inRange(events, from, to)) {
    const row = map.get(toLocalDate(startOfWeek(new Date(e.at))))
    if (!row) continue
    row.count++
    const lv = e.level ?? 0
    row.byLevel[lv] = (row.byLevel[lv] ?? 0) + 1
  }
  return weeks.map((w) => map.get(toLocalDate(w))!)
}

export interface SeriesPoint {
  t: number
  v: number
  date: LocalDate
}

/** Serie numérica (peso u otro indicador) ordenada por fecha. */
export function valueSeries(events: LogEvent[], from?: Date, to?: Date): SeriesPoint[] {
  return events
    .filter((e) => !e.deletedAt && typeof e.value === 'number')
    .filter((e) => (!from || e.at >= from.toISOString()) && (!to || e.at <= to.toISOString()))
    .map((e) => ({ t: Date.parse(e.at), v: e.value as number, date: toLocalDate(new Date(e.at)) }))
    .sort((a, b) => a.t - b.t)
}

export interface LevelPoint {
  date: LocalDate
  /** Media de los niveles ese día (null si no hubo registros). */
  avg: number | null
  n: number
}

/** Evolución diaria del nivel medio (apetito, estado de ánimo…). */
export function levelAveragePerDay(events: LogEvent[], from: Date, to: Date): LevelPoint[] {
  const days = eachLocalDay(from, to)
  const sums = new Map<LocalDate, { s: number; n: number }>()
  for (const e of inRange(events, from, to)) {
    if (typeof e.level !== 'number') continue
    const k = toLocalDate(new Date(e.at))
    const cur = sums.get(k) ?? { s: 0, n: 0 }
    cur.s += e.level
    cur.n++
    sums.set(k, cur)
  }
  return days.map((d) => {
    const k = toLocalDate(d)
    const v = sums.get(k)
    return { date: k, avg: v ? v.s / v.n : null, n: v?.n ?? 0 }
  })
}

export interface TypeFrequency {
  type: EventType
  count: number
}

/** Frecuencia por tipo de evento en el periodo (solo los que tienen ≥1). */
export function frequencyByType(events: LogEvent[], types: EventType[], from: Date, to: Date): TypeFrequency[] {
  const counts = new Map<string, number>()
  for (const e of inRange(events, from, to)) counts.set(e.typeId, (counts.get(e.typeId) ?? 0) + 1)
  return types
    .filter((t) => !t.deletedAt && counts.has(t.id))
    .map((type) => ({ type, count: counts.get(type.id)! }))
    .sort((a, b) => b.count - a.count || a.type.order - b.type.order)
}

/** Días del periodo con al menos un registro (eventos o tomas). */
export function daysWithRecords(timestamps: string[], from: Date, to: Date): { withRecords: number; total: number } {
  const days = eachLocalDay(from, to)
  const set = new Set(timestamps.map((iso) => toLocalDate(new Date(iso))))
  return { withRecords: days.filter((d) => set.has(toLocalDate(d))).length, total: days.length }
}

export function dayStartISO(d: Date): string {
  return startOfLocalDay(d).toISOString()
}
