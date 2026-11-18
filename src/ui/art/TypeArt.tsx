/**
 * Ilustraciones de los tipos de registro (botones de Hoy, listas, informe en pantalla).
 *
 * Estilo común: objeto con volumen suave, luz desde arriba a la izquierda, brillo especular y sombra de contacto.
 * Caja de 100×100. Dibujadas a mano para PetLog (sin librerías ni recursos externos).
 */
import { useId, type ReactNode } from 'react'
import type { EventKey } from '../../domain/types'

/** Tonos de la tarjeta de cada tipo: [claro arriba, claro abajo, oscuro arriba, oscuro abajo, tinta del nombre en claro]. */
export const ART_TINT: Record<string, [string, string, string, string, string]> = {
  medication: ['#eef0ff', '#dfe3ff', '#262d5c', '#1b2047', '#2a36a8'],
  vomit: ['#eef8e4', '#ddf0cb', '#1f3a1d', '#162b15', '#2d6a1c'],
  stool: ['#f8efe6', '#efdfcd', '#3a2a1f', '#2a1e16', '#7a4a22'],
  food: ['#fff5df', '#ffe8b8', '#3f3016', '#2e2210', '#9a5a08'],
  water: ['#e6f6ff', '#cdeaff', '#12324a', '#0c2335', '#0f5f9e'],
  weight: ['#f2ecff', '#e3d8ff', '#2d2450', '#211a3c', '#5b37c4'],
  mood: ['#ffeef4', '#ffdbe7', '#46202f', '#331722', '#b0245a'],
  symptom: ['#fff0ec', '#ffddd5', '#47231d', '#331914', '#b23a26'],
  vet: ['#e5f8f6', '#ccefec', '#123b39', '#0c2b2a', '#11706c'],
  other: ['#f1f3f6', '#e2e6ec', '#2b3139', '#1f242b', '#46505c'],
  shed: ['#fbf6dd', '#f2e8b5', '#3a341a', '#2a2512', '#7a6514'],
  temperature: ['#fff2e3', '#ffe0c0', '#47291a', '#341d12', '#b04a0c'],
  activity: ['#faeeff', '#f0d9ff', '#3c2148', '#2b1734', '#8a2bb8'],
  pee: ['#fff9df', '#fff0b0', '#3e3714', '#2d280e', '#8a6a00'],
  bath: ['#e9f9ff', '#d3f0ff', '#14374a', '#0e2836', '#14678e'],
  injection: ['#eef4ff', '#dce8ff', '#1d2b4a', '#152036', '#2a4fae'],
  sleep: ['#eef0ff', '#dde0fb', '#1f2244', '#161832', '#3e43a6'],
  bone: ['#fbf5ec', '#f2e6d3', '#3a3024', '#2a2219', '#7a5a2e'],
  custom: ['#f3efff', '#e6deff', '#2c2547', '#201b35', '#5a3fb8'],
}

export type ArtKey = Exclude<EventKey, 'custom'> | 'pee' | 'bath' | 'injection' | 'sleep' | 'bone'

/** Emojis frecuentes en botones propios que tienen ilustración propia. */
const EMOJI_ART: Record<string, ArtKey> = {
  '🚽': 'pee', '💦': 'pee', '🟡': 'pee', '🚰': 'pee', '💛': 'pee',
  '🛁': 'bath', '🧼': 'bath', '🚿': 'bath', '🫧': 'bath',
  '💉': 'injection',
  '😴': 'sleep', '💤': 'sleep', '🛏️': 'sleep', '🌙': 'sleep',
  '🦴': 'bone', '🍖': 'bone',
  '💊': 'medication', '🤮': 'vomit', '🤢': 'vomit', '💩': 'stool', '🍽️': 'food', '🥣': 'food', '💧': 'water',
  '⚖️': 'weight', '❤️': 'mood', '🌡️': 'symptom', '🩺': 'vet', '📝': 'other', '🦎': 'shed', '🪶': 'shed',
  '☀️': 'temperature', '🔥': 'temperature', '⚡': 'activity', '🐾': 'activity', '🦮': 'activity', '🎾': 'activity',
}

