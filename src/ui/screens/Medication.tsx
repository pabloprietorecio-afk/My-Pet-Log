import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useDoseLogs, useNow, useTreatments } from '../../data/hooks'
import { adherence, doseStateLabel, doseText, isTreatmentActive, scheduleText } from '../../domain/schedule'
import type { Pet, Treatment } from '../../domain/types'
import { addDays, endOfLocalDay, formatDateShort, formatTime, startOfLocalDay } from '../../domain/time'
import { Empty, Seg } from '../components'
import { TypeIcon } from '../art/TypeIcon'
import { PetIllustration } from '../art/pets'
import { todaySlots, useDoseActions, type SlotItem } from '../doses'
import { IconCheck, IconPlus } from '../icons'
import { Paged, type PagedItem } from '../layout'
import { TreatmentSheet } from '../TreatmentSheet'

type Tab = 'today' | 'plans'

const badge: Record<string, string> = { given: 'ok', late: 'warn', skipped: '', upcoming: '', due: 'due', overdue: 'bad' }

export function Medication() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  const now = useNow()
  const treatments = useTreatments(pet.id)
  const weekStart = startOfLocalDay(addDays(now, -6))
  const logs = useDoseLogs(pet.id, weekStart, endOfLocalDay(now))
  const act = useDoseActions(pet.id)
  const [sheet, setSheet] = useState<{ t?: Treatment } | null>(null)

  const all = treatments ?? []
  const active = all.filter((t) => isTreatmentActive(t, now))
  const ended = all.filter((t) => !isTreatmentActive(t, now))
  const slots = todaySlots(active, logs ?? [], now)
  const [picked, setTab] = useState<Tab | null>(null)
  // Por defecto, las tomas de hoy si las hay (se decide cuando los datos ya han cargado).
  const tab: Tab = picked ?? (slots.length ? 'today' : 'plans')
  const adh = new Map(adherence(active, logs ?? [], weekStart, endOfLocalDay(now), now).map((r) => [r.treatment.id, r]))

  const doseRow = (it: SlotItem): PagedItem => {
    const done = it.state === 'given' || it.state === 'late' || it.state === 'skipped'
    const at = formatTime(it.slot.at)
    return {
      key: it.slot.scheduledAt + it.treatment.id,
      node: (
        <div className={`dose${done ? ' done' : ''}`}>
          <span className="time">{at}</span>
          <span style={{ minWidth: 0 }}>
            <span className="name" style={{ display: 'block' }}>
              {it.treatment.name}
            </span>
            <span className="hint" style={{ fontWeight: 650, marginRight: 6 }}>
              {doseText(it.treatment)}
            </span>
            <span className={`badge ${badge[it.state]}`}>
              {doseStateLabel(it.state, it.slot.scheduledAt, now)}
              {it.log && it.state !== 'skipped' ? ` · ${formatTime(it.log.at)}` : ''}
            </span>
          </span>
          <span className="actions">
            {done ? (
              <button className="btn sm" onClick={() => act.remove(it.log!)} aria-label={`Deshacer ${it.treatment.name} de las ${at}`}>
                Deshacer
              </button>
            ) : (
              <>
                {(it.state === 'due' || it.state === 'overdue') && (
                  <button className="btn sm" onClick={() => act.skip(it.treatment, it.slot)} aria-label={`Omitir ${it.treatment.name} de las ${at}`}>
                    Omitir
                  </button>
                )}
                <button className="btn primary sm" onClick={() => act.give(it.treatment, it.slot)} aria-label={`Dar ${it.treatment.name} de las ${at} ahora`}>
                  <IconCheck />
                  Dada
                </button>
              </>
            )}
          </span>
        </div>
      ),
    }
  }

  const planRow = (t: Treatment, isActive: boolean): PagedItem => {
    const a = adh.get(t.id)
    const pct = a && a.planned > 0 ? Math.round(((a.given + a.late) / a.planned) * 100) : undefined
    const when = isActive
      ? scheduleText(t)
      : `Del ${formatDateShort(t.startDate)}${t.endDate ? ` al ${formatDateShort(t.endDate)}` : ''}`
    return {
      key: t.id,
      onClick: () => setSheet({ t }),
      label: `${t.name} ${doseText(t)}, ${when}${pct !== undefined ? `, ${pct} % de tomas dadas en 7 días` : ''}. Editar`,
      node: (
        <>
          <span className="e" aria-hidden="true">
            <TypeIcon k="medication" />
          </span>
          <span className="txt">
            <span className="lab">
              {t.name} <span className="muted" style={{ fontWeight: 600 }}>{doseText(t)}</span>
            </span>
            <span className="det">
              {when}
              {t.notes ? ` · ${t.notes}` : ''}
            </span>
          </span>
          {pct !== undefined ? (
            <span className={`badge ${pct >= 90 ? 'ok' : pct >= 60 ? 'warn' : 'bad'}`} title="Tomas dadas en 7 días">
              {pct} %
            </span>
          ) : (
            <span />
          )}
        </>
      ),
    }
  }

  const plans: PagedItem[] = []
  if (active.length) plans.push({ key: 'h-a', head: 'En curso' }, ...active.map((t) => planRow(t, true)))
  if (ended.length) plans.push({ key: 'h-e', head: 'Finalizados' }, ...ended.map((t) => planRow(t, false)))

  if (treatments !== undefined && all.length === 0) {
    return (
      <>
        <Empty emoji={<PetIllustration species="dog" />} title="Sin tratamientos">
          <p>Crea el tratamiento una vez, con su dosis y horario, y después registra cada toma con un toque.</p>
          <button className="btn primary" onClick={() => setSheet({})}>
            <IconPlus />
            Crear tratamiento
          </button>
        </Empty>
        {sheet && <TreatmentSheet petId={pet.id} treatment={sheet.t} onClose={() => setSheet(null)} />}
      </>
    )
  }

  return (
    <>
      <Seg<Tab>
        label="Vista de medicación"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: `Tomas de hoy${slots.length ? ` (${slots.length})` : ''}` },
          { value: 'plans', label: `Tratamientos (${all.length})` },
        ]}
      />
      {tab === 'today' ? (
        <Paged
          key="today"
          items={slots.map(doseRow)}
          rowRem={4.25}
          rowClass="dose-row"
          label="Tomas de hoy"
          empty={
            <Empty emoji="🗓️" title="Hoy no hay tomas con horario">
              <p>Los tratamientos «si hace falta» se registran con el botón Medicación de la pantalla Hoy.</p>
            </Empty>
          }
        />
      ) : (
        <>
          <Paged key="plans" items={plans} rowRem={3.9} rowClass="nt" label="Tratamientos" />
          <p className="hint" style={{ flex: 'none', textAlign: 'center' }}>
            El porcentaje es la parte de tomas previstas que constan como dadas en los últimos 7 días.
          </p>
          <button className="btn tonal block" style={{ flex: 'none' }} onClick={() => setSheet({})}>
            <IconPlus />
            Nuevo tratamiento
          </button>
        </>
      )}
      {sheet && <TreatmentSheet petId={pet.id} treatment={sheet.t} onClose={() => setSheet(null)} />}
    </>
  )
}
