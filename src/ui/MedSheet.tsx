import { useState } from 'react'
import { repo } from '../data/instance'
import { useDoseLogs, useNow, useTreatments } from '../data/hooks'
import { DOSE_UNITS } from '../domain/eventTypes'
import { doseText, isTreatmentActive, scheduleText } from '../domain/schedule'
import { addDays, startOfLocalDay } from '../domain/time'
import { Sheet } from './components'
import { IconPlus } from './icons'
import { TypeIcon } from './art/TypeIcon'
import { nearestOpenSlot, useDoseActions } from './doses'
import { tl } from '../i18n'

/** Botón "Medicación": un toque por tratamiento, o una toma suelta. */
export function MedSheet({ petId, onClose, onNewTreatment }: { petId: string; onClose: () => void; onNewTreatment: () => void }) {
  const treatments = useTreatments(petId)
  const now = useNow()
  const logs = useDoseLogs(petId, addDays(startOfLocalDay(now), -1))
  const act = useDoseActions(petId)
  const [adHoc, setAdHoc] = useState(false)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [unit, setUnit] = useState<string>('mg')
  const active = (treatments ?? []).filter((t) => isTreatmentActive(t, now))

  return (
    <Sheet title={tl('Medicación')} icon={<TypeIcon k="medication" size={30} />} onClose={onClose}>
      {active.length === 0 && !adHoc && <p className="muted">{tl('Todavía no hay tratamientos. Créalo una vez y después registrarás cada toma con un toque.')}</p>}
      {active.length > 0 && <div className="list">
        {active.map((t) => (
          <div className="list-item" key={t.id}>
            <span className="txt">
              <b>
                {t.name} <span className="muted" style={{ fontWeight: 600 }}>{doseText(t)}</span>
              </b>
              <small>{scheduleText(t)}</small>
            </span>
            <button
              className="btn primary sm"
              onClick={async () => {
                await act.give(t, nearestOpenSlot(t, logs ?? [], now))
                onClose()
              }}
            >
              {tl('Dada ahora')}
            </button>
          </div>
        ))}
      </div>}
      {adHoc ? (
        <div className="stack">
          <div className="field">
            <label htmlFor="ad-name" className="lbl">
              {tl('Medicamento')}
            </label>
            <input id="ad-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="ad-dose" className="lbl">
                {tl('Dosis (opcional)')}
              </label>
              <input id="ad-dose" className="input" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ad-unit" className="lbl">
                {tl('Unidad')}
              </label>
              <select id="ad-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {DOSE_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="btn primary block"
            disabled={!name.trim()}
            onClick={async () => {
              const d = Number(dose.replace(',', '.'))
              await repo.logDose({ petId, status: 'given', adHoc: { name: name.trim(), dose: dose.trim() && Number.isFinite(d) ? d : undefined, unit } })
              onClose()
            }}
          >
            {tl('Registrar toma')}
          </button>
        </div>
      ) : (
        <div className="two">
          <button className="btn" onClick={() => setAdHoc(true)}>
            {tl('Toma suelta')}
          </button>
          <button className="btn" onClick={onNewTreatment}>
            <IconPlus />
            {tl('Tratamiento')}
          </button>
        </div>
      )}
    </Sheet>
  )
}
