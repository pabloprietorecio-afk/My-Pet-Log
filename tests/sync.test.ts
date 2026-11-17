import { describe, expect, it } from 'vitest'
import { SyncEngine, makeCode, parseCode } from '../src/sync/engine'
import { MemoryBackend, MemoryServer } from '../src/sync/memoryBackend'
import { importKeys, open, seal } from '../src/sync/crypto'
import { freshRepo } from './helpers'

const petInput = { name: 'Luna', species: 'cat' as const, sex: 'female' as const, vet: {}, conditions: ['Insuficiencia renal'], allergies: [] }

function device(server: MemoryServer) {
  const repo = freshRepo()
  const backend = new MemoryBackend(server)
  return { repo, backend, sync: new SyncEngine(repo, backend) }
}

async function shared() {
  const server = new MemoryServer()
  const a = device(server)
  const b = device(server)
  const pet = await a.repo.createPet(petInput, 4.2)
  const link = await a.sync.share(pet.id)
  const petId = await b.sync.join(makeCode(link))
  return { server, a, b, pet, petId, link }
}

describe('cifrado', () => {
  it('cifra y descifra; otra clave no puede abrirlo', async () => {
    const k1 = await importKeys('A'.repeat(43))
    const k2 = await importKeys('B'.repeat(43))
    const box = await seal(k1, { hola: 'mundo' })
    expect(await open(k1, box)).toEqual({ hola: 'mundo' })
    await expect(open(k2, box)).rejects.toBeTruthy()
  })
  it('lee el código suelto o dentro de un mensaje', () => {
    const code = makeCode({ hid: 'h'.repeat(22), invite: 'i'.repeat(22), key: 'k'.repeat(43) })
    expect(parseCode(`Únete a Luna en PetLog: petlog://unirse/${code} ¡gracias!`)).toEqual({ hid: 'h'.repeat(22), invite: 'i'.repeat(22), key: 'k'.repeat(43) })
    expect(() => parseCode('hola')).toThrow(/no es válido/)
  })
})

describe('sincronización entre dos dueños', () => {
  it('quien se une recibe la ficha, los botones y el peso', async () => {
    const { a, b, pet, petId } = await shared()
    expect(petId).toBe(pet.id)
    expect((await b.repo.getPet(petId))?.name).toBe('Luna')
    expect((await b.repo.listEventTypes(petId)).length).toBe((await a.repo.listEventTypes(pet.id)).length)
    expect((await b.repo.listEvents(petId)).length).toBe(1)
  })

  it('los registros de cada uno llegan al otro, con nota y foto', async () => {
    const { a, b, pet } = await shared()
    const vomit = (await a.repo.listEventTypes(pet.id)).find((t) => t.key === 'vomit')!
    await a.repo.addEvent({ petId: pet.id, typeId: vomit.id, level: 2, note: 'tras comer', photo: 'data:image/jpeg;base64,AAAA' })
    await b.repo.addEvent({ petId: pet.id, typeId: vomit.id, level: 1 })
    await a.sync.sync()
    await b.sync.sync()
    await a.sync.sync()
    const ea = await a.repo.listEvents(pet.id)
    const eb = await b.repo.listEvents(pet.id)
    expect(ea.length).toBe(3)
    expect(eb.map((e) => e.id).sort()).toEqual(ea.map((e) => e.id).sort())
    expect(eb.find((e) => e.note === 'tras comer')?.photo).toBe('data:image/jpeg;base64,AAAA')
  })

  it('tratamientos, tomas y borrados se propagan; gana la edición más reciente', async () => {
    const { a, b, pet } = await shared()
    const t = await a.repo.createTreatment({ petId: pet.id, name: 'Prednisona', dose: 5, unit: 'mg', mode: 'scheduled', times: ['08:00'], everyDays: 1, startDate: '2026-11-01', graceMinutes: 60 })
    await a.sync.sync()
    await b.sync.sync()
    expect((await b.repo.listTreatments(pet.id)).map((x) => x.name)).toEqual(['Prednisona'])
    await b.repo.logDose({ petId: pet.id, treatmentId: t.id, status: 'given' })
    await new Promise((r) => setTimeout(r, 5))
    await b.repo.updatePet(pet.id, { name: 'Luna (B)' })
    await b.sync.sync()
    await a.sync.sync()
    expect((await a.repo.listDoseLogs(pet.id)).length).toBe(1)
    expect((await a.repo.getPet(pet.id))?.name).toBe('Luna (B)')
    const ev = (await a.repo.listEvents(pet.id))[0]
    await a.repo.deleteEvent(ev.id)
    await a.sync.sync()
    await b.sync.sync()
    expect((await b.repo.listEvents(pet.id)).length).toBe(0)
  })

  it('una sincronización sin cambios no vuelve a subir nada', async () => {
    const { server, a, b, link } = await shared()
    await a.sync.sync()
    await b.sync.sync()
    const before = [...server.households.get(link.hid)!.records.values()].map((r) => r.u).join()
    await a.sync.sync()
    await b.sync.sync()
    expect([...server.households.get(link.hid)!.records.values()].map((r) => r.u).join()).toBe(before)
  })

  it('el servidor solo ve texto cifrado', async () => {
    const { server } = await shared()
    const dump = server.dump()
    expect(dump).not.toMatch(/Luna|Insuficiencia|vomit|petId|weight/)
  })

  it('sin la invitación correcta no se puede entrar; al renovarla, la antigua deja de servir', async () => {
    const { server, a, pet, link } = await shared()
    const c = device(server)
    await expect(c.sync.join(makeCode({ ...link, invite: 'x'.repeat(22) }))).rejects.toThrow(/no es válida/)
    await a.sync.renewInvite(pet.id)
    await expect(c.sync.join(makeCode(link))).rejects.toThrow(/no es válida/)
    const fresh = (await a.sync.linkFor(pet.id))!
    expect(await c.sync.join(makeCode(fresh))).toBe(pet.id)
    expect(await a.sync.memberCount(pet.id)).toBe(3)
  })

  it('dejar de compartir conserva los datos locales y corta la sincronización', async () => {
    const { a, b, pet } = await shared()
    await b.sync.unshare(pet.id)
    expect(await b.sync.linkFor(pet.id)).toBeUndefined()
    expect((await b.repo.getPet(pet.id))?.name).toBe('Luna')
    await a.repo.updatePet(pet.id, { name: 'Solo A' })
    await a.sync.sync()
    await b.sync.sync()
    expect((await b.repo.getPet(pet.id))?.name).toBe('Luna')
  })

  it('sin conexión marca error y luego se recupera sin perder cambios', async () => {
    const { a, b, pet } = await shared()
    a.backend.offline = true
    await a.repo.updatePet(pet.id, { notes: 'sin red' })
    await a.sync.sync()
    expect(a.sync.status.state).toBe('error')
    a.backend.offline = false
    await a.sync.sync()
    expect(a.sync.status.state).toBe('idle')
    await b.sync.sync()
    expect((await b.repo.getPet(pet.id))?.notes).toBe('sin red')
  })

  it('no acepta datos de otra mascota metidos en el grupo', async () => {
    const { a, b, pet, link } = await shared()
    const keys = await importKeys(link.key)
    const rogue = await seal(keys, { t: 'pets', r: { id: 'otra', name: 'Intrusa', createdAt: 'x', updatedAt: '2999' } })
    await a.backend.push(link.hid, [{ rid: 'rogue', ...rogue }])
    await b.sync.sync()
    expect(await b.repo.getPet('otra')).toBeUndefined()
    expect((await b.repo.getPet(pet.id))?.name).toBe('Luna')
  })
})
