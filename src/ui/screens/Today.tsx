import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { repo } from '../../data/instance'
import { useDoseLogs, useEventTypes, useEvents, useNow, useSettings, useTreatments } from '../../data/hooks'
import { levelOptions, levelQuestion, tapBehavior } from '../../domain/eventTypes'
import { doseStateLabel, doseText, isTreatmentActive } from '../../domain/schedule'
import type { EventType, LogEvent, Pet } from '../../domain/types'
import { endOfLocalDay, formatTime, startOfLocalDay } from '../../domain/time'
import { Empty, Sheet, useToast } from '../components'
import { TypeIcon } from '../art/TypeIcon'
import { TypeArt, tintVars } from '../art/TypeArt'
import { pushWidgets } from '../../platform/widgets'
import { PetIllustration } from '../art/pets'
import { DoseList, todaySlots, useDoseActions, type SlotItem } from '../doses'
import { EventSheet } from '../EventSheet'
import { IconCheck, IconNext } from '../icons'
import { Paged, useBox, useUsableHeight, type PagedItem } from '../layout'
import { MedSheet } from '../MedSheet'
import { EntryEditor, EntryRow, entryLabel, useEntries, type Entry } from '../timeline'
import { TreatmentSheet } from '../TreatmentSheet'
import { lowerName, tl } from '../../i18n'

type SheetState =
  | { kind: 'event'; type: EventType; event?: LogEvent }
  | { kind: 'med' }
  | { kind: 'treatment' }
  | { kind: 'doses' }
  | { kind: 'today' }
  | null

