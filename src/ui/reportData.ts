import { useMemo } from 'react'
import { useDoseLogs, useEventTypes, useEvents, useTreatments } from '../data/hooks'
import { buildReport, type Period, type ReportModel } from '../domain/report'
import type { Pet } from '../domain/types'

/** Modelo de informe del periodo, siempre desde los datos vivos. */
export function useReportModel(pet: Pet, period: Period, now: Date): ReportModel | undefined {
  // El peso se grafica sobre una ventana de ~6 meses aunque el periodo sea corto.
  const eventsFrom = new Date(Math.min(period.from.getTime(), period.to.getTime() - 200 * 86_400_000))
  const types = useEventTypes(pet.id)
  const events = useEvents(pet.id, eventsFrom, period.to)
  const treatments = useTreatments(pet.id)
  const logs = useDoseLogs(pet.id, period.from, period.to)
  return useMemo(() => {
    if (!types || !events || !treatments || !logs) return undefined
    return buildReport({ pet, types, events, treatments, doseLogs: logs, period, now })
  }, [pet, types, events, treatments, logs, period, now])
}
