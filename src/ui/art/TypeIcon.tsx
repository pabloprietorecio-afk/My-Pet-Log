/**
 * Iconos de tipo de registro al estilo de iOS: «squircle» con degradado y glifo blanco.
 * Dibujados a mano para PetLog (sin librerías ni recursos externos).
 * Si el usuario cambió el icono de un botón (o es un botón propio), se muestra su emoji
 * dentro del mismo squircle, así todo conserva la misma forma.
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
import { TypeArt, tintVars } from './TypeArt'
import { BUILTIN_TYPES } from '../../domain/eventTypes'
import type { EventKey } from '../../domain/types'

type Pal = [top: string, bottom: string]

export const TYPE_COLORS: Record<EventKey, Pal> = {
  medication: ['#8296ff', '#4c62f2'],
  vomit: ['#acdf72', '#66b434'],
  stool: ['#e6b784', '#b47a42'],
  food: ['#ffd86e', '#fda821'],
  water: ['#74d6ff', '#2a98ef'],
  weight: ['#c6abff', '#8a62f0'],
  mood: ['#ffa1be', '#fb5a8c'],
  symptom: ['#ff9f8b', '#ef5542'],
  vet: ['#62d9d1', '#1ba3a0'],
  other: ['#bec7d0', '#84909e'],
  shed: ['#dccf86', '#a28f2c'],
  temperature: ['#ffb070', '#f0621a'],
  activity: ['#f2a8ff', '#be4fe6'],
  custom: ['#c9baff', '#9a84ef'],
}

/** Forma de squircle (aproximación de superelipse) en una caja de 40×40. */
const SQUIRCLE = 'M20 0C36.2 0 40 3.8 40 20S36.2 40 20 40 0 36.2 0 20 3.8 0 20 0Z'

const W = '#fff'

