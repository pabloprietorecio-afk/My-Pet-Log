/** Icono de la app en el lanzador de Android (solo iconos incluidos en el APK). */
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { PetKind } from '../ui/art/pets'

interface AppIconPlugin {
  get(): Promise<{ kind: PetKind }>
  set(opts: { kind: PetKind }): Promise<{ kind: PetKind }>
}

const AppIcon = registerPlugin<AppIconPlugin>('AppIcon')

/** Solo Android: en iOS haría falta otra implementación nativa que la app todavía no tiene. */
// Solo en desarrollo: simula el complemento para poder revisar la pantalla en el navegador.
const devFake = import.meta.env.DEV && typeof localStorage !== 'undefined' && localStorage.getItem('petlog-dev-icon') !== null

export function canChangeAppIcon(): boolean {
  if (devFake) return true
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('AppIcon')
}

export async function getAppIcon(): Promise<PetKind> {
  if (devFake) return (localStorage.getItem('petlog-dev-icon') || 'cat') as PetKind
  return (await AppIcon.get()).kind
}

export async function setAppIcon(kind: PetKind): Promise<void> {
  if (devFake) return void localStorage.setItem('petlog-dev-icon', kind)
  await AppIcon.set({ kind })
}
