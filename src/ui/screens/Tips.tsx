import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useBanner } from '../../monetize/useBanner'
import { useOutletContext } from 'react-router-dom'
import { TIP_SCOPE, TIP_TOPICS, TIPS, type TipTopic } from '../../domain/tips'
import type { Pet } from '../../domain/types'
import { openExternal } from '../../platform/files'
import { TipArt, TipPet, TopicIcon } from '../art/TipArt'
import { IconBack, IconNext } from '../icons'
import { tl } from '../../i18n'

/** Consejos de cuidado de la especie: fichas ilustradas por tema, una a una (sin scroll). */
export function Tips() {
  useBanner()
  const { pet } = useOutletContext<{ pet: Pet }>()
  const tips = useMemo(() => {
    const all = TIPS[pet.species] ?? []
    // Orden por tema, para poder pasar de una ficha a la siguiente sin saltos.
    return TIP_TOPICS.flatMap(({ key }) => all.filter((t) => t.topic === key))
  }, [pet.species])
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const tip = tips[Math.min(i, tips.length - 1)]
  const topics = TIP_TOPICS.filter(({ key }) => tips.some((t) => t.topic === key))
  const inTopic = tip ? tips.filter((t) => t.topic === tip.topic) : []
  const pos = tip ? inTopic.indexOf(tip) : 0
  const start = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => setI(0), [pet.species])

  if (!tip) return <p className="empty">{tl('No hay consejos para esta especie todavía.')}</p>

  const go = (n: number) => {
    const next = (n + tips.length) % tips.length
    setDir(n < i ? 'prev' : 'next')
    setI(next)
  }
  const pickTopic = (t: TipTopic) => {
    const first = tips.findIndex((x) => x.topic === t)
    setDir(first < i ? 'prev' : 'next')
    setI(first)
  }

  // Deslizar con el dedo: más de 40 px en horizontal cambia de ficha.
  const onDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? i + 1 : i - 1)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(i + 1)
    else if (e.key === 'ArrowLeft') go(i - 1)
  }

  return (
    <div className="tips">
      <div className="tip-topics" role="tablist" aria-label={tl('Temas')}>
        {topics.map(({ key, label }) => (
          <button key={key} role="tab" aria-selected={tip.topic === key} className={`tip-topic tip-${key}`} onClick={() => pickTopic(key)}>
            <TopicIcon topic={key} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <article
        key={tip.id}
        className={`tip-card tip-${tip.topic} enter-${dir}`}
        tabIndex={0}
        aria-roledescription="ficha"
        aria-label={tl('{0}. Ficha {1} de {2}', tip.title, pos + 1, inTopic.length)}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (start.current = null)}
        onKeyDown={onKey}
      >
        <div className="tip-band">
          <TipArt topic={tip.topic} />
          <TipPet kind={pet.species} />
        </div>
        <div className="tip-body" aria-live="polite">
          <h2>{tip.title}</h2>
          <p>{tip.text}</p>
          <div className="tip-foot">
            <p className="tip-src">
              {tl('Fuente:')}{' '}
              {tip.sources.map((s, k) => (
                <span key={s.url}>
                  {k > 0 && ', '}
                  <button type="button" className="link" onClick={() => openExternal(s.url)}>
                    {s.name}
                  </button>
                </span>
              ))}
            </p>
            <div className="tip-pager">
              <button className="icon-btn" onClick={() => go(i - 1)} aria-label={tl('Ficha anterior')}>
                <IconBack />
              </button>
              <div className="dots" aria-hidden="true">
                {inTopic.map((t, k) => (
                  <span key={t.id} className={k === pos ? 'on' : ''} />
                ))}
              </div>
              <span className="sr-only">
                {tl('Ficha')}{' '}{pos + 1} {tl('de')}{' '}{inTopic.length}
              </span>
              <button className="icon-btn" onClick={() => go(i + 1)} aria-label={tl('Ficha siguiente')}>
                <IconNext />
              </button>
            </div>
          </div>
        </div>
      </article>

      <p className="tips-note">{TIP_SCOPE[pet.species] ? `${TIP_SCOPE[pet.species]} ` : ''}{tl('Consejos generales: ante cualquier duda, tu veterinario.')}</p>
    </div>
  )
}
