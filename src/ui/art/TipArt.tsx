/** Ilustraciones de las fichas de Consejos: una escena por tema, con la mascota asomándose. */
import type { ReactNode } from 'react'
import type { TipTopic } from '../../domain/tips'
import { Face, type PetKind } from './pets'


function Sparkles({ c }: { c: string }) {
  return (
    <g fill={c}>
      <path d="M200 26l2.2 5.8 5.8 2.2-5.8 2.2-2.2 5.8-2.2-5.8-5.8-2.2 5.8-2.2z" />
      <path d="M296 70l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" opacity=".8" />
      <circle cx="22" cy="150" r="3" opacity=".6" />
      <circle cx="186" cy="150" r="2.4" opacity=".6" />
      <circle cx="262" cy="20" r="2.6" opacity=".7" />
    </g>
  )
}

function Food() {
  return (
    <g>
      {/* pescado */}
      <g transform="translate(26 30) rotate(-12)">
        <path d="M6 18c8-12 28-14 40 0-12 14-32 12-40 0z" fill="#8fc8f0" />
        <path d="M46 18l12-9v18z" fill="#6aaee0" />
        <circle cx="16" cy="15" r="2.4" fill="#21425e" />
        <path d="M26 10c3 5 3 11 0 16" stroke="#6aaee0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
      {/* zanahoria */}
      <g transform="translate(140 30) rotate(28)">
        <path d="M10 14 30 14 21 66z" fill="#ff9a4d" />
        <path d="M13 26h9M15 38h7M17 50h5" stroke="#e97b2c" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 14c-6-10-2-14 0-14 2 0 6 4 0 14zM20 14c4-10 10-10 12-8s-2 8-12 8zM20 14c-4-10-10-10-12-8s2 8 12 8z" fill="#5fbf6a" />
      </g>
      {/* cuenco con pienso */}
      <g transform="translate(40 96)">
        <ellipse cx="50" cy="16" rx="46" ry="11" fill="#b06a3b" />
        <ellipse cx="50" cy="14" rx="40" ry="8" fill="#c98a4f" />
        <circle cx="34" cy="10" r="5" fill="#9a5a2c" />
        <circle cx="46" cy="7" r="5.4" fill="#a8663a" />
        <circle cx="58" cy="10" r="5" fill="#9a5a2c" />
        <circle cx="68" cy="7" r="4.6" fill="#a8663a" />
        <circle cx="40" cy="4" r="4.4" fill="#b8743f" />
        <path d="M4 16c0 22 20 34 46 34s46-12 46-34" fill="#ff7f8a" />
        <path d="M14 30c10 9 22 12 36 12" stroke="#ffffff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="70" cy="34" r="4" fill="#ffffff" opacity=".7" />
      </g>
      {/* gota */}
      <path d="M196 92c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" fill="#7ec8f4" />
      <path d="M190 112a6 6 0 0 0 6 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".8" />
    </g>
  )
}

