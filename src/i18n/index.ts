/**
 * Traducciones de PetLog.
 *
 * El texto en español es la clave: `tl('Personalizar')`. Cada idioma tiene un diccionario español → idioma
 * en `src/i18n/<código>.ts`, que se carga antes de pintar la app. Si falta una traducción se muestra el español.
 * Los huecos se escriben {0}, {1}…: `tl('Hace {0} días', n)`.
 */
export type Lang = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt'

export const LANGS: { code: Lang; name: string; locale: string }[] = [
  { code: 'es', name: 'Español', locale: 'es-ES' },
  { code: 'en', name: 'English', locale: 'en-GB' },
  { code: 'fr', name: 'Français', locale: 'fr-FR' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE' },
  { code: 'it', name: 'Italiano', locale: 'it-IT' },
  { code: 'pt', name: 'Português', locale: 'pt-PT' },
]

const KEY = 'petlog-lang'
let current: Lang = 'es'
let dict: Record<string, string> = {}

const isLang = (s: unknown): s is Lang => typeof s === 'string' && LANGS.some((l) => l.code === s)

function stored(): Lang | null {
  try {
    const v = localStorage.getItem(KEY)
    return isLang(v) ? v : null
  } catch {
    return null
  }
}

/** ¿Ha elegido ya idioma? (la primera vez se muestra la pantalla de idioma). */
export const hasChosenLang = () => stored() !== null

/** Idioma sugerido por el teléfono (si es uno de los nuestros). */
export function deviceLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2).toLowerCase() : 'es'
  return isLang(nav) ? nav : 'en'
}

export const lang = () => current
export const locale = () => LANGS.find((l) => l.code === current)!.locale

const LOADERS: Record<Exclude<Lang, 'es'>, () => Promise<{ default: Record<string, string> }>> = {
  en: () => import('./en'),
  fr: () => import('./fr'),
  de: () => import('./de'),
  it: () => import('./it'),
  pt: () => import('./pt'),
}

/** Carga el diccionario del idioma guardado (o el que se pase). Se llama antes de pintar la app. */
export async function loadLang(l: Lang | null = stored()): Promise<void> {
  current = l ?? 'es'
  dict = current === 'es' ? {} : (await LOADERS[current]()).default
  if (typeof document !== 'undefined') document.documentElement.lang = current
}

/** Guarda el idioma y recarga la app para aplicarlo en todas partes. */
export function setLang(l: Lang, reload = true): void {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* sin almacenamiento: se aplica solo en esta sesión */
  }
  if (reload) location.reload()
}

/** Solo para pruebas. */
export function _setDict(l: Lang, d: Record<string, string>) {
  current = l
  dict = d
}

export function tl(es: string, ...args: unknown[]): string {
  const s = dict[es] ?? es
  return args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[+i] === undefined ? m : String(args[+i]))) : s
}
