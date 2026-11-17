import Dexie, { type DexieOptions, type Table } from 'dexie'
import { newId } from '../domain/ids'
import { LEGACY_EMOJI, missingBuiltinTypes, seedEventTypes } from '../domain/eventTypes'
import { scheduleChanged } from '../domain/schedule'
import {
  SCHEMA_VERSION,
  type DoseLog,
  type Entity,
  type EventType,
  type ISODateTime,
  type LogEvent,
  type Pet,
  type Settings,
  type Treatment,
} from '../domain/types'
import { addDays, toLocalDate } from '../domain/time'

export class PetLogDB extends Dexie {
  pets!: Table<Pet, string>
  eventTypes!: Table<EventType, string>
  events!: Table<LogEvent, string>
  treatments!: Table<Treatment, string>
  doseLogs!: Table<DoseLog, string>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor(name = 'petlog', options?: DexieOptions) {
    super(name, options)
    this.version(1).stores({
      pets: 'id, updatedAt',
      eventTypes: 'id, petId, updatedAt',
      events: 'id, petId, typeId, [petId+at], updatedAt',
      treatments: 'id, petId, updatedAt',
      doseLogs: 'id, petId, treatmentId, scheduledAt, [petId+at], updatedAt',
      meta: 'key',
    })
  }
}

export interface BackupData {
  pets: Pet[]
  eventTypes: EventType[]
  events: LogEvent[]
  treatments: Treatment[]
  doseLogs: DoseLog[]
}

export interface MergeResult {
  added: number
  updated: number
  skipped: number
}

type NewEntity<T extends Entity> = Omit<T, keyof Entity>

const live = <T extends Entity>(x: T) => !x.deletedAt

export class LocalRepository {
  private listeners = new Set<() => void>()
  constructor(readonly db: PetLogDB) {}

  /** Avisa tras cualquier cambio (lo usa el espejo nativo). */
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  /** Avisa a la interfaz de un cambio hecho fuera del repositorio (p. ej. estado de la sincronización). */
  touch() {
    this.notify()
  }

  private notify() {
    for (const l of this.listeners) {
      try {
        l()
      } catch {
        /* un oyente roto no debe romper el guardado */
      }
    }
  }

  private async mutate<T>(fn: () => Promise<T>): Promise<T> {
    const r = await fn()
    this.notify()
    return r
  }

  private stamp<T extends Entity>(input: NewEntity<T>): T {
    const now = new Date().toISOString()
    return { ...input, id: newId(), createdAt: now, updatedAt: now } as unknown as T
  }

  // ── Ajustes ──────────────────────────────────────────────────────────────

  /** Solo lectura (se usa dentro de consultas reactivas, donde no se puede escribir). */
  async getSettings(): Promise<Settings> {
    const row = await this.db.meta.get('settings')
    if (row) return row.value as Settings
    return { theme: 'system', tapMode: 'instant', deviceId: '', schemaVersion: SCHEMA_VERSION }
  }

  /** Crea los ajustes (y el id de dispositivo) la primera vez. */
  async ensureSettings(): Promise<Settings> {
    const row = await this.db.meta.get('settings')
    if (row) return row.value as Settings
    const s: Settings = { theme: 'system', tapMode: 'instant', deviceId: newId(), schemaVersion: SCHEMA_VERSION }
    await this.db.meta.put({ key: 'settings', value: s })
    return s
  }

  /** Sustituye iconos antiguos de los botones de serie (solo si siguen siendo los originales). */
  async migrateLegacyEmoji(): Promise<number> {
    const now = new Date().toISOString()
    let n = 0
    await this.db.eventTypes.toCollection().modify((t) => {
      const m = LEGACY_EMOJI[t.key]
      if (m && t.emoji === m.from) {
        t.emoji = m.to
        t.updatedAt = now
        n++
      }
    })
    if (n) this.notify()
    return n
  }

  async saveSettings(patch: Partial<Settings>): Promise<Settings> {
    const cur = await this.ensureSettings()
    const next = { ...cur, ...patch, deviceId: cur.deviceId, schemaVersion: SCHEMA_VERSION }
    await this.db.meta.put({ key: 'settings', value: next })
    this.notify()
    return next
  }

  // ── Mascotas ─────────────────────────────────────────────────────────────