function Hygiene() {
  return (
    <g>
      {/* burbujas */}
      {[
        [40, 40, 18],
        [80, 22, 10],
        [182, 36, 14],
        [210, 72, 8],
        [26, 96, 9],
        [154, 92, 11],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#ffffff" fillOpacity=".55" stroke="#9ad3ec" strokeWidth="2" />
          <path d={`M${x - r * 0.5} ${y - r * 0.2}a${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.45} ${-r * 0.4}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      ))}
      {/* cepillo */}
      <g transform="translate(60 70) rotate(-18)">
        <rect x="0" y="16" width="66" height="22" rx="11" fill="#7aa8ff" />
        <rect x="64" y="22" width="40" height="10" rx="5" fill="#5b88e6" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={6 + i * 8.4} y="38" width="4.4" height="14" rx="2" fill="#f3e3c4" />
        ))}
      </g>
      {/* patito */}
      <g transform="translate(116 104)">
        <ellipse cx="30" cy="34" rx="30" ry="18" fill="#ffd54d" />
        <circle cx="40" cy="14" r="14" fill="#ffd54d" />
        <path d="M52 14l14 3-14 5z" fill="#ff9a3c" />
        <circle cx="44" cy="10" r="2.6" fill="#3a2a10" />
        <path d="M10 30c6 6 16 6 22 0" stroke="#f2b92a" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </g>
  )
}

function Activity() {
  return (
    <g>
      {/* pelota */}
      <g transform="translate(26 92)">
        <circle cx="30" cy="30" r="30" fill="#ff8a8a" />
        <path d="M2 24c18 8 38 8 56 0M4 42c16-6 36-6 52 0" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="20" cy="14" r="5" fill="#fff" opacity=".5" />
      </g>
      {/* ovillo */}
      <g transform="translate(118 26)">
        <circle cx="26" cy="26" r="26" fill="#b99cff" />
        <path d="M6 14c14 4 30 14 38 32M2 30c14-4 30 0 42 14M16 4c2 14 14 30 32 34M30 2c-6 12-6 30 4 46" stroke="#8f6ef0" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M48 40c18 10 26 26 18 40" stroke="#b99cff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* caña con pluma */}
      <g>
        <path d="M30 16c26 4 44 22 50 48" stroke="#c29567" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M80 64c0 10-4 22-10 28" stroke="#9e8c77" strokeWidth="1.6" fill="none" />
        <path d="M70 92c-12 2-18 14-14 24 10-2 18-12 14-24z" fill="#5ec9a6" />
        <path d="M70 92 60 114" stroke="#3aa585" strokeWidth="1.6" />
      </g>
      {/* hueso de juguete */}
      <g transform="translate(160 112) rotate(-14)">
        <rect x="8" y="8" width="44" height="12" rx="6" fill="#ffe08a" />
        <circle cx="8" cy="8" r="8" fill="#ffe08a" />
        <circle cx="8" cy="20" r="8" fill="#ffe08a" />
        <circle cx="52" cy="8" r="8" fill="#ffe08a" />
        <circle cx="52" cy="20" r="8" fill="#ffe08a" />
      </g>
    </g>
  )
}

function Home() {
  return (
    <g>
      {/* luna y estrellas */}
      <path d="M196 22a18 18 0 1 0 18 26 14 14 0 1 1-18-26z" fill="#ffe08a" />
      <path d="M160 20l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#ffe08a" />
      {/* casita */}
      <g transform="translate(24 34)">
        <path d="M6 50 50 10 94 50z" fill="#ff8fa3" />
        <rect x="16" y="46" width="68" height="56" rx="6" fill="#fff4e6" />
        <path d="M40 102V78a10 10 0 0 1 20 0v24z" fill="#b48ae8" />
        <rect x="64" y="58" width="14" height="14" rx="3" fill="#9ad3ec" />
        <rect x="22" y="58" width="14" height="14" rx="3" fill="#9ad3ec" />
        <rect x="68" y="18" width="10" height="20" rx="2" fill="#e4708a" />
      </g>
      {/* cojín */}
      <g transform="translate(130 112)">
        <rect x="0" y="6" width="80" height="34" rx="17" fill="#9fd8c3" />
        <path d="M10 22c20 6 40 6 60 0" stroke="#7cc4a9" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="22" r="3" fill="#7cc4a9" />
      </g>
      {/* planta */}
      <g transform="translate(130 64)">
        <path d="M8 26h28l-4 22H12z" fill="#e9a26a" />
        <path d="M22 26c-2-14-12-18-18-16 2 8 8 14 18 16zM22 26c2-16 12-22 20-20-2 10-10 18-20 20zM22 26c0-12 2-22 0-26-4 6-4 16 0 26z" fill="#6cc27a" />
      </g>
    </g>
  )
}

function Health() {
  return (
    <g>
      {/* corazón */}
      <g transform="translate(22 30)">
        <path d="M40 74C14 56 0 42 0 24 0 10 10 0 22 0c8 0 14 4 18 10C44 4 50 0 58 0c12 0 22 10 22 24 0 18-14 32-40 50z" fill="#ff8fa3" />
        <path d="M14 18c2-6 6-9 12-9" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
        <path d="M18 38h10l5-9 7 18 5-9h12" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* tirita */}
      <g transform="translate(130 28) rotate(-24)">
        <rect x="0" y="0" width="72" height="24" rx="12" fill="#ffd1a8" />
        <rect x="24" y="0" width="24" height="24" fill="#f5b888" />
        {[30, 36, 42].map((x) => (
          <circle key={x} cx={x} cy="8" r="1.6" fill="#e39a66" />
        ))}
        {[30, 36, 42].map((x) => (
          <circle key={x} cx={x} cy="16" r="1.6" fill="#e39a66" />
        ))}
      </g>
      {/* escudo */}
      <g transform="translate(118 84)">
        <path d="M30 0 58 10v20c0 18-12 30-28 38C14 60 2 48 2 30V10z" fill="#8fd3b8" />
        <path d="M18 32l9 9 16-18" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* cruz */}
      <path d="M194 90h8v-8h8v8h8v8h-8v8h-8v-8h-8z" fill="#ff8fa3" opacity=".85" />
    </g>
  )
}

const SCENES: Record<TipTopic, () => ReactNode> = { food: Food, hygiene: Hygiene, activity: Activity, home: Home, health: Health }

export function TipArt({ topic }: { topic: TipTopic }) {
  const Scene = SCENES[topic]
  // «meet» + anclado abajo: la escena se ve entera en tarjetas altas o bajas; el fondo lo pone la tarjeta.
  return (
    <svg className={`tip-art tip-${topic}`} viewBox="58 4 222 166" preserveAspectRatio="xMinYMax meet" aria-hidden="true">
      <Sparkles c="var(--tS)" />
      <g className="tip-objects" transform="translate(44 0)">
        <Scene />
      </g>
    </svg>
  )
}

/** La mascota asomándose por la esquina de la ficha. */
export function TipPet({ kind }: { kind: PetKind }) {
  return (
    <svg className="tip-pet" viewBox="0 0 64 64" aria-hidden="true">
      <g className="tip-pet-in">
        <Face kind={kind} />
      </g>
    </svg>
  )
}

/** Icono pequeño del tema para las pestañas. */
export function TopicIcon({ topic }: { topic: TipTopic }) {
  const d: Record<TipTopic, ReactNode> = {
    food: (
      <>
        <path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" fill="currentColor" fillOpacity=".18" />
        <path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0zM9 9.5c0-2 1.5-3 3-3s3 1 3 3" />
      </>
    ),
    hygiene: (
      <>
        <circle cx="8" cy="15" r="4.5" fill="currentColor" fillOpacity=".18" />
        <circle cx="8" cy="15" r="4.5" />
        <circle cx="16.5" cy="8" r="3" />
        <circle cx="17.5" cy="16.5" r="1.8" />
      </>
    ),
    activity: (
      <>
        <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity=".18" />
        <circle cx="12" cy="12" r="8" />
        <path d="M4.6 9.5c5 2 9.8 2 14.8 0M4.6 14.5c5-2 9.8-2 14.8 0" />
      </>
    ),
    home: (
      <>
        <path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z" fill="currentColor" fillOpacity=".18" />
        <path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5zM10 21v-5h4v5" />
      </>
    ),
    health: (
      <>
        <path d="M12 20s-8-4.8-8-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 8 2.5C20 15.2 12 20 12 20z" fill="currentColor" fillOpacity=".18" />
        <path d="M12 20s-8-4.8-8-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 8 2.5C20 15.2 12 20 12 20zM9 12h2l1-2 1.5 4 1-2H17" />
      </>
    ),
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d[topic]}
    </svg>
  )
}
