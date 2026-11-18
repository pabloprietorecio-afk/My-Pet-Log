/**
 * Prueba contra el proyecto Firebase REAL de PetLog (no emuladores). Solo se ejecuta con PETLOG_REAL=1
 * (flujo «Firebase (proyecto real)» en GitHub Actions). Deja en el servidor solo datos cifrados de prueba
 * y saca a los dispositivos de prueba del grupo al terminar.
 */
import { describe, expect, it } from 'vitest'
import { FIREBASE_CONFIG } from '../src/sync/config'
import { FirebaseBackend } from '../src/sync/firebaseBackend'
import { SyncEngine, makeCode } from '../src/sync/engine'
import { freshRepo } from './helpers'

const run = process.env.PETLOG_REAL === '1' && FIREBASE_CONFIG ? describe : describe.skip
let n = 0

function device() {
  const repo = freshRepo()
  const backend = new FirebaseBackend(FIREBASE_CONFIG!, { name: `real${++n}`, memory: true })
  return { repo, backend, sync: new SyncEngine(repo, backend) }
}

run('Firebase (proyecto real petloj-72431)', () => {
  it('compartir, unirse, sincronizar en ambos sentidos y reglas', async () => {
    const t0 = Date.now()
    const a = device()
    const b = device()
    const pet = await a.repo.createPet({ name: 'Prueba CI', species: 'dog', sex: 'unknown', vet: {}, conditions: [], allergies: [] }, 10)
    const link = await a.sync.share(pet.id)
    console.log('compartida en', Date.now() - t0, 'ms')
    expect(await b.sync.join(makeCode(link))).toBe(pet.id)
    console.log('unida en', Date.now() - t0, 'ms')

    const vomit = (await b.repo.listEventTypes(pet.id)).find((t) => t.key === 'vomit')!
    await b.repo.addEvent({ petId: pet.id, typeId: vomit.id, level: 1, note: 'desde B', photo: 'data:image/jpeg;base64,' + 'A'.repeat(300_000) })
    await b.sync.sync()
    await a.sync.sync()
    expect(b.sync.status.state).toBe('idle')
    expect(a.sync.status.state).toBe('idle')
    expect((await a.repo.listEvents(pet.id)).some((e) => e.note === 'desde B')).toBe(true)
    await a.repo.updatePet(pet.id, { name: 'Prueba CI (A)' })
    await a.sync.sync()
    await b.sync.sync()
    expect((await b.repo.getPet(pet.id))?.name).toBe('Prueba CI (A)')
    expect(await a.sync.memberCount(pet.id)).toBe(2)

    const c = device()
    await expect(c.sync.join(makeCode({ ...link, invite: 'x'.repeat(22) }))).rejects.toThrow(/no es válida/)
    await expect(c.backend.pullSince(link.hid, 0)).rejects.toThrow(/acceso/)

    await b.sync.unshare(pet.id)
    await a.sync.unshare(pet.id)
    console.log('total', Date.now() - t0, 'ms')
  }, 120_000)
})
