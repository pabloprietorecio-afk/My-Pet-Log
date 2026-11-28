import { useState } from 'react'
import { repo } from '../data/instance'
import { DOSE_UNITS } from '../domain/eventTypes'
import type { ScheduleMode, Treatment } from '../domain/types'
import { addDays, formatNumber, isValidTime, toLocalDate } from '../domain/time'
import { Field, Seg, Sheet, confirmDialog, useToast } from './components'
import { IconTrash } from './icons'
import { tl } from '../i18n'

const EVERY: { value: number; label: string }[] = [
  { value: 1, label: tl('Cada día') },
  { value: 2, label: tl('Día sí, día no') },
  { value: 3, label: tl('Cada 3 días') },
  { value: 7, label: tl('Cada semana') },
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
    if (!name.trim()) return setError(tl('Escribe el nombre del medicamento.'))
    if (!Number.isFinite(d) || d <= 0) return setError(tl('Escribe una dosis válida.'))
    if (mode === 'scheduled' && times.length === 0) return setError(tl('Añade al menos una hora.'))
    if (end && end < start) return setError(tl('La fecha de fin es anterior al inicio.'))
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
        if (r.revised) toast.show(<span className="msg">{tl('Se guarda como pauta nueva desde hoy; el historial anterior se conserva.')}</span>, 6000)
      } else await repo.createTreatment({ petId, ...data })
      onClose()
    } catch {
      setError(tl('No se pudo guardar.'))
    }
  }

  const canFinish = treatment && (!treatment.endDate || treatment.endDate >= toLocalDate(new Date()))

  return (
    <Sheet
      title={treatment ? tl('Editar tratamiento') : tl('Nuevo tratamiento')}
      onClose={onClose}
      foot={
        <>
          {treatment && (
            <button
              className="btn danger"
              aria-label={tl('Eliminar tratamiento')}
              onClick={async () => {
                if (await confirmDialog(tl('¿Eliminar este tratamiento? Las tomas ya registradas seguirán en el historial.'))) {
                  await repo.deleteTreatment(treatment.id)
                  onClose()
                }
              }}
            >
              <IconTrash />
            </button>
          )}
          <button className="btn primary" onClick={save}>
            {tl('Guardar tratamiento')}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="tr-name" className="lbl">
          {tl('Medicamento')}
        </label>
        <input id="tr-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={tl('p. ej. Prednisona')} autoFocus={!treatment} />
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="tr-dose" className="lbl">
            {tl('Dosis')}
          </label>
          <input id="tr-dose" className="input" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5" />
        </div>
        <div className="field">
          <label htmlFor="tr-unit" className="lbl">
            {tl('Unidad')}
          </label>
          <select id="tr-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {[...new Set([...DOSE_UNITS, unit])].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <Seg
        label={tl('Tipo de pauta')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'scheduled', label: tl('Con horario') },
          { value: 'asNeeded', label: tl('Si hace falta') },
        ]}
      />
      {mode === 'scheduled' && (
        <>
          <Field label={tl('Horas de las tomas')}>
            <div className="chips">
              {[...times].sort().map((t) => (
                <button key={t} type="button" className="chip" aria-label={tl('Quitar las {0}', t)} onClick={() => setTimes(times.filter((x) => x !== t))}>
                  {t} ✕
                </button>
              ))}
              <span className="row" style={{ gap: 'var(--s1)' }}>
                <input className="input" type="time" value={newTime} aria-label={tl('Nueva hora')} onChange={(e) => setNewTime(e.target.value)} style={{ width: '8.75rem', minHeight: 'var(--tap)' }} />
                <button type="button" className="btn sm tonal" disabled={!isValidTime(newTime) || times.includes(newTime)} onClick={() => setTimes([...times, newTime])}>
                  {tl('Añadir')}
                </button>
              </span>
            </div>
          </Field>
          <div className="two">
            <div className="field">
              <label htmlFor="tr-every" className="lbl">
                {tl('Frecuencia')}
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
                {tl('Cuenta «a tiempo»')}
              </label>
              <select id="tr-grace" className="input" value={grace} onChange={(e) => setGrace(Number(e.target.value))}>
                {[30, 60, 90, 120].map((g) => (
                  <option key={g} value={g}>
                    ± {g} {tl('min')}
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
            {tl('Empieza')}
          </label>
          <input id="tr-start" className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="tr-end" className="lbl">
            {tl('Termina (opcional)')}
          </label>
          <input id="tr-end" className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="tr-notes" className="lbl">
          {tl('Notas (opcional)')}
        </label>
        <input id="tr-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tl('p. ej. con comida')} />
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
          {tl('Finalizar tratamiento (hasta ayer)')}
        </button>
      )}
    </Sheet>
  )
}
