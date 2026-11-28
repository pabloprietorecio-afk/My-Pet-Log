import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { EventKey, Pet } from '../domain/types'
import { IconClose } from './icons'
import { PetIllustration } from './art/pets'
import { tl } from '../i18n'

export const tint = (key: EventKey): CSSProperties => ({ ['--tint' as string]: `var(--t-${key})` })

// ─── Avatar ──────────────────────────────────────────────────────────────

export function Avatar({ pet, large }: { pet: Pick<Pet, 'photo' | 'species' | 'name'>; large?: boolean }) {
  return (
    <span className={`avatar${large ? ' lg' : ''} ${pet.species}`} aria-hidden="true">
      {pet.photo ? <img src={pet.photo} alt="" /> : <PetIllustration species={pet.species} />}
    </span>
  )
}

// ─── Hoja inferior ───────────────────────────────────────────────────────

export function Sheet({
  title,
  onClose,
  children,
  foot,
  full,
  icon,
}: {
  title: string
  /** Icono que acompaña al título (p. ej. el del tipo de registro). */
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  foot?: ReactNode
  full?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const toast = useToast()
  // Un aviso abierto taparía el contenido de la hoja.
  useEffect(() => toast.hide(), [toast])
  // `onClose` suele ser una función nueva en cada render del padre (p. ej. al abrirse el teclado
  // y cambiar el tamaño de la pantalla). Se guarda en una ref para que el efecto de abajo se ejecute
  // SOLO al abrir la hoja: si se repitiera, robaría el foco al campo, el teclado se cerraría,
  // la pantalla volvería a cambiar de tamaño… y así en bucle.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    // Respeta el foco que haya puesto un campo con autoFocus.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.({ preventScroll: true })
    }
  }, [])
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && closeRef.current()}>
      <div className={`sheet${full ? ' full' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="grab" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {icon}
            <span>{title}</span>
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label={tl('Cerrar')}>
            <IconClose />
          </button>
        </div>
        {children}
        {foot ? <div className="sheet-foot">{foot}</div> : null}
      </div>
    </div>
  )
}

// ─── Aviso temporal ──────────────────────────────────────────────────────

interface ToastApi {
  show: (content: ReactNode, ms?: number) => void
  hide: () => void
}
const ToastCtx = createContext<ToastApi>({ show: () => {}, hide: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setContent(null)
  }, [])
  const show = useCallback((c: ReactNode, ms = 7000) => {
    if (timer.current) clearTimeout(timer.current)
    setContent(c)
    timer.current = setTimeout(() => setContent(null), ms)
  }, [])
  const api = useMemo(() => ({ show, hide }), [show, hide])
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite" role="status">
        {content ? <div className="toast">{content}</div> : null}
      </div>
    </ToastCtx.Provider>
  )
}

// ─── Formularios ─────────────────────────────────────────────────────────

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const id = useId()
  return (
    <div className="field">
      <span className="lbl" id={id}>
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="stack" style={{ gap: '0.3rem' }}>
        {children}
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: ReactNode; text?: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} aria-label={o.text} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Lista de textos libres (patologías, alergias). */
export function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v])
    setDraft('')
  }
  return (
    <Field label={label}>
      {values.length > 0 && (
        <div className="chips">
          {values.map((v) => (
            <button key={v} type="button" className="chip" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={tl('Quitar {0}', v)}>
              {v} ✕
            </button>
          ))}
        </div>
      )}
      <div className="row">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <button type="button" className="btn" onClick={add} disabled={!draft.trim()}>
          {tl('Añadir')}
        </button>
      </div>
    </Field>
  )
}

export function Empty({ emoji, title, children }: { emoji: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="art" aria-hidden="true">
        {emoji}
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// ─── Confirmación ────────────────────────────────────────────────────────

interface ConfirmReq {
  message: string
  confirmLabel: string
  danger: boolean
  resolve: (ok: boolean) => void
}
let openConfirm: ((r: ConfirmReq) => void) | null = null

/** Confirmación propia (el confirm() del sistema desentona y algunos visores lo bloquean). */
export function confirmDialog(message: string, opts: { confirmLabel?: string; danger?: boolean } = {}): Promise<boolean> {
  const req = { message, confirmLabel: opts.confirmLabel ?? tl('Eliminar'), danger: opts.danger ?? true }
  if (!openConfirm) return Promise.resolve(window.confirm(message))
  return new Promise((resolve) => openConfirm!({ ...req, resolve }))
}

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmReq | null>(null)
  const msgId = useId()
  useEffect(() => {
    openConfirm = setReq
    return () => {
      openConfirm = null
    }
  }, [])
  useEffect(() => {
    if (!req) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      req.resolve(false)
      setReq(null)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [req])
  if (!req) return null
  const done = (ok: boolean) => {
    req.resolve(ok)
    setReq(null)
  }
  return (
    <div className="scrim center" onMouseDown={(e) => e.target === e.currentTarget && done(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-describedby={msgId}>
        <p id={msgId}>{req.message}</p>
        <div className="two">
          <button className="btn" onClick={() => done(false)}>
            {tl('Cancelar')}
          </button>
          <button className={`btn ${req.danger ? 'danger-solid' : 'primary'}`} onClick={() => done(true)} autoFocus>
            {req.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
