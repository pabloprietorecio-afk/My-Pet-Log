/** Lo que necesita la sincronización del servidor. Hay una implementación con Firebase y otra en memoria (pruebas). */
export interface RemoteRecord {
  rid: string
  /** Marca de tiempo del servidor (ms) en la que se escribió. */
  u: number
  iv: string
  ct: string
}

export interface SyncBackend {
  /** Identificador anónimo de este dispositivo en el servidor. */
  uid(): Promise<string>
  createHousehold(hid: string, invite: string): Promise<void>
  join(hid: string, invite: string): Promise<void>
  /** Sale del grupo (borra la pertenencia de este dispositivo). */
  leave(hid: string): Promise<void>
  /** Sustituye la invitación: la antigua deja de servir para unirse. */
  replaceInvite(hid: string, oldInvite: string, newInvite: string): Promise<void>
  members(hid: string): Promise<number>
  push(hid: string, records: Omit<RemoteRecord, 'u'>[]): Promise<void>
  /** Registros escritos después de `sinceMs` (exclusivo), ordenados por `u`. */
  pullSince(hid: string, sinceMs: number): Promise<RemoteRecord[]>
}

export class SyncError extends Error {
  constructor(
    message: string,
    readonly code: 'not-member' | 'bad-invite' | 'network' | 'not-configured' | 'other' = 'other',
  ) {
    super(message)
  }
}
