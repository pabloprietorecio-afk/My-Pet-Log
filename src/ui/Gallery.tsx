/** Solo en desarrollo: galería para revisar iconos, mascotas y fondos. */
import { useState } from 'react'
import { Backdrop, type Scene } from './art/Backdrop'
import { PetIllustration } from './art/pets'
import { TypeIcon } from './art/TypeIcon'
import type { EventKey } from '../domain/types'

const KEYS: EventKey[] = ['medication', 'vomit', 'stool', 'food', 'water', 'weight', 'mood', 'symptom', 'vet', 'other', 'shed', 'temperature', 'activity', 'custom']

export function Gallery() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const [scene] = useState<Scene>((q.get('s') as Scene) ?? 'today')
  return (
    <>
      <Backdrop scene={scene} />
      <div style={{ position: 'relative', zIndex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: 'rgba(255,255,255,.7)', padding: 12, borderRadius: 20 }}>
          {KEYS.map((k) => (
            <TypeIcon key={k} k={k} size={56} emoji={k === 'custom' ? '🦴' : undefined} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {KEYS.map((k) => (
            <TypeIcon key={k} k={k} size={28} emoji={k === 'custom' ? '🦴' : undefined} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {(['dog', 'cat', 'rabbit', 'rodent', 'bird', 'reptile'] as const).map((k) => (
            <span key={k} className={`avatar lg ${k}`} style={{ width: 104, height: 104 }}>
              <PetIllustration species={k} />
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
