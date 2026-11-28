/**
 * Micrófono: en Android, complemento nativo (VoicePlugin.java). En el navegador, la API de voz del navegador si existe.
 * En ningún caso PetLog envía audio a servidores propios: el reconocimiento lo hace el sistema del teléfono.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { locale, tl } from '../i18n'

interface VoicePlugin {
  available(): Promise<{ recognition: boolean; onDevice: boolean; permission: string }>
  start(opts: { lang?: string }): Promise<{ text: string; alternatives: string[]; engine: string }>
  stop(): Promise<void>
  cancel(): Promise<void>
  speak(opts: { text: string; lang?: string }): Promise<void>
  addListener(ev: 'partial', fn: (e: { text: string }) => void): Promise<PluginListenerHandle>
  addListener(ev: 'level', fn: (e: { level: number }) => void): Promise<PluginListenerHandle>
  addListener(ev: 'state', fn: (e: { state: string }) => void): Promise<PluginListenerHandle>
}

const Native = registerPlugin<VoicePlugin>('Voice')
const native = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('Voice')

type WebRec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
const WebSR = (): (new () => WebRec) | undefined =>
  typeof window === 'undefined' ? undefined : ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as never

export interface ListenHandlers {
  onPartial?: (text: string) => void
  onLevel?: (level: number) => void
  onState?: (state: string) => void
}

export class VoiceError extends Error {
  constructor(
    message: string,
    public code: 'permission' | 'unavailable' | 'network' | 'cancelled' | 'other',
  ) {
    super(message)
  }
}

export async function voiceAvailable(): Promise<{ recognition: boolean; onDevice: boolean }> {
  if (native()) {
    try {
      return await Native.available()
    } catch {
      return { recognition: false, onDevice: false }
    }
  }
  return { recognition: !!WebSR(), onDevice: false }
}

let webCurrent: WebRec | null = null

/** Escucha una frase. Resuelve con el texto (vacío si no se oyó nada). */
export async function listen(h: ListenHandlers = {}): Promise<string> {
  if (native()) {
    const subs = await Promise.all([
      Native.addListener('partial', (e) => h.onPartial?.(e.text)),
      Native.addListener('level', (e) => h.onLevel?.(e.level)),
      Native.addListener('state', (e) => h.onState?.(e.state)),
    ])
    try {
      const r = await Native.start({ lang: 'es-ES' })
      return r.text ?? ''
    } catch (e) {
      const code = (e as { code?: string }).code
      const msg = (e as Error).message
      throw new VoiceError(msg, code === 'permission' || code === 'unavailable' || code === 'network' || code === 'cancelled' ? code : 'other')
    } finally {
      for (const s of subs) void s.remove()
    }
  }
  const SR = WebSR()
  if (!SR) throw new VoiceError(tl('Este dispositivo no tiene reconocimiento de voz'), 'unavailable')
  return new Promise((resolve, reject) => {
    const r = new SR()
    webCurrent = r
    r.lang = 'es-ES'
    r.interimResults = true
    r.maxAlternatives = 1
    let text = ''
    r.onresult = (e) => {
      text = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(' ')
      h.onPartial?.(text)
    }
    r.onerror = (e) => {
      webCurrent = null
      if (e.error === 'no-speech') return resolve('')
      reject(new VoiceError(e.error, e.error === 'not-allowed' ? 'permission' : e.error === 'network' ? 'network' : e.error === 'aborted' ? 'cancelled' : 'other'))
    }
    r.onend = () => {
      webCurrent = null
      resolve(text.trim())
    }
    h.onState?.('listening')
    r.start()
  })
}

export async function stopListening(): Promise<void> {
  if (native()) return Native.stop()
  webCurrent?.stop()
}

export async function cancelListening(): Promise<void> {
  if (native()) return Native.cancel().catch(() => undefined)
  webCurrent?.abort()
}

export async function speak(text: string): Promise<void> {
  if (native()) return Native.speak({ text, lang: locale() })
  if (typeof speechSynthesis !== 'undefined') {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = locale()
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  }
}
