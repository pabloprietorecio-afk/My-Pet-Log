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

export function HamsterFace({ fur = '#f2c38c', dark = '#d99a57', blink }: FaceProps): ReactNode {
  return (
    <g>
      <circle cx="15.5" cy="19" r="6.4" fill={fur} />
      <circle cx="48.5" cy="19" r="6.4" fill={fur} />
      <circle cx="15.5" cy="19" r="3.4" fill="#ffb3b8" />
      <circle cx="48.5" cy="19" r="3.4" fill="#ffb3b8" />
      <ellipse cx="32" cy="37" rx="23" ry="20" fill={fur} />
      <path d="M26 19.5q6-4 12 0" stroke={dark} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".7" />
      <ellipse cx="32" cy="44" rx="15" ry="11" fill="#fff4e4" />
      <ellipse cx="17" cy="43" rx="7.5" ry="6.5" fill="#fff4e4" />
      <ellipse cx="47" cy="43" rx="7.5" ry="6.5" fill="#fff4e4" />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 34px' }}>
        <ellipse cx="23.5" cy="34" rx="2.9" ry="3.4" fill={INK} />
        <ellipse cx="40.5" cy="34" rx="2.9" ry="3.4" fill={INK} />
        <circle cx="24.5" cy="32.7" r="1" fill="#fff" />
        <circle cx="41.5" cy="32.7" r="1" fill="#fff" />
      </g>
      <ellipse cx="32" cy="39.4" rx="2.3" ry="1.6" fill="#ff8a9a" />
      <path d="M28.6 42q1.7 1.8 3.4 0 1.7 1.8 3.4 0" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="30.5" y="43.2" width="3" height="3" rx=".6" fill="#fff" stroke={INK} strokeWidth=".8" />
      <ellipse cx="17" cy="41" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".5" />
      <ellipse cx="47" cy="41" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".5" />
    </g>
  )
}

export function RabbitFace({ fur = '#f6efe6', dark = '#cdb8a3', blink }: FaceProps): ReactNode {
  return (
    <g>
      <ellipse cx="23" cy="15" rx="6" ry="15" fill={fur} transform="rotate(-12 23 15)" />
      <ellipse cx="41" cy="15" rx="6" ry="15" fill={fur} transform="rotate(12 41 15)" />
      <ellipse cx="23" cy="16" rx="2.8" ry="10.5" fill="#ffb8c4" transform="rotate(-12 23 16)" />
      <ellipse cx="41" cy="16" rx="2.8" ry="10.5" fill="#ffb8c4" transform="rotate(12 41 16)" />
      <ellipse cx="32" cy="41" rx="20.5" ry="17" fill={fur} />
      <ellipse cx="32" cy="48" rx="10" ry="7" fill="#fff" opacity=".8" />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 39px' }}>
        <ellipse cx="24" cy="39" rx="2.8" ry="3.3" fill={INK} />
        <ellipse cx="40" cy="39" rx="2.8" ry="3.3" fill={INK} />
        <circle cx="25" cy="37.7" r="1" fill="#fff" />
        <circle cx="41" cy="37.7" r="1" fill="#fff" />
      </g>
      <path d="M30.2 44.2h3.6l-1.8 1.9z" fill="#ff8a9a" stroke="#ff8a9a" strokeWidth="1" strokeLinejoin="round" />
      <path d="M32 46v1.4M29.2 48.4q2.8 1.8 2.8-.9 0 2.7 2.8.9" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M7 44l8.4 1M7.6 49.4l8-1.6M57 44l-8.4 1M56.4 49.4l-8-1.6" stroke={dark} strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="16.5" cy="46" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".45" />
      <ellipse cx="47.5" cy="46" rx="3.6" ry="2.2" fill="#ff8fa0" opacity=".45" />
    </g>
  )
}

