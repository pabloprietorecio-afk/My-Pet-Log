/**
 * Piezas de maquetación para pantallas SIN scroll.
 *
 * - `useBox`: mide el espacio real disponible de un contenedor.
 * - `Paged`: lista que se reparte en páginas del alto disponible (nunca hace scroll).
 *   Las filas tienen alto fijo (en rem) para que el reparto sea exacto y estable.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { IconBack, IconNext } from './icons'
import { tl } from '../i18n'

export function useBox<T extends HTMLElement>() {
  // Ref de función: funciona aunque el elemento aparezca más tarde (p. ej. tras cargar datos).
  const [el, setEl] = useState<T | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setBox((b) => (Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, box] as const
}

export const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

export type PagedItem = { key: string; head: string } | { key: string; node: ReactNode; onClick?: () => void; label?: string }

const ROW_GAP_REM = 0 // las filas de un grupo van pegadas, separadas por una línea
const SEG_GAP_REM = 0.5 // separación entre grupos (después de cada cabecera de día)
const PAGER_REM = 3.25

interface Built {
  kind: 'head' | 'row'
  item: PagedItem
  first?: boolean
  last?: boolean
  cont?: boolean
}

/** Reparte los elementos en páginas que caben en `avail` px. */
function paginate(items: PagedItem[], avail: number, rowPx: number, headPx: number, gapPx: number): Built[][] {
  const pages: Built[][] = []
  let cur: Built[] = []
  let used = 0
  let lastHead: PagedItem | null = null
  const close = () => {
    if (cur.length) pages.push(cur)
    cur = []
    used = 0
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if ('head' in it) {
      lastHead = it
      // Una cabecera nunca se queda sola al final de una página.
      const need = (cur.length ? gapPx : 0) + headPx + rowPx
      if (used + need > avail && cur.length) close()
      used += (cur.length ? gapPx : 0) + headPx
      cur.push({ kind: 'head', item: it })
      continue
    }
    if (used + rowPx > avail && cur.length) {
      close()
      if (lastHead) {
        cur.push({ kind: 'head', item: lastHead, cont: true })
        used += headPx
      }
    }
    used += rowPx
    cur.push({ kind: 'row', item: it })
  }
  close()
  // Marcar primera/última fila de cada grupo (para los bordes redondeados).
  for (const p of pages) {
    p.forEach((b, i) => {
      if (b.kind !== 'row') return
      b.first = i === 0 || p[i - 1].kind === 'head'
      b.last = i === p.length - 1 || p[i + 1].kind === 'head'
    })
  }
  return pages
}

/**
 * Lista paginada. `rowRem`/`headRem` son los altos fijos de fila y cabecera.
 * Si todo cabe, no aparece el paginador. Se puede pasar de página deslizando.
 */
export function Paged({
  items,
  rowRem = 4,
  headRem = 2,
  resetKey,
  label,
  empty,
  rowClass = '',
}: {
  items: PagedItem[]
  rowRem?: number
  headRem?: number
  resetKey?: string
  label: string
  empty?: ReactNode
  /** Variante de fila: '' (hora·icono·texto), 'nt' (icono·texto), 'plain' (texto·valor), 'dose-row'. */
  rowClass?: string
}) {
  const [ref, box] = useBox<HTMLDivElement>()
  const [page, setPage] = useState(0)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const rp = remPx()
  const rowPx = rowRem * rp + ROW_GAP_REM * rp
  const headPx = headRem * rp
  const gapPx = SEG_GAP_REM * rp

  const pages = useMemo(() => {
    if (box.h <= 0) return [] as Built[][]
    const all = paginate(items, box.h, rowPx, headPx, gapPx)
    if (all.length <= 1) return all
    return paginate(items, box.h - PAGER_REM * rp, rowPx, headPx, gapPx)
  }, [items, box.h, rowPx, headPx, gapPx, rp])

  useEffect(() => setPage(0), [resetKey])
  const n = pages.length
  const p = Math.min(page, Math.max(0, n - 1))
  const go = (d: number) => setPage((x) => Math.max(0, Math.min(n - 1, x + d)))

  return (
    <div
      className="paged"
      ref={ref}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current
        touch.current = null
        if (!s || n < 2) return
        const dx = e.changedTouches[0].clientX - s.x
        const dy = e.changedTouches[0].clientY - s.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
      }}
    >
      {items.length === 0 ? (
        empty
      ) : (
        <div className="page" role="list" aria-label={label} key={p}>
          {(pages[p] ?? []).map((b, i) =>
            b.kind === 'head' ? (
              <div key={`h${i}`} className="phead" role="presentation" style={{ height: `${headRem}rem` }}>
                {(b.item as { head: string }).head}
                {b.cont ? <span className="cont"> {tl('(continúa)')}</span> : null}
              </div>
            ) : (
              <Row key={b.item.key} b={b} rowRem={rowRem} rowClass={rowClass} />
            ),
          )}
        </div>
      )}
      {n > 1 && (
        <div className="pager" style={{ height: `${PAGER_REM}rem` }}>
          <button className="icon-btn" onClick={() => go(-1)} disabled={p === 0} aria-label={tl('Página anterior')}>
            <IconBack />
          </button>
          <span className="dots" aria-live="polite">
            <span className="sr">{tl('Página')}{' '}</span>
            {p + 1} {tl('de')}{' '}{n}
          </span>
          <button className="icon-btn" onClick={() => go(1)} disabled={p === n - 1} aria-label={tl('Página siguiente')}>
            <IconNext />
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ b, rowRem, rowClass }: { b: Built; rowRem: number; rowClass: string }) {
  const it = b.item as Extract<PagedItem, { node: ReactNode }>
  const cls = `prow ${rowClass}${b.first ? ' first' : ''}${b.last ? ' last' : ''}`
  const style = { height: `${rowRem}rem` }
  return it.onClick ? (
    <button role="listitem" className={`${cls} tap`} style={style} onClick={it.onClick} aria-label={it.label}>
      {it.node}
    </button>
  ) : (
    <div role="listitem" className={cls} style={style}>
      {it.node}
    </div>
  )
}

/**
 * Alto útil de la ventana (sin barras del sistema) para decidir qué cabe en pantallas muy bajas.
 * El teclado encoge la ventana al escribir: se ignora (se guarda el máximo para el mismo ancho),
 * así la pantalla de fondo no se reorganiza cada vez que aparece o desaparece el teclado.
 */
export function useUsableHeight() {
  const best = useRef({ w: 0, h: 0 })
  const read = () => {
    const cs = getComputedStyle(document.documentElement)
    const px = (v: string) => parseFloat(cs.getPropertyValue(v)) || 0
    // Solo el alto de la ventana se toma como máximo (el teclado lo reduce); las zonas seguras
    // se restan siempre con su valor actual, porque Capacitor puede inyectarlas tras el arranque.
    const w = window.innerWidth
    if (w !== best.current.w) best.current = { w, h: window.innerHeight }
    else best.current.h = Math.max(best.current.h, window.innerHeight)
    return Math.round(best.current.h - px('--safe-area-inset-top') - px('--safe-area-inset-bottom') - px('--ad-h'))
  }
  const [h, setH] = useState(read)
  useEffect(() => {
    const on = () => setH(read())
    window.addEventListener('resize', on)
    const t = setInterval(on, 1000) // Capacitor puede inyectar las zonas seguras tras el arranque
    return () => {
      window.removeEventListener('resize', on)
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return h
}
