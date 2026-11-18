/**
 * Servidor de sincronización sobre Firebase: acceso anónimo + Cloud Firestore (versión «lite», solo REST).
 *
 * Estructura (las reglas están en firebase/firestore.rules):
 *   households/{hid}                    { owner, createdAt }
 *   households/{hid}/members/{uid}      { invite, joinedAt }
 *   households/{hid}/invites/{invite}   { by, createdAt }        ← nadie puede leerlas: solo se comprueba que existen
 *   households/{hid}/records/{rid}      { u, iv, ct, by }        ← u = hora del servidor; iv/ct = datos cifrados
 */
import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  signInAnonymously,
  type Auth,
} from 'firebase/auth'
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  where,
  writeBatch,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore/lite'
import { SyncError, type RemoteRecord, type SyncBackend } from './backend'

const PAGE = 200

function wrap(e: unknown): never {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('permission-denied')) throw new SyncError('No tienes acceso a esta mascota compartida.', 'not-member')
  if (code.includes('unavailable') || code.includes('network') || code.includes('deadline')) {
    throw new SyncError('Sin conexión. Se sincronizará cuando vuelva.', 'network')
  }
  throw e instanceof Error ? e : new Error(String(e))
}

export class FirebaseBackend implements SyncBackend {
  private app: FirebaseApp
  private auth: Auth
  private db: Firestore

  /** Solo para pruebas: `emulator` usa los emuladores locales; `memory` no guarda la sesión. */
  constructor(config: FirebaseOptions, opts: { name?: string; memory?: boolean; emulator?: { firestore: string; auth: string } } = {}) {
    this.app = initializeApp(config, opts.name ?? 'petlog-sync')
    // Persistencia en IndexedDB (con respaldo en localStorage): el acceso anónimo se mantiene entre aperturas.
    this.auth = initializeAuth(this.app, {
      persistence: opts.emulator || opts.memory ? inMemoryPersistence : [indexedDBLocalPersistence, browserLocalPersistence],
    })
    this.db = getFirestore(this.app)
    if (opts.emulator) {
      const [host, port] = opts.emulator.firestore.split(':')
      connectFirestoreEmulator(this.db, host, Number(port))
      connectAuthEmulator(this.auth, `http://${opts.emulator.auth}`, { disableWarnings: true })
    }
  }

  async uid(): Promise<string> {
    await this.auth.authStateReady()
    if (this.auth.currentUser) return this.auth.currentUser.uid
    try {
      return (await signInAnonymously(this.auth)).user.uid
    } catch (e) {
      return wrap(e)
    }
  }

  private hh(hid: string) {
    return doc(this.db, 'households', hid)
  }

  async createHousehold(hid: string, invite: string) {
    const uid = await this.uid()
    try {
      await setDoc(this.hh(hid), { owner: uid, createdAt: serverTimestamp() })
      await setDoc(doc(this.hh(hid), 'members', uid), { invite, joinedAt: serverTimestamp() })
      await setDoc(doc(this.hh(hid), 'invites', invite), { by: uid, createdAt: serverTimestamp() })
    } catch (e) {
      wrap(e)
    }
  }

  async join(hid: string, invite: string) {
    const uid = await this.uid()
    try {
      await setDoc(doc(this.hh(hid), 'members', uid), { invite, joinedAt: serverTimestamp() })
    } catch (e) {
      const code = (e as { code?: string })?.code ?? ''
      if (code.includes('permission-denied')) throw new SyncError('La invitación no es válida o ha caducado. Pide una nueva.', 'bad-invite')
      wrap(e)
    }
  }

  async leave(hid: string) {
    const uid = await this.uid()
    try {
      await deleteDoc(doc(this.hh(hid), 'members', uid))
    } catch (e) {
      wrap(e)
    }
  }

  async replaceInvite(hid: string, oldInvite: string, newInvite: string) {
    const uid = await this.uid()
    try {
      const b = writeBatch(this.db)
      b.delete(doc(this.hh(hid), 'invites', oldInvite))
      b.set(doc(this.hh(hid), 'invites', newInvite), { by: uid, createdAt: serverTimestamp() })
      await b.commit()
    } catch (e) {
      wrap(e)
    }
  }

  async members(hid: string) {
    await this.uid()
    try {
      return (await getDocs(collection(this.hh(hid), 'members'))).size
    } catch (e) {
      return wrap(e)
    }
  }

  async push(hid: string, records: Omit<RemoteRecord, 'u'>[]) {
    const uid = await this.uid()
    try {
      const b = writeBatch(this.db)
      for (const r of records) b.set(doc(this.hh(hid), 'records', r.rid), { u: serverTimestamp(), iv: r.iv, ct: r.ct, by: uid })
      await b.commit()
    } catch (e) {
      wrap(e)
    }
  }

  async pullSince(hid: string, sinceMs: number): Promise<RemoteRecord[]> {
    await this.uid()
    const out: RemoteRecord[] = []
    const col = collection(this.hh(hid), 'records')
    let last: QueryDocumentSnapshot | null = null
    try {
      for (;;) {
        const parts: QueryConstraint[] = [where('u', '>', Timestamp.fromMillis(sinceMs)), orderBy('u'), ...(last ? [startAfter(last)] : []), limit(PAGE)]
        const snap: QuerySnapshot = await getDocs(query(col, ...parts))
        for (const d of snap.docs) {
          const v = d.data() as { u: Timestamp; iv: string; ct: string }
          out.push({ rid: d.id, u: v.u.toMillis(), iv: v.iv, ct: v.ct })
        }
        if (snap.docs.length < PAGE) break
        last = snap.docs[snap.docs.length - 1]
      }
    } catch (e) {
      return wrap(e)
    }
    return out
  }
}