export function BirdFace({ fur = '#9fdf86', dark = '#5fb24a', blink }: FaceProps): ReactNode {
  return (
    <g>
      <path d="M27.4 16.5c-.6-5 3-8.6 5.6-6.4 1.2-3.4 5.8-2.6 5.2 2.6" fill={fur} />
      <ellipse cx="12.5" cy="44" rx="6" ry="9.5" fill={dark} transform="rotate(18 12.5 44)" />
      <ellipse cx="51.5" cy="44" rx="6" ry="9.5" fill={dark} transform="rotate(-18 51.5 44)" />
      <circle cx="32" cy="36" r="21" fill={fur} />
      <ellipse cx="32" cy="41.5" rx="14" ry="12" fill="#fff3a6" />
      <path d="M22 50.5h2.6M28 52.4h2.6M34 52.4h2.6M40 50.5h2.6" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 34px' }}>
        <ellipse cx="24" cy="34" rx="2.9" ry="3.4" fill={INK} />
        <ellipse cx="40" cy="34" rx="2.9" ry="3.4" fill={INK} />
        <circle cx="25" cy="32.7" r="1" fill="#fff" />
        <circle cx="41" cy="32.7" r="1" fill="#fff" />
      </g>
      <path d="M28.6 38.2q3.4-1.6 6.8 0L32 44.2z" fill="#ffad42" stroke="#f08f1c" strokeWidth=".8" strokeLinejoin="round" />
      <ellipse cx="18.5" cy="40" rx="3.4" ry="2.2" fill="#ff8fa0" opacity=".5" />
      <ellipse cx="45.5" cy="40" rx="3.4" ry="2.2" fill="#ff8fa0" opacity=".5" />
    </g>
  )
}

export function SnakeFace({ fur = '#a7da86', dark = '#6fae4f', blink }: FaceProps): ReactNode {
  return (
    <g>
      <path d="M8 60c6-12 22-6 30-9s12-9 18-6" stroke={dark} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M8 60c6-12 22-6 30-9s12-9 18-6" stroke="#e9f6c9" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeDasharray="1 6" />
      <ellipse cx="32" cy="34" rx="20" ry="16.5" fill={fur} />
      <circle cx="22" cy="23.5" r="2.2" fill={dark} />
      <circle cx="32" cy="21" r="2.6" fill={dark} />
      <circle cx="42" cy="23.5" r="2.2" fill={dark} />
      <circle cx="16.5" cy="33" r="1.8" fill={dark} />
      <circle cx="47.5" cy="33" r="1.8" fill={dark} />
      <g className={blink ? 'blink' : undefined} style={{ transformOrigin: '32px 32px' }}>
        <circle cx="23.5" cy="32" r="4.6" fill="#fff" />
        <circle cx="40.5" cy="32" r="4.6" fill="#fff" />
        <ellipse cx="24.2" cy="32.6" rx="2.6" ry="3.2" fill={INK} />
        <ellipse cx="39.8" cy="32.6" rx="2.6" ry="3.2" fill={INK} />
        <circle cx="25.1" cy="31.4" r=".9" fill="#fff" />
        <circle cx="40.7" cy="31.4" r=".9" fill="#fff" />
      </g>
      <path d="M26 41.2q6 4.2 12 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 43.4v4.6M32 48l-2.2 2.6M32 48l2.2 2.6" stroke="#ff5f86" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="16.8" cy="39" rx="3.4" ry="2.1" fill="#ff8fa0" opacity=".45" />
      <ellipse cx="47.2" cy="39" rx="3.4" ry="2.1" fill="#ff8fa0" opacity=".45" />
    </g>
  )
}

export type PetKind = 'cat' | 'dog' | 'rodent' | 'reptile' | 'rabbit' | 'bird'

export function Face({ kind, ...p }: FaceProps & { kind: PetKind }): ReactNode {
  switch (kind) {
    case 'cat':
      return <CatFace {...p} />
    case 'rodent':
      return <HamsterFace {...p} />
    case 'reptile':
      return <SnakeFace {...p} />
    case 'rabbit':
      return <RabbitFace {...p} />
    case 'bird':
      return <BirdFace {...p} />
    default:
      return <DogFace {...p} />
  }
}

/** Avatar ilustrado para mascotas sin foto. */
export function PetIllustration({ species, size = '100%' }: { species: PetKind; size?: number | string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="translate(5 7) scale(.84)">
        <Face kind={species} />
      </g>
    </svg>
  )
}
