import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { reportCharts } from '../../charts/reportCharts'
import { makePeriod } from '../../domain/report'
import type { Pet } from '../../domain/types'
import { addDays, endOfLocalDay, startOfLocalDay } from '../../domain/time'
import { Empty, Seg, Sheet } from '../components'
import { IconBack, IconDown, IconNext } from '../icons'
import { useBox } from '../layout'
import { useReportModel } from '../reportData'
import { useChartPalette } from '../theme'

type Range = '7d' | '30d' | '90d'

/** Una gráfica cada vez, ocupando todo el hueco: se lee mejor y no hay scroll. */
export function Charts() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  const [range, setRange] = useState<Range>('30d')
  const [idx, setIdx] = useState(0)
  const [picking, setPicking] = useState(false)
  const [showData, setShowData] = useState(false)
  const palette = useChartPalette()
  const [plotRef, plot] = useBox<HTMLDivElement>()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [range])
  const period = useMemo(() => {
    if (range === '90d') {
      return { preset: 'custom' as const, from: startOfLocalDay(addDays(now, -89)), to: endOfLocalDay(now), label: 'Últimos 90 días' }
    }
    return makePeriod(range, now)
  }, [range, now])
  const model = useReportModel(pet, period, now)
  const w = Math.max(240, Math.round(plot.w))
  const h = Math.max(140, Math.round(plot.h))
  const charts = useMemo(() => (model ? reportCharts(model, palette, w, h) : []), [model, palette, w, h])
  const hasAny = model && (model.timeline.length > 0 || model.weight.points.length > 0)
  const i = Math.min(idx, Math.max(0, charts.length - 1))
  const c = charts[i]

  return (
    <>
      <Seg<Range>
        label="Periodo de las gráficas"
        value={range}
        onChange={setRange}
        options={[
          { value: '7d', label: '7 días' },
          { value: '30d', label: '30 días' },
          { value: '90d', label: '90 días' },
        ]}
      />
      {model && !hasAny ? (
        <Empty emoji="📈" title="Aún no hay datos para graficar">
          <p>Las gráficas se crean solas a partir de lo que registres.</p>
        </Empty>
      ) : (
        <>
          <div className="chart-nav">
            <button className="icon-btn soft" onClick={() => setIdx(i - 1)} disabled={i === 0} aria-label="Gráfica anterior">
              <IconBack />
            </button>
            <button className="chart-pick" onClick={() => setPicking(true)} aria-label={`${c?.title ?? 'Gráfica'}. Elegir otra gráfica`}>
              <b>
                <span>{c?.title ?? 'Gráficas'}</span>
                <IconDown />
              </b>
              <small>
                {charts.length ? `${i + 1} de ${charts.length}` : ' '}
              </small>
            </button>
            <button className="icon-btn soft" onClick={() => setIdx(i + 1)} disabled={i >= charts.length - 1} aria-label="Gráfica siguiente">
              <IconNext />
            </button>
          </div>
          <section className="stage" aria-label={c?.title}>
            {c?.note && <p className="note">{c.note}</p>}
            <div className="plot" ref={plotRef}>
              {c && <div dangerouslySetInnerHTML={{ __html: c.svg }} />}
            </div>
            <div className="foot">
              {c?.legend ? (
                <div className="legend">
                  {c.legend.map((l) => (
                    <span key={l.label}>
                      <i style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <button className="link-btn" onClick={() => setShowData(true)} disabled={!c}>
                Ver datos
              </button>
            </div>
          </section>
        </>
      )}

      {picking && (
        <Sheet title="Gráficas" onClose={() => setPicking(false)}>
          <div className="list">
            {charts.map((x, j) => (
              <button
                key={x.key}
                className="list-item"
                aria-current={j === i}
                onClick={() => {
                  setIdx(j)
                  setPicking(false)
                }}
              >
                <span className="txt">
                  <b>{x.title}</b>
                  {x.note && <small>{x.note}</small>}
                </span>
                {j === i ? <span className="badge due">Viendo</span> : <IconNext />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {showData && c && (
        <Sheet title={c.title} onClose={() => setShowData(false)}>
          <p className="hint">{period.label}. Datos tal como se registraron.</p>
          <div className="data-text">{c.text.split('; ').join('\n')}</div>
        </Sheet>
      )}
    </>
  )
}
