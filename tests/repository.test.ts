import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup, restoreBackup, serializeBackup, BackupError } from '../src/data/backup'
import { NativeMirror, type FileStore } from '../src/data/nativeMirror'
import { freshRepo, d } from './helpers'

const petInput = {
  name: 'Luna',
  species: 'cat' as const,
  sex: 'female' as const,
  vet: {},
  conditions: ['Insuficiencia renal'],
  allergies: [],
}

describe('repositorio', () => {
  it('crea mascota con sus 10 botones y su primer peso', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput, 4.2)
    const types = await repo.listEventTypes(pet.id)
    expect(types.map((t) => t.key)).toEqual([
      'medication', 'vomit', 'stool', 'food', 'water', 'weight', 'mood', 'symptom', 'vet', 'other',
    ])
    const events = await repo.listEvents(pet.id)
    expect(events).toHaveLength(1)
    expect(events[0].value).toBe(4.2)
  })

  it('registra, edita, borra y restaura un evento (borrado lógico)', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const vomit = (await repo.listEventTypes(pet.id)).find((t) => t.key === 'vomit')!
    const ev = await repo.addEvent({ petId: pet.id, typeId: vomit.id })
    expect(ev.at).toBeTruthy()
    await repo.updateEvent(ev.id, { level: 2, note: 'tras comer' })
    expect((await repo.listEvents(pet.id))[0]).toMatchObject({ level: 2, note: 'tras comer' })
    await repo.updateEvent(ev.id, { level: undefined })
    expect((await repo.listEvents(pet.id))[0].level).toBeUndefined()
    await repo.deleteEvent(ev.id)
    expect(await repo.listEvents(pet.id)).toHaveLength(0)
    expect((await repo.db.events.get(ev.id))?.deletedAt).toBeTruthy()
    await repo.restoreEvent(ev.id)
    expect(await repo.listEvents(pet.id)).toHaveLength(1)
  })

  it('filtra eventos por rango', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const t = (await repo.listEventTypes(pet.id))[1]
    await repo.addEvent({ petId: pet.id, typeId: t.id, at: d('2026-11-10 10:00').toISOString() })
    await repo.addEvent({ petId: pet.id, typeId: t.id, at: d('2026-11-12 10:00').toISOString() })
    const r = await repo.listEvents(pet.id, d('2026-11-11 00:00'), d('2026-11-13 00:00'))
    expect(r).toHaveLength(1)
  })

  it('doble toque en la misma toma no duplica el registro', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const tr = await repo.createTreatment({
      petId: pet.id, name: 'Prednisona', dose: 5, unit: 'mg', mode: 'scheduled',
      times: ['20:00', '08:00'], everyDays: 1, startDate: '2026-11-01', graceMinutes: 60,
    })
    expect(tr.times).toEqual(['08:00', '20:00'])
    const at = d('2026-11-16 20:00').toISOString()
    await repo.logDose({ petId: pet.id, treatmentId: tr.id, scheduledAt: at, status: 'given' })
    await repo.logDose({ petId: pet.id, treatmentId: tr.id, scheduledAt: at, status: 'given' })
    expect(await repo.listDoseLogs(pet.id)).toHaveLength(1)
  })

  it('cambiar el horario con historial cierra la pauta anterior y crea una nueva', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const tr = await repo.createTreatment({
      petId: pet.id, name: 'Prednisona', dose: 5, unit: 'mg', mode: 'scheduled',
      times: ['08:00'], everyDays: 1, startDate: '2020-01-01', graceMinutes: 60,
    })
    await repo.logDose({ petId: pet.id, treatmentId: tr.id, scheduledAt: d('2026-11-15 08:00').toISOString(), status: 'given' })
    const res = await repo.updateTreatment(tr.id, { times: ['09:00'] })
    expect(res.revised).toBe(true)
    const all = await repo.listTreatments(pet.id)
    expect(all).toHaveLength(2)
    expect(all.find((t) => t.id === tr.id)?.endDate).toBeTruthy()
    // un cambio de dosis o notas NO revisa
    const res2 = await repo.updateTreatment(res.treatment.id, { dose: 7.5 })
    expect(res2.revised).toBe(false)
    expect(await repo.listTreatments(pet.id)).toHaveLength(2)
  })

  it('eliminar una mascota borra en cascada (lógico)', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput, 4)
    await repo.deletePet(pet.id)
    expect(await repo.listPets()).toHaveLength(0)
    expect(await repo.listEvents(pet.id)).toHaveLength(0)
    expect(await repo.listEventTypes(pet.id)).toHaveLength(0)
  })

  it('solo se pueden eliminar botones propios', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const builtin = (await repo.listEventTypes(pet.id))[0]
    await expect(repo.deleteCustomType(builtin.id)).rejects.toThrow()
    const custom = await repo.createCustomType(pet.id, { label: 'Cojera', emoji: '🦴', input: 'level' })
    await repo.deleteCustomType(custom.id)
    expect((await repo.listEventTypes(pet.id)).some((t) => t.id === custom.id)).toBe(false)
  })
})

