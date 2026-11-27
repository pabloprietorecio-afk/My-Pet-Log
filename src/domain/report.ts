/**
 * Informe veterinario: convierte los datos del propietario en un `ReportModel`.
 *
 * Regla de oro: SOLO organiza y cuenta lo que el propietario introdujo.
 * No diagnostica, no interpreta y no recomienda. Los textos fijos son neutros.
 */
import { SPECIES, describeEvent, levelOptions } from './eventTypes'
import { adherence, doseState, doseText, isTreatmentActive, scheduleText } from './schedule'
import { countPerDay, countPerWeek, daysWithRecords, frequencyByType, levelAveragePerDay, valueSeries } from './stats'
import type { DoseLog, EventKey, EventType, LocalDate, LogEvent, Pet, Species, Treatment } from './types'
import {
  addDays,
  ageText,
  endOfLocalDay,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatDayMonth,
  formatNumber,
  formatTime,
  parseLocalDate,
  plural,
  startOfLocalDay,
  toLocalDate,
} from './time'

export type PeriodPreset = '24h' | '7d' | '30d' | 'custom'

export interface Period {
  preset: PeriodPreset
  from: Date
  to: Date
  label: string
}

export function makePeriod(
  preset: PeriodPreset,
  now: Date,
  custom?: { from: LocalDate; to: LocalDate },
): Period {
  switch (preset) {
    case '24h':
      return { preset, from: new Date(now.getTime() - 24 * 3_600_000), to: now, label: 'Últimas 24 horas' }
    case '7d':
      return { preset, from: startOfLocalDay(addDays(now, -6)), to: now, label: 'Últimos 7 días' }
    case '30d':
      return { preset, from: startOfLocalDay(addDays(now, -29)), to: now, label: 'Últimos 30 días' }
    case 'custom': {
      const c = custom ?? { from: toLocalDate(addDays(now, -6)), to: toLocalDate(now) }
      const a = parseLocalDate(c.from)
      const b = parseLocalDate(c.to)
      const [f, t] = a <= b ? [a, b] : [b, a]
      return {
        preset,
        from: startOfLocalDay(f),
        to: endOfLocalDay(t),
        label: `Del ${formatDateShort(f)} al ${formatDateShort(t)}`,
      }
    }
  }
}

export const DISCLAIMER =
  'Informe generado por PetLog a partir de los datos que ha introducido el propietario. ' +
  'Es una organización de esos datos: no contiene diagnósticos, interpretaciones ni recomendaciones médicas, ' +
  'y su exactitud depende de lo registrado.'

export interface ReportInput {
  pet: Pet
  types: EventType[]
  events: LogEvent[]
  treatments: Treatment[]
  doseLogs: DoseLog[]
  period: Period
  now: Date
}

export interface TimelineItem {
  at: string
  time: string
  emoji: string
  label: string
  detail: string
  kind: 'event' | 'dose'
}

export interface TimelineDay {
  date: LocalDate
  title: string
  items: TimelineItem[]
}

export interface MedRow {
  name: string
  dose: string
  schedule: string
  period: string
  planned: number
  given: number
  late: number
  skipped: number
  unrecorded: number
  extra: number
  pct: number | null
}

export interface CurrentTreatment {
  name: string
  dose: string
  schedule: string
  since: string
  until?: string
  notes?: string
}

export interface IncidentSeries {
  id: string
  label: string
  counts: number[]
}

/** Un dato de la portada (tarjeta «Resumen del periodo»). Solo recuentos. */
export interface CoverStat {
  key: EventKey | 'days'
  emoji?: string
  label: string
  value: string
  detail?: string
}

/** Datos de la primera página (infografía). Todo sale de lo registrado; nada se interpreta. */
export interface ReportCover {
  stats: CoverStat[]
  weight?: { last: string; lastDate: string; first?: string; firstDate?: string; delta?: string }
  vetVisits: { when: string; text: string }[]
  notes: { when: string; label: string; text: string }[]
  meds: { name: string; dose: string; schedule: string; adherence?: string }[]
}

