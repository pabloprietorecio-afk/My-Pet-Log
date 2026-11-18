/**
 * Ejecuta lo interpretado por voz contra el repositorio y prepara los textos de confirmación.
 */
import { repo } from '../data/instance'
import { describeEvent } from '../domain/eventTypes'
import { doseText, indexLogs, isTreatmentActive, slotKey, slotsInRange } from '../domain/schedule'
import { addDays, endOfLocalDay, formatTime, startOfLocalDay, startOfWeek } from '../domain/time'
import type { DoseLog, EventType, Pet, Treatment } from '../domain/types'
import { parseVoice, type VoiceAction, type VoiceContext, type VoiceQuery, type VoiceResult } from './parse'

export interface Done {
  kind: 'event' | 'dose'
  id: string
  /** Texto corto para la tarjeta y la voz: «Vómito leve», «Prednisona 5 mg dada». */
  text: string
  emoji?: string
  typeKey?: EventType['key']
  at: Date
  /** Para «Editar» (solo eventos). */
  typeId?: string
}

export type Outcome =
  | { kind: 'saved'; petId: string; done: Done[]; ignored: string[]; needsTreatment?: boolean }
  | { kind: 'answer'; petId: string; text: string }
  | { kind: 'undone'; text: string }
  | { kind: 'none'; text: string }

/** Lo último que se guardó por voz (para «deshacer» o el botón Deshacer). */
let lastBatch: Done[] = []

export async function buildContext(currentPetId: string, now = new Date()): Promise<VoiceContext & { petsFull: Pet[] }> {
  const pets = await repo.listPets()
  const types = new Map<string, EventType[]>()
  const trs = new Map<string, Treatment[]>()
  for (const p of pets) {
    types.set(p.id, await repo.listEventTypes(p.id))
    trs.set(p.id, (await repo.listTreatments(p.id)).filter((t) => isTreatmentActive(t, now)))
  }
  return {
    now,
    pets: pets.map((p) => ({ id: p.id, name: p.name })),
    petsFull: pets,
    currentPetId,
    types: (id) => types.get(id) ?? [],
    treatments: (id) => trs.get(id) ?? [],
  }
}

const hhmm = (d: Date) => formatTime(d)
const sameDay = (a: Date, b: Date) => startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime()
function when(at: Date, now: Date, said: boolean): string {
  if (!said) return ''
  if (sameDay(at, now)) return ` · ${hhmm(at)}`
  if (sameDay(at, addDays(now, -1))) return ` · ayer ${hhmm(at)}`
  return ` · ${at.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${hhmm(at)}`
}

/** Hueco de la toma más cercano a la hora dicha (o a ahora) que aún no está registrado. */
function slotFor(t: Treatment, logs: DoseLog[], at: Date) {
  const index = indexLogs(logs)
  const slots = slotsInRange(t, addDays(startOfLocalDay(at), -1), endOfLocalDay(at))
    .filter((s) => !index.has(slotKey(t.id, s.scheduledAt)))
    .sort((a, b) => Math.abs(a.at.getTime() - at.getTime()) - Math.abs(b.at.getTime() - at.getTime()))
  const best = slots[0]
  const limit = Math.max(t.graceMinutes * 2, 180) * 60_000
  return best && Math.abs(best.at.getTime() - at.getTime()) <= limit ? best : null
}

async function apply(petId: string, a: VoiceAction, ctx: VoiceContext): Promise<Done | 'needsTreatment'> {
  if (a.kind === 'event') {
    const type = ctx.types(petId).find((t) => t.id === a.typeId)!
    const ev = await repo.addEvent({ petId, typeId: a.typeId, at: a.at.toISOString(), level: a.level, value: a.value, unit: a.unit, note: a.note })
    const det = describeEvent(type, ev)
    return { kind: 'event', id: ev.id, typeId: type.id, typeKey: type.key, emoji: type.emoji, at: a.at, text: `${type.label}${det ? `, ${det}` : ''}${when(a.at, ctx.now, a.timeSaid)}` }
  }
  if (a.kind === 'adhoc') {
    const log = await repo.logDose({ petId, at: a.at.toISOString(), status: 'given', adHoc: { name: a.name, dose: a.dose, unit: a.unit } })
    return { kind: 'dose', id: log.id, typeKey: 'medication', at: a.at, text: `${a.name}${a.dose !== undefined ? ` ${a.dose} ${a.unit ?? ''}`.trimEnd() : ''} dada${when(a.at, ctx.now, a.timeSaid)}` }
  }
  if (!a.treatmentId) return 'needsTreatment'
  const t = ctx.treatments(petId).find((x) => x.id === a.treatmentId)!
  const logs = await repo.listDoseLogs(petId, addDays(a.at, -2), addDays(a.at, 1))
  const slot = t.mode === 'scheduled' ? slotFor(t, logs, a.at) : null
  // Sin hora dicha, una toma programada se apunta a su hora de registro real (ahora); con hora dicha, a esa hora.
  const log = await repo.logDose({ petId, treatmentId: t.id, scheduledAt: slot?.scheduledAt, status: a.status, at: (a.status === 'skipped' && slot ? slot.at : a.at).toISOString() })
  const verb = a.status === 'given' ? 'dada' : 'sin dar'
  return { kind: 'dose', id: log.id, typeKey: 'medication', at: a.at, text: `${t.name} ${doseText(t)} ${verb}${slot ? ` (toma de las ${hhmm(slot.at)})` : when(a.at, ctx.now, a.timeSaid)}` }
}

