/**
 * Cifrado de extremo a extremo de los datos compartidos.
 *
 * Cada mascota compartida tiene su propia clave AES-256 que solo viaja dentro de la invitación (código o QR).
 * El servidor guarda únicamente texto cifrado con AES-GCM y un identificador opaco por registro (HMAC),
 * así que no puede saber qué tipo de dato es ni a qué registro corresponde.
 */
const enc = new TextEncoder()
const dec = new TextDecoder()

export function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  const out = new Uint8Array(b.length)
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i)
  return out
}

export function randomToken(bytes = 16): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export interface SyncKeys {
  aes: CryptoKey
  hmac: CryptoKey
}

/** Clave nueva (32 bytes aleatorios) en base64url, lista para la invitación. */
export function newRawKey(): string {
  return randomToken(32)
}

export async function importKeys(raw: string): Promise<SyncKeys> {
  const bytes = fromB64url(raw)
  if (bytes.length !== 32) throw new Error('Clave de invitación no válida')
  const base = await crypto.subtle.importKey('raw', bytes as BufferSource, 'HKDF', false, ['deriveKey'])
  const salt = enc.encode('petlog-sync-v1')
  const aes = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('aes') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  const hmac = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('id') },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  )
  return { aes, hmac }
}

/** Identificador opaco y estable del registro en el servidor. */
export async function recordId(keys: SyncKeys, table: string, id: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', keys.hmac, enc.encode(`${table}/${id}`))
  return b64url(new Uint8Array(sig).slice(0, 20))
}

export async function seal(keys: SyncKeys, value: unknown): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keys.aes, enc.encode(JSON.stringify(value)))
  return { iv: b64url(iv), ct: b64url(new Uint8Array(ct)) }
}

export async function open<T>(keys: SyncKeys, box: { iv: string; ct: string }): Promise<T> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64url(box.iv) as BufferSource },
    keys.aes,
    fromB64url(box.ct) as BufferSource,
  )
  return JSON.parse(dec.decode(pt)) as T
}