export interface ReportModel {
  generatedAt: string
  period: { label: string; from: string; to: string; fromText: string; toText: string; fromDay: string; toDay: string }
  pet: {
    name: string
    species: string
    speciesKey: Species
    photo?: string
    breed?: string
    sex: string
    age?: string
    birthDate?: string
    weight?: { text: string; date: string }
    vet: { name?: string; clinic?: string; phone?: string }
    conditions: string[]
    allergies: string[]
  }
  currentTreatments: CurrentTreatment[]
  summary: { label: string; value: string }[]
  timeline: TimelineDay[]
  medication: { rows: MedRow[]; adHoc: number }
  weight: { windowLabel: string; points: { t: number; v: number; date: LocalDate }[]; unit: string }
  incidents: { bin: 'day' | 'week'; labels: string[]; series: IncidentSeries[] }
  frequency: { key: EventKey; label: string; emoji: string; count: number }[]
  appetite: { date: LocalDate; avg: number | null }[]
  customValues: { label: string; unit: string; points: { t: number; v: number; date: LocalDate }[] }[]
  ownerNotes: { when: string; label: string; text: string }[]
  photos: { when: string; label: string; dataUrl: string }[]
  cover: ReportCover
  disclaimer: string
}

const SEX = { male: 'Macho', female: 'Hembra', unknown: 'Sin especificar' } as const

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

function levelBreakdown(type: EventType, events: LogEvent[]): string {
  const opts = levelOptions(type)
  const parts: string[] = []
  for (const o of opts) {
    const n = events.filter((e) => e.level === o.value).length
    if (n > 0) parts.push(`${o.label} ×${n}`)
  }
  return parts.join(' · ')
}

