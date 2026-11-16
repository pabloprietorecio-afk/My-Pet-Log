import { useEffect, useState } from 'react'
import { repo } from './instance'

/** Consulta reactiva: se vuelve a ejecutar tras cualquier escritura del repositorio. */
function useLiveQuery<T>(query: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T>()
  const [tick, setTick] = useState(0)
  useEffect(() => repo.subscribe(() => setTick((t) => t + 1)), [])
  useEffect(() => {
    let alive = true
    query().then(
      (r) => alive && setValue(r),
      (e) => console.error('Consulta fallida', e),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return value
}

export const usePets = () => useLiveQuery(() => repo.listPets(), [])
export const usePet = (id: string | undefined) => useLiveQuery(async () => (id ? (await repo.getPet(id)) ?? null : null), [id])
export const useEventTypes = (petId: string | undefined) =>
  useLiveQuery(() => (petId ? repo.listEventTypes(petId) : Promise.resolve([])), [petId])
export const useEvents = (petId: string | undefined, from?: Date, to?: Date) =>
  useLiveQuery(() => (petId ? repo.listEvents(petId, from, to) : Promise.resolve([])), [petId, from?.getTime(), to?.getTime()])
export const useTreatments = (petId: string | undefined) =>
  useLiveQuery(() => (petId ? repo.listTreatments(petId) : Promise.resolve([])), [petId])
export const useDoseLogs = (petId: string | undefined, from?: Date, to?: Date) =>
  useLiveQuery(() => (petId ? repo.listDoseLogs(petId, from, to) : Promise.resolve([])), [petId, from?.getTime(), to?.getTime()])
export const useSettings = () => useLiveQuery(() => repo.getSettings(), [])

/** Hora actual, refrescada cada `ms` (para estados de tomas). */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ms])
  return now
}