export async function undoLast(): Promise<string | null> {
  if (!lastBatch.length) return null
  for (const d of lastBatch) {
    if (d.kind === 'event') await repo.deleteEvent(d.id)
    else await repo.deleteDoseLog(d.id)
  }
  const text = lastBatch.map((d) => d.text.split(/[,·]/)[0].trim()).join(', ')
  lastBatch = []
  return text
}

async function answer(petId: string, q: VoiceQuery, ctx: VoiceContext): Promise<string> {
  const now = ctx.now
  const pet = ctx.pets.find((p) => p.id === petId)?.name ?? ''
  if (q.kind === 'count') {
    const type = ctx.types(petId).find((t) => t.id === q.typeId)!
    const from = q.range === 'week' ? startOfWeek(now) : q.range === 'yesterday' ? startOfLocalDay(addDays(now, -1)) : startOfLocalDay(now)
    const to = q.range === 'yesterday' ? endOfLocalDay(addDays(now, -1)) : now
    const n = (await repo.listEvents(petId, from, to)).filter((e) => e.typeId === type.id).length
    const range = q.range === 'week' ? 'esta semana' : q.range === 'yesterday' ? 'ayer' : 'hoy'
    return `${pet}: ${n} ${n === 1 ? 'registro' : 'registros'} de ${type.label.toLowerCase()} ${range}.`
  }
  if (q.medication) {
    const logs = (await repo.listDoseLogs(petId, addDays(now, -60), now))
      .filter((l) => l.status === 'given' && (!q.treatmentId || l.treatmentId === q.treatmentId))
      .sort((a, b) => b.at.localeCompare(a.at))
    const l = logs[0]
    if (!l) return `No hay tomas dadas registradas${q.treatmentId ? ' de ese tratamiento' : ''} en los últimos 60 días.`
    const name = l.adHoc?.name ?? ctx.treatments(petId).find((t) => t.id === l.treatmentId)?.name ?? 'Medicación'
    return `Última toma: ${name}, ${when(new Date(l.at), now, true).replace(' · ', '')}.`
  }
  const type = ctx.types(petId).find((t) => t.id === q.typeId)!
  const evs = (await repo.listEvents(petId)).filter((e) => e.typeId === type.id).sort((a, b) => b.at.localeCompare(a.at))
  const e = evs[0]
  if (!e) return `No hay registros de ${type.label.toLowerCase()}.`
  const det = describeEvent(type, e)
  return `Último registro de ${type.label.toLowerCase()}: ${when(new Date(e.at), now, true).replace(' · ', '')}${det ? `, ${det}` : ''}.`
}

/** Interpreta y ejecuta una frase. */
export async function runVoice(text: string, currentPetId: string): Promise<Outcome> {
  const ctx = await buildContext(currentPetId)
  const r: VoiceResult = parseVoice(text, ctx)
  if (r.kind === 'none') return { kind: 'none', text }
  if (r.kind === 'undo') {
    const t = await undoLast()
    return { kind: 'undone', text: t ? `Deshecho: ${t}` : 'No hay nada que deshacer de esta sesión de voz.' }
  }
  if (r.kind === 'query') return { kind: 'answer', petId: r.petId, text: await answer(r.petId, r.query, ctx) }
  const done: Done[] = []
  let needsTreatment = false
  for (const a of r.actions) {
    const d = await apply(r.petId, a, ctx)
    if (d === 'needsTreatment') needsTreatment = true
    else done.push(d)
  }
  if (done.length) lastBatch = done
  return { kind: 'saved', petId: r.petId, done, ignored: r.ignored, needsTreatment }
}

/** Frase corta para leer en voz alta. */
export function spoken(o: Outcome, petName?: string): string {
  if (o.kind === 'saved') {
    if (!o.done.length) return o.needsTreatment ? '¿Qué medicamento? Dímelo por su nombre.' : 'No lo he entendido.'
    const say = (t: string) => t.replace(/ · ayer (\d)/, ', ayer a las $1').replace(/ · (\d)/, ', a las $1').replace(/ · /g, ', ')
    return `Anotado${petName ? ` para ${petName}` : ''}: ${o.done.map((d) => say(d.text)).join('; ')}.`
  }
  if (o.kind === 'none') return 'No lo he entendido.'
  return o.text
}
