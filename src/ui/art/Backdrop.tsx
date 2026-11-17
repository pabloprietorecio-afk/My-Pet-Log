/**
 * Fondos ilustrados por pantalla: degradado pastel, manchas de color suaves y un «papel de regalo»
 * de huellas, huesos, peces, ovillos, corazones y estrellas, con gatos y perros asomándose.
 * Todo es SVG propio. Los colores salen de variables CSS (cambian en modo oscuro).
 * La pantalla Hoy se anima suavemente (y se queda quieta si el sistema pide reducir movimiento).
 */
import { memo, type ReactNode } from 'react'
import { Face, type PetKind } from './pets'

export type Scene = 'today' | 'history' | 'meds' | 'charts' | 'report' | 'settings' | 'home' | 'form'

const VW = 390
const VH = 844

// ─── Piezas (centradas en 0,0; ~24 de ancho) ─────────────────────────────

const Paw = ({ f }: { f: string }) => (
  <g fill={f}>
    <path d="M-6.2 4.2c0-4.1 3-7.2 6.2-7.2s6.2 3.1 6.2 7.2S3.3 9.4 0 9.4-6.2 8.3-6.2 4.2z" />
    <ellipse cx="-7.8" cy="-4.2" rx="2.6" ry="3.1" transform="rotate(-20 -7.8 -4.2)" />
    <ellipse cx="-2.9" cy="-8.8" rx="2.6" ry="3.2" />
    <ellipse cx="2.9" cy="-8.8" rx="2.6" ry="3.2" />
    <ellipse cx="7.8" cy="-4.2" rx="2.6" ry="3.1" transform="rotate(20 7.8 -4.2)" />
  </g>
)
const Bone = ({ f }: { f: string }) => (
  <g fill={f}>
    <circle cx="-10" cy="-3.1" r="3.6" />
    <circle cx="-10" cy="3.1" r="3.6" />
    <circle cx="10" cy="-3.1" r="3.6" />
    <circle cx="10" cy="3.1" r="3.6" />
    <rect x="-10.5" y="-2.8" width="21" height="5.6" rx="1" />
  </g>
)
const Fish = ({ f }: { f: string }) => (
  <g fill={f}>
    <ellipse cx="-2.5" cy="0" rx="9.5" ry="6" />
    <path d="M5.5 0 13.5-6.2v12.4z" />
    <circle cx="-7" cy="-1.2" r="1.3" fill="#fff" opacity=".9" />
  </g>
)
const Yarn = ({ f }: { f: string }) => (
  <g>
    <path d="M7 6.5q9 4 5 11t5 9" stroke={f} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <circle r="9.5" fill={f} />
    <path d="M-8-3.5q8-6.5 15.5 1.5M-9 2q9-6 17 3M-5.5 7.5Q1 1 6.5 8M-3-8.5q-3 8 1.5 17.5" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </g>
)
const Heart = ({ f }: { f: string }) => <path d="M0 8.5S-9 3.2-9-2.8A4.6 4.6 0 0 1 0-5a4.6 4.6 0 0 1 9 2.2c0 6-9 11.3-9 11.3z" fill={f} />
const Spark = ({ f }: { f: string }) => <path d="M0-9C1-2.2 2.2-1 9 0 2.2 1 1 2.2 0 9-1 2.2-2.2 1-9 0-2.2-1-1-2.2 0-9z" fill={f} />
const Ball = ({ f }: { f: string }) => (
  <g>
    <circle r="8.5" fill={f} />
    <path d="M-7.4-4.2q5 4.2 0 8.4M7.4-4.2q-5 4.2 0 8.4" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" fill="none" />
  </g>
)
const Dot = ({ f }: { f: string }) => <circle r="3.2" fill={f} />

const KINDS = { paw: Paw, bone: Bone, fish: Fish, yarn: Yarn, heart: Heart, spark: Spark, ball: Ball, dot: Dot } as const
type Kind = keyof typeof KINDS

/** Colores de los adornos: variables CSS para que el tema oscuro los ajuste. */
const DECO = ['var(--d1)', 'var(--d2)', 'var(--d3)', 'var(--d4)', 'var(--d5)', 'var(--d6)']

