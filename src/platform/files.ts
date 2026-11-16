/**
 * Compartir / guardar archivos. En nativo usa Capacitor (hoja de compartir del
 * sistema); en navegador usa Web Share o una descarga normal.
 */
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(r.error)
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.readAsDataURL(blob)
  })
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/** Comparte un archivo con la hoja del sistema (WhatsApp, correo, Drive…). */
export async function shareFile(blob: Blob, filename: string, title: string, text?: string): Promise<ShareOutcome> {
  if (isNative()) {
    const data = await blobToBase64(blob)
    const saved = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache })
    try {
      await Share.share({ title, text, files: [saved.uri], dialogTitle: title })
      return 'shared'
    } catch (e) {
      if (String((e as Error)?.message ?? e).toLowerCase().includes('cancel')) return 'cancelled'
      throw e
    }
  }
  const file = new File([blob], filename, { type: blob.type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text })
      return 'shared'
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled'
      throw e
    }
  }
  download(blob, filename)
  return 'downloaded'
}

/**
 * Guarda un archivo. En nativo se abre la hoja del sistema para elegir dónde
 * ("Guardar en Archivos", Drive…); en navegador se descarga.
 */
export async function saveFile(blob: Blob, filename: string, title: string): Promise<ShareOutcome> {
  if (isNative()) return shareFile(blob, filename, title)
  download(blob, filename)
  return 'downloaded'
}

export async function pickTextFile(accept = '.json,application/json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const f = input.files?.[0]
      resolve(f ? await f.text() : null)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

/**
 * Abre WhatsApp o el correo con el texto ya escrito.
 * - App instalada: el sistema abre la app de WhatsApp / correo (plugin AppLauncher).
 * - Navegador: wa.me en una pestaña nueva; mailto: con un enlace normal.
 * Devuelve false si se sabe que el navegador lo ha bloqueado (para ofrecer copiar el texto).
 */
export async function openExternal(url: string): Promise<boolean> {
  if (isNative()) {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher')
      const r = await AppLauncher.openUrl({ url })
      return r.completed
    } catch {
      return false
    }
  }
  try {
    if (url.startsWith('mailto:')) {
      const a = document.createElement('a')
      a.href = url
      document.body.appendChild(a)
      a.click()
      a.remove()
      return true
    }
    // Sin 'noopener' en las opciones: con él window.open devuelve siempre null.
    const w = window.open(url, '_blank')
    if (w) w.opener = null
    return !!w
  } catch {
    return false
  }
}

/** Copia texto al portapapeles; si la API no está permitida, usa la selección clásica. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function mailtoUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
