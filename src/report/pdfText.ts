/** Las fuentes estándar del PDF solo cubren Latin-1/WinAnsi: sin emoji ni símbolos raros. */
export function pdfSafe(s: string): string {
  return s
    .replace(/→/g, '->')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\u0000-ÿ]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
