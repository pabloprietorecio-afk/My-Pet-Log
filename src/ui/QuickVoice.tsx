/**
 * «Anotar por voz» en ventana flotante, sin abrir PetLog (atajo del icono de la app).
 *
 * Dos ventanas sobre la pantalla de inicio: primero la del micrófono (con lo que va entendiendo)
 * y después la del resultado (qué se ha anotado, con Deshacer). La del resultado se cierra sola
 * a los pocos segundos si no se toca.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { repo } from '../data/instance'
import { usePets, useSettings } from '../data/hooks'
import { cancelListening, listen, speak, stopListening, voiceAvailable, VoiceError } from '../platform/voice'
import { closeQuickVoice, openFullApp } from '../platform/quick'
import { runVoice, spoken, undoLast, type Outcome } from '../voice/execute'
import { TypeIcon } from './art/TypeIcon'
import { VoiceFace } from './art/VoiceFace'
import { lastPet } from './nav'
import { useTheme } from './theme'
import { lang, tl } from '../i18n'

type Phase = 'starting' | 'listening' | 'working' | 'result' | 'error' | 'typing'

/** Segundos que el resultado sigue en pantalla antes de cerrarse solo. */
const AUTO_CLOSE = 6

export function QuickVoice() {
  useTheme()
  const pets = usePets()
  const settings = useSettings()
  const [phase, setPhase] = useState<Phase>('starting')
  const [partial, setPartial] = useState('')
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState('')
  const [out, setOut] = useState<Outcome | null>(null)
  const [err, setErr] = useState('')
  const [typed, setTyped] = useState('')
  const [left, setLeft] = useState<number | null>(null)
  const [total, setTotal] = useState(AUTO_CLOSE)
  const [otherName, setOtherName] = useState<string | null>(null)
  const alive = useRef(true)
  const started = useRef(false)

  const live = pets?.filter((p) => !p.deletedAt) ?? []
  const remembered = lastPet()
  const pet = live.find((p) => p.id === remembered) ?? live[0]

  const close = useCallback(() => {
    alive.current = false
    void cancelListening()
    void closeQuickVoice()
  }, [])

  const process = async (text: string) => {
    if (!pet) return
    setHeard(text)
    setPhase('working')
    const o = await runVoice(text, pet.id)
    if (!alive.current) return
    if (o.kind === 'help') {
      // La lista de frases es larga: se abre en la app.
      return void openFullApp(`/pet/${pet.id}/hoy?voz=ayuda`)
    }
    const name = o.kind === 'saved' && o.petId !== pet.id ? ((await repo.getPet(o.petId))?.name ?? null) : null
    setOtherName(name)
    setOut(o)
    setPhase('result')
    // Se cierra sola solo si todo ha ido bien (si hay que corregir algo, espera).
    const secs = o.kind === 'saved' && o.done.length > 0 && !o.needsTreatment && o.ignored.length === 0 ? AUTO_CLOSE : o.kind === 'answer' ? AUTO_CLOSE + 4 : null
    setTotal(secs ?? AUTO_CLOSE)
    setLeft(secs)
    if (settings?.voiceSpeak) void speak(spoken(o, name ?? undefined))
  }

  const start = async () => {
    setErr('')
    setPartial('')
    setLevel(0)
    setOut(null)
    setLeft(null)
    setPhase('listening')
    try {
      const text = await listen({ onPartial: setPartial, onLevel: setLevel })
      if (!alive.current) return
      if (!text.trim()) {
        setErr(tl('No he oído nada. Toca la carita y habla cerca del teléfono.'))
        return setPhase('error')
      }
      await process(text)
    } catch (e) {
      if (!alive.current) return
      const code = e instanceof VoiceError ? e.code : 'other'
      if (code === 'cancelled') return close()
      setErr(
        code === 'permission'
          ? tl('PetLog necesita permiso de micrófono. Puedes darlo en Ajustes de Android → Aplicaciones → PetLog → Permisos.')
          : code === 'unavailable'
            ? tl('Este teléfono no tiene reconocimiento de voz. Puedes escribir la frase.')
            : code === 'network'
              ? tl('El dictado de este teléfono necesita conexión. Puedes escribir la frase.')
              : tl('No se pudo escuchar ({0}).', (e as Error).message),
      )
      setPhase(code === 'unavailable' || code === 'network' ? 'typing' : 'error')
    }
  }

  // Arranca a escuchar en cuanto se sabe la mascota.
  useEffect(() => {
    if (!pets || started.current) return
    started.current = true
    if (!pet) return setPhase('error')
    void voiceAvailable().then((a) => {
      if (!alive.current) return
      if (a.recognition) void start()
      else setPhase('typing')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      void cancelListening()
    }
  }, [])

  // Cuenta atrás del cierre automático.
  useEffect(() => {
    if (left === null) return
    if (left <= 0) return close()
    const t = setTimeout(() => setLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [left, close])

  // Atrás de Android o Escape: cerrar.
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [close])

  const undo = async () => {
    setLeft(null)
    const t = await undoLast()
    setOut({ kind: 'undone', text: t ? tl('Deshecho: {0}', t) : tl('No había nada que deshacer.') })
  }

  const listening = phase === 'listening'
  const ring = 1 + Math.min(1, level) * 0.35
  const showMic = phase !== 'result'
  const forName = otherName ?? pet?.name

  return (
    <div className="qv" onClick={(e) => e.target === e.currentTarget && close()}>
      {showMic && (
        <section className="qv-card qv-mic" role="dialog" aria-label={tl('Anotar por voz')} aria-live="polite">
          <header className="qv-head">
            <span className="qv-brand">{tl('PetLog')}</span>
            {pet && <span className="qv-pet">{tl('Para')}{' '}{pet.name}</span>}
            <button className="qv-x" onClick={close} aria-label={tl('Cerrar')}>
              ×
            </button>
          </header>
          <div className="qv-body">
            <button
              className={`voice-orb${listening ? ' on' : ''}`}
              style={{ ['--ring' as string]: ring }}
              onClick={() => (listening ? void stopListening() : void start())}
              disabled={phase === 'working' || phase === 'starting' || !pet}
              aria-label={listening ? tl('Terminar de hablar') : tl('Hablar')}
            >
              <span className="halo" aria-hidden="true" />
              <VoiceFace className="face" />
            </button>
            <div className="qv-said">
              {phase === 'starting' && <p className="hint">{tl('Preparando el micrófono…')}</p>}
              {phase === 'starting' && lang() !== 'es' && <p className="hint">{tl('Los comandos de voz, de momento, solo funcionan en español.')}</p>}
              {listening && <p className={partial ? '' : 'hint'}>{partial || tl('¿Qué ha pasado?')}</p>}
              {listening && !partial && <p className="qv-example">{tl('Por ejemplo: «vómito leve», «le he dado la pastilla»')}</p>}
              {phase === 'working' && <p>«{heard}»</p>}
              {phase === 'error' && <p className="qv-err">{pet ? err : tl('Todavía no hay ninguna mascota. Ábrela en PetLog para crearla.')}</p>}
              {phase === 'typing' && err && <p className="qv-err">{err}</p>}
            </div>
          </div>
          {(phase === 'typing' || phase === 'error') && pet && (
            <form
              className="qv-type"
              onSubmit={(e) => {
                e.preventDefault()
                if (typed.trim()) void process(typed.trim())
                setTyped('')
              }}
            >
              <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={tl('Escríbelo: «vómito leve»')} aria-label={tl('Frase')} />
              <button className="btn tonal" type="submit" disabled={!typed.trim()}>
                {tl('Anotar')}
              </button>
            </form>
          )}
          <div className="qv-actions">
            {listening ? (
              <>
                <button className="btn tonal" onClick={close}>
                  {tl('Cancelar')}
                </button>
                <button className="btn primary" onClick={() => void stopListening()}>
                  {tl('Listo')}
                </button>
              </>
            ) : phase === 'error' || phase === 'typing' ? (
              <>
                <button className="btn tonal" onClick={() => void openFullApp(pet ? `/pet/${pet.id}/hoy` : '/')}>
                  {tl('Abrir PetLog')}
                </button>
                {pet && phase === 'error' && (
                  <button className="btn primary" onClick={() => void start()}>
                    {tl('Reintentar')}
                  </button>
                )}
              </>
            ) : null}
          </div>
        </section>
      )}

      {phase === 'result' && out && pet && (
        <section className="qv-card qv-res" role="dialog" aria-label={tl('Resultado')} aria-live="polite" onPointerDown={() => setLeft(null)}>
          <header className="qv-head">
            <span className="qv-brand">{tl('PetLog')}</span>
            <button className="qv-x" onClick={close} aria-label={tl('Cerrar')}>
              ×
            </button>
          </header>
          <p className="qv-heard">«{heard}»</p>
          {out.kind === 'saved' && out.done.length > 0 && (
            <>
              <p className="qv-ok">
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                {tl('Anotado')}{forName ? ` para ${forName}` : ''}
              </p>
              <ul className="voice-done">
                {out.done.map((d) => (
                  <li key={d.id}>
                    <span className="ic">
                      <TypeIcon k={d.typeKey ?? 'other'} emoji={d.emoji} size="100%" />
                    </span>
                    <span className="t">{d.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {out.kind === 'saved' && out.needsTreatment && <p className="qv-err">{tl('Hay varios tratamientos: di el nombre del medicamento («le he dado la …»).')}</p>}
          {out.kind === 'saved' && out.ignored.length > 0 && <p className="qv-note">{tl('No he entendido: «')}{out.ignored.join('», «')}».</p>}
          {(out.kind === 'answer' || out.kind === 'undone') && <p className="qv-answer">{out.text}</p>}
          {out.kind === 'none' && <p className="qv-err">{tl('No lo he entendido. Prueba con el nombre de un botón: «vómito», «comida», «peso 4 kilos»…')}</p>}
          <div className="qv-actions">
            {out.kind === 'saved' && out.done.length > 0 && (
              <button className="btn tonal" onClick={() => void undo()}>
                {tl('Deshacer')}
              </button>
            )}
            <button className="btn tonal" onClick={() => void openFullApp(`/pet/${out.kind === 'saved' || out.kind === 'answer' ? out.petId : pet.id}/historial`)}>
              {tl('Abrir')}
            </button>
            <button className="btn primary" onClick={() => void start()}>
              {out.kind === 'none' ? tl('Repetir') : tl('Otra')}
            </button>
          </div>
          {left !== null && (
            <div className="qv-timer" aria-hidden="true">
              <i style={{ animationDuration: `${total}s` }} key={out.kind + heard} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
