/** Solo en desarrollo: dibuja el icono de la app y la pantalla de inicio para exportarlos a PNG. */
import { CatFace } from './art/pets'

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
export function IconLayer({ layer }: { layer: 'bg' | 'fg' | 'full' | 'round' }) {
  const bg = (
    <>
      <defs>
        <linearGradient id="ibg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bdeedd" />
          <stop offset=".55" stopColor="#dff1ff" />
          <stop offset="1" stopColor="#d6c9ff" />
        </linearGradient>
        <radialGradient id="iglow" cx=".5" cy=".55" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="108" height="108" fill="url(#ibg)" />
      <circle cx="54" cy="58" r="40" fill="url(#iglow)" />
      {PAWS.map(([x, y, r, o], i) => (
        <Paw key={i} x={x} y={y} r={r} o={o} />
      ))}
    </>
  )
  // La cara cabe en la zona segura (círculo central de 66 de diámetro).
  const fg = <g transform="translate(23 22) scale(.97)"><CatFace /></g>
  const clip = layer === 'round' ? <circle cx="54" cy="54" r="54" /> : <rect width="108" height="108" rx="24" />
  return (
    <svg id="icon" viewBox="0 0 108 108" width="100%" height="100%" style={{ display: 'block' }}>
      {layer === 'fg' ? (
        fg
      ) : layer === 'bg' ? (
        bg
      ) : (
        <>
          <clipPath id="iclip">{clip}</clipPath>
          <g clipPath="url(#iclip)">
            {bg}
            <g transform="translate(-10.8 -10.8) scale(1.2)">{fg}</g>
          </g>
        </>
      )}
    </svg>
  )
}

export function IconStudio() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const layer = (q.get('layer') ?? 'full') as 'bg' | 'fg' | 'full' | 'round'
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent' }}>
      <IconLayer layer={layer} />
    </div>
  )
}
