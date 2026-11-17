/** Icono de la app (capas de icono adaptativo de Android, caja de 108). Se usa para exportar los PNG y para la vista previa en Ajustes. */
import { useId } from 'react'
import { Face, type PetKind } from './pets'

const PAWS = [
  [18, 22, -20, 0.55],
  [88, 16, 18, 0.45],
  [92, 86, -12, 0.5],
  [14, 90, 25, 0.4],
  [54, 100, 0, 0.3],
] as const

function Paw({ x, y, r, o }: { x: number; y: number; r: number; o: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(.42)`} fill="#fff" opacity={o}>
      <path d="M-6.2 4.2c0-4.1 3-7.2 6.2-7.2s6.2 3.1 6.2 7.2S3.3 9.4 0 9.4-6.2 8.3-6.2 4.2z" />
      <ellipse cx="-7.8" cy="-4.2" rx="2.6" ry="3.1" />
      <ellipse cx="-2.9" cy="-8.8" rx="2.6" ry="3.2" />
      <ellipse cx="2.9" cy="-8.8" rx="2.6" ry="3.2" />
      <ellipse cx="7.8" cy="-4.2" rx="2.6" ry="3.1" />
    </g>
  )
}

/** Capas en una caja de 108 (medida de icono adaptativo de Android). */
export function IconLayer({ layer, kind = 'cat' }: { layer: 'bg' | 'fg' | 'full' | 'round'; kind?: PetKind }) {
  const u = useId().replace(/:/g, '')
  const bg = (
    <>
      <defs>
        <linearGradient id={`ibg${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bdeedd" />
          <stop offset=".55" stopColor="#dff1ff" />
          <stop offset="1" stopColor="#d6c9ff" />
        </linearGradient>
        <radialGradient id={`iglow${u}`} cx=".5" cy=".55" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="108" height="108" fill={`url(#ibg${u})`} />
      <circle cx="54" cy="58" r="40" fill={`url(#iglow${u})`} />
      {PAWS.map(([x, y, r, o], i) => (
        <Paw key={i} x={x} y={y} r={r} o={o} />
      ))}
    </>
  )
  // La cara cabe en la zona segura (círculo central de 66 de diámetro).
  // El conejo es más alto (orejas): un poco más pequeño para no salirse de la zona segura.
  const fg = kind === 'rabbit' ? <g transform="translate(25.5 25) scale(.89)"><Face kind={kind} /></g> : <g transform="translate(23 22) scale(.97)"><Face kind={kind} /></g>
  const clip = layer === 'round' ? <circle cx="54" cy="54" r="54" /> : <rect width="108" height="108" rx="24" />
  return (
    <svg viewBox="0 0 108 108" width="100%" height="100%" style={{ display: 'block' }}>
      {layer === 'fg' ? (
        fg
      ) : layer === 'bg' ? (
        bg
      ) : (
        <>
          <clipPath id={`iclip${u}`}>{clip}</clipPath>
          <g clipPath={`url(#iclip${u})`}>
            {bg}
            <g transform="translate(-10.8 -10.8) scale(1.2)">{fg}</g>
          </g>
        </>
      )}
    </svg>
  )
}