export function buildReport(input: ReportInput): ReportModel {
  const { pet, period, now } = input
  const types = input.types.filter((t) => !t.deletedAt && t.petId === pet.id)
  const typeById = new Map(types.map((t) => [t.id, t]))
  const fromIso = period.from.toISOString()
  const toIso = period.to.toISOString()

  const allEvents = input.events.filter((e) => !e.deletedAt && e.petId === pet.id)
  const events = allEvents.filter((e) => e.at >= fromIso && e.at <= toIso)
  const treatments = input.treatments.filter((t) => !t.deletedAt && t.petId === pet.id)
  const treatmentById = new Map(treatments.map((t) => [t.id, t]))
  const allLogs = input.doseLogs.filter((l) => !l.deletedAt && l.petId === pet.id)
  const logs = allLogs.filter((l) => l.at >= fromIso && l.at <= toIso)

  // ── Ficha ────────────────────────────────────────────────────────────────
  const weightTypeIds = new Set(types.filter((t) => t.key === 'weight').map((t) => t.id))
  const allWeights = allEvents
    .filter((e) => weightTypeIds.has(e.typeId) && typeof e.value === 'number' && e.at <= now.toISOString())
    .sort((a, b) => a.at.localeCompare(b.at))
  const lastWeight = allWeights[allWeights.length - 1]

  // ── Cronología ───────────────────────────────────────────────────────────
  const items: TimelineItem[] = []
  for (const e of events) {
    const t = typeById.get(e.typeId)
    if (!t) continue
    const detail = describeEvent(t, { ...e, note: e.note ? short(e.note, 80) : undefined })
    items.push({ at: e.at, time: formatTime(e.at), emoji: t.emoji, label: t.label, detail, kind: 'event' })
  }
  for (const l of logs) {
    const t = l.treatmentId ? treatmentById.get(l.treatmentId) : undefined
    const name = t?.name ?? l.adHoc?.name ?? 'Medicamento'
    const dose = t ? doseText(t) : l.adHoc?.dose !== undefined ? `${formatNumber(l.adHoc.dose)} ${l.adHoc.unit ?? ''}`.trim() : ''
    let state = l.status === 'skipped' ? 'omitida' : 'administrada'
    if (t && l.scheduledAt) {
      const st = doseState({ scheduledAt: l.scheduledAt }, l, t.graceMinutes, now)
      if (st === 'late') state = `administrada con retraso (prevista ${formatTime(l.scheduledAt)})`
    }
    const note = l.note ? ` · ${short(l.note, 80)}` : ''
    items.push({
      at: l.at,
      time: formatTime(l.at),
      emoji: '💊',
      label: 'Medicación',
      detail: `${[name, dose].filter(Boolean).join(' ')} · ${state}${note}`,
      kind: 'dose',
    })
  }
  items.sort((a, b) => a.at.localeCompare(b.at))
  const byDay = new Map<LocalDate, TimelineItem[]>()
  for (const it of items) {
    const k = toLocalDate(new Date(it.at))
    byDay.set(k, [...(byDay.get(k) ?? []), it])
  }
  const timeline: TimelineDay[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, its]) => ({ date, title: formatDateLong(date), items: its }))

  // ── Medicación ───────────────────────────────────────────────────────────
  const adh = adherence(treatments, allLogs, period.from, period.to, now)
  const rows: MedRow[] = adh
    .filter((r) => r.planned > 0 || r.extra > 0 || r.pending > 0)
    .map((r) => ({
      name: r.treatment.name,
      dose: doseText(r.treatment),
      schedule: scheduleText(r.treatment),
      period: r.treatment.endDate
        ? `${formatDateShort(r.treatment.startDate)} – ${formatDateShort(r.treatment.endDate)}`
        : `desde ${formatDateShort(r.treatment.startDate)}`,
      planned: r.planned,
      given: r.given,
      late: r.late,
      skipped: r.skipped,
      unrecorded: r.unrecorded,
      extra: r.extra,
      pct: r.pct,
    }))
  const adHoc = logs.filter((l) => !l.treatmentId && l.status === 'given').length

  const currentTreatments: CurrentTreatment[] = treatments
    .filter((t) => isTreatmentActive(t, now))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((t) => ({
      name: t.name,
      dose: doseText(t),
      schedule: scheduleText(t),
      since: formatDateShort(t.startDate),
      until: t.endDate ? formatDateShort(t.endDate) : undefined,
      notes: t.notes,
    }))

  // ── Resumen (solo hechos) ────────────────────────────────────────────────
  const summary: { label: string; value: string }[] = []
  const periodDays = daysWithRecords([...events.map((e) => e.at), ...logs.map((l) => l.at)], period.from, period.to)
  summary.push({
    label: 'Días con algún registro',
    value: `${periodDays.withRecords} de ${periodDays.total}`,
  })
  const stats: CoverStat[] = [{ key: 'days', label: 'Días con registro', value: `${periodDays.withRecords} de ${periodDays.total}` }]
  const ordered = [...types].sort((a, b) => a.order - b.order)
  for (const t of ordered) {
    if (t.key === 'medication' || t.key === 'weight' || t.key === 'vet') continue
    const evs = events.filter((e) => e.typeId === t.id)
    // Vómito y deposición se listan aunque sean 0 (un «0» también es información), salvo si el botón está oculto.
    const always = (t.key === 'vomit' || t.key === 'stool') && !t.hidden
    if (evs.length === 0 && !always) continue
    const noun = t.key === 'vomit' || t.key === 'symptom' ? ['episodio', 'episodios'] : ['registro', 'registros']
    if (t.input === 'number') {
      const vals = evs.filter((e) => typeof e.value === 'number')
      if (vals.length) {
        const u = vals[vals.length - 1].unit ?? t.unit ?? ''
        const min = Math.min(...vals.map((e) => e.value!))
        const max = Math.max(...vals.map((e) => e.value!))
        const range = `${min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`} ${u}`.trim()
        summary.push({ label: t.label, value: `${vals.length} ${plural(vals.length, 'medida', 'medidas')} (${range})` })
        stats.push({ key: t.key, emoji: t.emoji, label: t.label, value: `${vals.length} ${plural(vals.length, 'medida', 'medidas')}`, detail: range })
        continue
      }
    }
    const br = levelBreakdown(t, evs)
    summary.push({
      label: t.label,
      value: `${evs.length} ${plural(evs.length, noun[0], noun[1])}${br ? ` (${br})` : ''}`,
    })
    stats.push({ key: t.key, emoji: t.emoji, label: t.label, value: `${evs.length} ${plural(evs.length, noun[0], noun[1])}`, detail: br || undefined })
  }
  const vetEvents = events.filter((e) => types.find((t) => t.id === e.typeId)?.key === 'vet')
  if (vetEvents.length > 0) {
    summary.push({ label: 'Citas / visitas veterinarias', value: String(vetEvents.length) })
    const vt = types.find((t) => t.key === 'vet')
    stats.push({ key: 'vet', emoji: vt?.emoji, label: 'Visitas veterinarias', value: String(vetEvents.length) })
  }
  const periodWeights = allWeights.filter((e) => e.at >= fromIso && e.at <= toIso)
  if (periodWeights.length > 0) {
    const first = periodWeights[0]
    const last = periodWeights[periodWeights.length - 1]
    const u = last.unit ?? 'kg'
    summary.push({
      label: 'Peso',
      value:
        periodWeights.length === 1
          ? `${formatNumber(last.value!)} ${u} (${formatDayMonth(new Date(last.at))})`
          : `${formatNumber(first.value!)} ${u} (${formatDayMonth(new Date(first.at))}) → ${formatNumber(last.value!)} ${u} (${formatDayMonth(new Date(last.at))})`,
    })
  }
  const planned = rows.reduce((s, r) => s + r.planned, 0)
  if (planned > 0 || adHoc > 0 || rows.some((r) => r.extra > 0)) {
    const g = rows.reduce((s, r) => s + r.given, 0)
    const l = rows.reduce((s, r) => s + r.late, 0)
    const sk = rows.reduce((s, r) => s + r.skipped, 0)
    const un = rows.reduce((s, r) => s + r.unrecorded, 0)
    const extra = rows.reduce((s, r) => s + r.extra, 0) + adHoc
    const bits: string[] = []
    if (planned > 0) {
      bits.push(
        `${g + l} de ${planned} tomas previstas administradas (${g} a tiempo, ${l} con retraso)`,
        `${sk} omitidas`,
        `${un} sin registrar`,
      )
    } else {
      bits.push('Sin tomas programadas en el periodo')
    }
    if (extra > 0) bits.push(`${extra} ${plural(extra, 'toma adicional', 'tomas adicionales')}`)
    summary.push({ label: 'Medicación', value: bits.join(' · ') })
    const mt = types.find((t) => t.key === 'medication')
    stats.push(
      planned > 0
        ? { key: 'medication', emoji: mt?.emoji, label: 'Medicación', value: `${g + l} de ${planned} tomas`, detail: [sk ? `${sk} omitidas` : '', un ? `${un} sin registrar` : '', extra ? `${extra} adicionales` : ''].filter(Boolean).join(' · ') || undefined }
        : { key: 'medication', emoji: mt?.emoji, label: 'Medicación', value: `${extra} ${plural(extra, 'toma suelta', 'tomas sueltas')}` },
    )
  }

  // ── Gráficas ─────────────────────────────────────────────────────────────
  const spanDays = Math.max(1, Math.round((period.to.getTime() - period.from.getTime()) / 86_400_000))
  const bin: 'day' | 'week' = spanDays > 45 ? 'week' : 'day'
  const count = bin === 'day' ? countPerDay : countPerWeek
  const labelsSource = count([], period.from, period.to)
  const labels = labelsSource.map((d) => formatDayMonth(d.date))

  const series: IncidentSeries[] = []
  const addSeries = (id: string, label: string, evs: LogEvent[]) => {
    if (evs.length === 0) return
    series.push({ id, label, counts: count(evs, period.from, period.to).map((d) => d.count) })
  }
  for (const t of ordered) {
    const evs = events.filter((e) => e.typeId === t.id)
    if (t.key === 'vomit') addSeries(t.id, t.label, evs)
    else if (t.key === 'symptom') addSeries(t.id, t.label, evs)
    else if (t.key === 'stool') addSeries(t.id, 'Deposición blanda o diarrea', evs.filter((e) => (e.level ?? 0) >= 2))
    else if ((t.key === 'custom' || t.key === 'shed') && t.input !== 'number') addSeries(t.id, t.label, evs)
  }

  const frequency = frequencyByType(events, ordered, period.from, period.to)
    .filter((f) => f.type.key !== 'weight')
    .map((f) => ({ key: f.type.key, label: f.type.label, emoji: f.type.emoji, count: f.count }))

  const foodType = types.find((t) => t.key === 'food')
  const appetite = foodType
    ? levelAveragePerDay(events.filter((e) => e.typeId === foodType.id), period.from, period.to).map((p) => ({
        date: p.date,
        avg: p.avg,
      }))
    : []

  const weightWindowFrom = new Date(Math.min(period.from.getTime(), period.to.getTime() - 180 * 86_400_000))
  const weightPoints = valueSeries(
    allWeights.filter((e) => e.at <= toIso),
    weightWindowFrom,
    period.to,
  )
  const customValues = ordered
    .filter((t) => t.key !== 'weight' && t.input === 'number')
    .map((t) => ({
      label: t.label,
      unit: t.unit ?? '',
      points: valueSeries(events.filter((e) => e.typeId === t.id)),
    }))
    .filter((c) => c.points.length > 0)

  // ── Notas del propietario y fotos ────────────────────────────────────────
  const ownerNotes: ReportModel['ownerNotes'] = []
  for (const e of events.filter((x) => x.note)) {
    const t = typeById.get(e.typeId)
    ownerNotes.push({ when: formatDateTime(e.at), label: t?.label ?? 'Registro', text: e.note! })
  }
  for (const l of logs.filter((x) => x.note)) {
    ownerNotes.push({ when: formatDateTime(l.at), label: 'Medicación', text: l.note! })
  }
  ownerNotes.sort((a, b) => a.when.localeCompare(b.when))

  const photos = events
    .filter((e) => e.photo)
    .slice(0, 12)
    .map((e) => ({ when: formatDateTime(e.at), label: typeById.get(e.typeId)?.label ?? 'Registro', dataUrl: e.photo! }))

  const wUnit = lastWeight?.unit ?? 'kg'

  // ── Portada (infografía): solo datos ya calculados arriba, sin valoraciones ──
  const vetTypeIds = new Set(types.filter((t) => t.key === 'vet').map((t) => t.id))
  const vetVisits = vetEvents
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((e) => ({ when: formatDateTime(e.at), text: describeEvent(typeById.get(e.typeId)!, e) }))
  // Notas del propietario (las de «Veterinario» ya salen en su tarjeta), de la más reciente a la más antigua.
  const coverNotes = [
    ...events.filter((x) => x.note && !vetTypeIds.has(x.typeId)).map((e) => ({ at: e.at, label: typeById.get(e.typeId)?.label ?? 'Registro', text: e.note! })),
    ...logs.filter((x) => x.note).map((l) => ({ at: l.at, label: 'Medicación', text: l.note! })),
  ].sort((a, b) => b.at.localeCompare(a.at))
  let coverWeight: ReportCover['weight']
  if (lastWeight) {
    const shown = weightPoints.filter((q) => q.v !== null)
    const first = shown[0]
    const last = { v: lastWeight.value!, date: toLocalDate(new Date(lastWeight.at)) }
    const diff = first ? Math.round((last.v - first.v) * 100) / 100 : 0
    coverWeight = {
      last: `${formatNumber(last.v)} ${wUnit}`,
      lastDate: formatDateShort(new Date(lastWeight.at)),
      ...(first && shown.length > 1
        ? {
            first: `${formatNumber(first.v)} ${wUnit}`,
            firstDate: formatDateShort(parseLocalDate(first.date)),
            delta: `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${formatNumber(Math.abs(diff))} ${wUnit}`,
          }
        : {}),
    }
  }
  // En la portada caben pocos datos: primero lo que más pregunta el veterinario.
  const PRIORITY: string[] = ['days', 'medication', 'vomit', 'stool', 'symptom', 'food', 'water', 'vet']
  const rank = (k: string) => (PRIORITY.includes(k) ? PRIORITY.indexOf(k) : PRIORITY.length)
  stats.sort((a, b) => rank(a.key) - rank(b.key))
  const pctByName = new Map(rows.filter((r) => r.planned > 0).map((r) => [r.name, `${r.given + r.late} de ${r.planned} tomas`]))
  const cover: ReportCover = {
    stats,
    weight: coverWeight,
    vetVisits,
    notes: coverNotes.map((n) => ({ when: formatDateTime(n.at), label: n.label, text: n.text })),
    meds: currentTreatments.map((t) => ({ name: t.name, dose: t.dose, schedule: t.schedule, adherence: pctByName.get(t.name) })),
  }

  return {
    generatedAt: formatDateTime(now.toISOString()),
    period: {
      label: period.label,
      from: fromIso,
      to: toIso,
      fromText: formatDateTime(fromIso),
      toText: formatDateTime(toIso),
      fromDay: formatDateShort(period.from),
      toDay: formatDateShort(period.to),
    },
    pet: {
      name: pet.name,
      species: SPECIES[pet.species]?.pick ?? pet.species,
      speciesKey: pet.species,
      photo: pet.photo || undefined,
      breed: pet.breed || undefined,
      sex: SEX[pet.sex],
      age: ageText(pet.birthDate, now),
      birthDate: pet.birthDate ? formatDateShort(pet.birthDate) : undefined,
      weight: lastWeight
        ? { text: `${formatNumber(lastWeight.value!)} ${wUnit}`, date: formatDateShort(new Date(lastWeight.at)) }
        : undefined,
      vet: pet.vet ?? {},
      conditions: pet.conditions,
      allergies: pet.allergies,
    },
    currentTreatments,
    summary,
    timeline,
    medication: { rows, adHoc },
    weight: {
      windowLabel: weightWindowFrom < period.from ? 'últimos 6 meses' : 'periodo del informe',
      points: weightPoints,
      unit: wUnit,
    },
    incidents: { bin, labels, series },
    frequency,
    appetite,
    customValues,
    ownerNotes,
    photos,
    cover,
    disclaimer: DISCLAIMER,
  }
}
