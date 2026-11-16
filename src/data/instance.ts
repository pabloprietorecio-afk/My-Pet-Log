import { isNative } from '../platform/files'
import { capacitorMirrorStore } from '../platform/mirrorStore'
import { NativeMirror } from './nativeMirror'
import { LocalRepository, PetLogDB } from './repository'

export let repo = new LocalRepository(new PetLogDB())

/** true si el navegador no deja usar IndexedDB (p. ej. visor con sandbox): los datos viven solo en memoria. */
export let memoryMode = false

async function ensureDatabase(): Promise<void> {
  try {
    await repo.db.open()
  } catch {
    const fake = await import('fake-indexeddb')
    // Dexie también lee window.indexedDB: si el visor lo bloquea, lo sustituimos por el simulado.
    for (const [k, v] of [['indexedDB', fake.indexedDB], ['IDBKeyRange', fake.IDBKeyRange]] as const) {
      try {
        Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true })
      } catch {
        /* si no se puede redefinir, se intenta igualmente con las opciones */
      }
    }
    repo = new LocalRepository(new PetLogDB('petlog-memoria', { indexedDB: fake.indexedDB, IDBKeyRange: fake.IDBKeyRange }))
    memoryMode = true
  }
}

let mirror: NativeMirror | null = null

export interface StorageInit {
  restoredFromMirror: boolean
  mirrorError?: string
}

/** Arranque del almacenamiento: espejo en archivo (solo nativo) y almacenamiento persistente. */
export async function initStorage(): Promise<StorageInit> {
  const out: StorageInit = { restoredFromMirror: false }
  await ensureDatabase()
  await repo.ensureSettings()
  await repo.migrateLegacyEmoji().catch(() => 0)
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* es solo una petición de mejor esfuerzo */
  }
  if (isNative()) {
    mirror = new NativeMirror(repo, capacitorMirrorStore)
    try {
      out.restoredFromMirror = await mirror.restoreIfEmpty()
    } catch (e) {
      out.mirrorError = e instanceof Error ? e.message : String(e)
    }
    mirror.start()
  }
  return out
}

export function mirrorStatus(): { active: boolean; lastError: unknown } {
  return { active: mirror !== null, lastError: mirror?.lastError ?? null }
}
