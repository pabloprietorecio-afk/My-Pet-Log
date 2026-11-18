/**
 * Anotar por voz: escucha, muestra lo que entiende mientras se habla y guarda al momento (con Deshacer).
 * «¿Qué puedo decir?» enseña todas las frases que entiende, por categorías.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../data/instance'
import { useEventTypes, usePets, useSettings, useTreatments } from '../data/hooks'
import { isTreatmentActive } from '../domain/schedule'
import { cancelListening, listen, speak, stopListening, voiceAvailable, VoiceError } from '../platform/voice'
import { runVoice, spoken, undoLast, type Outcome } from '../voice/execute'
import { plain, voiceHelp, type HelpCategory, type VoiceHelp } from '../voice/help'
import { TypeIcon } from './art/TypeIcon'
import { VoiceFace } from './art/VoiceFace'
import { Sheet } from './components'
import { IconMic } from './icons'

type Phase = 'idle' | 'listening' | 'working' | 'result' | 'error' | 'help'

export function VoiceSheet({ petId, petName, onClose, autoStart = true }: { petId: string; petName: string; onClose: () => void; autoStart?: boolean }) {
  const settings = useSettings()
  const nav = useNavigate()
  const trs = useTreatments(petId)
  const pets = usePets()
  const types = useEventTypes(petId)
  const [phase, setPhase] = useState<Phase>('idle')
  const [partial, setPartial] = useState('')
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState('')
  const [out, setOut] = useState<Outcome | null>(null)
  const [err, setErr] = useState('')
  const [typed, setTyped] = useState('')
  const [canListen, setCanListen] = useState<boolean | null>(null)
  const alive = useRef(true)

  // Las frases de ayuda usan los nombres reales de esta mascota (tratamiento, botón propio, otra mascota).
  const help = voiceHelp({
    treatment: trs?.find((t) => isTreatmentActive(t, new Date()))?.name,
    otherPet: pets?.find((p) => p.id !== petId)?.name,
    custom: types?.find((t) => t.key === 'custom' && !t.hidden && !t.deletedAt)?.label,
  })
  const example = plain(help[1].phrases[0])

  const process = async (text: string) => {
    setHeard(text)
    setPhase('working')
    const o = await runVoice(text, petId)
    if (!alive.current) return
    setOut(o)
    setPhase('result')
    if (settings?.voiceSpeak) {
      const name = o.kind === 'saved' && o.petId !== petId ? (await repo.getPet(o.petId))?.name : undefined
      void speak(spoken(o, name))
    }
  }

  const start = async () => {
    setErr('')
    setPartial('')
    setLevel(0)
    setOut(null)
    setPhase('listening')
    try {
      const text = await listen({ onPartial: setPartial, onLevel: setLevel })
      if (!alive.current) return
      if (!text.trim()) {
        setErr('No he oído nada. Toca la carita y habla cerca del teléfono.')
        setPhase((p) => (p === 'help' ? p : 'error'))
        return
      }
      await process(text)
    } catch (e) {
      if (!alive.current) return
      const code = e instanceof VoiceError ? e.code : 'other'
      if (code === 'cancelled') return setPhase((p) => (p === 'help' ? p : 'idle'))
      setErr(
        code === 'permission'
          ? 'PetLog necesita permiso de micrófono. Puedes darlo en los ajustes de Android → Aplicaciones → PetLog → Permisos.'
          : code === 'unavailable'
            ? 'Este teléfono no tiene reconocimiento de voz. Puedes escribir la frase abajo.'
            : code === 'network'
              ? 'El dictado de este teléfono necesita conexión. Puedes escribir la frase abajo.'
              : `No se pudo escuchar (${(e as Error).message}).`,
      )
      setPhase((p) => (p === 'help' ? p : 'error'))
    }
  }

  useEffect(() => {
    alive.current = true
    void voiceAvailable().then((a) => {
      if (!alive.current) return
      setCanListen(a.recognition)
      if (a.recognition && autoStart) void start()
    })
    return () => {
      alive.current = false
      void cancelListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const undo = async () => {
    const t = await undoLast()
    setOut({ kind: 'undone', text: t ? `Deshecho: ${t}` : 'No había nada que deshacer.' })
  }

  const openHelp = () => {
    setPhase('help')
    void cancelListening()
  }

  const listening = phase === 'listening'
  const ring = 1 + Math.min(1, level) * 0.35
  const showMain = phase !== 'result' && phase !== 'help'

  return (
    <Sheet title="Anotar por voz" onClose={onClose} icon={<IconMic />}>
      <div className="voice">
        {showMain && (
          <button
            className={`voice-orb${listening ? ' on' : ''}`}
            style={{ ['--ring' as string]: ring }}
            onClick={() => (listening ? void stopListening() : void start())}
            disabled={canListen === false || phase === 'working'}
            aria-label={listening ? 'Terminar de hablar' : 'Hablar'}
          >
            <span className="halo" aria-hidden="true" />
            <VoiceFace className="face" />
          </button>
        )}

        {showMain && (
          <div className="voice-text" aria-live="polite">
            {listening && <p className={`said${partial ? '' : ' hint'}`}>{partial || 'Te escucho…'}</p>}
            {phase === 'working' && <p className="said">«{heard}»</p>}
            {phase === 'error' && <p className="voice-err">{err}</p>}
            {phase === 'idle' && canListen !== false && <p className="said hint">Toca la carita y di qué ha pasado.</p>}
            {canListen === false && <p className="said hint">Este dispositivo no tiene dictado. Escribe la frase.</p>}
          </div>
        )}

        {showMain && phase !== 'working' && (
          <>
            {!(listening && partial) && (
              <p className="voice-example">
                Ejemplo: di <b>«{example}»</b>
              </p>
            )}
            <button className="voice-help-btn" onClick={openHelp}>
              <span aria-hidden="true">💡</span> ¿Qué puedo decir?
            </button>
          </>
        )}

        {phase === 'help' && <Help groups={help} canListen={canListen !== false} onSpeak={start} onBack={() => setPhase('idle')} />}

        {phase === 'result' && out && (
          <Result
            out={out}
            heard={heard}
            petId={petId}
            petName={petName}
            onUndo={undo}
            onAgain={start}
            onOpen={(to) => {
              onClose()
              nav(to)
            }}
          />
        )}

        {(phase === 'idle' || phase === 'error') && (
          <form
            className="voice-type"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim()) void process(typed.trim())
              setTyped('')
            }}
          >
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="O escríbelo: «vómito leve»" aria-label="Frase" />
            <button className="btn tonal" type="submit" disabled={!typed.trim()}>
              Anotar
            </button>
          </form>
        )}

        {phase !== 'help' && (
          <label className="voice-speak">
            <input type="checkbox" checked={!!settings?.voiceSpeak} onChange={(e) => void repo.saveSettings({ voiceSpeak: e.target.checked })} />
            <span>Confirmar en voz alta</span>
          </label>
        )}
      </div>
    </Sheet>
  )
}

/** Palabras clave en negrita: «vómito **leve**». */
function Rich({ text }: { text: string }) {
  return <>{text.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))}</>
}

