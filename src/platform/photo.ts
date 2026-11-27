/** Reduce una imagen a JPEG con lado máximo y devuelve un data-URL. */
export async function fileToSmallDataUrl(file: File, maxSide = 1024, quality = 0.78): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return canvas.toDataURL('image/jpeg', quality)
}

function openPicker(camera: boolean): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    // `capture` abre directamente la cámara del teléfono (en el ordenador se ignora y sale el selector de archivos).
    if (camera) input.setAttribute('capture', 'environment')
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

/**
 * Pide una foto: primero pregunta «Hacer foto» o «Elegir de la galería» y después abre la cámara o la galería.
 * Devuelve `null` si se cancela.
 */
export function pickImage(): Promise<File | null> {
  return new Promise((resolve) => {
    const back = document.createElement('div')
    back.className = 'photo-choice'
    back.setAttribute('role', 'dialog')
    back.setAttribute('aria-modal', 'true')
    back.setAttribute('aria-label', 'Añadir foto')
    const card = document.createElement('div')
    card.className = 'photo-choice-card'
    const title = document.createElement('h2')
    title.textContent = 'Añadir foto'
    card.append(title)
    const prev = document.activeElement as HTMLElement | null
    const done = (v: Promise<File | null> | null) => {
      document.removeEventListener('keydown', onKey, true)
      back.remove()
      prev?.focus?.()
      resolve(v)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      done(null)
    }
    const button = (label: string, cls: string, act: () => void) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `btn block big ${cls}`
      b.textContent = label
      b.onclick = act
      card.append(b)
      return b
    }
    // La cámara o la galería se abren dentro del propio toque (los navegadores lo exigen).
    const first = button('📷  Hacer foto', 'primary', () => done(openPicker(true)))
    button('🖼️  Elegir de la galería', 'tonal', () => done(openPicker(false)))
    button('Cancelar', '', () => done(null))
    back.onclick = (e) => e.target === back && done(null)
    back.append(card)
    document.body.append(back)
    document.addEventListener('keydown', onKey, true)
    first.focus()
  })
}
