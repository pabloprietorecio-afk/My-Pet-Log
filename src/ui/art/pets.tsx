/** Ilustraciones originales de mascotas (estilo tierno, formas simples). Caja de 64×64. */
import type { ReactNode } from 'react'

const INK = '#3a2f2c'

export interface FaceProps {
  fur?: string
  dark?: string
  /** Si es true, los ojos parpadean (animación CSS). */
  blink?: boolean
}

export function CatFace({ fur = '#ffcf96', dark = '#f2a65e', blink }: FaceProps): ReactNode {
  return (
    <g>
      <path d="M11 28 13.4 7.6c.2-1.4 1.8-2 2.9-1.1L29 17.4Z" fill={fur} />
      <path d="M53 28 50.6 7.6c-.2-1.4-1.8-2-2.9-1.1L35 17.4Z" fill={fur} />
      <path d="M15.6 22 16.8 12l7.8 6.6Z" fill="#ffb3b8" />
      <path d="M48.4 22 47.2 12l-7.8 6.6Z" fill="#ffb3b8" />
      <ellipse cx="32" cy="37" rx="23" ry="19.5" fill={fur} />
      <path d="M27.4 19.4l.8 4.6M32 18.4v5.6M36.6 19.4l-.8 4.6" stroke={dark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 37px' }}>
        <ellipse cx="22.5" cy="37" rx="2.9" ry="3.5" fill={INK} />
        <ellipse cx="41.5" cy="37" rx="2.9" ry="3.5" fill={INK} />
        <circle cx="23.5" cy="35.6" r="1" fill="#fff" />
        <circle cx="42.5" cy="35.6" r="1" fill="#fff" />
      </g>
      <ellipse cx="15.5" cy="44" rx="4" ry="2.4" fill="#ff8fa0" opacity=".45" />
      <ellipse cx="48.5" cy="44" rx="4" ry="2.4" fill="#ff8fa0" opacity=".45" />
      <path d="M30.2 41.4h3.6l-1.8 2.1Z" fill="#ff8a9a" stroke="#ff8a9a" strokeWidth="1" strokeLinejoin="round" />
      <path d="M28.4 45.2q1.8 1.9 3.6 0 1.8 1.9 3.6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M6 39.5l8.5 1.2M6.4 45l8.2-1.4M58 39.5l-8.5 1.2M57.6 45l-8.2-1.4" stroke={dark} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
    </g>
  )
}

export function DogFace({ fur = '#f6dcb5', dark = '#c98c58', blink }: FaceProps): ReactNode {
  return (
    <g>
      <ellipse cx="32" cy="35" rx="20.5" ry="19" fill={fur} />
      <path d="M15.4 17.4C6.6 17.6 3.4 30 6.6 40.6c1.5 4.8 7 4.6 8.8.4 2.2-5.2 3.2-12.8 4.2-18.4.5-2.8-1.5-5.3-4.2-5.2z" fill={dark} />
      <path d="M48.6 17.4c8.8.2 12 12.6 8.8 23.2-1.5 4.8-7 4.6-8.8.4-2.2-5.2-3.2-12.8-4.2-18.4-.5-2.8 1.5-5.3 4.2-5.2z" fill={dark} />
      <ellipse cx="41.8" cy="33.6" rx="6.4" ry="6" fill={dark} opacity=".55" />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 34px' }}>
        <ellipse cx="23.4" cy="34" rx="2.8" ry="3.3" fill={INK} />
        <ellipse cx="41.6" cy="34" rx="2.8" ry="3.3" fill={INK} />
        <circle cx="24.4" cy="32.7" r="1" fill="#fff" />
        <circle cx="42.6" cy="32.7" r="1" fill="#fff" />
      </g>
      <ellipse cx="32" cy="45" rx="10" ry="7.6" fill="#fff6ea" />
      <ellipse cx="32" cy="41.2" rx="3.8" ry="2.7" fill={INK} />
      <path d="M28 46q4 3.4 8 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M30.4 47.6h3.2v2.2a1.6 1.6 0 0 1-3.2 0z" fill="#ff8a9a" />
      <ellipse cx="17" cy="42.6" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".4" />
      <ellipse cx="47" cy="42.6" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".4" />
    </g>
  )
}

/** Avatar ilustrado para mascotas sin foto. */
export function PetIllustration({ species, size = '100%' }: { species: 'cat' | 'dog'; size?: number | string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="translate(5 7) scale(.84)">{species === 'cat' ? <CatFace /> : <DogFace />}</g>
    </svg>
  )
}
