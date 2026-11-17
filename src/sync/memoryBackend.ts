/** Servidor de sincronización en memoria con las mismas comprobaciones que las reglas de Firestore (para pruebas). */
import { SyncError, type RemoteRecord, type SyncBackend } from './backend'

interface Household {
  owner: string
  members: Map<string, string>
  invites: Set<string>
  records: Map<string, RemoteRecord>
}

export class MemoryServer {
  households = new Map<string, Household>()
  private clock = 1_700_000_000_000
  /** Marca de tiempo del servidor: estrictamente creciente salvo dentro de un mismo lote. */
  now(): number {
    return ++this.clock
  }
  /** Lo que vería alguien con acceso al servidor (para comprobar que todo va cifrado). */
  dump(): string {
    return JSON.stringify([...this.households.entries()].map(([k, h]) => [k, [...h.records.values()]]))
  }
}

let uidSeq = 0

export class MemoryBackend implements SyncBackend {
  readonly id = `uid-${++uidSeq}`
  offline = false
  constructor(private server: MemoryServer) {}

  private check() {
    if (this.offline) throw new SyncError('Sin conexión', 'network')
  }

  private member(hid: string): Household {
    const h = this.server.households.get(hid)
    if (!h || !h.members.has(this.id)) throw new SyncError('No perteneces a este grupo', 'not-member')
    return h
  }

  async uid() {
    return this.id
  }

  async createHousehold(hid: string, invite: string) {
    this.check()
    if (this.server.households.has(hid)) throw new SyncError('Ya existe', 'other')
    this.server.households.set(hid, { owner: this.id, members: new Map([[this.id, invite]]), invites: new Set([invite]), records: new Map() })
  }

  async join(hid: string, invite: string) {
    this.check()
    const h = this.server.households.get(hid)
    if (!h || !h.invites.has(invite)) throw new SyncError('La invitación no es válida o ha caducado.', 'bad-invite')
    h.members.set(this.id, invite)
  }

  async leave(hid: string) {
    this.check()
    this.member(hid).members.delete(this.id)
  }

  async replaceInvite(hid: string, oldInvite: string, newInvite: string) {
    this.check()
    const h = this.member(hid)
    h.invites.delete(oldInvite)
    h.invites.add(newInvite)
  }

  async members(hid: string) {
    this.check()
    return this.member(hid).members.size
  }

  async push(hid: string, records: Omit<RemoteRecord, 'u'>[]) {
    this.check()
    const h = this.member(hid)
    const u = this.server.now()
    for (const r of records) h.records.set(r.rid, { ...r, u })
  }

  async pullSince(hid: string, sinceMs: number) {
    this.check()
    return [...this.member(hid).records.values()].filter((r) => r.u > sinceMs).sort((a, b) => a.u - b.u)
  }
}
