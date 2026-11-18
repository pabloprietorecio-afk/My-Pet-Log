/**
 * Prepara los widgets de Android: mascota actual y sus tres primeros botones (con la ilustración en PNG).
 * Solo se envía al teléfono el nombre de la mascota y de los botones: los registros siguen dentro de la app.
 */
import { Capacitor, registerPlugin } from '@capacitor/core'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { ART_TINT, TypeArt, artFor } from '../ui/art/TypeArt'
import type { EventType } from '../domain/types'

interface WidgetsPlugin {
  update(o: { petId: string; petName: string; items: { typeId: string; label: string; png?: string }[] }): Promise<void>
}
const Widgets = registerPlugin<WidgetsPlugin>('Widgets')
const available = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('Widgets')

/** SVG de la ilustración sobre su tarjeta tintada, como texto. */
export function artSvg(t: Pick<EventType, 'key' | 'emoji'>): string {
  const host = document.createElement('div')
  const root = createRoot(host)
  flushSync(() => root.render(createElement(TypeArt, { k: t.key, emoji: t.emoji, box: { x: 8, y: 8, size: 84 } })))
  const inner = host.innerHTML
  root.unmount()
  const tint = ART_TINT[artFor(t.key, t.emoji) ?? 'custom'] ?? ART_TINT.custom
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="192" height="192"><defs><linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${tint[0]}"/><stop offset="1" stop-color="${tint[1]}"/></linearGradient></defs><rect width="100" height="100" rx="26" fill="url(#bg)"/>${inner}</svg>`
}

async function toPng(svg: string): Promise<string | undefined> {
  try {
    const img = new Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = c.height = 192
    c.getContext('2d')!.drawImage(img, 0, 0, 192, 192)
    return c.toDataURL('image/png')
  } catch {
    return undefined
  }
}

let lastKey = ''

export async function pushWidgets(petId: string, petName: string, types: EventType[]): Promise<void> {
  if (!available()) return
  const top = types.filter((t) => !t.hidden && !t.deletedAt).slice(0, 3)
  const key = JSON.stringify([petId, petName, top.map((t) => [t.id, t.label, t.emoji])])
  if (key === lastKey) return
  lastKey = key
  const items = []
  for (const t of top) items.push({ typeId: t.id, label: t.label, png: await toPng(artSvg(t)) })
  await Widgets.update({ petId, petName, items }).catch(() => undefined)
}
