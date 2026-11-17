/** Solo en desarrollo: dibuja el icono de la app para exportarlo a PNG. */
import { IconLayer } from './art/AppIconArt'
import type { PetKind } from './art/pets'

export function IconStudio() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const layer = (q.get('layer') ?? 'full') as 'bg' | 'fg' | 'full' | 'round'
  const kind = (q.get('kind') ?? 'cat') as PetKind
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent' }}>
      <IconLayer layer={layer} kind={kind} />
    </div>
  )
}