describe('copia de seguridad', () => {
  it('ida y vuelta: exportar y restaurar en una base vacía', async () => {
    const a = freshRepo()
    const pet = await a.createPet(petInput, 4.2)
    const t = (await a.listEventTypes(pet.id)).find((x) => x.key === 'vomit')!
    await a.addEvent({ petId: pet.id, typeId: t.id, level: 3, note: 'ñ á ü 🤮' })
    const text = serializeBackup(await createBackup(a))

    const b = freshRepo()
    const res = await restoreBackup(b, text)
    expect(res.added).toBeGreaterThan(0)
    const events = await b.listEvents(pet.id)
    expect(events.find((e) => e.level === 3)?.note).toBe('ñ á ü 🤮')
    // restaurar dos veces no duplica
    const again = await restoreBackup(b, text)
    expect(again.added).toBe(0)
  })

  it('gana el registro más reciente y un borrado más reciente se respeta', async () => {
    const a = freshRepo()
    const pet = await a.createPet(petInput)
    const t = (await a.listEventTypes(pet.id))[1]
    const ev = await a.addEvent({ petId: pet.id, typeId: t.id, note: 'v1' })
    const text = serializeBackup(await createBackup(a))
    await new Promise((r) => setTimeout(r, 5))
    await a.deleteEvent(ev.id)
    await restoreBackup(a, text) // la copia es más antigua que el borrado
    expect(await a.listEvents(pet.id)).toHaveLength(0)
  })

  it('rechaza archivos que no son copias o son de una versión futura', () => {
    expect(() => parseBackup('no es json')).toThrow(BackupError)
    expect(() => parseBackup('{"format":"otra-cosa"}')).toThrow(/no es una copia/)
    expect(() => parseBackup(JSON.stringify({ format: 'petlog-backup', schemaVersion: 99, data: {} }))).toThrow(/más nueva/)
    expect(() => parseBackup(JSON.stringify({ format: 'petlog-backup', schemaVersion: 1, data: { pets: [{}] } }))).toThrow(BackupError)
  })
})

describe('espejo nativo', () => {
  const memStore = (): FileStore & { content: string | null } => ({
    content: null,
    async read() { return this.content },
    async write(c: string) { this.content = c },
  })

  it('escribe tras un cambio y restaura si la base se pierde', async () => {
    const repo = freshRepo()
    const store = memStore()
    const mirror = new NativeMirror(repo, store, 10)
    mirror.start()
    const pet = await repo.createPet(petInput, 5)
    await mirror.flush()
    expect(store.content).toContain('Luna')

    // El SO "reclama" IndexedDB: base nueva y vacía
    const lost = freshRepo()
    const m2 = new NativeMirror(lost, store, 10)
    expect(await m2.restoreIfEmpty()).toBe(true)
    expect((await lost.listPets())[0].id).toBe(pet.id)
    // con datos presentes no restaura
    expect(await m2.restoreIfEmpty()).toBe(false)
    mirror.stop()
  })
})

describe('migración de iconos antiguos', () => {
  it('cambia 📅 de Veterinario y respeta iconos personalizados', async () => {
    const repo = freshRepo()
    const pet = await repo.createPet(petInput)
    const types = await repo.listEventTypes(pet.id)
    const vet = types.find((t) => t.key === 'vet')!
    const sym = types.find((t) => t.key === 'symptom')!
    await repo.updateEventType(vet.id, { emoji: '📅' })
    await repo.updateEventType(sym.id, { emoji: '🐾' })
    await repo.migrateLegacyEmoji()
    const after = await repo.listEventTypes(pet.id)
    expect(after.find((t) => t.key === 'vet')!.emoji).toBe('🩺')
    expect(after.find((t) => t.key === 'symptom')!.emoji).toBe('🐾')
  })
})
