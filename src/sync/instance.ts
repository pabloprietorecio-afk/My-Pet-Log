/** Motor de sincronización de la app (se crea al primer uso; Firebase se carga aparte, solo si hace falta). */
import { repo } from '../data/instance'
import { SyncError } from './backend'
import { FIREBASE_CONFIG } from './config'
import type { SyncEngine } from './engine'
import { tl } from '../i18n'

let engine: Promise<SyncEngine> | null = null

// Solo en desarrollo: servidor simulado en memoria para revisar las pantallas sin Firebase.
const devFake = import.meta.env.DEV && typeof localStorage !== 'undefined' && localStorage.getItem('petlog-dev-sync') !== null

export function syncConfigured(): boolean {
  return FIREBASE_CONFIG !== null || devFake
}

export function getSync(): Promise<SyncEngine> {
  if (devFake && !engine) {
    engine = (async () => {
      const [{ SyncEngine }, { MemoryBackend, MemoryServer }] = await Promise.all([import('./engine'), import('./memoryBackend')])
      const w = window as unknown as { __petlogServer?: InstanceType<typeof MemoryServer> }
      w.__petlogServer ??= new MemoryServer()
      return new SyncEngine(repo, new MemoryBackend(w.__petlogServer))
    })()
  }
  if (engine) return engine
  if (!FIREBASE_CONFIG) return Promise.reject(new SyncError(tl('La sincronización aún no está configurada.'), 'not-configured'))
  if (!engine) {
    const cfg = FIREBASE_CONFIG
    engine = (async () => {
      const [{ SyncEngine }, { FirebaseBackend }] = await Promise.all([import('./engine'), import('./firebaseBackend')])
      return new SyncEngine(repo, new FirebaseBackend(cfg))
    })()
  }
  return engine
}

/** Arranca la sincronización automática si hay alguna mascota compartida. */
export async function startSyncIfShared(): Promise<void> {
  if (!syncConfigured()) return
  const row = await repo.db.meta.get('sync:links')
  if (!(row?.value as unknown[] | undefined)?.length) return
  const e = await getSync()
  e.start()
}
