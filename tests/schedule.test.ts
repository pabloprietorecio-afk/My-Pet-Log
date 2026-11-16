import { describe, expect, it } from 'vitest'
import { adherence, doseState, doseStateLabel, scheduleText, slotsInRange } from '../src/domain/schedule'
import type { DoseLog, Treatment } from '../src/domain/types'
import { d } from './helpers'

const base = (over: Partial<Treatment> = {}): Treatment => ({
  id: 't1',
  petId: 'p1',
  name: 'Prednisona',
  dose: 5,
  unit: 'mg',
  mode: 'scheduled',
  times: ['08:00', '20:00'],
  everyDays: 1,
  startDate: '2026-03-01',
  graceMinutes: 60,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...over,
})

const log = (over: Partial<DoseLog>): DoseLog => ({
  id: Math.random().toString(36).slice(2),
  petId: 'p1',
  treatmentId: 't1',
  at: '2026-11-16T07:00:00.000Z',
  status: 'given',
  createdAt: '2026-11-16T07:00:00.000Z',
  updatedAt: '2026-11-16T07:00:00.000Z',
  ...over,
})

describe('slotsInRange', () => {
  it('genera 2 tomas diarias y respeta el cambio de hora (28→30 marzo 2026, Madrid)', () => {
    const slots = slotsInRange(base(), d('2026-03-28 00:00'), d('2026-03-30 23:59'))
    expect(slots).toHaveLength(6)
    // 28/03 20:00 CET = 19:00Z; 29/03 20:00 CEST = 18:00Z
    expect(slots[1].scheduledAt).toBe('2026-03-28T19:00:00.000Z')
    expect(slots[3].scheduledAt).toBe('2026-03-29T18:00:00.000Z')
  })

  it('día sí, día no', () => {
    const t = base({ everyDays: 2, times: ['09:00'], startDate: '2026-11-01' })
    const days = slotsInRange(t, d('2026-11-01 00:00'), d('2026-11-07 23:59')).map((s) => s.at.getDate())
    expect(days).toEqual([1, 3, 5, 7])
  })

  it('no genera antes del inicio ni después del fin, y "si hace falta" no programa', () => {
    const t = base({ startDate: '2026-11-03', endDate: '2026-11-04', times: ['10:00'] })
    expect(slotsInRange(t, d('2026-11-01 00:00'), d('2026-11-10 00:00'))).toHaveLength(2)
    expect(slotsInRange(base({ mode: 'asNeeded' }), d('2026-11-01 00:00'), d('2026-11-10 00:00'))).toHaveLength(0)
  })
})

describe('doseState', () => {
  const slot = { scheduledAt: d('2026-11-16 20:00').toISOString() }
  const t = 60
  it('sin registro: pendiente → toca → retrasada', () => {
    expect(doseState(slot, undefined, t, d('2026-11-16 15:00'))).toBe('upcoming')
    expect(doseState(slot, undefined, t, d('2026-11-16 20:30'))).toBe('due')
    expect(doseState(slot, undefined, t, d('2026-11-16 21:30'))).toBe('overdue')
  })
  it('con registro: a tiempo, con retraso u omitida', () => {
    expect(doseState(slot, log({ at: d('2026-11-16 20:10').toISOString() }), t, d('2026-11-16 23:00'))).toBe('given')
    expect(doseState(slot, log({ at: d('2026-11-16 19:30').toISOString() }), t, d('2026-11-16 23:00'))).toBe('given')
    expect(doseState(slot, log({ at: d('2026-11-16 21:30').toISOString() }), t, d('2026-11-16 23:00'))).toBe('late')
    expect(doseState(slot, log({ status: 'skipped' }), t, d('2026-11-16 23:00'))).toBe('skipped')
  })
  it('etiqueta: retrasada el mismo día, sin registrar otro día', () => {
    expect(doseStateLabel('overdue', slot.scheduledAt, d('2026-11-16 22:00'))).toBe('Sin dar')
    expect(doseStateLabel('overdue', slot.scheduledAt, d('2026-11-17 09:00'))).toBe('Sin registrar')
  })
})

describe('adherence', () => {
  it('cuenta administradas, con retraso, omitidas y sin registrar; ignora huecos futuros', () => {
    const t = base({ startDate: '2026-11-14' })
    const logs = [
      log({ scheduledAt: d('2026-11-14 08:00').toISOString(), at: d('2026-11-14 08:05').toISOString() }),
      log({ scheduledAt: d('2026-11-14 20:00').toISOString(), at: d('2026-11-14 22:30').toISOString() }),
      log({ scheduledAt: d('2026-11-15 08:00').toISOString(), at: d('2026-11-15 08:00').toISOString(), status: 'skipped' }),
      // 15/11 20:00 sin registro
    ]
    const now = d('2026-11-16 07:00')
    const [row] = adherence([t], logs, d('2026-11-14 00:00'), d('2026-11-16 23:59'), now)
    expect(row).toMatchObject({ planned: 4, given: 1, late: 1, skipped: 1, unrecorded: 1, pending: 2 })
    expect(row.pct).toBe(50)
  })

  it('una toma sin hueco cuenta como adicional', () => {
    const t = base({ mode: 'asNeeded', times: [] })
    const logs = [log({ at: d('2026-11-15 12:00').toISOString() })]
    const [row] = adherence([t], logs, d('2026-11-14 00:00'), d('2026-11-16 23:59'), d('2026-11-16 07:00'))
    expect(row.planned).toBe(0)
    expect(row.extra).toBe(1)
    expect(row.pct).toBeNull()
  })
})

describe('textos', () => {
  it('describe la pauta', () => {
    expect(scheduleText(base())).toBe('Cada día · 08:00, 20:00')
    expect(scheduleText(base({ everyDays: 2, times: ['09:00'] }))).toBe('Día sí, día no · 09:00')
    expect(scheduleText(base({ mode: 'asNeeded' }))).toBe('Si hace falta')
  })
})