const HELP_ICON: Record<HelpCategory, string> = { log: '📝', detail: '🎚️', meds: '💊', time: '🕒', more: '➕', ask: '❓' }

/** «¿Qué puedo decir?»: un desplegable por categoría, solo uno abierto a la vez. */
function Help({ groups, canListen, onSpeak, onBack }: { groups: VoiceHelp[]; canListen: boolean; onSpeak: () => void; onBack: () => void }) {
  const [open, setOpen] = useState<HelpCategory | null>('log')
  return (
    <div className="voice-help">
      <p className="voice-help-title">¿Qué puedo decir?</p>
      <p className="voice-help-sub">Toca una categoría para ver sus frases</p>
      <div className="voice-help-list">
        {groups.map((g) => {
          const on = open === g.id
          return (
            <section key={g.id} className={`vh-group vh-${g.id}${on ? ' on' : ''}`}>
              <button className="vh-head" aria-expanded={on} onClick={() => setOpen(on ? null : g.id)}>
                <span className="vh-ic" aria-hidden="true">
                  {HELP_ICON[g.id]}
                </span>
                <span className="vh-txt">
                  <span className="vh-t">{g.title}</span>
                  <span className="vh-s">{g.subtitle}</span>
                </span>
                <span className="vh-arrow" aria-hidden="true" />
              </button>
              {on && (
                <ul className="vh-phrases">
                  {g.phrases.map((ph) => (
                    <li key={ph}>
                      «<Rich text={ph} />»
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
      <div className="voice-actions">
        <button className="btn tonal" onClick={onBack}>
          Volver
        </button>
        {canListen && (
          <button className="btn primary" onClick={onSpeak}>
            Hablar
          </button>
        )}
      </div>
    </div>
  )
}

function Result({
  out,
  heard,
  petId,
  petName,
  onUndo,
  onAgain,
  onOpen,
}: {
  out: Outcome
  heard: string
  petId: string
  petName: string
  onUndo: () => void
  onAgain: () => void
  onOpen: (to: string) => void
}) {
  const [other, setOther] = useState<string | null>(null)
  useEffect(() => {
    if (out.kind === 'saved' && out.petId !== petId) void repo.getPet(out.petId).then((p) => setOther(p?.name ?? null))
  }, [out, petId])
  return (
    <div className="voice-result">
      <p className="voice-heard">«{heard}»</p>
      {out.kind === 'saved' && (
        <>
          {out.done.length > 0 && (
            <>
              <p className="voice-ok">Anotado{other ? ` para ${other}` : petName ? ` para ${petName}` : ''}</p>
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
          {out.needsTreatment && (
            <p className="voice-err">
              Hay varios tratamientos: di el nombre del medicamento («le he dado la …») o anótalo en{' '}
              <button className="link-btn" onClick={() => onOpen(`/pet/${out.petId}/medicacion`)}>
                Medicación
              </button>
              .
            </p>
          )}
          {out.ignored.length > 0 && <p className="voice-note">No he entendido: «{out.ignored.join('», «')}».</p>}
          <div className="voice-actions">
            {out.done.length > 0 && (
              <button className="btn tonal" onClick={onUndo}>
                Deshacer
              </button>
            )}
            {out.done.length > 0 && (
              <button className="btn tonal" onClick={() => onOpen(`/pet/${out.petId}/historial`)}>
                Ver o editar
              </button>
            )}
            <button className="btn primary" onClick={onAgain}>
              Otra
            </button>
          </div>
        </>
      )}
      {(out.kind === 'answer' || out.kind === 'undone') && (
        <>
          <p className="voice-answer">{out.text}</p>
          <div className="voice-actions">
            <button className="btn primary" onClick={onAgain}>
              Otra
            </button>
          </div>
        </>
      )}
      {out.kind === 'none' && (
        <>
          <p className="voice-err">No lo he entendido. Toca «¿Qué puedo decir?» para ver las frases que entiendo.</p>
          <div className="voice-actions">
            <button className="btn primary" onClick={onAgain}>
              Repetir
            </button>
          </div>
        </>
      )}
    </div>
  )
}
