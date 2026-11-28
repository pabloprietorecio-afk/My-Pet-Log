/**
 * Publicidad discreta (AdMob): un banner no personalizado al pie de Historial, Gráficas y Consejos.
 * Nunca en Hoy, en la voz ni en el informe. Con Premium no se carga nada.
 *
 * Consentimiento: formulario de Google (UMP) en la UE/Reino Unido antes del primer anuncio; se puede cambiar en Ajustes.
 * El banner es nativo y se pinta encima de la app: su alto se reserva en la variable CSS --ad-h.
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { ADMOB, ADMOB_TEST } from './config'
import { isPremium, onPremium } from './premium'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any = null
let ready: Promise<boolean> | null = null
let privacyRequired = false
let wanted = 0 // pantallas que piden banner ahora mismo
let shown = false
let sizeSub: PluginListenerHandle | null = null

const native = () => Capacitor.getPlatform() === 'android'
const setH = (px: number) => document.documentElement.style.setProperty('--ad-h', `${Math.max(0, Math.round(px))}px`)
const safeBottom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0

/** Inicializa AdMob y pide el consentimiento si hace falta. Devuelve si se pueden pedir anuncios. */
export function startAds(): Promise<boolean> {
  if (!native() || isPremium()) return Promise.resolve(false)
  if (ready) return ready
  ready = (async () => {
    try {
      mod = await import('@capacitor-community/admob')
      const { AdMob, AdmobConsentStatus } = mod
      await AdMob.initialize({ initializeForTesting: ADMOB_TEST })
      let info = await AdMob.requestConsentInfo()
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm()
      privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED'
      sizeSub = await AdMob.addListener('bannerAdSizeChanged', (s: { height: number }) => setH(shown ? s.height : 0))
      return !!info.canRequestAds
    } catch (e) {
      console.warn('AdMob no disponible', e)
      return false
    }
  })()
  return ready
}

async function show() {
  if (shown || isPremium() || !(await startAds()) || wanted === 0) return
  const { AdMob, BannerAdPosition, BannerAdSize } = mod
  shown = true
  try {
    await AdMob.showBanner({
      adId: ADMOB.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: safeBottom(),
      npa: true, // anuncios no personalizados
      isTesting: ADMOB_TEST,
    })
  } catch {
    shown = false
    setH(0)
  }
}

async function hide() {
  if (!shown || !mod) return
  shown = false
  setH(0)
  await mod.AdMob.hideBanner().catch(() => undefined)
}

/** Lo llama cada pantalla que lleva banner (al montarse) y devuelve cómo quitarlo (al desmontarse). */
export function requestBanner(): () => void {
  wanted++
  void show()
  return () => {
    wanted = Math.max(0, wanted - 1)
    // pequeño margen para no parpadear al pasar de una pantalla con banner a otra
    setTimeout(() => wanted === 0 && void hide(), 250)
  }
}

/** ¿Hay que ofrecer «Opciones de privacidad de anuncios» en Ajustes? (lo exige Google en la UE). */
export const adsPrivacyRequired = () => privacyRequired && !isPremium()
export async function showAdsPrivacyOptions(): Promise<void> {
  if (mod) await mod.AdMob.showPrivacyOptionsForm()
}

onPremium((s) => {
  if (s.premium) {
    void hide()
    if (mod) void mod.AdMob.removeBanner().catch(() => undefined)
    void sizeSub?.remove()
  }
})