  async listPets(): Promise<Pet[]> {
    const all = await this.db.pets.toArray()
    return all.filter(live).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async getPet(id: string): Promise<Pet | undefined> {
    const p = await this.db.pets.get(id)
    return p && live(p) ? p : undefined
  }

  /** Crea la mascota con los botones de su especie y, si se indica, su primer peso (en la unidad de su especie). */
  async createPet(input: NewEntity<Pet>, initialWeight?: number): Promise<Pet> {
    return this.mutate(async () => {
      const pet = this.stamp<Pet>(input)
      const types = seedEventTypes(pet.id, pet.createdAt, pet.species)
      await this.db.transaction('rw', this.db.pets, this.db.eventTypes, this.db.events, async () => {
        await this.db.pets.add(pet)
        await this.db.eventTypes.bulkAdd(types)
        if (initialWeight && initialWeight > 0) {
          const wt = types.find((t) => t.key === 'weight')!
          await this.db.events.add(
            this.stamp<LogEvent>({
              petId: pet.id,
              typeId: wt.id,
              at: pet.createdAt,
              value: initialWeight,
              unit: wt.unit ?? 'kg',
            }),
          )
        }
      })
      return pet
    })
  }

  async updatePet(id: string, patch: Partial<NewEntity<Pet>>): Promise<Pet> {
    return this.mutate(async () => {
      const cur = await this.db.pets.get(id)
      if (!cur) throw new Error('Mascota no encontrada')
      const next = { ...cur, ...patch, updatedAt: new Date().toISOString() }
      await this.db.pets.put(next)
      if (patch.species && patch.species !== cur.species) {
        // Al cambiar de especie se añaden (ocultos) los botones de serie que falten; los del usuario no se tocan.
        const existing = await this.db.eventTypes.where('petId').equals(id).filter((t) => !t.deletedAt).toArray()
        const add = missingBuiltinTypes(id, existing, next.updatedAt, patch.species)
        if (add.length) await this.db.eventTypes.bulkAdd(add)
      }
      return next
    })
  }

  /** Borrado lógico en cascada: mascota y todo lo suyo. */
  async deletePet(id: string): Promise<void> {
    await this.mutate(async () => {
      const now = new Date().toISOString()
      const mark = { deletedAt: now, updatedAt: now }
      await this.db.transaction(
        'rw',
        [this.db.pets, this.db.eventTypes, this.db.events, this.db.treatments, this.db.doseLogs],
        async () => {
          await this.db.pets.update(id, mark)
          await this.db.eventTypes.where('petId').equals(id).modify(mark)
          await this.db.events.where('petId').equals(id).modify(mark)
          await this.db.treatments.where('petId').equals(id).modify(mark)
          await this.db.doseLogs.where('petId').equals(id).modify(mark)
        },
      )
    })
  }

  // ── Botones (tipos de evento) ────────────────────────────────────────────

  async listEventTypes(petId: string, includeHidden = true): Promise<EventType[]> {
    const all = await this.db.eventTypes.where('petId').equals(petId).toArray()
    return all
      .filter(live)
      .filter((t) => includeHidden || !t.hidden)
      .sort((a, b) => a.order - b.order)
  }

  async createCustomType(
    petId: string,
    input: { label: string; emoji: string; input: 'none' | 'level' | 'number'; unit?: string },
  ): Promise<EventType> {
    return this.mutate(async () => {
      const existing = await this.listEventTypes(petId)
      const t = this.stamp<EventType>({
        petId,
        key: 'custom',
        label: input.label.trim(),
        emoji: input.emoji,
        input: input.input,
        unit: input.input === 'number' ? input.unit?.trim() || undefined : undefined,
        order: existing.length,
        hidden: false,
      })
      await this.db.eventTypes.add(t)
      return t
    })
  }

  async updateEventType(id: string, patch: Partial<Pick<EventType, 'label' | 'emoji' | 'hidden' | 'unit'>>) {
    await this.mutate(() => this.db.eventTypes.update(id, { ...patch, updatedAt: new Date().toISOString() }))
  }

  /** Persiste un nuevo orden. `orderedIds` incluye todos los botones de la mascota. */
  async reorderEventTypes(orderedIds: string[]): Promise<void> {
    await this.mutate(async () => {
      const now = new Date().toISOString()
      await this.db.transaction('rw', this.db.eventTypes, async () => {
        for (const [i, id] of orderedIds.entries()) await this.db.eventTypes.update(id, { order: i, updatedAt: now })
      })
    })
  }

  /** Solo se pueden eliminar los botones propios; los de serie se ocultan. */
  async deleteCustomType(id: string): Promise<void> {
    await this.mutate(async () => {
      const t = await this.db.eventTypes.get(id)
      if (!t || t.key !== 'custom') throw new Error('Solo se pueden eliminar botones propios')
      const now = new Date().toISOString()
      await this.db.eventTypes.update(id, { deletedAt: now, updatedAt: now })
    })
  }

  // ── Eventos ──────────────────────────────────────────────────────────────

  async listEvents(petId: string, from?: Date, to?: Date): Promise<LogEvent[]> {
    const lo = from ? from.toISOString() : Dexie.minKey
    const hi = to ? to.toISOString() : Dexie.maxKey
    const rows = await this.db.events
      .where('[petId+at]')
      .between([petId, lo], [petId, hi], true, true)
      .toArray()
    return rows.filter(live)
  }

  async addEvent(input: Omit<NewEntity<LogEvent>, 'at'> & { at?: ISODateTime }): Promise<LogEvent> {
    return this.mutate(async () => {
      const ev = this.stamp<LogEvent>({ ...input, at: input.at ?? new Date().toISOString() })
      await this.db.events.add(ev)
      return ev
    })
  }

  async updateEvent(id: string, patch: Partial<NewEntity<LogEvent>>): Promise<LogEvent> {
    return this.mutate(async () => {
      const cur = await this.db.events.get(id)
      if (!cur) throw new Error('Registro no encontrado')
      const next: LogEvent = { ...cur, ...patch, updatedAt: new Date().toISOString() }
      // Un campo borrado explícitamente (undefined) debe desaparecer.
      for (const k of Object.keys(next) as (keyof LogEvent)[]) if (next[k] === undefined) delete next[k]
      await this.db.events.put(next)
      return next
    })
  }

  async deleteEvent(id: string): Promise<void> {
    await this.mutate(async () => {
      const now = new Date().toISOString()
      await this.db.events.update(id, { deletedAt: now, updatedAt: now })
    })
  }

  async restoreEvent(id: string): Promise<void> {
    await this.mutate(async () => {
      await this.db.events.update(id, { deletedAt: null, updatedAt: new Date().toISOString() })
    })
  }

  // ── Tratamientos ─────────────────────────────────────────────────────────

  async listTreatments(petId: string): Promise<Treatment[]> {
    const all = await this.db.treatments.where('petId').equals(petId).toArray()
    return all.filter(live).sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }

  async createTreatment(input: NewEntity<Treatment>): Promise<Treatment> {
    return this.mutate(async () => {
      const t = this.stamp<Treatment>({ ...input, name: input.name.trim(), times: [...input.times].sort() })
      await this.db.treatments.add(t)
      return t
    })
  }

  /**
   * Edita un tratamiento. Si cambia el calendario (horas, frecuencia, modo) y ya
   * hay tomas registradas, la pauta anterior se cierra ayer y se crea una nueva
   * desde hoy: así el historial de cumplimiento pasado no se falsea.
   */
  async updateTreatment(
    id: string,
    patch: Partial<NewEntity<Treatment>>,
  ): Promise<{ treatment: Treatment; revised: boolean }> {
    return this.mutate(async () => {
      const cur = await this.db.treatments.get(id)
      if (!cur) throw new Error('Tratamiento no encontrado')
      const clean = { ...patch, ...(patch.times ? { times: [...patch.times].sort() } : {}) }
      const today = toLocalDate(new Date())
      const calendarChanged = scheduleChanged(cur, { ...clean, startDate: undefined })
      const hasLogs = (await this.db.doseLogs.where('treatmentId').equals(id).filter(live).count()) > 0
      if (calendarChanged && hasLogs && cur.startDate < today) {
        const yesterday = toLocalDate(addDays(new Date(), -1))
        const now = new Date().toISOString()
        const next = this.stamp<Treatment>({
          ...(cur as NewEntity<Treatment>),
          ...clean,
          startDate: today,
          endDate: clean.endDate ?? cur.endDate,
        })
        await this.db.transaction('rw', this.db.treatments, async () => {
          await this.db.treatments.update(id, { endDate: yesterday, updatedAt: now })
          await this.db.treatments.add(next)
        })
        return { treatment: next, revised: true }
      }
      const next: Treatment = { ...cur, ...clean, updatedAt: new Date().toISOString() }
      for (const k of Object.keys(next) as (keyof Treatment)[]) if (next[k] === undefined) delete next[k]
      await this.db.treatments.put(next)
      return { treatment: next, revised: false }
    })
  }

  async deleteTreatment(id: string): Promise<void> {
    await this.mutate(async () => {
      const now = new Date().toISOString()
      await this.db.treatments.update(id, { deletedAt: now, updatedAt: now })
    })
  }

  // ── Tomas ────────────────────────────────────────────────────────────────

  async listDoseLogs(petId: string, from?: Date, to?: Date): Promise<DoseLog[]> {
    const lo = from ? from.toISOString() : Dexie.minKey
    const hi = to ? to.toISOString() : Dexie.maxKey
    const rows = await this.db.doseLogs.where('[petId+at]').between([petId, lo], [petId, hi], true, true).toArray()
    return rows.filter(live)
  }

  /**
   * Registra una toma. Si ya hay un registro vivo para ese hueco, lo actualiza
   * (evita duplicados por doble toque).
   */
  async logDose(input: Omit<NewEntity<DoseLog>, 'at'> & { at?: ISODateTime }): Promise<DoseLog> {
    return this.mutate(async () => {
      if (input.treatmentId && input.scheduledAt) {
        const dup = (
          await this.db.doseLogs.where('treatmentId').equals(input.treatmentId).filter((l) => live(l) && l.scheduledAt === input.scheduledAt).toArray()
        )[0]
        if (dup) {
          const next: DoseLog = {
            ...dup,
            status: input.status,
            at: input.at ?? new Date().toISOString(),
            note: input.note ?? dup.note,
            updatedAt: new Date().toISOString(),
          }
          await this.db.doseLogs.put(next)
          return next
        }
      }
      const log = this.stamp<DoseLog>({ ...input, at: input.at ?? new Date().toISOString() })
      await this.db.doseLogs.add(log)
      return log
    })
  }

  async deleteDoseLog(id: string): Promise<void> {
    await this.mutate(async () => {
      const now = new Date().toISOString()
      await this.db.doseLogs.update(id, { deletedAt: now, updatedAt: now })
    })
  }

  // ── Copia de seguridad ───────────────────────────────────────────────────

  async exportAll(): Promise<BackupData> {
    const [pets, eventTypes, events, treatments, doseLogs] = await Promise.all([
      this.db.pets.toArray(),
      this.db.eventTypes.toArray(),
      this.db.events.toArray(),
      this.db.treatments.toArray(),
      this.db.doseLogs.toArray(),
    ])
    return { pets, eventTypes, events, treatments, doseLogs }
  }

  async countPetsRaw(): Promise<number> {
    return this.db.pets.count()
  }

  /** Combina datos externos: por cada id gana el registro con `updatedAt` más reciente. */
  async importMerge(data: BackupData): Promise<MergeResult> {
    return this.mutate(async () => {
      const result: MergeResult = { added: 0, updated: 0, skipped: 0 }
      const tables = [
        [this.db.pets, data.pets],
        [this.db.eventTypes, data.eventTypes],
        [this.db.events, data.events],
        [this.db.treatments, data.treatments],
        [this.db.doseLogs, data.doseLogs],
      ] as const
      await this.db.transaction(
        'rw',
        [this.db.pets, this.db.eventTypes, this.db.events, this.db.treatments, this.db.doseLogs],
        async () => {
          for (const [table, rows] of tables) {
            const t = table as Table<Entity, string>
            for (const row of rows as Entity[]) {
              const cur = await t.get(row.id)
              if (!cur) {
                await t.put(row)
                result.added++
              } else if (cur.updatedAt < row.updatedAt) {
                await t.put(row)
                result.updated++
              } else {
                result.skipped++
              }
            }
          }
        },
      )
      return result
    })
  }

  /** Borra TODO el contenido local (acción destructiva, la confirma la UI). */
  async wipeAll(): Promise<void> {
    await this.mutate(async () => {
      await this.db.transaction(
        'rw',
        [this.db.pets, this.db.eventTypes, this.db.events, this.db.treatments, this.db.doseLogs],
        async () => {
          await Promise.all([
            this.db.pets.clear(),
            this.db.eventTypes.clear(),
            this.db.events.clear(),
            this.db.treatments.clear(),
            this.db.doseLogs.clear(),
          ])
        },
      )
    })
  }
}