interface Pet {
  kind: PetKind
  x: number
  y: number
  s: number
  r: number
  fur?: string
  dark?: string
}

interface SceneDef {
  kinds: Kind[]
  pets: Pet[]
  seed: number
  /** Manchas de color grandes (x, y, radio, color). */
  blobs: [number, number, number, string][]
  animated?: boolean
}

const SCENES: Record<Scene, SceneDef> = {
  today: {
    seed: 7,
    kinds: ['paw', 'heart', 'spark', 'bone', 'paw', 'fish', 'dot', 'yarn'],
    pets: [
      { kind: 'cat', x: 300, y: 800, s: 2.3, r: -8 },
      { kind: 'dog', x: 40, y: 470, s: 1.6, r: 12, fur: '#f9e1bd', dark: '#b97c4b' },
    ],
    blobs: [
      [40, 90, 190, 'var(--b1)'],
      [380, 380, 210, 'var(--b2)'],
      [60, 760, 220, 'var(--b3)'],
    ],
    animated: true,
  },
  history: {
    seed: 21,
    kinds: ['spark', 'paw', 'dot', 'heart', 'paw', 'ball'],
    pets: [{ kind: 'rabbit', x: 352, y: 765, s: 1.9, r: -14 }],
    blobs: [
      [380, 120, 200, 'var(--b1)'],
      [0, 520, 230, 'var(--b2)'],
    ],
  },
  meds: {
    seed: 33,
    kinds: ['heart', 'spark', 'paw', 'dot', 'bone'],
    pets: [{ kind: 'dog', x: 330, y: 700, s: 2, r: -10 }],
    blobs: [
      [0, 200, 220, 'var(--b1)'],
      [390, 640, 230, 'var(--b2)'],
    ],
  },
  charts: {
    seed: 47,
    kinds: ['spark', 'dot', 'paw', 'fish', 'spark'],
    pets: [
      { kind: 'bird', x: 52, y: 790, s: 1.7, r: 10 },
      { kind: 'rodent', x: 345, y: 120, s: 1.1, r: -10 },
    ],
    blobs: [
      [390, 160, 210, 'var(--b1)'],
      [40, 600, 220, 'var(--b3)'],
    ],
  },
  report: {
    seed: 59,
    kinds: ['paw', 'spark', 'heart', 'dot', 'bone'],
    pets: [
      { kind: 'dog', x: 352, y: 470, s: 1.5, r: -10, fur: '#f3dbbd', dark: '#a8774d' },
      { kind: 'reptile', x: 46, y: 822, s: 1.7, r: 8 },
    ],
    blobs: [
      [0, 120, 200, 'var(--b2)'],
      [390, 560, 220, 'var(--b1)'],
    ],
  },
  settings: {
    seed: 71,
    kinds: ['paw', 'yarn', 'spark', 'bone', 'dot', 'heart'],
    pets: [
      { kind: 'cat', x: 110, y: 700, s: 2.4, r: -6 },
      { kind: 'dog', x: 290, y: 735, s: 2.5, r: 6, fur: '#f6dcb5', dark: '#c98c58' },
    ],
    blobs: [
      [390, 100, 200, 'var(--b1)'],
      [0, 470, 220, 'var(--b3)'],
    ],
  },
  home: {
    seed: 83,
    kinds: ['paw', 'heart', 'spark', 'bone', 'fish', 'yarn', 'ball'],
    pets: [
      { kind: 'cat', x: 70, y: 770, s: 2.2, r: 10 },
      { kind: 'dog', x: 320, y: 790, s: 2.4, r: -8 },
      { kind: 'bird', x: 345, y: 150, s: 1.15, r: -10 },
      { kind: 'rabbit', x: 40, y: 330, s: 1.15, r: 12 },
    ],
    blobs: [
      [60, 120, 220, 'var(--b1)'],
      [380, 420, 220, 'var(--b2)'],
      [100, 760, 230, 'var(--b3)'],
    ],
    animated: true,
  },
  form: {
    seed: 97,
    kinds: ['paw', 'spark', 'dot', 'heart'],
    pets: [
      { kind: 'dog', x: 335, y: 795, s: 1.8, r: -8 },
      { kind: 'rodent', x: 40, y: 640, s: 1.3, r: 10 },
    ],
    blobs: [
      [390, 200, 210, 'var(--b2)'],
      [0, 640, 220, 'var(--b1)'],
    ],
  },
}

