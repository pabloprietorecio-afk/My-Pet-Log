/**
 * Sincronización real (FirebaseBackend + SyncEngine) contra los emuladores de Firestore y Auth.
 * Solo se ejecuta dentro de `firebase emulators:exec` (ver firebase/test/package.json y el CI).
 */
import { describe, expect, it } from 'vitest'
import { FirebaseBackend } from '../src/sync/firebaseBackend'
import { SyncEngine, makeCode } from '../src/sync/engine'
import { freshRepo } from './helpers'

const FS = process.env.FIRESTORE_EMULATOR_HOST
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST
const run = FS && AUTH ? describe : describe.skip
let n = 0

function device() {
  const repo = freshRepo()
  const backend = new FirebaseBackend({ apiKey: 'demo-key', projectId: 'demo-petlog', appId: 'demo' }, { name: `d${++n}`, emulator: { firestore: FS!, auth: AUTH! } })
  return { repo, backend, sync: new SyncEngine(repo, backend) }
}

run('Firebase (emuladores)', () => {
  it('dos dueños comparten una mascota de verdad: ficha, registros con foto, tratamiento y borrados', async () => {
    const a = device()
    const b = device()
    expect(await a.backend.uid()).not.toBe(await b.backend.uid())
    const pet = await a.repo.createPet({ name: 'Luna', species: 'cat', sex: 'female', vet: {}, conditions: ['Renal'], allergies: [] }, 4.2)
    const link = await a.sync.share(pet.id)
    expect(await b.sync.join(makeCode(link))).toBe(pet.id)
    expect((await b.repo.getPet(pet.id))?.name).toBe('Luna')

    const vomit = (await b.repo.listEventTypes(pet.id)).find((t) => t.key === 'vomit')!
    await b.repo.addEvent({ petId: pet.id, typeId: vomit.id, level: 2, note: 'desde B', photo: 'data:image/jpeg;base64,' + 'A'.repeat(200_000) })
    await a.repo.createTreatment({ petId: pet.id, name: 'Prednisona', dose: 5, unit: 'mg', mode: 'scheduled', times: ['08:00'], everyDays: 1, startDate: '2026-11-01', graceMinutes: 60 })
    await b.sync.sync()
    await a.sync.sync()
    await b.sync.sync()
    expect(a.sync.status.state).toBe('idle')
    const ev = (await a.repo.listEvents(pet.id)).find((e) => e.note === 'desde B')
    expect(ev?.photo?.length).toBe('data:image/jpeg;base64,'.length + 200_000)
    expect((await b.repo.listTreatments(pet.id)).map((t) => t.name)).toEqual(['Prednisona'])
    expect(await a.sync.memberCount(pet.id)).toBe(2)

    await a.repo.deleteEvent(ev!.id)
    await a.sync.sync()
    await b.sync.sync()
    expect((await b.repo.listEvents(pet.id)).some((e) => e.note === 'desde B')).toBe(false)

    // Una invitación inventada no deja entrar; dejar de compartir corta el acceso
    const c = device()
    await expect(c.sync.join(makeCode({ ...link, invite: 'x'.repeat(22) }))).rejects.toThrow(/no es válida/)
    await b.sync.unshare(pet.id)
    await expect(b.backend.pullSince(link.hid, 0)).rejects.toThrow(/acceso/)
  }, 60_000)
})
