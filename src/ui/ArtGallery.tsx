/** Solo en desarrollo: revisión de las ilustraciones de tipos de registro. */
import { TypeArt, tintVars } from './art/TypeArt'
import type { EventKey } from '../domain/types'

const ITEMS: [EventKey, string | undefined, string][] = [
  ['medication', undefined, 'Medicación'], ['vomit', undefined, 'Vómito'], ['stool', undefined, 'Deposición'], ['food', undefined, 'Comida'],
  ['water', undefined, 'Agua'], ['weight', undefined, 'Peso'], ['mood', undefined, 'Estado'], ['symptom', undefined, 'Síntoma'],
  ['vet', undefined, 'Veterinario'], ['other', undefined, 'Otro'], ['shed', undefined, 'Muda'], ['temperature', undefined, 'Temperatura'],
  ['activity', undefined, 'Actividad'], ['custom', '🚽', 'Pis'], ['custom', '🛁', 'Baño'], ['custom', '💉', 'Inyección'],
  ['custom', '😴', 'Sueño'], ['custom', '🦴', 'Premio'], ['custom', '🐱', 'Otro emoji'],
]

export function ArtGallery() {
  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: 'var(--bg)' }}>
      {ITEMS.map(([k, e, label], i) => (
        <div key={i} style={{ ...tintVars(k, e), background: 'linear-gradient(160deg, var(--l1), var(--l2))', borderRadius: 22, aspectRatio: '1', position: 'relative', overflow: 'hidden', padding: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--tink)', fontSize: 15 }}>{label}</span>
          <TypeArt k={k} emoji={e} className="ga" />
        </div>
      ))}
      <style>{`.ga{position:absolute;right:-6%;bottom:-6%;width:78%;height:78%}`}</style>
    </div>
  )
}
