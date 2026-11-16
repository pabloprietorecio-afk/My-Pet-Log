import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { backupFileName, createBackup, restoreBackup, serializeBackup } from '../../data/backup'
import { memoryMode, mirrorStatus, repo } from '../../data/instance'
import { useSettings } from '../../data/hooks'
import { isNative, pickTextFile, saveFile } from '../../platform/files'
import { Seg, Sheet, confirmDialog } from '../components'
import { IconBack, IconNext } from '../icons'
import { Backdrop } from '../art/Backdrop'
import { SettingIcon } from '../art/TypeIcon'

type Panel = 'theme' | 'tap' | 'backup' | 'privacy' | null

const THEME = { system: 'Automático', light: 'Claro', dark: 'Oscuro' } as const
const TAP = { instant: 'Registrar al instante', sheet: 'Pedir detalles antes' } as const

export function Settings() {
  const settings = useSettings()
  const nav = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  if (!settings) return null

  const backup = async () => {
    try {
      const file = await createBackup(repo)
      const blob = new Blob([serializeBackup(file)], { type: 'application/json' })
      await saveFile(blob, backupFileName(), 'Copia de seguridad de PetLog')
      setMsg({ ok: true, text: 'Copia generada. Guárdala en un lugar seguro: contiene datos privados.' })
    } catch (e) {
      setMsg({ ok: false, text: `No se pudo crear la copia: ${e instanceof Error ? e.message : 'error'}` })
    }
  }
  const restore = async () => {
    const text = await pickTextFile()
    if (text === null) return
    try {
      const r = await restoreBackup(repo, text)
      setMsg({ ok: true, text: `Copia restaurada: ${r.added} registros nuevos, ${r.updated} actualizados.` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'No se pudo restaurar la copia.' })
    }
  }

  const storage = isNative()
    ? mirrorStatus().lastError
      ? 'Aviso: la copia automática interna falló en el último intento. Haz una copia manual.'
      : 'Además de la base de datos, la app guarda una copia interna automática en su carpeta privada por si el sistema limpia el almacenamiento.'
    : memoryMode
      ? 'En esta vista de demostración los datos solo están en memoria y se borran al cerrarla.'
      : 'En el navegador, los datos se guardan en el almacenamiento del propio navegador.'

  const Item = ({ ico, title, sub, onClick, danger }: { ico: ReactNode; title: string; sub?: string; onClick: () => void; danger?: boolean }) => (
    <button className={`list-item${danger ? ' danger' : ''}`} onClick={onClick}>
      <span className="ico" aria-hidden="true">
        {ico}
      </span>
      <span className="txt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      {!danger && <IconNext />}
    </button>
  )

  return (
    <div className="app">
      <Backdrop scene="settings" />
      <header className="topbar">
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Volver">
          <IconBack />
        </button>
        <h1>Ajustes</h1>
      </header>
      <main className="screen" style={{ gap: 'var(--s4)' }}>
        <div className="list">
          <Item ico={<SettingIcon name="theme" />} title="Apariencia" sub={THEME[settings.theme]} onClick={() => setPanel('theme')} />
          <Item ico={<SettingIcon name="tap" />} title="Al tocar un botón" sub={TAP[settings.tapMode]} onClick={() => setPanel('tap')} />
        </div>
        <div className="list">
          <Item ico={<SettingIcon name="backup" />} title="Copia de seguridad" sub="Guardar o restaurar tus datos" onClick={() => setPanel('backup')} />
          <Item ico={<SettingIcon name="privacy" />} title="Privacidad" sub="Todo se queda en este dispositivo" onClick={() => setPanel('privacy')} />
        </div>
        <div className="list">
          <Item
            danger
            ico={<SettingIcon name="trash" />}
            title="Borrar todos los datos"
            onClick={async () => {
              if (await confirmDialog('Se borrarán TODAS las mascotas y registros de este dispositivo. Esta acción no se puede deshacer.', { confirmLabel: 'Borrar todo' })) {
                await repo.wipeAll()
                nav('/', { replace: true })
              }
            }}
          />
        </div>
        <p className="hint" style={{ textAlign: 'center', marginTop: 'auto' }}>
          PetLog 0.2 · organiza lo que registras; no sustituye al veterinario
        </p>
      </main>

      {panel === 'theme' && (
        <Sheet title="Apariencia" onClose={() => setPanel(null)}>
          <Seg
            label="Tema"
            value={settings.theme}
            onChange={(theme) => repo.saveSettings({ theme })}
            options={[
              { value: 'system', label: THEME.system },
              { value: 'light', label: THEME.light },
              { value: 'dark', label: THEME.dark },
            ]}
          />
          <p className="hint">«Automático» sigue el modo claro u oscuro del teléfono.</p>
        </Sheet>
      )}
      {panel === 'tap' && (
        <Sheet title="Al tocar un botón" onClose={() => setPanel(null)}>
          <div className="choices" role="radiogroup" aria-label="Modo de registro">
            {(
              [
                { value: 'instant', text: 'Un toque guarda la fecha y la hora. La intensidad o una nota se añaden después, si quieres.' },
                { value: 'sheet', text: 'Cada toque abre el registro para completarlo antes de guardar.' },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={settings.tapMode === o.value}
                className="choice"
                onClick={() => repo.saveSettings({ tapMode: o.value })}
              >
                <span className="dot" aria-hidden="true" />
                <span>
                  <b>{TAP[o.value]}</b>
                  <span>{o.text}</span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {panel === 'backup' && (
        <Sheet title="Copia de seguridad" onClose={() => setPanel(null)}>
          <p className="muted">Tus datos viven solo en este dispositivo. Haz copias para no perderlos si cambias de móvil.</p>
          <button className="btn primary block" onClick={backup} disabled={memoryMode}>
            Guardar copia en un archivo
          </button>
          <button className="btn block" onClick={restore} disabled={memoryMode}>
            Restaurar o combinar una copia
          </button>
          {msg ? (
            <p role="status" className={msg.ok ? 'status ok' : 'status err'}>
              {msg.text}
            </p>
          ) : (
            memoryMode && <p className="hint">No disponible en la vista de demostración.</p>
          )}
        </Sheet>
      )}
      {panel === 'privacy' && (
        <Sheet title="Privacidad" onClose={() => setPanel(null)}>
          <p>PetLog no tiene cuentas, ni servidores, ni analítica, y no se conecta a internet. Los informes solo salen del teléfono cuando tú los compartes.</p>
          <p className="hint">{storage}</p>
        </Sheet>
      )}
    </div>
  )
}
