import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { repo } from '../../data/instance'
import { useEventTypes } from '../../data/hooks'
import type { Pet } from '../../domain/types'
import { Field, Seg, Sheet, confirmDialog } from '../components'
import { IconDown, IconEye, IconEyeOff, IconPlus, IconTrash, IconUp } from '../icons'
import { Paged, type PagedItem } from '../layout'
import { TypeIcon } from '../art/TypeIcon'

const EMOJIS = ['🦴', '🐾', '😮‍💨', '🤧', '😴', '🏃', '🩹', '🦷', '👁️', '🌡️', '💉', '🥛', '🍗', '🚽', '🧴', '⭐']

function NewButton({ petId, onClose }: { petId: string; onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [input, setInput] = useState<'none' | 'level' | 'number'>('level')
  const [unit, setUnit] = useState('')
  return (
    <Sheet
      title="Botón nuevo"
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
          Crear botón
        </button>
      }
    >
      <div className="field">
        <label htmlFor="b-label" className="lbl">
          Nombre
        </label>
        <input id="b-label" className="input" value={label} maxLength={20} onChange={(e) => setLabel(e.target.value)} placeholder="p. ej. Cojera" autoFocus />
      </div>
      <Field label="Icono">
        <div className="chips" role="radiogroup" aria-label="Icono">
          {EMOJIS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} className="chip emoji-only" aria-label={`Icono ${e}`} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Field label="¿Qué quieres anotar?">
        <Seg
          label="Tipo de dato"
          value={input}
          onChange={setInput}
          options={[
            { value: 'none', label: 'Solo la hora' },
            { value: 'level', label: 'Intensidad' },
            { value: 'number', label: 'Un número' },
          ]}
        />
      </Field>
      {input === 'number' && (
        <div className="field">
          <label htmlFor="b-unit" className="lbl">
            Unidad
          </label>
          <input id="b-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="p. ej. respiraciones/min" />
        </div>
      )}
      <p className="hint">Los botones con número generan una gráfica de evolución; los demás, un recuento por día.</p>
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
          <span className="det">{t.hidden ? 'Oculto' : t.key === 'custom' ? 'Botón propio' : 'Visible'}</span>
        </span>
        <span className="tools">
          <button aria-label={`Subir ${t.label}`} disabled={i === 0} onClick={() => move(i, -1)}>
            <IconUp />
          </button>
          <button aria-label={`Bajar ${t.label}`} disabled={i === types.length - 1} onClick={() => move(i, 1)}>
            <IconDown />
          </button>
          <button aria-label={t.hidden ? `Mostrar ${t.label}` : `Ocultar ${t.label}`} aria-pressed={!t.hidden} onClick={() => repo.updateEventType(t.id, { hidden: !t.hidden })}>
            {t.hidden ? <IconEyeOff /> : <IconEye />}
          </button>
          {t.key === 'custom' && (
            <button
              aria-label={`Eliminar ${t.label}`}
              onClick={async () => {
                if (await confirmDialog(`¿Eliminar el botón «${t.label}»? Sus registros dejarán de mostrarse.`)) await repo.deleteCustomType(t.id)
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
        Ordena, oculta o crea tus botones. Ocultar un botón no borra lo que ya registraste.
      </p>
      <div className="fill cfg">
        <Paged items={items} rowRem={3.6} rowClass="nt" label="Botones de registro" />
      </div>
      <button className="btn tonal block" style={{ flex: 'none' }} onClick={() => setAdding(true)}>
        <IconPlus />
        Botón nuevo
      </button>
      {adding && <NewButton petId={pet.id} onClose={() => setAdding(false)} />}
    </>
  )
}