/** Qué ilustración corresponde a un botón: la de su tipo o, en botones propios, la de su emoji si la hay. */
export function artFor(k: EventKey, emoji?: string): ArtKey | null {
  if (k !== 'custom') {
    // Si el usuario cambió el emoji de un botón de serie y hay ilustración para él, se usa esa.
    if (emoji && EMOJI_ART[emoji] && EMOJI_ART[emoji] !== k) return EMOJI_ART[emoji]
    return k
  }
  return (emoji && EMOJI_ART[emoji]) || null
}

type Defs = (id: (n: string) => string) => ReactNode
interface Art {
  defs: Defs
  body: (u: (n: string) => string) => ReactNode
}

const lin = (id: string, a: string, b: string, x2 = 1, y2 = 1) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    <stop offset="0" stopColor={a} />
    <stop offset="1" stopColor={b} />
  </linearGradient>
)
const rad = (id: string, a: string, b: string, cx = 0.35, cy = 0.3) => (
  <radialGradient id={id} cx={cx} cy={cy} r="0.8">
    <stop offset="0" stopColor={a} />
    <stop offset="1" stopColor={b} />
  </radialGradient>
)
const shadow = (rx = 28, cx = 50, cy = 90) => <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.14} fill="#1b1030" opacity=".16" />
const gloss = (d: string, o = 0.55) => <path d={d} fill="#fff" opacity={o} />