/** Glifos en rejilla de 24; `c` es el color oscuro del degradado para los recortes. */
export const GLYPHS: Record<Exclude<EventKey, 'custom' | 'shed' | 'temperature' | 'activity'>, (c: string) => ReactNode> = {
  medication: (c) => (
    <g transform="rotate(45 12 12)">
      <rect x="7.6" y="2.2" width="8.8" height="19.6" rx="4.4" fill={W} />
      <path d="M7.6 12h8.8v5.4a4.4 4.4 0 0 1-8.8 0z" fill={c} fillOpacity=".3" />
      <rect x="9.4" y="4.6" width="1.7" height="5" rx=".85" fill={c} fillOpacity=".22" />
    </g>
  ),
  vomit: (c) => (
    <>
      <circle cx="12" cy="12.4" r="9.2" fill={W} />
      <path d="M7.4 9.4 9.5 10.6 7.4 11.8M16.6 9.4 14.5 10.6 16.6 11.8" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.6 16.6q1.1-1.3 2.2 0t2.2 0 2.2 0 2.2 0" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  stool: (c) => (
    <>
      <path d="M12 2.6c1.9 1 3 2.4 2.5 4.3H9.6c.3-1.5 1.2-2.7 2.4-4.3z" fill={W} />
      <rect x="7.8" y="6.2" width="8.4" height="5.4" rx="2.7" fill={W} />
      <rect x="5.4" y="10.4" width="13.2" height="5.8" rx="2.9" fill={W} />
      <rect x="3.2" y="14.8" width="17.6" height="6.2" rx="3.1" fill={W} />
      <circle cx="10" cy="13.2" r="1" fill={c} />
      <circle cx="14" cy="13.2" r="1" fill={c} />
      <path d="M10.1 17.6q1.9 1.5 3.8 0" stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  ),
  food: (c) => (
    <>
      <circle cx="8.4" cy="8.6" r="2.3" fill={W} />
      <circle cx="12" cy="7" r="2.5" fill={W} />
      <circle cx="15.6" cy="8.6" r="2.3" fill={W} />
      <circle cx="10.2" cy="5.4" r="1.4" fill={W} fillOpacity=".8" />
      <rect x="2" y="11.2" width="20" height="2.8" rx="1.4" fill={W} />
      <path d="M3.6 15h16.8c-.9 3.6-4.2 5.6-8.4 5.6S4.5 18.6 3.6 15z" fill={W} />
      <circle cx="12" cy="17.4" r="1.4" fill={c} fillOpacity=".35" />
    </>
  ),
  water: (c) => (
    <>
      <path d="M12 2.6S4.8 10.6 4.8 15.3a7.2 7.2 0 0 0 14.4 0C19.2 10.6 12 2.6 12 2.6z" fill={W} />
      <path d="M8.4 15.4a3.6 3.6 0 0 0 2.8 3.5" stroke={c} strokeOpacity=".45" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  ),
  weight: (c) => (
    <>
      <rect x="3" y="3.4" width="18" height="17.4" rx="4.6" fill={W} />
      <path d="M7.4 10.6a4.6 4.6 0 0 1 9.2 0z" fill={c} fillOpacity=".28" />
      <path d="M12 10.6l2.1-2.9" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7.6" y="14.4" width="8.8" height="1.6" rx=".8" fill={c} fillOpacity=".2" />
    </>
  ),
  mood: (c) => (
    <>
      <path d="M12 20.6S2.8 15 2.8 8.8A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 9.2 2.4c0 6.2-9.2 11.8-9.2 11.8z" fill={W} />
      <path d="M6.4 9.1a2.3 2.3 0 0 1 2.1-2.2" stroke={c} strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  symptom: (c) => (
    <>
      <rect x="9.5" y="2.2" width="5" height="13.6" rx="2.5" fill={W} />
      <circle cx="12" cy="17.6" r="4.3" fill={W} />
      <rect x="11.1" y="8" width="1.8" height="9" rx=".9" fill={c} />
      <circle cx="12" cy="17.6" r="2.3" fill={c} />
      <path d="M16.6 5h1.8M16.6 8h1.8M16.6 11h1.8" stroke={W} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  vet: () => (
    <>
      <path d="M6.5 3.6v4.9a5 5 0 0 0 10 0V3.6" stroke={W} strokeWidth="2.1" fill="none" strokeLinecap="round" />
      <path d="M11.5 13.5v2.4a4.5 4.5 0 0 0 9 0v-1.3" stroke={W} strokeWidth="2.1" fill="none" strokeLinecap="round" />
      <circle cx="20.5" cy="12.4" r="2.5" fill={W} />
      <circle cx="6.5" cy="3.2" r="1.4" fill={W} />
      <circle cx="16.5" cy="3.2" r="1.4" fill={W} />
    </>
  ),
  other: (c) => (
    <>
      <rect x="4.6" y="2.8" width="14.8" height="18.4" rx="3.2" fill={W} />
      <rect x="7.8" y="7.6" width="8.4" height="1.7" rx=".85" fill={c} fillOpacity=".45" />
      <rect x="7.8" y="11.2" width="8.4" height="1.7" rx=".85" fill={c} fillOpacity=".45" />
      <rect x="7.8" y="14.8" width="5.2" height="1.7" rx=".85" fill={c} fillOpacity=".45" />
    </>
  ),
}

// Glifos de los botones de especies (muda, temperatura del terrario, actividad).
export const EXTRA: Record<'shed' | 'temperature' | 'activity', (c: string) => ReactNode> = {
  shed: (c) => (
    <>
      <path d="M19.6 3.4C11.4 3.6 4.8 10 5 19l.2.2c9 .2 15.4-6.4 14.4-15.8z" fill={W} />
      <path d="M4 20.2 16.8 7.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.4 14.8l-3-.6M12.2 12l-2.8-1.4M14.8 9.4l-2.4-2M11.4 15.6l.8 2.6M14 13l1.4 2.4M16.6 10.4l1.8 1.8" stroke={c} strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  temperature: () => (
    <>
      <circle cx="12" cy="12" r="4.6" fill={W} />
      <path
        d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M5.4 18.6l1.8-1.8M16.8 7.2l1.8-1.8"
        stroke={W}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </>
  ),
  activity: () => <path d="M13.8 2.4 5.2 13.6h5.9l-1.2 8 8.9-11.6h-5.9z" fill={W} strokeLinejoin="round" />,
}

export const DEFAULT_EMOJI = new Map<string, string>(BUILTIN_TYPES.map((t) => [t.key, t.emoji]))

export function TypeIcon({ k, emoji, size = 40 }: { k: EventKey; emoji?: string; size?: number | string }) {
  const id = useId().replace(/:/g, '')
  // Tarjeta tintada (clara u oscura según el tema) con la ilustración del tipo encima.
  return (
    <svg className="ticon ticon2" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={tintVars(k, emoji) as CSSProperties}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--c1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--c2)' }} />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE} fill={`url(#g${id})`} />
      <path d={SQUIRCLE} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" transform="translate(.5 .5) scale(.975)" />
      <TypeArt k={k} emoji={emoji} box={{ x: 3, y: 3, size: 34 }} />
    </svg>
  )
}

/** Icono de app genérico (ajustes, menús): squircle con degradado y glifo blanco en rejilla de 24. */
export function AppIcon({ colors, children, size = 32 }: { colors: Pal; children: ReactNode; size?: number | string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="ticon" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE} fill={`url(#a${id})`} />
      <g transform="translate(8 8)">{children}</g>
    </svg>
  )
}

export const APP_GLYPHS = {
  theme: (
    <>
      <circle cx="12" cy="12" r="8.4" fill="none" stroke={W} strokeWidth="2.2" />
      <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill={W} />
    </>
  ),
  tap: (
    <path
      d="M9.6 12.4V5.2a1.9 1.9 0 0 1 3.8 0v5.6l4.4.9c1.5.3 2.5 1.7 2.3 3.2l-.6 4.3c-.2 1.1-1.1 1.8-2.2 1.8h-5.6c-.8 0-1.5-.4-1.9-1l-3.7-5.4a1.7 1.7 0 0 1 2.6-2.2z"
      fill={W}
    />
  ),
  backup: (
    <>
      <path d="M4 14.5v2.8A2.7 2.7 0 0 0 6.7 20h10.6a2.7 2.7 0 0 0 2.7-2.7v-2.8" stroke={W} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M12 3.5v10.5M7.6 9.8 12 14.2l4.4-4.4" stroke={W} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  privacy: (
    <>
      <rect x="5" y="10.4" width="14" height="10.6" rx="2.8" fill={W} />
      <path d="M8.4 10.6V8a3.6 3.6 0 0 1 7.2 0v2.6" stroke={W} strokeWidth="2.2" fill="none" />
    </>
  ),
  share: (
    <>
      <circle cx="9" cy="8.6" r="3.3" fill={W} />
      <path d="M2.8 19.4c.5-3.5 3.1-5.6 6.2-5.6s5.7 2.1 6.2 5.6z" fill={W} />
      <circle cx="16.6" cy="9.4" r="2.6" fill={W} fillOpacity=".75" />
      <path d="M15.4 13.9c3.2-.6 5.6 1.4 6 4.6h-4.3" fill={W} fillOpacity=".75" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M9.5 7V5h5v2" stroke={W} strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.6h11l-.9 10.4a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8z" fill={W} />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" fill={W} />
      <circle cx="9" cy="11" r="2.2" fill="#000" fillOpacity=".18" />
      <path d="M6 16.2c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13.2h3" stroke="#000" strokeOpacity=".18" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="8" stroke={W} strokeWidth="2" fill="none" />
      <path d="M4.5 12h15M12 4c2.4 2.3 3.4 5 3.4 8s-1 5.7-3.4 8c-2.4-2.3-3.4-5-3.4-8s1-5.7 3.4-8z" stroke={W} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
    </>
  ),
  premium: (
    <>
      <path d="M4 9.2 7.8 12 12 5.5 16.2 12 20 9.2 18.3 18H5.7z" fill={W} strokeLinejoin="round" />
      <rect x="5.7" y="18.6" width="12.6" height="1.9" rx=".9" fill={W} fillOpacity=".8" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 8h14M5 16h14" stroke={W} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="15" cy="8" r="2.8" fill={W} />
      <circle cx="9" cy="16" r="2.8" fill={W} />
    </>
  ),
}

export const APP_COLORS: Record<keyof typeof APP_GLYPHS, Pal> = {
  theme: ['#8a93a8', '#4f5a73'],
  tap: ['#ffb36b', '#ff8a2b'],
  backup: ['#6fd0ff', '#2a8fef'],
  privacy: ['#7fdcae', '#2fae6f'],
  trash: ['#ff8c80', '#ec4a3c'],
  share: ['#ffa3c4', '#e7558f'],
  card: ['#ffc56b', '#f59a21'],
  sliders: ['#b9a2ff', '#8460ef'],
  language: ['#7cc4ff', '#3b7be8'],
  premium: ['#ffd76a', '#f0a500'],
}

export function SettingIcon({ name, size = 32 }: { name: keyof typeof APP_GLYPHS; size?: number | string }) {
  return (
    <AppIcon colors={APP_COLORS[name]} size={size}>
      {APP_GLYPHS[name]}
    </AppIcon>
  )
}
