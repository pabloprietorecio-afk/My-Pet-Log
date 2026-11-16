import { useState } from 'react'
import { repo } from '../data/instance'
import { SYMPTOM_SUGGESTIONS, levelOptions } from '../domain/eventTypes'
import type { EventType, LogEvent } from '../domain/types'
import { formatNumber, fromInputDateTime, toInputDateTime } from '../domain/time'
import { fileToSmallDataUrl, pickImage } from '../platform/photo'
import { Field, Sheet, confirmDialog } from './components'
import { IconTrash } from './icons'
import { TypeIcon } from './art/TypeIcon'

const parseNum = (s: string): number | undefined => {
  const n = Number(s.trim().replace(',', '.'))
  return s.trim() !== '' && Number.isFinite(n) ? n : undefined
}

/** Hoja de detalle: crear (con tipo) o editar un registro. */
export function EventSheet({
  petId,
  type,
  event,
  onClose,
}: {
  petId: string
  type: EventType
  event?: LogEvent
  onClose: () => void
}) {
  const levels = levelOptions(type)
  const needsNumber = type.input === 'number'
  const [level, setLevel] = useState<number | undefined>(event?.level)
  const [value, setValue] = useState(event?.value !== undefined ? formatNumber(event.value, 3).replace(/\./g, '') : '')
  const [note, setNote] = useState(event?.note ?? '')
  const [photo, setPhoto] = useState(event?.photo)
  const [when, setWhen] = useState(toInputDateTime(event?.at ?? new Date().toISOString()))
  const [whenTouched, setWhenTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    const num = parseNum(value)
    if (needsNumber && (num === undefined || num <= 0)) return setError(`Escribe un valor válido en ${type.unit ?? 'número'}.`)
    if (type.key === 'other' && !note.trim()) return setError('Escribe qué ha pasado.')
    if (type.key === 'symptom' && !note.trim()) return setError('Elige o escribe qué síntoma has visto.')
    if (value.trim() !== '' && num === undefined) return setError('La cantidad no es un número válido.')
    setBusy(true)
    try {
      const data = {
        level,
        value: num,
        unit: num !== undefined ? type.unit : undefined,
        note: note.trim() || undefined,
        photo,
        at: !event && !whenTouched ? new Date().toISOString() : fromInputDateTime(when),
      }
      if (event) await repo.updateEvent(event.id, data)
      else await repo.addEvent({ petId, typeId: type.id, ...data })
      onClose()
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.')
      setBusy(false)
    }
  }

  const isSymptom = type.key === 'symptom'
  const pickSymptom = (name: string) => {
    setError('')
    setNote((cur) => {
      const t = cur.trim()
      if (t === name) return ''
      if (t === '' || (SYMPTOM_SUGGESTIONS as readonly string[]).includes(t)) return name
      return t.startsWith(name) ? t : `${name}. ${t}`
    })
  }
  const levelTitle = type.key === 'food' ? 'Cuánto comió' : type.key === 'water' ? 'Cuánto bebió' : type.key === 'stool' ? 'Consistencia' : type.key === 'mood' ? 'Cómo está' : 'Intensidad'

  const remove = async () => {
    if (event && (await confirmDialog(`¿Eliminar este registro de ${type.label.toLowerCase()}?`))) {
      await repo.deleteEvent(event.id)
      onClose()
    }
  }

  return (
    <Sheet
      title={type.label}
      icon={<TypeIcon k={type.key} emoji={type.emoji} size={30} />}
      onClose={onClose}
      foot={
        <>
          {event && (
            <button className="btn danger" onClick={remove} aria-label="Eliminar registro">
              <IconTrash />
            </button>
          )}
          <button className="btn primary" onClick={save} disabled={busy}>
            {event ? 'Guardar cambios' : 'Guardar'}
          </button>
        </>
      }
    >
      {isSymptom && (
        <Field label="¿Qué has visto?">
          <div className="chips">
            {SYMPTOM_SUGGESTIONS.map((n) => (
              <button key={n} type="button" className="chip" aria-pressed={note.trim().startsWith(n)} onClick={() => pickSymptom(n)}>
                {n}
              </button>
            ))}
          </div>
        </Field>
      )}
      {levels.length > 0 && (
        <Field label={`${levelTitle} (opcional)`}>
          <div className="opts-grid" role="radiogroup" aria-label={levelTitle} style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
            {levels.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={level === l.value}
                className="chip"
                onClick={() => setLevel(level === l.value ? undefined : l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Field>
      )}
      {(needsNumber || type.unit) && (
        <div className="field">
          <label htmlFor="ev-value" className="lbl">
            {needsNumber ? `Valor (${type.unit})` : `${type.unit === 'g' ? 'Gramos' : type.unit === 'ml' ? 'Mililitros' : `Cantidad en ${type.unit}`} exactos (opcional)`}
          </label>
          <input id="ev-value" className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={needsNumber ? 'p. ej. 4,2' : ''} autoFocus={needsNumber} />
        </div>
      )}
      <div className="field">
        <label htmlFor="ev-note" className="lbl">
          {type.key === 'vet' ? 'Motivo o resultado' : isSymptom ? 'Descripción' : 'Nota'}
          {type.key === 'other' || isSymptom ? '' : ' (opcional)'}
        </label>
        <textarea
          id="ev-note"
          className="input"
          rows={2}
          style={{ minHeight: type.input === 'text' ? '5rem' : '3.25rem' }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus={type.input === 'text'}
          placeholder={isSymptom ? 'Elige arriba o escribe, p. ej. «se rasca la oreja»' : type.key === 'other' ? 'Qué ha pasado' : ''}
        />
      </div>
      <div className="when-row">
        <div className="field">
          <label htmlFor="ev-when" className="lbl">
            {type.key === 'vet' ? 'Fecha y hora (puede ser futura)' : 'Fecha y hora'}
          </label>
          <input
            id="ev-when"
            className="input"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value)
              setWhenTouched(true)
            }}
          />
        </div>
        {photo ? (
          <button type="button" className="thumb" onClick={() => setPhoto(undefined)} aria-label="Quitar la foto">
            <img src={photo} alt="Foto adjunta" />
            <span aria-hidden="true">✕</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn photo-btn"
            aria-label="Añadir foto"
            onClick={async () => {
              const f = await pickImage()
              if (f) {
                try {
                  setPhoto(await fileToSmallDataUrl(f))
                } catch {
                  setError('No se pudo leer esa imagen.')
                }
              }
            }}
          >
            📷 Foto
          </button>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  )
}
