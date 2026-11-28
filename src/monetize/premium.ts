/**
 * PetLog Premium: compra única en Google Play (complemento capacitor-plugin-cdv-purchase, Play Billing 9).
 * Quita los anuncios y el límite de mascotas. Sin servidor propio: la compra la confirma Google Play en el teléfono.
 *
 * El estado se guarda en localStorage para arrancar sin esperar a la tienda; la tienda lo corrige al iniciar.
 */
import { Capacitor } from '@capacitor/core'
import { PREMIUM_PRODUCT } from './config'

type Listener = (s: PremiumState) => void
export interface PremiumState {
  premium: boolean
  /** Precio en la moneda del usuario, tal como lo da Google Play («4,99 €»). */
  price?: string
  /** ¿Se puede comprar en este dispositivo? (no en el navegador ni sin Google Play) */
  canBuy: boolean
  busy: boolean
  error?: string
}

const KEY = 'petlog-premium'
const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1' || (import.meta.env.DEV && localStorage.getItem('petlog-dev-premium') === '1')
  } catch {
    return false
  }
}

let state: PremiumState = { premium: read(), canBuy: false, busy: false }
const listeners = new Set<Listener>()
const emit = (patch: Partial<PremiumState>) => {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, state.premium ? '1' : '0')
  } catch {
    /* sin almacenamiento */
  }
  for (const l of listeners) l(state)
}

export const premiumState = () => state
export const isPremium = () => state.premium
export function onPremium(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any = null
let started = false

/** Conecta con Google Play. Sin Google Play (navegador, emulador sin tienda) no hace nada. */
export async function startPremium(): Promise<void> {
  if (started || Capacitor.getPlatform() !== 'android') return
  started = true
  try {
    const mod = await import('capacitor-plugin-cdv-purchase')
    store = mod.store
    store.register([{ id: PREMIUM_PRODUCT, type: mod.ProductType.NON_CONSUMABLE, platform: mod.Platform.GOOGLE_PLAY }])
    store
      .when()
      .productUpdated(() => refresh())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .approved((t: any) => t.verify())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .verified((r: any) => r.finish())
      .finished(() => refresh())
      .receiptUpdated(() => refresh())
    await store.initialize([mod.Platform.GOOGLE_PLAY])
    refresh()
  } catch (e) {
    emit({ canBuy: false, error: (e as Error).message })
  }
}

function refresh() {
  const p = store?.get(PREMIUM_PRODUCT)
  if (!p) return
  emit({ premium: !!p.owned, price: p.pricing?.price, canBuy: !!p.canPurchase || !!p.owned })
}

export async function buyPremium(): Promise<void> {
  if (import.meta.env.DEV && Capacitor.getPlatform() === 'web') {
    localStorage.setItem('petlog-dev-premium', '1')
    emit({ premium: true })
    return
  }
  const offer = store?.get(PREMIUM_PRODUCT)?.getOffer()
  if (!offer) {
    emit({ error: 'unavailable' })
    return
  }
  emit({ busy: true, error: undefined })
  try {
    const err = await offer.order()
    if (err && err.code !== 6777006 /* cancelado por el usuario */) emit({ error: err.message })
  } finally {
    emit({ busy: false })
  }
}

export async function restorePremium(): Promise<void> {
  if (!store) return
  emit({ busy: true, error: undefined })
  try {
    await store.restorePurchases()
    refresh()
  } finally {
    emit({ busy: false })
  }
}