/** Confirmación tras registrar: detalle opcional con un toque, nota y deshacer. */
function AfterLog({ type, event, onNote }: { type: EventType; event: LogEvent; onNote: () => void }) {
  const toast = useToast()
  const [level, setLevel] = useState<number | undefined>(event.level)
  const options = levelOptions(type)
  return (
    <>
      <div className="toast-head">
        <span className="tick" aria-hidden="true">
          <IconCheck />
        </span>
        <TypeIcon k={type.key} emoji={type.emoji} size={24} />
        <span className="msg">{type.label} {tl('anotado')}</span>
        <span className="when">{formatTime(event.at)}</span>
      </div>
      {options.length > 0 && (
        <div className="toast-opts" role="group" aria-label={`${levelQuestion(type.key)} (opcional)`}>
          <span className="ask">{levelQuestion(type.key)} {tl('(opcional)')}</span>
          <div className="opts" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
            {options.map((o) => (
              <button
                key={o.value}
                className="chip"
                aria-pressed={level === o.value}
                onClick={async () => {
                  const next = level === o.value ? undefined : o.value
                  setLevel(next)
                  await repo.updateEvent(event.id, { level: next })
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="toast-actions">
        <button className="tbtn" onClick={onNote}>
          {tl('Añadir nota o foto')}
        </button>
        <button
          className="tbtn"
          onClick={async () => {
            await repo.deleteEvent(event.id)
            toast.hide()
          }}
        >
          {tl('Deshacer')}
        </button>
      </div>
    </>
  )
}

/** Elige columnas y orientación para que todos los botones quepan sin scroll y sean lo más grandes posible. */
function tileLayout(n: number, w: number, h: number) {
  const gap = h < 340 ? 8 : 10
  const fit = (cols: number) => {
    const rows = Math.ceil(n / cols)
    return { cols, rows, th: (h - gap * (rows - 1)) / rows, tw: (w - gap * (cols - 1)) / cols }
  }
  let L = fit(2)
  if (L.th < 72) L = fit(3)
  if (L.th < 58 && n > 9) {
    const four = fit(4)
    if (four.tw >= 70) L = four
  }
  const rowH = Math.min(L.th, 140)
  // Icono arriba y nombre abajo: el nombre nunca se corta. Con ancho de sobra, todo más grande.
  return { ...L, gap, rowH, mode: L.tw >= 150 ? 'v roomy' : 'v', tight: L.tw < 105 }
}

/** Icono lo más grande posible sin pisar el nombre (padding + línea de texto + respiro). */
function iconPx(L: ReturnType<typeof tileLayout>) {
  const roomy = L.mode.includes('roomy')
  const pad = roomy ? 20 : L.tight ? 15 : 19
  const label = roomy ? 20 : L.tight ? 15 : 18
  return Math.round(Math.max(24, Math.min(58, L.tw * 0.4, L.rowH - pad - label - 4)))
}

/** La toma que importa ahora: la primera pendiente o, si no, la siguiente. */
function focusSlot(slots: SlotItem[]) {
  return (
    slots.find((s) => s.state === 'overdue') ?? slots.find((s) => s.state === 'due') ?? slots.find((s) => s.state === 'upcoming') ?? null
  )
}

export function Today() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  const now = useNow()
  const from = startOfLocalDay(now)
  const to = endOfLocalDay(now)
  const settings = useSettings()
  const types = useEventTypes(pet.id)
  const events = useEvents(pet.id, from, to)
  const treatments = useTreatments(pet.id)
  const logs = useDoseLogs(pet.id, from, to)
  const toast = useToast()
  const act = useDoseActions(pet.id)
  const [sheet, setSheet] = useState<SheetState>(null)
  const [flash, setFlash] = useState<{ id: string; text: string } | null>(null)
  const [gridRef, box] = useBox<HTMLDivElement>()
  // En móviles muy bajos el título de la rejilla cede su sitio («Personalizar» sigue en el menú de la mascota).
  const compact = useUsableHeight() < 560

  const visible = (types ?? []).filter((t) => !t.hidden)
  const active = (treatments ?? []).filter((t) => isTreatmentActive(t, now))
  const slots = todaySlots(active, logs ?? [], now)
  const pending = slots.filter((x) => x.state === 'due' || x.state === 'overdue').length
  const doneSlots = slots.filter((x) => x.state === 'given' || x.state === 'late' || x.state === 'skipped').length
  const focus = focusSlot(slots)
  const givenToday = (logs ?? []).filter((l) => l.status === 'given').length

  const count = (t: EventType) => (t.key === 'medication' ? givenToday : (events ?? []).filter((e) => e.typeId === t.id).length)

  // Widgets de Android: mascota y primeros botones (orden de «Personalizar»).
  useEffect(() => {
    if (types) void pushWidgets(pet.id, pet.name, [...types].sort((a, b) => a.order - b.order))
  }, [pet.id, pet.name, types])

  // Botón del widget: petlog://anotar/<botón> llega como ?anotar=<id>
  const [q, setQ] = useSearchParams()
  const fromWidget = q.get('anotar')
  useEffect(() => {
    if (!fromWidget || !types) return
    const t = types.find((x) => x.id === fromWidget)
    setQ({}, { replace: true })
    if (t) void tap(t)
  }, [fromWidget, types]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = async (type: EventType) => {
    const behavior = settings?.tapMode === 'sheet' && type.key !== 'medication' ? 'sheet' : tapBehavior(type)
    if (behavior === 'medication') return setSheet({ kind: 'med' })
    if (behavior === 'sheet') return setSheet({ kind: 'event', type })
    const ev = await repo.addEvent({ petId: pet.id, typeId: type.id })
    navigator.vibrate?.(12)
    setFlash({ id: type.id, text: formatTime(ev.at) })
    setTimeout(() => setFlash((f) => (f?.id === type.id ? null : f)), 1100)
    toast.show(
      <AfterLog
        type={type}
        event={ev}
        onNote={() => {
          toast.hide()
          setSheet({ kind: 'event', type, event: ev })
        }}
      />,
      9000,
    )
  }

  const L = tileLayout(visible.length, box.w, box.h)
  const rest = visible.length % L.cols
  const todayCount = (events ?? []).length + (logs ?? []).length
  const lastEvent = [...(events ?? [])].sort((a, b) => b.at.localeCompare(a.at))[0]
  const lastType = lastEvent ? visible.find((t) => t.id === lastEvent.typeId) ?? (types ?? []).find((t) => t.id === lastEvent.typeId) : undefined

  return (
    <>
      {focus ? (
        <div className={`strip${focus.state === 'overdue' ? ' alert' : ''}`}>
          <button className="main" onClick={() => setSheet({ kind: 'doses' })} aria-label={tl('Tomas de hoy: {0}. Ver todas', slots.length)}>
            <span className="time">{formatTime(focus.slot.at)}</span>
            <span className="txt">
              <span className="ttl">
                {focus.treatment.name} {doseText(focus.treatment)}
              </span>
              <span className="sub">
                <span className={focus.state === 'overdue' ? 'error' : undefined} style={{ fontSize: 'inherit' }}>
                  {doseStateLabel(focus.state, focus.slot.scheduledAt, now)}
                </span>
                {slots.length > 1 ? tl(' · {0} de {1} hoy', doneSlots, slots.length) : ''}
              </span>
            </span>
          </button>
          <button
            className="btn primary sm"
            onClick={() => act.give(focus.treatment, focus.slot)}
            aria-label={tl('Dar {0} de las {1} ahora', focus.treatment.name, formatTime(focus.slot.at))}
          >
            <IconCheck />
            {tl('Dada')}
          </button>
        </div>
      ) : slots.length > 0 ? (
        <button className="strip done" onClick={() => setSheet({ kind: 'doses' })}>
          <span className="main" style={{ pointerEvents: 'none' }}>
            <span className="lead ic-ok" aria-hidden="true">
              <IconCheck />
            </span>
            <span className="txt">
              <span className="ttl">{tl('Tomas de hoy al día')}</span>
              <span className="sub">
                {doneSlots} {tl('de')}{' '}{slots.length} {tl('registradas')}
              </span>
            </span>
          </span>
          <IconNext />
        </button>
      ) : null}

      {!compact && <div className="bar today-bar" style={{ minHeight: '2.25rem' }}>
        <h2 className="eyebrow">{tl('¿Qué ha pasado?')}</h2>
        <Link className="link-btn" to="../botones">
          {tl('Personalizar')}
        </Link>
      </div>}

      {visible.length === 0 ? (
        <Empty emoji="🔘" title={tl('No hay botones visibles')}>
          <p>{tl('Actívalos en «Personalizar».')}</p>
        </Empty>
      ) : (
        <div
          ref={gridRef}
          className={`tiles ${L.mode}${L.tight ? ' tight' : ''}`}
          style={{
            ['--cols' as string]: L.cols,
            ['--gap' as string]: `${L.gap}px`,
            ['--ic' as string]: `${iconPx(L)}px`,
            gridAutoRows: `${Math.max(0, L.rowH)}px`,
            alignContent: 'center',
          }}
        >
          {visible.map((t, i) => {
            const n = count(t)
            const alert = t.key === 'medication' && pending > 0
            const aria = alert
              ? `${t.label}, ${pending} ${pending === 1 ? tl('toma pendiente') : tl('tomas pendientes')}`
              : `${t.label}${n ? `, ${n} hoy` : ''}`
            const wide = rest !== 0 && i === visible.length - 1
            return (
              <button
                key={t.id}
                className={`tile art${wide ? ' wide' : ''}`}
                style={{ ...(tintVars(t.key, t.emoji) as CSSProperties), ...(wide ? { gridColumn: `span ${L.cols - rest + 1}` } : null) }}
                onClick={() => tap(t)}
                aria-label={aria}
              >
                <TypeArt k={t.key} emoji={t.emoji} className="tart" />
                <span className="label">{t.label}</span>
                {alert ? (
                  <span className="count alert" aria-hidden="true">
                    {pending}
                  </span>
                ) : (
                  n > 0 && (
                    <span className="count" aria-hidden="true">
                      {n}
                    </span>
                  )
                )}
                {flash?.id === t.id && (
                  <span className="flash" aria-hidden="true">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <IconCheck />
                      {flash.text}
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <button className="strip ghost" onClick={() => setSheet({ kind: 'today' })}>
        <span className="main" style={{ pointerEvents: 'none' }}>
          <span className="lead" aria-hidden="true">
            <TypeIcon k={lastType?.key ?? 'other'} emoji={lastType?.emoji} size="100%" />
          </span>
          <span className="txt">
            <span className="ttl">
              {tl('Hoy:')}{' '}{todayCount} {todayCount === 1 ? tl('registro') : tl('registros')}
            </span>
            <span className="sub">
              {lastEvent && lastType ? tl('Último: {0} a las {1}', lowerName(lastType.label), formatTime(lastEvent.at)) : tl('Toca un botón y quedará anotado con la hora')}
            </span>
          </span>
        </span>
        <IconNext />
      </button>

      {sheet?.kind === 'event' && <EventSheet petId={pet.id} type={sheet.type} event={sheet.event} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'med' && <MedSheet petId={pet.id} onClose={() => setSheet(null)} onNewTreatment={() => setSheet({ kind: 'treatment' })} />}
      {sheet?.kind === 'treatment' && <TreatmentSheet petId={pet.id} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'doses' && (
        <Sheet title={tl('Tomas de hoy')} onClose={() => setSheet(null)}>
          <DoseList petId={pet.id} items={slots} now={now} />
          <Link className="btn block" to="../medicacion">
            {tl('Ver tratamientos')}
          </Link>
        </Sheet>
      )}
      {sheet?.kind === 'today' && <TodaySheet petId={pet.id} now={now} onClose={() => setSheet(null)} />}
    </>
  )
}

/** Lo registrado hoy, sin salir de la pantalla. */
function TodaySheet({ petId, now, onClose }: { petId: string; now: Date; onClose: () => void }) {
  const from = useMemo(() => startOfLocalDay(now), [now])
  const to = useMemo(() => endOfLocalDay(now), [now])
  const { entries, trById } = useEntries(petId, from, to)
  const [edit, setEdit] = useState<Entry | null>(null)
  const items: PagedItem[] = entries.map((e) => ({
    key: e.id,
    node: <EntryRow e={e} trById={trById} />,
    onClick: () => setEdit(e),
    label: entryLabel(e, trById),
  }))
  if (edit) return <EntryEditor petId={petId} entry={edit} trById={trById} onClose={() => setEdit(null)} />
  return (
    <Sheet title={tl('Hoy')} onClose={onClose}>
      <div className="box">
        <Paged
          items={items}
          rowRem={3.75}
          label={tl('Registros de hoy')}
          empty={
            <Empty emoji={<PetIllustration species="cat" />} title={tl('Nada todavía')}>
              <p>{tl('Toca un botón de la pantalla Hoy y quedará anotado con la hora.')}</p>
            </Empty>
          }
        />
      </div>
      <Link className="btn block" to="../historial">
        {tl('Abrir historial completo')}
      </Link>
    </Sheet>
  )
}
