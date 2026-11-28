/** Estado del atajo «Anotar por voz» del icono de la app (solo Android, complemento ShortcutPlugin). */
import { Capacitor, registerPlugin } from '@capacitor/core'
import { tl } from '../i18n'

const Shortcut = registerPlugin<{ status(): Promise<{ ensure: string; state: string }> }>('Shortcut')

export async function voiceShortcutText(): Promise<string | null> {
  if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('Shortcut')) return null
  try {
    const { state, ensure } = await Shortcut.status()
    if (state === 'manifest') return tl('Atajo «Anotar por voz»: publicado por Android (fijo).')
    if (state === 'dynamic') return tl('Atajo «Anotar por voz»: publicado por la app.')
    if (state === 'unsupported') return tl('Atajo «Anotar por voz»: este Android no admite atajos.')
    return tl('Atajo «Anotar por voz»: no publicado ({0}).', ensure)
  } catch (e) {
    return tl('Atajo «Anotar por voz»: no se pudo comprobar ({0}).', (e as Error).message)
  }
}
