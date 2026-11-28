import type { DoseLog, ISODateTime, Treatment } from './types'
import {
  addDays,
  dayDiff,
  endOfLocalDay,
  formatNumber,
  parseLocalDate,
  startOfLocalDay,
  toLocalDate,
  withTime,
} from './time'
import { tl } from '../i18n'

/** Una toma programada ("hueco"). */
export interface Slot {
  treatmentId: string
  /** ISO exacto del hueco; es la clave con la que se enlazan los DoseLog. */
  scheduledAt: ISODateTime
  at: Date
}

export type DoseState = 'given' | 'late' | 'skipped' | 'upcoming' | 'due' | 'overdue'

export const slotKey = (treatmentId: string, scheduledAt: ISODateTime) => `${treatmentId}|${scheduledAt}`

/** Huecos de un tratamiento programado dentro de [from, to] (ambos incluidos). */
export function slotsInRange(t: Treatment, from: Date, to: Date): Slot[] {
  if (t.mode !== 'scheduled' || t.deletedAt) return []
  const start = parseLocalDate(t.startDate)
  const end = t.endDate ? endOfLocalDay(parseLocalDate(t.endDate)) : null
  const every = Math.max(1, t.everyDays || 1)
  const out: Slot[] = []
  for (let d = startOfLocalDay(from); d <= to; d = addDays(d, 1)) {
    if (d < start) continue
    if (dayDiff(start, d) % every !== 0) continue
    for (const hhmm of t.times) {
      const at = withTime(d, hhmm)
      if (at < from || at > to) continue
      if (end && at > end) continue
      out.push({ treatmentId: t.id, scheduledAt: at.toISOString(), at })
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** Estado de un hueco según su registro (si existe) y la hora actual. */
export function doseState(
  slot: Pick<Slot, 'scheduledAt'>,
  log: DoseLog | undefined,
  graceMinutes: number,
  now: Date,
): DoseState {
  const scheduled = Date.parse(slot.scheduledAt)
  if (log) {
    if (log.status === 'skipped') return 'skipped'
    const delayMin = (Date.parse(log.at) - scheduled) / 60_000
    return delayMin > graceMinutes ? 'late' : 'given'
  }
  const diffMin = (now.getTime() - scheduled) / 60_000
  if (diffMin < -graceMinutes) return 'upcoming'
  if (diffMin <= graceMinutes) return 'due'
  return 'overdue'
}

/** Etiqueta visible. `overdue` es "Sin dar" el mismo día y "Sin registrar" si ya pasó el día. */
export function doseStateLabel(state: DoseState, scheduledAt: ISODateTime, now: Date): string {
  switch (state) {
    case 'given':
      return tl('Administrada')
    case 'late':
      return tl('Administrada con retraso')
    case 'skipped':
      return tl('Omitida')
    case 'upcoming':
      return tl('Pendiente')
    case 'due':
      return tl('Toca ahora')
    case 'overdue':
      return toLocalDate(new Date(scheduledAt)) === toLocalDate(now) ? tl('Sin dar') : tl('Sin registrar')
  }
}

/** Mapa hueco → log (si hay duplicados gana el más reciente). */
export function indexLogs(logs: DoseLog[]): Map<string, DoseLog> {
  const map = new Map<string, DoseLog>()
  for (const l of logs) {
    if (l.deletedAt || !l.treatmentId || !l.scheduledAt) continue
    const k = slotKey(l.treatmentId, l.scheduledAt)
    const prev = map.get(k)
    if (!prev || prev.updatedAt < l.updatedAt) map.set(k, l)
  }
  return map
}

export interface AdherenceRow {
  treatment: Treatment
  planned: number
  given: number
  late: number
  skipped: number
  /** Huecos pasados sin ningún registro. */
  unrecorded: number
  /** Huecos aún no vencidos (no cuentan como previstos). */
  pending: number
  /** Administraciones sin hueco (a demanda, sueltas o de una pauta anterior). */
  extra: number
  /** % de tomas previstas administradas (a tiempo o con retraso). null si no había ninguna. */
  pct: number | null
}

export function adherence(
  treatments: Treatment[],
  logs: DoseLog[],
  from: Date,
  to: Date,
  now: Date,
): AdherenceRow[] {
  const liveLogs = logs.filter((l) => !l.deletedAt)
  const index = indexLogs(liveLogs)
  const rows: AdherenceRow[] = []
  for (const t of treatments) {
    if (t.deletedAt) continue
    const slots = slotsInRange(t, from, to)
    let given = 0
    let late = 0
    let skipped = 0
    let unrecorded = 0
    let pending = 0
    const matched = new Set<string>()
    for (const s of slots) {
      const k = slotKey(t.id, s.scheduledAt)
      const log = index.get(k)
      if (log) matched.add(log.id)
      const st = doseState(s, log, t.graceMinutes, now)
      if (st === 'given') given++
      else if (st === 'late') late++
      else if (st === 'skipped') skipped++
      else if (st === 'overdue') unrecorded++
      else pending++
    }
    const fromIso = from.toISOString()
    const toIso = to.toISOString()
    const extra = liveLogs.filter(
      (l) =>
        l.treatmentId === t.id &&
        l.status === 'given' &&
        !matched.has(l.id) &&
        l.at >= fromIso &&
        l.at <= toIso,
    ).length
    const planned = given + late + skipped + unrecorded
    rows.push({
      treatment: t,
      planned,
      given,
      late,
      skipped,
      unrecorded,
      pending,
      extra,
      pct: planned === 0 ? null : Math.round(((given + late) / planned) * 100),
    })
  }
  return rows
}

/** ¿El tratamiento está activo en la fecha dada? */
export function isTreatmentActive(t: Treatment, now: Date): boolean {
  if (t.deletedAt) return false
  const today = toLocalDate(now)
  if (t.startDate > today) return false
  if (t.endDate && t.endDate < today) return false
  return true
}

export function doseText(t: Pick<Treatment, 'dose' | 'unit'>): string {
  return `${formatNumber(t.dose)} ${t.unit}`.trim()
}

export function scheduleText(t: Pick<Treatment, 'mode' | 'times' | 'everyDays'>): string {
  if (t.mode === 'asNeeded') return tl('Si hace falta')
  const every = t.everyDays <= 1 ? tl('Cada día') : t.everyDays === 2 ? tl('Día sí, día no') : tl('Cada {0} días', t.everyDays)
  const times = [...t.times].sort().join(', ')
  return times ? `${every} · ${times}` : every
}

/** Campos que, si cambian, alteran el calendario de huecos. */
export function scheduleChanged(a: Treatment, b: Partial<Treatment>): boolean {
  const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y)
  if (b.mode !== undefined && b.mode !== a.mode) return true
  if (b.everyDays !== undefined && b.everyDays !== a.everyDays) return true
  if (b.startDate !== undefined && b.startDate !== a.startDate) return true
  if (b.times !== undefined && !same([...b.times].sort(), [...a.times].sort())) return true
  return false
}
