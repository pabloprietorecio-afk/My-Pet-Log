/** Filas de la cronología (registros y tomas), compartidas por Hoy e Historial. */
import { useMemo } from 'react'
import { repo } from '../data/instance'
import { useDoseLogs, useEventTypes, useEvents, useTreatments } from '../data/hooks'
import { describeEvent } from '../domain/eventTypes'
import { doseText } from '../domain/schedule'
import type { DoseLog, EventType, LogEvent, Treatment } from '../domain/types'
import { formatDateTime, formatNumber, formatTime } from '../domain/time'
import { Sheet, confirmDialog } from './components'
import { TypeIcon } from './art/TypeIcon'
import { EventSheet } from './EventSheet'
import { IconTrash } from './icons'

export type Entry =
  | { kind: 'event'; at: string; id: string; type: EventType; ev: LogEvent }
  | { kind: 'dose'; at: string; id: string; log: DoseLog }

export function useEntries(petId: string, from?: Date, to?: Date) {
  const types = useEventTypes(petId)
  const events = useEvents(petId, from, to)
  const logs = useDoseLogs(petId, from, to)
  const treatments = useTreatments(petId)
  const trById = useMemo(() => new Map((treatments ?? []).map((t) => [t.id, t])), [treatments])
  const entries = useMemo(() => {
    const tById = new Map((types ?? []).map((t) => [t.id, t]))
    const out: Entry[] = []
    for (const ev of events ?? []) {
      const type = tById.get(ev.typeId)
      if (type) out.push({ kind: 'event', at: ev.at, id: ev.id, type, ev })
    }
    for (const log of logs ?? []) out.push({ kind: 'dose', at: log.at, id: log.id, log })
    return out.sort((a, b) => b.at.localeCompare(a.at))
  }, [types, events, logs])
  const ready = types !== undefined && events !== undefined && logs !== undefined
  return { entries, trById, types: types ?? [], ready }
}

export function doseName(log: DoseLog, trById: Map<string, Treatment>) {
  const t = log.treatmentId ? trById.get(log.treatmentId) : undefined
  const name = t?.name ?? log.adHoc?.name ?? 'Medicamento'
  const dose = t ? doseText(t) : log.adHoc?.dose !== undefined ? `${formatNumber(log.adHoc.dose)} ${log.adHoc.unit ?? ''}`.trim() : ''
  return { name, dose }
}

/** Contenido de una fila de cronología: hora · icono · tipo y detalle. */
export function EntryRow({ e, trById }: { e: Entry; trById: Map<string, Treatment> }) {
  if (e.kind === 'event') {
    const det = describeEvent(e.type, e.ev)
    return (
      <>
        <span className="t">{formatTime(e.at)}</span>
        <span className="e" aria-hidden="true">
          <TypeIcon k={e.type.key} emoji={e.type.emoji} />
        </span>
        <span className="txt">
          <span className="lab">{e.type.label}</span>
          {det && <span className="det">{det}</span>}
        </span>
        {e.ev.photo ? <span aria-label="con foto">📷</span> : <span />}
      </>
    )
  }
  const { name, dose } = doseName(e.log, trById)
  const skipped = e.log.status === 'skipped'
  return (
    <>
      <span className="t">{formatTime(e.at)}</span>
      <span className="e" aria-hidden="true">
        <TypeIcon k="medication" />
      </span>
      <span className="txt">
        <span className="lab">
          {name} {dose && <span className="muted" style={{ fontWeight: 600 }}>{dose}</span>}
        </span>
        <span className="det">Medicación</span>
      </span>
      <span className={`badge ${skipped ? '' : 'ok'}`}>{skipped ? 'Omitida' : 'Dada'}</span>
    </>
  )
}

export function entryLabel(e: Entry, trById: Map<string, Treatment>) {
  if (e.kind === 'event') return `${formatTime(e.at)}, ${e.type.label}. ${describeEvent(e.type, e.ev)}. Editar`
  const { name } = doseName(e.log, trById)
  return `${formatTime(e.at)}, ${name}, ${e.log.status === 'skipped' ? 'omitida' : 'dada'}. Ver toma`
}

/** Hoja de edición para una entrada (registro o toma). */
export function EntryEditor({ petId, entry, trById, onClose }: { petId: string; entry: Entry; trById: Map<string, Treatment>; onClose: () => void }) {
  if (entry.kind === 'event') return <EventSheet petId={petId} type={entry.type} event={entry.ev} onClose={onClose} />
  const { name, dose } = doseName(entry.log, trById)
  const skipped = entry.log.status === 'skipped'
  return (
    <Sheet
      title="Toma"
      icon={<TypeIcon k="medication" size={30} />}
      onClose={onClose}
      foot={
        <button
          className="btn danger block"
          onClick={async () => {
            if (await confirmDialog('¿Eliminar este registro de toma?')) {
              await repo.deleteDoseLog(entry.log.id)
              onClose()
            }
          }}
        >
          <IconTrash />
          Eliminar registro
        </button>
      }
    >
      <div className="list">
        <div className="list-item">
          <span className="txt">
            <b>
              {name} {dose}
            </b>
            <small>
              {skipped ? 'Omitida' : 'Administrada'} · {formatDateTime(entry.log.at)}
            </small>
          </span>
          <span className={`badge ${skipped ? '' : 'ok'}`}>{skipped ? 'Omitida' : 'Dada'}</span>
        </div>
      </div>
      <p className="hint">Para corregir una toma, elimínala y vuelve a registrarla desde Medicación.</p>
    </Sheet>
  )
}
