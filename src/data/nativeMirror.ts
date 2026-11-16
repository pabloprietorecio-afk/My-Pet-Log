/**
 * Espejo de seguridad en archivo.
 *
 * Capacitor advierte de que el sistema puede reclamar el almacenamiento web
 * (IndexedDB) del WebView, sobre todo en iOS. Para datos de salud eso no es
 * aceptable como única copia. En nativo, tras cada cambio se escribe (con
 * debounce) una copia completa en el directorio privado de la app y, si al
 * arrancar la base está vacía y existe esa copia, se restaura.
 */
import { createBackup, parseBackup, serializeBackup } from './backup'
import type { LocalRepository } from './repository'

export interface FileStore {
  read(): Promise<string | null>
  write(content: string): Promise<void>
}

export class NativeMirror {
  private timer: ReturnType<typeof setTimeout> | null = null
  private writing: Promise<void> = Promise.resolve()
  private unsub: (() => void) | null = null
  lastError: unknown = null

  constructor(
    private repo: LocalRepository,
    private store: FileStore,
    private debounceMs = 1500,
  ) {}

  /** Restaura desde el espejo si la base local está vacía. Devuelve true si restauró algo. */
  async restoreIfEmpty(): Promise<boolean> {
    if ((await this.repo.countPetsRaw()) > 0) return false
    const text = await this.store.read()
    if (!text) return false
    const file = parseBackup(text)
    const res = await this.repo.importMerge(file.data)
    return res.added > 0
  }

  start(): void {
    this.unsub?.()
    this.unsub = this.repo.subscribe(() => this.schedule())
  }

  stop(): void {
    this.unsub?.()
    this.unsub = null
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, this.debounceMs)
  }

  /** Escribe ya (en serie, para no pisar escrituras). */
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.writing = this.writing.then(async () => {
      try {
        const backup = await createBackup(this.repo)
        await this.store.write(serializeBackup(backup))
        this.lastError = null
      } catch (e) {
        this.lastError = e
      }
    })
    return this.writing
  }
}