/** Generador pseudoaleatorio estable (mismo dibujo en cada visita). */
function rng(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

interface Item {
  kind: Kind
  x: number
  y: number
  s: number
  r: number
  f: string
  o: number
  anim?: number
}

function layout(def: SceneDef): Item[] {
  const rand = rng(def.seed)
  const out: Item[] = []
  const cw = 78
  const ch = 74
  let n = 0
  for (let row = 0; row * ch < VH + ch; row++) {
    for (let col = 0; col * cw < VW + cw / 2; col++) {
      const x = col * cw + (row % 2 ? cw / 2 : 0) + (rand() - 0.5) * 34
      const y = row * ch + 20 + (rand() - 0.5) * 30
      // Sin adornos encima de las mascotas ni junto al nombre de la cabecera.
      if (def.pets.some((p) => Math.hypot(p.x - x, p.y - y) < 34 * p.s)) continue
      if (y < 70 && x < 250) continue
      const kind = def.kinds[Math.floor(rand() * def.kinds.length)]
      const big = kind === 'dot' ? 0.9 : 0.75 + rand() * 0.55
      out.push({
        kind,
        x,
        y,
        s: big,
        r: (rand() - 0.5) * 70,
        f: DECO[Math.floor(rand() * DECO.length)],
        // Más suaves en la franja de la cabecera, donde hay texto.
        o: (y < 80 ? 0.4 : 0.62) + rand() * 0.25,
        anim: def.animated && n++ % 3 === 0 ? Math.floor(rand() * 4) : undefined,
      })
    }
  }
  return out
}

const cache = new Map<Scene, Item[]>()

function At({ x, y, s, r, cls, delay, children }: { x: number; y: number; s: number; r: number; cls?: string; delay?: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${s.toFixed(2)})`}>
      <g className={cls} style={delay !== undefined ? { animationDelay: `${-delay}s` } : undefined}>
        {children}
      </g>
    </g>
  )
}

export const Backdrop = memo(function Backdrop({ scene }: { scene: Scene }) {
  const def = SCENES[scene]
  let items = cache.get(scene)
  if (!items) {
    items = layout(def)
    cache.set(scene, items)
  }
  const anim = !!def.animated
  return (
    <div className={`backdrop bd-${scene}${anim ? ' animated' : ''}`} aria-hidden="true">
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <defs>
          <linearGradient id={`bdg-${scene}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="var(--bA)" />
            <stop offset="1" stopColor="var(--bB)" />
          </linearGradient>
          {def.blobs.map(([, , , c], i) => (
            <radialGradient key={i} id={`bdb-${scene}-${i}`}>
              <stop offset="0" stopColor={c} stopOpacity=".95" />
              <stop offset=".6" stopColor={c} stopOpacity=".45" />
              <stop offset="1" stopColor={c} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <rect width={VW} height={VH} fill={`url(#bdg-${scene})`} />
        {def.blobs.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r={r} fill={`url(#bdb-${scene}-${i})`} className={anim ? `blob b${i}` : undefined} />
          </g>
        ))}
        <g className="deco">
          {items.map((it, i) => {
            const K = KINDS[it.kind]
            return (
              <g key={i} opacity={it.o}>
                <At x={it.x} y={it.y} s={it.s} r={it.r} cls={it.anim !== undefined ? `fl fl${it.anim}` : undefined} delay={it.anim !== undefined ? i * 0.7 : undefined}>
                  <K f={it.f} />
                </At>
              </g>
            )
          })}
        </g>
        <g className="pets">
          {def.pets.map((p, i) => (
            <At key={i} x={p.x - 32 * p.s} y={p.y - 32 * p.s} s={p.s} r={p.r} cls={anim ? 'bob' : undefined} delay={anim ? i * 1.3 : undefined}>
              <Face kind={p.kind} fur={p.fur} dark={p.dark} blink={anim} />
            </At>
          ))}
        </g>
      </svg>
    </div>
  )
})
