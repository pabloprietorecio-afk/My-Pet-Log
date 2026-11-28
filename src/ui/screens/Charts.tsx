import { useMemo, useState } from 'react'
import { useBanner } from '../../monetize/useBanner'
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
import { tl } from '../../i18n'

type Range = '7d' | '30d' | '90d'

/** Una gráfica cada vez, ocupando todo el hueco: se lee mejor y no hay scroll. */
export function Charts() {
  useBanner()
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
      return { preset: 'custom' as const, from: startOfLocalDay(addDays(now, -89)), to: endOfLocalDay(now), label: tl('Últimos 90 días') }
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
        label={tl('Periodo de las gráficas')}
        value={range}
        onChange={setRange}
        options={[
          { value: '7d', label: tl('7 días') },
          { value: '30d', label: tl('30 días') },
          { value: '90d', label: tl('90 días') },
        ]}
      />
      {model && !hasAny ? (
        <Empty emoji="📈" title={tl('Aún no hay datos para graficar')}>
          <p>{tl('Las gráficas se crean solas a partir de lo que registres.')}</p>
        </Empty>
      ) : (
        <>
          <div className="chart-nav">
            <button className="icon-btn soft" onClick={() => setIdx(i - 1)} disabled={i === 0} aria-label={tl('Gráfica anterior')}>
              <IconBack />
            </button>
            <button className="chart-pick" onClick={() => setPicking(true)} aria-label={tl('{0}. Elegir otra gráfica', c?.title ?? 'Gráfica')}>
              <b>
                <span>{c?.title ?? tl('Gráficas')}</span>
                <IconDown />
              </b>
              <small>
                {charts.length ? `${i + 1} de ${charts.length}` : ' '}
              </small>
            </button>
            <button className="icon-btn soft" onClick={() => setIdx(i + 1)} disabled={i >= charts.length - 1} aria-label={tl('Gráfica siguiente')}>
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
                {tl('Ver datos')}
              </button>
            </div>
          </section>
        </>
      )}

      {picking && (
        <Sheet title={tl('Gráficas')} onClose={() => setPicking(false)}>
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
                {j === i ? <span className="badge due">{tl('Viendo')}</span> : <IconNext />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {showData && c && (
        <Sheet title={c.title} onClose={() => setShowData(false)}>
          <p className="hint">{period.label}{tl('. Datos tal como se registraron.')}</p>
          <div className="data-text">{c.text.split('; ').join('\n')}</div>
        </Sheet>
      )}
    </>
  )
}
