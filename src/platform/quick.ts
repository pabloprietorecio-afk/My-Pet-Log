/**
 * Ventana flotante «Anotar por voz» (atajo al mantener pulsado el icono de la app).
 *
 * En Android la abre `QuickVoiceActivity`: una ventana transparente sobre la pantalla de inicio que carga
 * esta misma app en modo «rápido» (solo micro y resultado, sin abrir PetLog). En el navegador se puede
 * probar con `#/voz-rapida`.
 */
import { Capacitor, registerPlugin } from '@capacitor/core'

interface QuickVoicePlugin {
  isQuick(): Promise<{ quick: boolean }>
  close(): Promise<void>
  openApp(opts: { url: string }): Promise<void>
}

const Native = registerPlugin<QuickVoicePlugin>('QuickVoice')
const native = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('QuickVoice')

export const WEB_QUICK_HASH = '#/voz-rapida'

/** ¿Se ha arrancado la app como ventana flotante de voz? */
export async function isQuickVoice(): Promise<boolean> {
  if (native()) {
    try {
      return (await Native.isQuick()).quick
    } catch {
      return false
    }
  }
  return typeof location !== 'undefined' && location.hash.startsWith(WEB_QUICK_HASH)
}

/** Cierra la ventana flotante (vuelve a donde estaba el usuario). */
export async function closeQuickVoice(): Promise<void> {
  if (native()) return Native.close()
  location.hash = '#/'
  location.reload()
}

/** Abre PetLog completo en una ruta (p. ej. el historial) y cierra la ventana flotante. */
export async function openFullApp(path: string): Promise<void> {
  if (native()) return Native.openApp({ url: `petlog://abrir${path}` })
  location.hash = `#${path}`
  location.reload()
}
