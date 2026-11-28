import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { repo } from '../../data/instance'
import { useEventTypes } from '../../data/hooks'
import type { Pet } from '../../domain/types'
import { Field, Seg, Sheet, confirmDialog } from '../components'
import { IconDown, IconEye, IconEyeOff, IconPlus, IconTrash, IconUp } from '../icons'
import { Paged, type PagedItem } from '../layout'
import { TypeIcon } from '../art/TypeIcon'
import { tl } from '../../i18n'

const EMOJIS = ['🦴', '🐾', '😮‍💨', '🤧', '😴', '🏃', '🩹', '🦷', '👁️', '🌡️', '💉', '🥛', '🍗', '🚽', '🧴', '⭐']

function NewButton({ petId, onClose }: { petId: string; onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [input, setInput] = useState<'none' | 'level' | 'number'>('level')
  const [unit, setUnit] = useState('')
  return (
    <Sheet
      title={tl('Botón nuevo')}
      onClose={onClose}
      foot={
        <button
          className="btn primary"
          disabled={!label.trim()}
          onClick={async () => {
            await repo.createCustomType(petId, { label, emoji, input, unit })
            onClose()
          }}
        >
          {tl('Crear botón')}
        </button>
      }
    >
      <div className="field">
        <label htmlFor="b-label" className="lbl">
          {tl('Nombre')}
        </label>
        <input id="b-label" className="input" value={label} maxLength={20} onChange={(e) => setLabel(e.target.value)} placeholder={tl('p. ej. Cojera')} autoFocus />
      </div>
      <Field label={tl('Icono')}>
        <div className="chips" role="radiogroup" aria-label={tl('Icono')}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} className="chip emoji-only" aria-label={tl('Icono {0}', e)} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Field label={tl('¿Qué quieres anotar?')}>
        <Seg
          label={tl('Tipo de dato')}
          value={input}
          onChange={setInput}
          options={[
            { value: 'none', label: tl('Solo la hora') },
            { value: 'level', label: tl('Intensidad') },
            { value: 'number', label: tl('Un número') },
          ]}
        />
      </Field>
      {input === 'number' && (
        <div className="field">
          <label htmlFor="b-unit" className="lbl">
            {tl('Unidad')}
          </label>
          <input id="b-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={tl('p. ej. respiraciones/min')} />
        </div>
      )}
      <p className="hint">{tl('Los botones con número generan una gráfica de evolución; los demás, un recuento por día.')}</p>
    </Sheet>
  )
}

export function Buttons() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  const types = useEventTypes(pet.id) ?? []
  const [adding, setAdding] = useState(false)

  const move = async (i: number, d: -1 | 1) => {
    const ids = types.map((t) => t.id)
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    await repo.reorderEventTypes(ids)
  }

  const items: PagedItem[] = types.map((t, i) => ({
    key: t.id,
    node: (
      <>
        <span className={`e${t.hidden ? ' off' : ''}`} aria-hidden="true">
          <TypeIcon k={t.key} emoji={t.emoji} />
        </span>
        <span className={`txt${t.hidden ? ' off' : ''}`}>
          <span className="lab">{t.label}</span>
          <span className="det">{t.hidden ? tl('Oculto') : t.key === 'custom' ? tl('Botón propio') : tl('Visible')}</span>
        </span>
        <span className="tools">
          <button aria-label={tl('Subir {0}', t.label)} disabled={i === 0} onClick={() => move(i, -1)}>
            <IconUp />
          </button>
          <button aria-label={tl('Bajar {0}', t.label)} disabled={i === types.length - 1} onClick={() => move(i, 1)}>
            <IconDown />
          </button>
          <button aria-label={t.hidden ? tl('Mostrar {0}', t.label) : tl('Ocultar {0}', t.label)} aria-pressed={!t.hidden} onClick={() => repo.updateEventType(t.id, { hidden: !t.hidden })}>
            {t.hidden ? <IconEyeOff /> : <IconEye />}
          </button>
          {t.key === 'custom' && (
            <button
              aria-label={tl('Eliminar {0}', t.label)}
              onClick={async () => {
                if (await confirmDialog(tl('¿Eliminar el botón «{0}»? Sus registros dejarán de mostrarse.', t.label))) await repo.deleteCustomType(t.id)
              }}
            >
              <IconTrash />
            </button>
          )}
        </span>
      </>
    ),
  }))

  return (
    <>
      <p className="hint" style={{ flex: 'none' }}>
        {tl('Ordena, oculta o crea tus botones. Ocultar un botón no borra lo que ya registraste.')}
      </p>
      <div className="fill cfg">
        <Paged items={items} rowRem={3.6} rowClass="nt" label={tl('Botones de registro')} />
      </div>
      <button className="btn tonal block" style={{ flex: 'none' }} onClick={() => setAdding(true)}>
        <IconPlus />
        {tl('Botón nuevo')}
      </button>
      {adding && <NewButton petId={pet.id} onClose={() => setAdding(false)} />}
    </>
  )
}
