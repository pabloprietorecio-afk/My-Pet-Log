import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { backupFileName, createBackup, restoreBackup, serializeBackup } from '../../data/backup'
import { memoryMode, mirrorStatus, repo } from '../../data/instance'
import { useSettings } from '../../data/hooks'
import { isNative, pickTextFile, saveFile } from '../../platform/files'
import { Seg, Sheet, confirmDialog } from '../components'
import { IconBack, IconNext } from '../icons'
import { Backdrop } from '../art/Backdrop'
import { SettingIcon } from '../art/TypeIcon'
import { IconLayer } from '../art/AppIconArt'
import type { PetKind } from '../art/pets'
import { canChangeAppIcon, getAppIcon, setAppIcon } from '../../platform/appIcon'

type Panel = 'theme' | 'tap' | 'backup' | 'privacy' | 'icon' | null

const ICONS: { kind: PetKind; label: string }[] = [
  { kind: 'cat', label: 'Gato' },
  { kind: 'dog', label: 'Perro' },
  { kind: 'rabbit', label: 'Conejo' },
  { kind: 'rodent', label: 'Hámster' },
  { kind: 'bird', label: 'Pájaro' },
  { kind: 'reptile', label: 'Serpiente' },
]

const THEME = { system: 'Automático', light: 'Claro', dark: 'Oscuro' } as const
const TAP = { instant: 'Registrar al instante', sheet: 'Pedir detalles antes' } as const

export function Settings() {
  const settings = useSettings()
  const nav = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const iconSupported = canChangeAppIcon()
  const [icon, setIcon] = useState<PetKind | null>(null)
  const [iconMsg, setIconMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    if (iconSupported) getAppIcon().then(setIcon, () => setIcon(null))
  }, [iconSupported])
  if (!settings) return null

  const chooseIcon = async (kind: PetKind) => {
    if (kind === icon) return
    try {
      await setAppIcon(kind)
      setIcon(kind)
      setIconMsg({ ok: true, text: 'Icono cambiado. El lanzador del teléfono puede tardar unos segundos en mostrarlo.' })
    } catch {
      setIconMsg({ ok: false, text: 'No se pudo cambiar el icono en este teléfono.' })
    }
  }

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
          {iconSupported && (
            <Item
              ico={
                <span className="app-ico-mini">
                  <IconLayer layer="full" kind={icon ?? 'cat'} />
                </span>
              }
              title="Icono de la app"
              sub={ICONS.find((i) => i.kind === icon)?.label ?? 'Gato'}
              onClick={() => {
                setIconMsg(null)
                setPanel('icon')
              }}
            />
          )}
        </div>
        <div className="list">
          <Item ico={<SettingIcon name="share" />} title="Compartir con otros dueños" sub="Llevar el diario entre varias personas" onClick={() => nav('/compartir')} />
          <Item ico={<SettingIcon name="backup" />} title="Copia de seguridad" sub="Guardar o restaurar tus datos" onClick={() => setPanel('backup')} />
          <Item ico={<SettingIcon name="privacy" />} title="Privacidad" sub="Sin cuentas ni anuncios; lo compartido va cifrado" onClick={() => setPanel('privacy')} />
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
        <p className="hint about">
          PetLog {__APP_VERSION__} · organiza lo que registras; no sustituye al veterinario
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
      {panel === 'icon' && (
        <Sheet title="Icono de la app" onClose={() => setPanel(null)}>
          <div className="icon-grid" role="radiogroup" aria-label="Icono de la app">
            {ICONS.map((i) => (
              <button key={i.kind} className="icon-opt" role="radio" aria-checked={icon === i.kind} onClick={() => chooseIcon(i.kind)}>
                <span className="pic">
                  <IconLayer layer="full" kind={i.kind} />
                </span>
                <span>{i.label}</span>
              </button>
            ))}
          </div>
          {iconMsg ? (
            <p className={`status ${iconMsg.ok ? 'ok' : 'err'}`} role="status">
              {iconMsg.text}
            </p>
          ) : (
            <p className="hint">Cambia el icono en la pantalla de inicio. Algunos lanzadores quitan el acceso directo del escritorio al cambiarlo: la app sigue en el cajón de aplicaciones y tus datos no se tocan.</p>
          )}
        </Sheet>
      )}
      {panel === 'privacy' && (
        <Sheet title="Privacidad" onClose={() => setPanel(null)}>
          <p>PetLog no tiene cuentas, ni anuncios, ni analítica. Tus datos viven en este dispositivo, y los informes solo salen cuando tú los compartes.</p>
          <p>
            Solo si compartes una mascota con otros dueños, sus datos se envían a un servidor de Google (Firebase) para que los demás los reciban. Van <b>cifrados en tu móvil</b> con una clave que solo está en la invitación: el servidor no puede leerlos.
          </p>
          <p>
            Al anotar por voz, el micrófono solo se activa mientras lo usas. El dictado lo hace el reconocimiento de voz de Android: si el teléfono tiene el idioma descargado se hace en el propio móvil; si no, el servicio de voz del teléfono puede usar internet. PetLog no guarda el audio.
          </p>
          <p className="hint">{storage}</p>
        </Sheet>
      )}
    </div>
  )
}
