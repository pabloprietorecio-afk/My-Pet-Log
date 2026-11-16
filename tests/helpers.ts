import 'fake-indexeddb/auto'
import { LocalRepository, PetLogDB } from '../src/data/repository'

let n = 0
export function freshRepo(): LocalRepository {
  return new LocalRepository(new PetLogDB(`petlog-test-${Date.now()}-${n++}`))
}

/** Fecha local legible: d('2026-11-16 08:30'). */
export function d(s: string): Date {
  const [date, time = '00:00'] = s.split(' ')
  const [y, m, day] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, m - 1, day, h, mi)
}
