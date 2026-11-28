import { useMemo, useState } from 'react'
import { useBanner } from '../../monetize/useBanner'
import { useOutletContext } from 'react-router-dom'
import { useNow } from '../../data/hooks'
import type { Pet } from '../../domain/types'
import { addDays, formatDateLong, startOfLocalDay, toLocalDate } from '../../domain/time'
import { Empty, Seg, Sheet } from '../components'
import { IconFilter } from '../icons'
import { TypeIcon } from '../art/TypeIcon'
import { PetIllustration } from '../art/pets'
import { Paged, type PagedItem } from '../layout'
import { EntryEditor, EntryRow, entryLabel, useEntries, type Entry } from '../timeline'
import { tl } from '../../i18n'

type Period = 'today' | '7' | '30' | 'all'

export function History() {
  useBanner()
  const { pet } = useOutletContext<{ pet: Pet }>()
  const [period, setPeriod] = useState<Period>('7')
  const [filter, setFilter] = useState<Set<string>>(new Set())
  const [picking, setPicking] = useState(false)
  const [edit, setEdit] = useState<Entry | null>(null)
  const now = useNow(60_000)
  const dayKey = toLocalDate(now)
  const from = useMemo(
    () => (period === 'all' ? undefined : startOfLocalDay(addDays(now, period === 'today' ? 0 : period === '7' ? -6 : -29))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, dayKey],
  )
  const { entries, trById, types, ready } = useEntries(pet.id, from)

  const filtered = entries.filter((e) => filter.size === 0 || (e.kind === 'dose' ? filter.has('dose') : filter.has(e.type.id)))
  const nowIso = now.toISOString()
  const upcoming = filtered.filter((e) => e.at > nowIso).reverse()
  const past = filtered.filter((e) => e.at <= nowIso)

  const items: PagedItem[] = []
  const push = (e: Entry) =>
    items.push({ key: e.id, node: <EntryRow e={e} trById={trById} />, onClick: () => setEdit(e), label: entryLabel(e, trById) })
  if (upcoming.length) {
    items.push({ key: 'h-next', head: tl('Próximos') })
    upcoming.forEach(push)
  }
  let day = ''
  for (const e of past) {
    const k = toLocalDate(new Date(e.at))
    if (k !== day) {
      day = k
      items.push({ key: `h-${k}`, head: k === dayKey ? `Hoy, ${formatDateLong(k).toLowerCase()}` : formatDateLong(k) })
    }
    push(e)
  }

  const usedTypes = types.filter((t) => t.key !== 'medication' && entries.some((e) => e.kind === 'event' && e.type.id === t.id))
  const hasDoses = entries.some((e) => e.kind === 'dose')
  const toggle = (id: string) =>
    setFilter((f) => {
      const n = new Set(f)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const filterText =
    filter.size === 0
      ? tl('Todos los tipos')
      : [...filter].map((id) => (id === 'dose' ? tl('Medicación') : types.find((t) => t.id === id)?.label ?? '')).filter(Boolean).join(', ')

  return (
    <>
      <Seg<Period>
        label={tl('Periodo')}
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'today', label: tl('Hoy') },
          { value: '7', label: tl('7 días') },
          { value: '30', label: tl('30 días') },
          { value: 'all', label: tl('Todo') },
        ]}
      />
      <div className="bar">
        <button className={`chip${filter.size ? '' : ''}`} aria-pressed={filter.size > 0} onClick={() => setPicking(true)} style={{ maxWidth: '68%' }}>
          <IconFilter />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filterText}</span>
        </button>
        <span className="hint" style={{ fontWeight: 650 }}>
          {filtered.length} {filtered.length === 1 ? tl('registro') : tl('registros')}
        </span>
      </div>

      {ready && (
        <Paged
          items={items}
          rowRem={3.75}
          resetKey={`${period}|${[...filter].join()}`}
          label={tl('Historial')}
          empty={
            <Empty emoji={<PetIllustration species="cat" />} title={filter.size ? tl('Nada de ese tipo') : tl('Sin registros en este periodo')}>
              <p>{filter.size ? tl('Prueba con otro tipo o un periodo más largo.') : tl('Lo que registres aparecerá aquí, ordenado por día y hora.')}</p>
            </Empty>
          }
        />
      )}

      {picking && (
        <Sheet
          title={tl('Mostrar')}
          onClose={() => setPicking(false)}
          foot={
            <>
              <button className="btn" onClick={() => setFilter(new Set())} disabled={filter.size === 0}>
                {tl('Ver todo')}
              </button>
              <button className="btn primary" onClick={() => setPicking(false)}>
                {tl('Aplicar')}
              </button>
            </>
          }
        >
          {usedTypes.length === 0 && !hasDoses ? (
            <p className="muted">{tl('Todavía no hay registros que filtrar en este periodo.')}</p>
          ) : (
            <div className="chips" role="group" aria-label={tl('Tipos de registro')}>
              {hasDoses && (
                <button className="chip" aria-pressed={filter.has('dose')} onClick={() => toggle('dose')}>
                  <TypeIcon k="medication" size={22} /> {tl('Medicación')}
                </button>
              )}
              {usedTypes.map((t) => (
                <button key={t.id} className="chip" aria-pressed={filter.has(t.id)} onClick={() => toggle(t.id)}>
                  <TypeIcon k={t.key} emoji={t.emoji} size={22} /> {t.label}
                </button>
              ))}
            </div>
          )}
          <p className="hint">{tl('Elige uno o varios. Sin selección se muestra todo.')}</p>
        </Sheet>
      )}

      {edit && <EntryEditor petId={pet.id} entry={edit} trById={trById} onClose={() => setEdit(null)} />}
    </>
  )
}
