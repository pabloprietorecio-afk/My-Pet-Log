/**
 * Iconos de trazo para el informe (rejilla de 24). Cadenas SVG puras: las usan
 * el HTML (en línea) y el PDF (vía svg2pdf), así que solo usan trazos y rellenos básicos.
 */
export type Glyph =
  | 'paw'
  | 'tag'
  | 'male'
  | 'female'
  | 'sex'
  | 'cake'
  | 'calendar'
  | 'scale'
  | 'steth'
  | 'heart'
  | 'alert'
  | 'clipboard'
  | 'bars'
  | 'list'
  | 'pill'
  | 'note'
  | 'line'
  | 'bulb'
  | 'calcheck'
  | 'check'

const P: Record<Glyph, string> = {
  paw: 'M7.5 15.5c0-2.6 2-4.5 4.5-4.5s4.5 1.9 4.5 4.5c0 1.9-1.3 3-3 3-.6 0-1-.3-1.5-.3s-.9.3-1.5.3c-1.7 0-3-1.1-3-3ZM6 11.2a1.6 2 0 1 0 0 .1ZM9.4 7a1.6 2 0 1 0 0 .1ZM14.6 7a1.6 2 0 1 0 0 .1ZM18 11.2a1.6 2 0 1 0 0 .1Z',
  tag: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.5 6.5a1.4 1.4 0 0 1-2 0ZM8 8.1a.1.1 0 1 0 .1 0',
  male: 'M10 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM14.3 9.7 20 4M15 4h5v5',
  female: 'M12 15a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 15v6M9 18.5h6',
  sex: 'M12 15a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 15v6',
  cake: 'M4 20.5h16M5 20.5v-7a1.5 1.5 0 0 1 1.5-1.5h11a1.5 1.5 0 0 1 1.5 1.5v7M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M12 12V8.5M12 6.2c-.8-.8-.8-1.8 0-2.7.8.9.8 1.9 0 2.7Z',
  calendar: 'M4.5 6.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5ZM4.5 10h15M8.5 3v4M15.5 3v4M8 13.5h.1M12 13.5h.1M16 13.5h.1M8 16.8h.1M12 16.8h.1',
  scale: 'M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2ZM8 10.5a4 4 0 0 1 8 0ZM12 10.5l1.6-2.2',
  steth: 'M6 3.5H5v5a4.5 4.5 0 0 0 9 0v-5h-1M9.5 13v1.5a4.5 4.5 0 0 0 9 0V12M18.5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  heart: 'M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10ZM6 12.5h3l1.5-2.5 2 4.5 1.5-2h4',
  alert: 'M12 4.2 2.8 19.5h18.4ZM12 10v4.5M12 17.2h.1',
  clipboard: 'M8.5 4.5H7A1.5 1.5 0 0 0 5.5 6v13A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 17 4.5h-1.5M9 3.5h6v2.5H9ZM8.5 11h7M8.5 14.5h7M8.5 18h4',
  bars: 'M4 20h16M6.5 20v-6M10.5 20V8M14.5 20v-9M18.5 20V5',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1',
  pill: 'M10.6 3.9a4.6 4.6 0 0 1 6.5 6.5l-6.7 6.7a4.6 4.6 0 0 1-6.5-6.5ZM7.3 7.2l6.5 6.5',
  note: 'M6.5 3.5h8l4 4v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1ZM14.5 3.5v4h4M8.5 12h7M8.5 15.5h7',
  bulb: 'M9 17.5h6M9.8 20.5h4.4M12 3.5a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.8v.4h5.4v-.4c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3.5Z',
  calcheck: 'M4.5 6.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5ZM4.5 10h15M8.5 3v4M15.5 3v4M8.8 14.6l2.2 2.2 4.2-4.4',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.3l2.7 2.7L16 9.5',
  line: 'M3.5 20.5h17M5 16l4.5-5 3.5 3 6-7.5M15.5 6.5H19V10',
}

/** Icono como SVG completo. `fill` solo para la huella (relleno); el resto son trazos. */
export function glyph(g: Glyph, color: string, strokeWidth = 1.8): string {
  const filled = g === 'paw'
  const attrs = filled ? `fill="${color}" stroke="none"` : `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="${P[g]}" ${attrs}/></svg>`
}
