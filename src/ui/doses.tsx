import { repo } from '../data/instance'
import {
  doseState,
  doseStateLabel,
  doseText,
  indexLogs,
  slotKey,
  slotsInRange,
  type DoseState,
  type Slot,
} from '../domain/schedule'
import type { DoseLog, Treatment } from '../domain/types'
import { addDays, endOfLocalDay, formatTime, startOfLocalDay } from '../domain/time'
import { useToast } from './components'
import { IconCheck } from './icons'
import { tl } from '../i18n'

export interface SlotItem {
  treatment: Treatment
  slot: Slot
  log?: DoseLog
  state: DoseState
}

/** Huecos de hoy de los tratamientos programados, con su registro y estado. */
export function todaySlots(treatments: Treatment[], logs: DoseLog[], now: Date): SlotItem[] {
  const index = indexLogs(logs)
  const from = startOfLocalDay(now)
  const to = endOfLocalDay(now)
  const out: SlotItem[] = []
  for (const t of treatments) {
    for (const slot of slotsInRange(t, from, to)) {
      const log = index.get(slotKey(t.id, slot.scheduledAt))
      out.push({ treatment: t, slot, log, state: doseState(slot, log, t.graceMinutes, now) })
    }
  }
  return out.sort((a, b) => a.slot.at.getTime() - b.slot.at.getTime())
}

/** Hueco aún sin registrar más cercano a ahora (para el botón "Medicación"). */
export function nearestOpenSlot(t: Treatment, logs: DoseLog[], now: Date): Slot | null {
  const index = indexLogs(logs)
  const slots = slotsInRange(t, addDays(startOfLocalDay(now), -1), endOfLocalDay(now))
    .filter((s) => !index.has(slotKey(t.id, s.scheduledAt)))
    .sort((a, b) => Math.abs(a.at.getTime() - now.getTime()) - Math.abs(b.at.getTime() - now.getTime()))
  const best = slots[0]
  if (!best) return null
  const limit = Math.max(t.graceMinutes * 2, 180) * 60_000
  return Math.abs(best.at.getTime() - now.getTime()) <= limit ? best : null
}

const badgeClass: Record<DoseState, string> = {
  given: 'ok',
  late: 'warn',
  skipped: '',
  upcoming: '',
  due: 'due',
  overdue: 'bad',
}

export function useDoseActions(petId: string) {
  const toast = useToast()
  const undo = (id: string) => async () => {
    await repo.deleteDoseLog(id)
    toast.hide()
  }
  return {
    async give(t: Treatment, slot: Slot | null) {
      const log = await repo.logDose({
        petId,
        treatmentId: t.id,
        scheduledAt: slot?.scheduledAt,
        status: 'given',
      })
      toast.show(
        <>
          <div className="toast-head">
            <span className="tick" aria-hidden="true">
              <IconCheck />
            </span>
            <span className="msg">
              💊 {t.name} {doseText(t)} {tl('dada')}
            </span>
            <span className="when">{formatTime(log.at)}</span>
          </div>
          <div className="toast-actions" style={{ justifyContent: 'flex-end' }}>
            <button className="tbtn" onClick={undo(log.id)}>
              {tl('Deshacer')}
            </button>
          </div>
        </>,
        6000,
      )
    },
    async skip(t: Treatment, slot: Slot) {
      await repo.logDose({ petId, treatmentId: t.id, scheduledAt: slot.scheduledAt, at: slot.scheduledAt, status: 'skipped' })
    },
    async remove(log: DoseLog) {
      await repo.deleteDoseLog(log.id)
    },
  }
}

export function DoseList({ petId, items, now }: { petId: string; items: SlotItem[]; now: Date }) {
  const act = useDoseActions(petId)
  return (
    <div className="list">
      {items.map((it) => {
        const done = it.state === 'given' || it.state === 'late' || it.state === 'skipped'
        const label = doseStateLabel(it.state, it.slot.scheduledAt, now)
        return (
          <div className="list-item" key={it.slot.scheduledAt + it.treatment.id}>
          <div className={`dose${done ? ' done' : ''}`}>
            <span className="time">{formatTime(it.slot.at)}</span>
            <div>
              <div className="name">
                {it.treatment.name} <span className="muted">{doseText(it.treatment)}</span>
              </div>
              <span className={`badge ${badgeClass[it.state]}`}>
                {label}
                {it.log && it.state !== 'skipped' ? ` · ${formatTime(it.log.at)}` : ''}
              </span>
            </div>
            <div className="actions">
              {done ? (
                <button className="link-btn" onClick={() => act.remove(it.log!)} aria-label={tl('Deshacer {0} de las {1}', it.treatment.name, formatTime(it.slot.at))}>
                  {tl('Deshacer')}
                </button>
              ) : (
                <>
                  {(it.state === 'due' || it.state === 'overdue') && (
                    <button className="btn sm" onClick={() => act.skip(it.treatment, it.slot)} aria-label={tl('Omitir {0} de las {1}', it.treatment.name, formatTime(it.slot.at))}>
                      {tl('Omitir')}
                    </button>
                  )}
                  <button className="btn primary sm" onClick={() => act.give(it.treatment, it.slot)} aria-label={tl('Dar {0} de las {1} ahora', it.treatment.name, formatTime(it.slot.at))}>
                    {tl('Dada')}
                  </button>
                </>
              )}
            </div>
          </div>
          </div>
        )
      })}
    </div>
  )
}