const ARTS: Record<ArtKey, Art> = {
  medication: {
    defs: (u) => (
      <>
        {lin(u('blue'), '#8e9bff', '#3c4fe0')}
        {lin(u('white'), '#ffffff', '#dde2f4')}
        {lin(u('tab'), '#ffffff', '#e6e9f7')}
        {lin(u('side'), '#cfd5ee', '#a3acd8', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        {shadow(34)}
        {/* comprimido detrás */}
        <ellipse cx="66" cy="36" rx="22" ry="14" fill={`url(#${u('side')})`} transform="translate(0 6)" />
        <rect x="44" y="36" width="44" height="6" fill={`url(#${u('side')})`} />
        <ellipse cx="66" cy="36" rx="22" ry="14" fill={`url(#${u('tab')})`} />
        <path d="M52 35.5h28" stroke="#c3c9e6" strokeWidth="2.4" strokeLinecap="round" />
        {/* cápsula delante */}
        <g transform="rotate(-36 46 62)">
          <rect x="6" y="46" width="80" height="33" rx="16.5" fill={`url(#${u('white')})`} />
          <path d="M46 46v33H22.5a16.5 16.5 0 0 1 0-33z" fill={`url(#${u('blue')})`} />
          <path d="M46 46v33" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" />
          <rect x="14" y="51" width="62" height="6.5" rx="3.25" fill="#fff" opacity=".55" />
          <rect x="12" y="70" width="68" height="3.5" rx="1.75" fill="#1b1f60" opacity=".08" />
        </g>
      </>
    ),
  },
  vomit: {
    defs: (u) => (
      <>
        {lin(u('st'), '#b5e98a', '#4a9a2a')}
        {lin(u('dr'), '#c9f0a4', '#6bb83e', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        {shadow(30)}
        {/* estómago */}
        <path
          d="M40 12c4 0 6 3 6 7 0 6 1 9 5 11 4 2 9 1 14 2 13 3 21 14 21 28 0 18-15 29-33 29-17 0-29-10-29-24 0-9 6-14 11-17 5-3 6-6 5-12-1-7-6-11-6-17 0-4 3-7 6-7z"
          fill={`url(#${u('st')})`}
        />
        {gloss('M30 52c3-6 9-8 15-8-6 3-10 6-12 12-1 3-4 1-3-4z', 0.5)}
        {/* remolino de náusea */}
        <path d="M57 63c-1-6 7-9 10-4 3 5-2 11-9 11-9 0-13-9-9-16 4-7 14-9 21-4" stroke="#fff" strokeWidth="4.2" fill="none" strokeLinecap="round" opacity=".92" />
        {/* gotas */}
        <path d="M80 18c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" fill={`url(#${u('dr')})`} />
        <path d="M89 34c2 2.6 3 4.4 3 5.6a3 3 0 0 1-6 0c0-1.2 1-3 3-5.6z" fill={`url(#${u('dr')})`} />
        <ellipse cx="78.5" cy="26" rx="1.3" ry="2" fill="#fff" opacity=".7" />
      </>
    ),
  },
  stool: {
    defs: (u) => (
      <>
        {lin(u('a'), '#d9a06a', '#86512a')}
        {lin(u('b'), '#cf9560', '#7a4a24')}
        {lin(u('c'), '#c68a55', '#6e421f')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(34)}
        <path d="M14 76c0-9 8-15 18-15h36c10 0 18 6 18 15 0 8-8 12-18 12H32c-10 0-18-4-18-12z" fill={`url(#${u('a')})`} />
        <path d="M24 59c0-8 7-13 15-13h22c8 0 15 5 15 13 0 6-6 8-14 8H38c-8 0-14-2-14-8z" fill={`url(#${u('b')})`} />
        <path d="M34 43c0-7 6-11 13-11 4 0 5-6 3-12 9 2 16 9 16 16 0 6-4 10-11 10H44c-6 0-10-1-10-3z" fill={`url(#${u('c')})`} />
        {gloss('M22 72c2-4 6-6 11-6-4 2-6 4-7 7-1 2-5 2-4-1z', 0.42)}
        {gloss('M31 55c2-3 5-5 9-5-3 2-5 3-6 6-1 1-4 1-3-1z', 0.42)}
        {gloss('M40 38c1-3 4-4 7-4-2 1-4 3-4 5-1 1-3 1-3-1z', 0.45)}
      </>
    ),
  },
  food: {
    defs: (u) => (
      <>
        {lin(u('bowl'), '#ffc75c', '#ee7d0e', 0, 1)}
        {lin(u('rim'), '#ffe6a6', '#ffcf6b', 0, 1)}
        {rad(u('k1'), '#d99a52', '#8a4e1c')}
        {rad(u('k2'), '#c98840', '#73401a')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(36)}
        {/* pienso */}
        {[
          [36, 47, 7], [48, 42, 7.5], [61, 45, 7], [42, 53, 7], [55, 52, 7.5], [68, 52, 6.5], [30, 55, 6], [49, 34, 6.5], [60, 37, 6],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={`url(#${u(i % 2 ? 'k2' : 'k1')})`} />
        ))}
        {[
          [34, 44], [46, 39], [59, 42], [53, 49], [47, 31],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill="#fff" opacity=".5" />
        ))}
        {/* cuenco */}
        <ellipse cx="50" cy="58" rx="38" ry="10" fill={`url(#${u('rim')})`} />
        <path d="M12 58c1 18 17 30 38 30s37-12 38-30c-6 6-20 9-38 9s-32-3-38-9z" fill={`url(#${u('bowl')})`} />
        <path d="M18 70c6 7 17 11 32 11" stroke="#fff" strokeOpacity=".45" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* huella */}
        <g fill="#fff" opacity=".75" transform="translate(62 70)">
          <ellipse cx="6" cy="7" rx="4" ry="3.2" />
          <circle cx="1.6" cy="2.6" r="1.6" />
          <circle cx="5" cy="0.6" r="1.6" />
          <circle cx="8.8" cy="1" r="1.6" />
          <circle cx="11.4" cy="3.6" r="1.6" />
        </g>
      </>
    ),
  },
  water: {
    defs: (u) => (
      <>
        {lin(u('d'), '#9ae6ff', '#1f7fe0')}
        {lin(u('p'), '#bfeeff', '#62c1f7', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        <ellipse cx="50" cy="86" rx="32" ry="6" fill={`url(#${u('p')})`} opacity=".7" />
        <ellipse cx="50" cy="86" rx="20" ry="3.6" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M50 8c3 5 30 37 30 56a30 30 0 0 1-60 0C20 45 47 13 50 8z" fill={`url(#${u('d')})`} />
        <path d="M36 66c-1-10 4-20 10-28" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".6" />
        <circle cx="36" cy="76" r="3.4" fill="#fff" opacity=".55" />
        <path d="M62 82c6-3 10-9 11-16" stroke="#0b4f9c" strokeOpacity=".22" strokeWidth="4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  weight: {
    defs: (u) => (
      <>
        {lin(u('b'), '#c9b0ff', '#6f45e0')}
        {lin(u('t'), '#e3d6ff', '#b39af7', 0, 1)}
        {lin(u('w'), '#ffffff', '#ecebfa', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        {shadow(36)}
        <rect x="14" y="30" width="72" height="56" rx="16" fill={`url(#${u('b')})`} />
        <rect x="18" y="33" width="64" height="47" rx="13" fill={`url(#${u('t')})`} />
        <path d="M32 58a18 18 0 0 1 36 0z" fill={`url(#${u('w')})`} />
        {[-60, -30, 0, 30, 60].map((a) => (
          <rect key={a} x="49.2" y="42.5" width="1.6" height="4.5" rx=".8" fill="#8f7ad6" transform={`rotate(${a} 50 58)`} />
        ))}
        <path d="M50 58 61 46" stroke="#ff5a7a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="58" r="3.6" fill="#4a2aa8" />
        {gloss('M22 40c2-4 6-5 11-5-4 2-6 4-7 7-1 2-5 1-4-2z', 0.5)}
        <rect x="24" y="84" width="10" height="4" rx="2" fill="#4a2aa8" opacity=".55" />
        <rect x="66" y="84" width="10" height="4" rx="2" fill="#4a2aa8" opacity=".55" />
      </>
    ),
  },
  mood: {
    defs: (u) => <>{lin(u('h'), '#ffa8c6', '#e23472')}</>,
    body: (u) => (
      <>
        {shadow(30)}
        <path d="M50 86C22 68 10 52 10 36a20 20 0 0 1 40-7 20 20 0 0 1 40 7c0 16-12 32-40 50z" fill={`url(#${u('h')})`} />
        {gloss('M20 34c1-8 7-13 15-13-6 3-9 7-10 13-1 4-6 5-5 0z', 0.6)}
        <path d="M22 50h14l5-9 8 20 6-14 4 6h19" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M84 12l1.8 4.6 4.6 1.8-4.6 1.8L84 24.8l-1.8-4.6-4.6-1.8 4.6-1.8z" fill="#ff8ab0" />
      </>
    ),
  },
  symptom: {
    defs: (u) => (
      <>
        {lin(u('g'), '#ffffff', '#dfe5ee')}
        {lin(u('r'), '#ff9b8a', '#e03a26')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(24)}
        <g transform="rotate(32 50 50)">
          <rect x="40" y="6" width="20" height="66" rx="10" fill={`url(#${u('g')})`} stroke="#c9d1dd" strokeWidth="1.2" />
          {[18, 26, 34, 42, 50].map((y) => (
            <rect key={y} x={y % 16 === 2 ? 52 : 54} y={y} width={y % 16 === 2 ? 6 : 4} height="1.6" rx=".8" fill="#9aa6b6" />
          ))}
          <rect x="46" y="28" width="8" height="50" rx="4" fill={`url(#${u('r')})`} />
          <circle cx="50" cy="80" r="15" fill={`url(#${u('r')})`} />
          {gloss('M43 76c1-5 4-7 8-8-3 2-4 4-5 7-1 2-3 3-3 1z', 0.6)}
          <rect x="43" y="10" width="4" height="56" rx="2" fill="#fff" opacity=".8" />
        </g>
      </>
    ),
  },
  vet: {
    defs: (u) => (
      <>
        {lin(u('t'), '#5fd8cf', '#0f8b86', 0, 1)}
        {rad(u('m'), '#ffffff', '#a8b4bc')}
        {lin(u('c'), '#3cc4ba', '#0b6f6b')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(30)}
        <g transform="translate(9 9) scale(.86)">
        <path d="M28 14v22c0 14 9 24 21 24s21-10 21-24V14" stroke={`url(#${u('t')})`} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M49 60v8c0 10 7 16 15 16" stroke={`url(#${u('t')})`} strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="28" cy="12" r="5" fill="#2b3a46" />
        <circle cx="70" cy="12" r="5" fill="#2b3a46" />
        <circle cx="70" cy="76" r="15" fill={`url(#${u('m')})`} />
        <circle cx="70" cy="76" r="9" fill={`url(#${u('c')})`} />
        {gloss('M61 70c1-3 4-5 7-5-2 1-4 3-4 5-1 1-3 1-3 0z', 0.75)}
        </g>
      </>
    ),
  },
  other: {
    defs: (u) => (
      <>
        {lin(u('p'), '#ffffff', '#e4e8ef')}
        {lin(u('h'), '#a9b4c2', '#66727f', 0, 1)}
        {lin(u('y'), '#ffd864', '#f2a516', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        {shadow(30)}
        <rect x="20" y="14" width="54" height="72" rx="9" fill={`url(#${u('p')})`} stroke="#d3d9e2" strokeWidth="1.2" />
        <path d="M20 23a9 9 0 0 1 9-9h36a9 9 0 0 1 9 9v5H20z" fill={`url(#${u('h')})`} />
        {[30, 42, 54].map((x) => (
          <rect key={x} x={x} y="9" width="4" height="12" rx="2" fill="#4b5663" />
        ))}
        {[40, 50, 60, 70].map((y, i) => (
          <rect key={y} x="28" y={y} width={i === 3 ? 22 : 38} height="3" rx="1.5" fill="#c7cfda" />
        ))}
        <g transform="rotate(38 72 62)">
          <rect x="66" y="26" width="12" height="46" rx="2" fill={`url(#${u('y')})`} />
          <rect x="66" y="22" width="12" height="7" rx="2" fill="#ff8fa3" />
          <rect x="66" y="28" width="12" height="3" fill="#c7cfda" />
          <path d="M66 72h12l-6 11z" fill="#f5dcb4" />
          <path d="M70 79.5h4l-2 3.5z" fill="#3b3b3b" />
        </g>
      </>
    ),
  },
  shed: {
    defs: (u) => <>{lin(u('f'), '#f6e79c', '#b8902a')}</>,
    body: (u) => (
      <>
        {shadow(24, 46)}
        <path d="M74 10C48 14 26 38 26 62c0 8 3 15 8 20 22-6 42-30 44-56 0-6-1-11-4-16z" fill={`url(#${u('f')})`} />
        <path d="M30 84C40 62 54 40 72 16" stroke="#8a6a12" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {[
          'M40 66c-4-2-6-6-6-10', 'M47 56c-4-2-6-6-6-10', 'M54 46c-4-2-5-6-5-10', 'M44 70c5 0 9-2 12-5', 'M51 60c5 0 9-2 12-5', 'M58 50c5 0 8-2 11-5',
        ].map((d) => (
          <path key={d} d={d} stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" fill="none" />
        ))}
      </>
    ),
  },
  temperature: {
    defs: (u) => (
      <>
        {rad(u('s'), '#ffe08a', '#ff7a1c')}
        {lin(u('r'), '#ffc35a', '#ff8a2a')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(26)}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="46.5" y="6" width="7" height="15" rx="3.5" fill={`url(#${u('r')})`} transform={`rotate(${i * 45} 50 48)`} />
        ))}
        <circle cx="50" cy="48" r="24" fill={`url(#${u('s')})`} />
        {gloss('M36 42c2-7 7-11 14-12-5 3-8 7-9 12-1 3-5 3-5 0z', 0.6)}
      </>
    ),
  },
  activity: {
    defs: (u) => <>{lin(u('p'), '#eab0ff', '#9a36dc')}</>,
    body: (u) => (
      <>
        {shadow(28, 54)}
        <path d="M10 52h14M6 62h16M12 72h12" stroke="#c77ce9" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        <g fill={`url(#${u('p')})`}>
          <path d="M56 50c11 0 22 11 22 22 0 9-7 12-12 12-4 0-6-3-10-3s-6 3-10 3c-5 0-12-3-12-12 0-11 11-22 22-22z" />
          <ellipse cx="36" cy="40" rx="7.5" ry="9.5" transform="rotate(-20 36 40)" />
          <ellipse cx="49" cy="28" rx="7.5" ry="10" transform="rotate(-6 49 28)" />
          <ellipse cx="64" cy="28" rx="7.5" ry="10" transform="rotate(8 64 28)" />
          <ellipse cx="76" cy="41" rx="7.5" ry="9.5" transform="rotate(22 76 41)" />
        </g>
        {gloss('M42 64c2-5 6-8 11-8-4 2-6 5-7 8-1 2-4 2-4 0z', 0.5)}
        {gloss('M46 24c1-2 2-4 4-4-1 1-2 3-2 5 0 1-2 1-2-1z', 0.6)}
      </>
    ),
  },
  pee: {
    defs: (u) => (
      <>
        {lin(u('d'), '#ffe98a', '#e3a10c')}
        {lin(u('p'), '#fff3b8', '#f5cf4a', 0, 1)}
      </>
    ),
    body: (u) => (
      <>
        <ellipse cx="50" cy="84" rx="34" ry="7" fill={`url(#${u('p')})`} opacity=".85" />
        <ellipse cx="44" cy="83" rx="12" ry="2.2" fill="#fff" opacity=".6" />
        <path d="M50 10c3 5 26 33 26 50a26 26 0 0 1-52 0C24 43 47 15 50 10z" fill={`url(#${u('d')})`} />
        <path d="M38 62c-1-9 3-17 8-24" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity=".6" />
        <circle cx="38" cy="72" r="3" fill="#fff" opacity=".55" />
      </>
    ),
  },
  bath: {
    defs: (u) => (
      <>
        {rad(u('b'), '#ffffff', '#a9dcf6', 0.32, 0.28)}
        {lin(u('s'), '#ffb3d0', '#f0679c')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(32)}
        <g transform="rotate(-12 44 70)">
          <rect x="18" y="56" width="52" height="26" rx="10" fill={`url(#${u('s')})`} />
          {gloss('M24 62c3-3 8-4 14-4-5 2-8 4-10 6-2 2-5 1-4-2z', 0.55)}
        </g>
        {[
          [62, 44, 16], [36, 34, 12], [76, 22, 9], [54, 18, 7], [24, 54, 7],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={`url(#${u('b')})`} opacity=".92" stroke="#7cc8ef" strokeOpacity=".5" />
            <path d={`M${x - r * 0.45} ${y - r * 0.15}a${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.4}-${r * 0.38}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </g>
        ))}
      </>
    ),
  },
  injection: {
    defs: (u) => (
      <>
        {lin(u('g'), '#ffffff', '#d7e2f5')}
        {lin(u('l'), '#8fb4ff', '#3b6ef0')}
      </>
    ),
    body: (u) => (
      <>
        {shadow(30)}
        <g transform="rotate(-45 50 50)">
          <rect x="47" y="2" width="6" height="12" rx="2" fill="#5a6b85" />
          <rect x="38" y="12" width="24" height="5" rx="2.5" fill="#5a6b85" />
          <rect x="40" y="17" width="20" height="50" rx="5" fill={`url(#${u('g')})`} stroke="#b9c7de" strokeWidth="1.2" />
          <rect x="42" y="38" width="16" height="27" rx="3" fill={`url(#${u('l')})`} />
          {[24, 30, 36, 42, 48, 54].map((y) => (
            <rect key={y} x="53" y={y} width="5" height="1.4" rx=".7" fill="#7f8da6" />
          ))}
          <rect x="47" y="67" width="6" height="5" fill="#9aa8bd" />
          <rect x="49.2" y="72" width="1.6" height="20" rx=".8" fill="#9aa8bd" />
          <rect x="43" y="20" width="3" height="42" rx="1.5" fill="#fff" opacity=".85" />
        </g>
      </>
    ),
  },
  sleep: {
    defs: (u) => <>{lin(u('m'), '#c3c8ff', '#5a62e0')}</>,
    body: (u) => (
      <>
        {shadow(26, 46)}
        <path d="M58 16A34 34 0 1 0 84 66 28 28 0 0 1 58 16z" fill={`url(#${u('m')})`} />
        {gloss('M30 40c3-9 10-15 18-17-6 4-11 10-13 17-1 4-6 4-5 0z', 0.5)}
        <circle cx="40" cy="62" r="3.5" fill="#4a52c8" opacity=".25" />
        <circle cx="54" cy="70" r="2.4" fill="#4a52c8" opacity=".25" />
        <text x="70" y="30" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" fill="#6a70e8">
          z
        </text>
        <text x="80" y="18" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="11" fill="#8a8ff0">
          z
        </text>
      </>
    ),
  },
  bone: {
    defs: (u) => <>{lin(u('b'), '#fffaf0', '#dcc6a0')}</>,
    body: (u) => (
      <>
        {shadow(34)}
        <g transform="rotate(-28 50 54)" fill={`url(#${u('b')})`} stroke="#c9ad82" strokeWidth="1.2">
          <circle cx="20" cy="44" r="11" />
          <circle cx="20" cy="64" r="11" />
          <circle cx="80" cy="44" r="11" />
          <circle cx="80" cy="64" r="11" />
          <rect x="20" y="44" width="60" height="20" rx="4" stroke="none" />
        </g>
        <g transform="rotate(-28 50 54)">
          <rect x="24" y="47" width="46" height="4" rx="2" fill="#fff" opacity=".7" />
          <circle cx="16" cy="40" r="3" fill="#fff" opacity=".7" />
        </g>
      </>
    ),
  },
}

const pos = (b?: { x: number; y: number; size: number }) => (b ? { x: b.x, y: b.y, width: b.size, height: b.size } : {})

/** Ilustración suelta (sin fondo). Si no hay ilustración (botón propio con otro emoji), dibuja el emoji. */
export function TypeArt({ k, emoji, className, box }: { k: EventKey; emoji?: string; className?: string; box?: { x: number; y: number; size: number } }) {
  const u0 = useId().replace(/:/g, '')
  const u = (n: string) => `${u0}${n}`
  const key = artFor(k, emoji)
  if (!key) {
    return (
      <svg className={className} viewBox="0 0 100 100" aria-hidden="true" {...pos(box)}>
        {shadow(26)}
        <circle cx="50" cy="50" r="34" fill="#fff" opacity=".55" />
        <text x="50" y="53" textAnchor="middle" dominantBaseline="central" fontSize="44">
          {emoji ?? '⭐'}
        </text>
      </svg>
    )
  }
  const a = ARTS[key]
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" {...pos(box)}>
      <defs>{a.defs(u)}</defs>
      {a.body(u)}
    </svg>
  )
}

/** Tinte de la tarjeta para un botón (variables CSS que usa .tile y .ticon2). */
export function tintVars(k: EventKey, emoji?: string): Record<string, string> {
  const t = ART_TINT[artFor(k, emoji) ?? 'custom'] ?? ART_TINT.custom
  return { '--l1': t[0], '--l2': t[1], '--d1': t[2], '--d2': t[3], '--tink': t[4] }
}
