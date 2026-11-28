import type { ISODateTime, LocalDate } from './types'
import { locale, tl } from '../i18n'

const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Medianoche local de una fecha "yyyy-mm-dd". */
export function parseLocalDate(s: LocalDate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Días naturales entre dos fechas locales (a → b), a prueba de cambios de hora. */
export function dayDiff(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / 86_400_000)
}

export function withTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0)
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s)
}

/** Lunes de la semana (local) de una fecha. */
export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // lunes = 0
  return addDays(startOfLocalDay(d), -day)
}

export function eachLocalDay(from: Date, to: Date): Date[] {
  const out: Date[] = []
  for (let d = startOfLocalDay(from); d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function nowISO(): ISODateTime {
  return new Date().toISOString()
}

/** "yyyy-mm-ddThh:mm" local, para <input type="datetime-local">. */
export function toInputDateTime(iso: ISODateTime): string {
  const d = new Date(iso)
  return `${toLocalDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromInputDateTime(s: string): ISODateTime {
  const [date, time] = s.split('T')
  return withTime(parseLocalDate(date), time).toISOString()
}

// ─── Formato (es-ES) ────────────────────────────────────────────────────────


export function formatTime(iso: ISODateTime | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateShort(d: Date | LocalDate): string {
  const date = typeof d === 'string' ? parseLocalDate(d) : d
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function formatDayMonth(d: Date | LocalDate): string {
  const date = typeof d === 'string' ? parseLocalDate(d) : d
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

export function formatDateLong(d: Date | LocalDate): string {
  const date = typeof d === 'string' ? parseLocalDate(d) : d
  const s = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDateTime(iso: ISODateTime): string {
  const d = new Date(iso)
  return `${formatDateShort(d)} ${formatTime(d)}`
}

export function formatNumber(n: number, maxFraction = 2): string {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: maxFraction }).format(n)
}

/** Edad legible a partir de la fecha de nacimiento. */
export function ageText(birth: LocalDate | undefined, now: Date): string | undefined {
  if (!birth) return undefined
  const b = parseLocalDate(birth)
  if (b > now) return undefined
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  if (now.getDate() < b.getDate()) months -= 1
  if (months < 1) {
    const days = Math.max(0, dayDiff(b, now))
    return days === 1 ? tl('1 día') : tl('{0} días', days)
  }
  if (months < 24) return months === 1 ? tl('1 mes') : tl('{0} meses', months)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = years === 1 ? tl('1 año') : tl('{0} años', years)
  if (rest === 0) return y
  return rest === 1 ? tl('{0} y 1 mes', y) : tl('{0} y {1} meses', y, rest)
}

/** Edad abreviada para cabeceras: "14 años", "8 meses". */
export function ageShort(birth: LocalDate | undefined, now: Date): string | undefined {
  if (!birth) return undefined
  const b = parseLocalDate(birth)
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  if (now.getDate() < b.getDate()) months -= 1
  if (months < 24) return ageText(birth, now)
  const years = Math.floor(months / 12)
  return years === 1 ? tl('1 año') : tl('{0} años', years)
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}
