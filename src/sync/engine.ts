/**
 * Sincronización de mascotas compartidas entre varios dueños.
 *
 * - Cada mascota compartida es un «grupo» en el servidor con su clave propia (ver crypto.ts).
 * - Se suben, cifrados, los registros de esa mascota (ficha, botones, registros, tratamientos y tomas,
 *   incluidas las fotos de los registros porque salen en el informe). Los informes no se suben: se generan.
 * - Al bajar, por cada registro gana el `updatedAt` más reciente (igual que al restaurar una copia).
 * - Los borrados son lógicos (`deletedAt`), así que también se propagan.
 */
import type { DoseLog, Entity, EventType, LogEvent, Pet, Treatment } from '../domain/types'
import type { BackupData, LocalRepository } from '../data/repository'
import { SyncError, type RemoteRecord, type SyncBackend } from './backend'
import { importKeys, newRawKey, open, randomToken, recordId, seal, type SyncKeys } from './crypto'

export type TableName = 'pets' | 'eventTypes' | 'events' | 'treatments' | 'doseLogs'
const TABLES: TableName[] = ['pets', 'eventTypes', 'events', 'treatments', 'doseLogs']

export interface ShareLink {
  petId: string
  hid: string
  key: string
  invite: string
  /** Última marca de tiempo del servidor ya bajada (ms). */
  lastPull: number
  lastSync?: string
  owner: boolean
}

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'error'
  lastSync?: string
  error?: string
}

interface Payload {
  t: TableName
  r: Entity & { petId?: string }
}

const LINKS = 'sync:links'
const seenKey = (hid: string) => `sync:seen:${hid}`
/** Margen al volver a bajar, por si dos escrituras comparten marca de tiempo. */
const OVERLAP_MS = 2000
/** Límite de tamaño por envío (las fotos van dentro de los registros). */
const BATCH_BYTES = 3_000_000
const BATCH_COUNT = 300

export const CODE_PREFIX = 'PL1'

export function makeCode(l: Pick<ShareLink, 'hid' | 'invite' | 'key'>): string {
  return `${CODE_PREFIX}.${l.hid}.${l.invite}.${l.key}`
}

export function joinUrl(code: string): string {
  return `petlog://unirse/${code}`
}

/** Acepta el código suelto, el enlace petlog:// o un texto que lo contenga (p. ej. un mensaje de WhatsApp). */
export function parseCode(text: string): { hid: string; invite: string; key: string } {
  const m = text.match(/PL1\.([A-Za-z0-9_-]{16,64})\.([A-Za-z0-9_-]{16,64})\.([A-Za-z0-9_-]{40,64})/)
  if (!m) throw new SyncError('El código de invitación no es válido. Cópialo entero, empieza por «PL1.».', 'bad-invite')
  return { hid: m[1], invite: m[2], key: m[3] }
}

export class SyncEngine {
  private keys = new Map<string, Promise<SyncKeys>>()
  private running: Promise<void> | null = null
  private again = false
  private applying = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<(s: SyncStatus) => void>()
  status: SyncStatus = { state: 'idle' }

  constructor(
    private repo: LocalRepository,
    private backend: SyncBackend,
  ) {}

  // ── Estado ────────────────────────────────────────────────────────────────

