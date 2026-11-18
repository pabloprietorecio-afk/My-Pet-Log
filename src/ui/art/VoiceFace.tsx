/** Logo de «Anotar por voz»: carita de mascota cuyo hocico es el micrófono (igual que el widget de Android). */
import { useId } from 'react'

export function VoiceFace({ className }: { className?: string }) {
  const u = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 108 108" aria-hidden="true">
      <defs>
        <linearGradient id={`${u}bg`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#7d8bff" />
          <stop offset="1" stopColor="#3142b8" />
        </linearGradient>
        <linearGradient id={`${u}face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e3f6" />
        </linearGradient>
        <linearGradient id={`${u}mic`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa6ff" />
          <stop offset="1" stopColor="#3a4ad6" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="104"
        height="104"
        rx="30"
        fill={`url(#${u}bg)`}
      />
      <path d="M10 14 C 12 10 28 6 34 8 L 22 24 Z" fill="#fff" opacity=".12" />

      <path
        d="M24 46 L 22 16 Q 23 11 28 13 L 46 28 Z"
        fill={`url(#${u}face)`}
      />
      <path
        d="M84 46 L 86 16 Q 85 11 80 13 L 62 28 Z"
        fill={`url(#${u}face)`}
      />
      <path d="M28 38 L 27 20 L 40 30 Z" fill="#ffb7cb" />
      <path d="M80 38 L 81 20 L 68 30 Z" fill="#ffb7cb" />

      <ellipse cx="54" cy="61" rx="37" ry="34" fill={`url(#${u}face)`} />
      <ellipse cx="54" cy="97" rx="26" ry="3" fill="#1b1440" opacity=".18" />

      <ellipse cx="29" cy="70" rx="7" ry="4.5" fill="#ff9fbb" opacity=".55" />
      <ellipse cx="79" cy="70" rx="7" ry="4.5" fill="#ff9fbb" opacity=".55" />

      <ellipse cx="36" cy="52" rx="5.6" ry="6.6" fill="#1f1b2e" />
      <ellipse cx="72" cy="52" rx="5.6" ry="6.6" fill="#1f1b2e" />
      <circle cx="38" cy="49.5" r="2" fill="#fff" />
      <circle cx="74" cy="49.5" r="2" fill="#fff" />

      <path
        d="M38 67 a16 16 0 0 0 32 0"
        fill="none"
        stroke="#1f1b2e"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <rect x="51.9" y="83" width="4.2" height="6" rx="1.4" fill="#1f1b2e" />
      <rect x="45" y="88.5" width="18" height="4" rx="2" fill="#1f1b2e" />
      <rect
        x="45"
        y="48"
        width="18"
        height="30"
        rx="9"
        fill={`url(#${u}mic)`}
      />
      <path
        d="M48 62h12M48 67h12M48 72h12"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="47.6"
        y="51"
        width="3.4"
        height="16"
        rx="1.7"
        fill="#fff"
        opacity=".55"
      />

      <path
        d="M50 53.5 Q 54 51.5 58 53.5 Q 56.5 57.5 54 58 Q 51.5 57.5 50 53.5 Z"
        fill="#1f1b2e"
      />
      <ellipse cx="52.6" cy="53.6" rx="1.3" ry=".8" fill="#fff" opacity=".7" />
    </svg>
  )
}
