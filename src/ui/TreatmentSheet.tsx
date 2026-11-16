import { useState } from 'react'
import { repo } from '../data/instance'
import { DOSE_UNITS } from '../domain/eventTypes'
import type { ScheduleMode, Treatment } from '../domain/types'
import { addDays, formatNumber, isValidTime, toLocalDate } from '../domain/time'
import { Field, Seg, Sheet, confirmDialog, useToast } from './components'
import { IconTrash } from './icons'

const EVERY: { value: number; label: string }[] = [
  { value: 1, label: 'Cada día' },
  { value: 2, label: 'Día sí, día no' },
  { value: 3, label: 'Cada 3 días' },
  { value: 7, label: 'Cada semana' },
]

export function TreatmentSheet({ petId, treatment, onClose }: { petId: string; treatment?: Treatment; onClose: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(treatment?.name ?? '')
  const [dose, setDose] = useState(treatment ? formatNumber(treatment.dose, 3).replace(/\./g, '') : '')
  const [unit, setUnit] = useState(treatment?.unit ?? 'mg')
  const [mode, setMode] = useState<ScheduleMode>(treatment?.mode ?? 'scheduled')
  const [every, setEvery] = useState(treatment?.everyDays ?? 1)
  const [times, setTimes] = useState<string[]>(treatment?.times ?? ['08:00', '20:00'])
  const [newTime, setNewTime] = useState('12:00')
  const [start, setStart] = useState(treatment?.startDate ?? toLocalDate(new Date()))
  const [end, setEnd] = useState(treatment?.endDate ?? '')
  const [grace, setGrace] = useState(treatment?.graceMinutes ?? 60)
  const [notes, setNotes] = useState(treatment?.notes ?? '')
  const [error, setError] = useState('')

  const save = async () => {
    const d = Number(dose.trim().replace(',', '.'))
    if (!name.trim()) return setError('Escribe el nombre del medicamento.')
    if (!Number.isFinite(d) || d <= 0) return setError('Escribe una dosis válida.')
    if (mode === 'scheduled' && times.length === 0) return setError('Añade al menos una hora.')
    if (end && end < start) return setError('La fecha de fin es anterior al inicio.')
    const data = {
      name: name.trim(),
      dose: d,
      unit,
      mode,
      times: mode === 'scheduled' ? times : [],
      everyDays: mode === 'scheduled' ? every : 1,
      startDate: start,
      endDate: end || undefined,
      graceMinutes: grace,
      notes: notes.trim() || undefined,
    }
    try {
      if (treatment) {
        const r = await repo.updateTreatment(treatment.id, data)
        if (r.revised) toast.show(<span className="msg">Se guarda como pauta nueva desde hoy; el historial anterior se conserva.</span>, 6000)
      } else await repo.createTreatment({ petId, ...data })
      onClose()
    } catch {
      setError('No se pudo guardar.')
    }
  }

  const canFinish = treatment && (!treatment.endDate || treatment.endDate >= toLocalDate(new Date()))

  return (
    <Sheet
      title={treatment ? 'Editar tratamiento' : 'Nuevo tratamiento'}
      onClose={onClose}
      foot={
        <>
          {treatment && (
            <button
              className="btn danger"
              aria-label="Eliminar tratamiento"
              onClick={async () => {
                if (await confirmDialog('¿Eliminar este tratamiento? Las tomas ya registradas seguirán en el historial.')) {
                  await repo.deleteTreatment(treatment.id)
                  onClose()
                }
              }}
            >
              <IconTrash />
            </button>
          )}
          <button className="btn primary" onClick={save}>
            Guardar tratamiento
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="tr-name" className="lbl">
          Medicamento
        </label>
        <input id="tr-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Prednisona" autoFocus={!treatment} />
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="tr-dose" className="lbl">
            Dosis
          </label>
          <input id="tr-dose" className="input" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5" />
        </div>
        <div className="field">
          <label htmlFor="tr-unit" className="lbl">
            Unidad
          </label>
          <select id="tr-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {[...new Set([...DOSE_UNITS, unit])].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <Seg
        label="Tipo de pauta"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'scheduled', label: 'Con horario' },
          { value: 'asNeeded', label: 'Si hace falta' },
        ]}
      />
      {mode === 'scheduled' && (
        <>
          <Field label="Horas de las tomas">
            <div className="chips">
              {[...times].sort().map((t) => (
                <button key={t} type="button" className="chip" aria-label={`Quitar las ${t}`} onClick={() => setTimes(times.filter((x) => x !== t))}>
                  {t} ✕
                </button>
              ))}
              <span className="row" style={{ gap: 'var(--s1)' }}>
                <input className="input" type="time" value={newTime} aria-label="Nueva hora" onChange={(e) => setNewTime(e.target.value)} style={{ width: '8.75rem', minHeight: 'var(--tap)' }} />
                <button type="button" className="btn sm tonal" disabled={!isValidTime(newTime) || times.includes(newTime)} onClick={() => setTimes([...times, newTime])}>
                  Añadir
                </button>
              </span>
            </div>
          </Field>
          <div className="two">
            <div className="field">
              <label htmlFor="tr-every" className="lbl">
                Frecuencia
              </label>
              <select id="tr-every" className="input" value={every} onChange={(e) => setEvery(Number(e.target.value))}>
                {EVERY.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tr-grace" className="lbl">
                Cuenta «a tiempo»
              </label>
              <select id="tr-grace" className="input" value={grace} onChange={(e) => setGrace(Number(e.target.value))}>
                {[30, 60, 90, 120].map((g) => (
                  <option key={g} value={g}>
                    ± {g} min
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
      <div className="two">
        <div className="field">
          <label htmlFor="tr-start" className="lbl">
            Empieza
          </label>
          <input id="tr-start" className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="tr-end" className="lbl">
            Termina (opcional)
          </label>
          <input id="tr-end" className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="tr-notes" className="lbl">
          Notas (opcional)
        </label>
        <input id="tr-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="p. ej. con comida" />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {canFinish && (
        <button
          className="btn block"
          onClick={async () => {
            await repo.updateTreatment(treatment!.id, { endDate: toLocalDate(addDays(new Date(), -1)) })
            onClose()
          }}
        >
          Finalizar tratamiento (hasta ayer)
        </button>
      )}
    </Sheet>
  )
}
