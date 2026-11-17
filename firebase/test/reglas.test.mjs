// Reglas de Firestore de PetLog contra el emulador (las lanza `npm test` en este directorio).
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'

const HID = 'hogar-de-prueba-000001'
const INV = 'invitacion-secreta-0001'
let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-petlog',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})
after(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()
const hh = (d, hid = HID) => doc(d, 'households', hid)
const rec = (by, extra = {}) => ({ u: serverTimestamp(), iv: 'aaaaaaaaaaaaaaaa', ct: 'cifrado', by, ...extra })

async function crearGrupo(owner = 'ana') {
  const d = db(owner)
  await assertSucceeds(setDoc(hh(d), { owner, createdAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(hh(d), 'members', owner), { invite: INV, joinedAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(hh(d), 'invites', INV), { by: owner, createdAt: serverTimestamp() }))
}

test('sin iniciar sesión no se puede hacer nada', async () => {
  await assertFails(setDoc(hh(db(null)), { owner: 'x', createdAt: serverTimestamp() }))
})

test('el creador monta el grupo y sube registros con hora del servidor', async () => {
  await crearGrupo()
  const d = db('ana')
  await assertSucceeds(setDoc(doc(hh(d), 'records', 'r1'), rec('ana')))
  await assertSucceeds(getDocs(collection(hh(d), 'records')))
})

test('no se puede crear un grupo a nombre de otro ni con campos extra', async () => {
  await assertFails(setDoc(hh(db('ana')), { owner: 'otro', createdAt: serverTimestamp() }))
  await assertFails(setDoc(hh(db('ana')), { owner: 'ana', createdAt: serverTimestamp(), extra: 1 }))
})

test('un extraño no puede leer ni escribir registros ni ver miembros', async () => {
  await crearGrupo()
  const d = db('intruso')
  await assertFails(getDocs(collection(hh(d), 'records')))
  await assertFails(setDoc(doc(hh(d), 'records', 'r1'), rec('intruso')))
  await assertFails(getDocs(collection(hh(d), 'members')))
  await assertFails(getDoc(hh(d)))
})

test('entrar exige una invitación vigente; las invitaciones no se pueden leer', async () => {
  await crearGrupo()
  const d = db('bea')
  await assertFails(getDoc(doc(hh(d), 'invites', INV)))
  await assertFails(getDocs(collection(hh(d), 'invites')))
  await assertFails(setDoc(doc(hh(d), 'members', 'bea'), { invite: 'inventada-xxxxxxxxxxxx', joinedAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(hh(d), 'members', 'bea'), { invite: INV, joinedAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(hh(d), 'records', 'r2'), rec('bea')))
})

test('nadie puede meter a otra persona en el grupo', async () => {
  await crearGrupo()
  await assertFails(setDoc(doc(hh(db('ana')), 'members', 'colado'), { invite: INV, joinedAt: serverTimestamp() }))
})

test('al renovar la invitación la antigua deja de servir', async () => {
  await crearGrupo()
  const a = db('ana')
  await assertSucceeds(deleteDoc(doc(hh(a), 'invites', INV)))
  await assertSucceeds(setDoc(doc(hh(a), 'invites', 'nueva-invitacion-000001'), { by: 'ana', createdAt: serverTimestamp() }))
  await assertFails(setDoc(doc(hh(db('bea')), 'members', 'bea'), { invite: INV, joinedAt: serverTimestamp() }))
})

test('los registros deben llevar hora del servidor, autor real y solo los campos previstos', async () => {
  await crearGrupo()
  const d = db('ana')
  await assertFails(setDoc(doc(hh(d), 'records', 'r1'), rec('ana', { u: new Date(0) })))
  await assertFails(setDoc(doc(hh(d), 'records', 'r1'), rec('otra')))
  await assertFails(setDoc(doc(hh(d), 'records', 'r1'), rec('ana', { nombre: 'Luna' })))
  await assertFails(deleteDoc(doc(hh(d), 'records', 'r1')))
})

test('quien sale del grupo pierde el acceso', async () => {
  await crearGrupo()
  const b = db('bea')
  await assertSucceeds(setDoc(doc(hh(b), 'members', 'bea'), { invite: INV, joinedAt: serverTimestamp() }))
  await assertSucceeds(deleteDoc(doc(hh(b), 'members', 'bea')))
  await assertFails(getDocs(collection(hh(b), 'records')))
  // y no puede echar a otro
  await assertFails(deleteDoc(doc(hh(b), 'members', 'ana')))
  assert.ok(true)
})