  onStatus(cb: (s: SyncStatus) => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private setStatus(s: SyncStatus) {
    this.status = s
    for (const l of this.listeners) l(s)
  }

  async links(): Promise<ShareLink[]> {
    const row = await this.repo.db.meta.get(LINKS)
    return (row?.value as ShareLink[] | undefined) ?? []
  }

  private async saveLinks(links: ShareLink[]) {
    await this.repo.db.meta.put({ key: LINKS, value: links })
    // Notifica a la interfaz (lista de mascotas compartidas) sin provocar otra sincronización.
    this.applying = true
    try {
      this.repo.touch()
    } finally {
      this.applying = false
    }
  }

  async linkFor(petId: string): Promise<ShareLink | undefined> {
    return (await this.links()).find((l) => l.petId === petId)
  }

  private keysFor(l: ShareLink): Promise<SyncKeys> {
    let k = this.keys.get(l.hid)
    if (!k) {
      k = importKeys(l.key)
      this.keys.set(l.hid, k)
    }
    return k
  }

  // ── Compartir / unirse / dejar de compartir ───────────────────────────────

  async share(petId: string): Promise<ShareLink> {
    const existing = await this.linkFor(petId)
    if (existing) return existing
    const pet = await this.repo.getPet(petId)
    if (!pet) throw new SyncError('No se encuentra la mascota.')
    const link: ShareLink = { petId, hid: randomToken(16), key: newRawKey(), invite: randomToken(16), lastPull: 0, owner: true }
    await this.backend.createHousehold(link.hid, link.invite)
    await this.saveLinks([...(await this.links()), link])
    await this.syncLink(link)
    return (await this.linkFor(petId))!
  }

  /** Se une con un código de invitación y baja los datos. Devuelve el id de la mascota. */
  async join(codeText: string): Promise<string> {
    const { hid, invite, key } = parseCode(codeText)
    const already = (await this.links()).find((l) => l.hid === hid)
    if (already) {
      await this.syncLink(already)
      return already.petId
    }
    const keys = await importKeys(key)
    await this.backend.join(hid, invite)
    const recs = await this.backend.pullSince(hid, 0)
    let petId: string | undefined
    for (const rec of recs) {
      try {
        const p = await open<Payload>(keys, rec)
        if (p.t === 'pets') petId = p.r.id
      } catch {
        throw new SyncError('La clave del código no coincide con los datos. Pide que te vuelvan a enviar la invitación.', 'bad-invite')
      }
      if (petId) break
    }
    if (!petId) {
      await this.backend.leave(hid).catch(() => undefined)
      throw new SyncError('Esa mascota todavía no tiene datos compartidos. Pide a quien te invitó que abra PetLog con conexión e inténtalo de nuevo.')
    }
    const other = await this.linkFor(petId)
    if (other) throw new SyncError('Esta mascota ya está compartida en este móvil con otro código.')
    const link: ShareLink = { petId, hid, key, invite, lastPull: 0, owner: false }
    this.keys.set(hid, Promise.resolve(keys))
    await this.saveLinks([...(await this.links()), link])
    await this.syncLink(link)
    return petId
  }

  /** Deja de compartir en este móvil: los datos locales se quedan; los demás dueños siguen con los suyos. */
  async unshare(petId: string): Promise<void> {
    const link = await this.linkFor(petId)
    if (!link) return
    await this.backend.leave(link.hid).catch((e) => {
      if (!(e instanceof SyncError && e.code === 'not-member')) throw e
    })
    await this.saveLinks((await this.links()).filter((l) => l.petId !== petId))
    await this.repo.db.meta.delete(seenKey(link.hid))
    this.keys.delete(link.hid)
  }

  /** Nueva invitación: la anterior deja de servir para unirse (quien ya está dentro sigue dentro). */
  async renewInvite(petId: string): Promise<ShareLink> {
    const link = await this.linkFor(petId)
    if (!link) throw new SyncError('Esta mascota no está compartida.')
    const invite = randomToken(16)
    await this.backend.replaceInvite(link.hid, link.invite, invite)
    const links = (await this.links()).map((l) => (l.petId === petId ? { ...l, invite } : l))
    await this.saveLinks(links)
    return links.find((l) => l.petId === petId)!
  }

  async memberCount(petId: string): Promise<number> {
    const link = await this.linkFor(petId)
    return link ? this.backend.members(link.hid) : 1
  }

  // ── Sincronizar ───────────────────────────────────────────────────────────

  /** Sube y baja los cambios de todas las mascotas compartidas. Si ya hay una en marcha, encadena otra. */
  sync(): Promise<void> {
    if (this.running) {
      this.again = true
      return this.running
    }
    this.running = (async () => {
      do {
        this.again = false
        const links = await this.links()
        if (!links.length) break
        this.setStatus({ ...this.status, state: 'syncing' })
        try {
          for (const l of links) await this.syncLink(l)
          this.setStatus({ state: 'idle', lastSync: new Date().toISOString() })
        } catch (e) {
          this.setStatus({ ...this.status, state: 'error', error: describe(e) })
          break
        }
      } while (this.again)
    })().finally(() => {
      this.running = null
    })
    return this.running
  }

  /** Programa una sincronización (se agrupan los cambios seguidos). */
  schedule(delayMs = 2000) {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      void this.sync()
    }, delayMs)
  }

  /** Sincroniza tras cada cambio local y cada cierto tiempo mientras la app está abierta. */
  start(intervalMs = 60_000): () => void {
    const unsub = this.repo.subscribe(() => {
      if (!this.applying) this.schedule()
    })
    const iv = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void this.sync()
    }, intervalMs)
    void this.sync()
    return () => {
      unsub()
      clearInterval(iv)
      if (this.timer) clearTimeout(this.timer)
    }
  }

  private async syncLink(link: ShareLink): Promise<void> {
    const keys = await this.keysFor(link)
    const seen = ((await this.repo.db.meta.get(seenKey(link.hid)))?.value as Record<string, string> | undefined) ?? {}

    // 1) Bajar primero: así un cambio remoto más reciente no se pisa con uno local antiguo.
    const recs = await this.backend.pullSince(link.hid, Math.max(0, link.lastPull - OVERLAP_MS))
    let lastPull = link.lastPull
    const incoming: Record<TableName, Entity[]> = { pets: [], eventTypes: [], events: [], treatments: [], doseLogs: [] }
    for (const rec of recs) {
      lastPull = Math.max(lastPull, rec.u)
      let p: Payload
      try {
        p = await open<Payload>(keys, rec)
      } catch {
        continue // no se puede descifrar: se ignora
      }
      if (!TABLES.includes(p.t) || !p.r || typeof p.r.id !== 'string' || typeof p.r.updatedAt !== 'string') continue
      const belongs = p.t === 'pets' ? p.r.id === link.petId : p.r.petId === link.petId
      if (!belongs) continue
      if (seen[rec.rid] && seen[rec.rid] >= p.r.updatedAt) continue
      incoming[p.t].push(p.r)
      seen[rec.rid] = p.r.updatedAt
    }
    if (TABLES.some((t) => incoming[t].length)) {
      this.applying = true
      try {
        await this.repo.importMerge(incoming as unknown as BackupData)
      } finally {
        this.applying = false
      }
    }

    // 2) Subir lo local que el servidor aún no tiene en esa versión.
    const local = await this.petRows(link.petId)
    const out: Omit<RemoteRecord, 'u'>[] = []
    const marks: [string, string][] = []
    for (const t of TABLES) {
      for (const r of local[t]) {
        const rid = await recordId(keys, t, r.id)
        if (seen[rid] && seen[rid] >= r.updatedAt) continue
        out.push({ rid, ...(await seal(keys, { t, r } satisfies Payload)) })
        marks.push([rid, r.updatedAt])
      }
    }
    let batch: Omit<RemoteRecord, 'u'>[] = []
    let bytes = 0
    let done = 0
    const flush = async () => {
      if (!batch.length) return
      await this.backend.push(link.hid, batch)
      for (const [rid, v] of marks.slice(done, done + batch.length)) seen[rid] = v
      done += batch.length
      batch = []
      bytes = 0
    }
    for (const rec of out) {
      if (batch.length >= BATCH_COUNT || bytes + rec.ct.length > BATCH_BYTES) await flush()
      batch.push(rec)
      bytes += rec.ct.length
    }
    await flush()

    await this.repo.db.meta.put({ key: seenKey(link.hid), value: seen })
    const links = (await this.links()).map((l) =>
      l.hid === link.hid ? { ...l, lastPull, lastSync: new Date().toISOString() } : l,
    )
    await this.saveLinks(links)
    link.lastPull = lastPull
  }

  private async petRows(petId: string): Promise<Record<TableName, Entity[]>> {
    const db = this.repo.db
    const [pet, eventTypes, events, treatments, doseLogs] = await Promise.all([
      db.pets.get(petId),
      db.eventTypes.where('petId').equals(petId).toArray(),
      db.events.where('petId').equals(petId).toArray(),
      db.treatments.where('petId').equals(petId).toArray(),
      db.doseLogs.where('petId').equals(petId).toArray(),
    ])
    return {
      pets: pet ? [pet as Pet] : [],
      eventTypes: eventTypes as EventType[],
      events: events as LogEvent[],
      treatments: treatments as Treatment[],
      doseLogs: doseLogs as DoseLog[],
    }
  }
}

export function describe(e: unknown): string {
  if (e instanceof SyncError) return e.message
  if (e instanceof Error && /network|fetch|offline|unavailable/i.test(e.message)) return 'Sin conexión. Se sincronizará cuando vuelva.'
  return e instanceof Error ? e.message : String(e)
}
