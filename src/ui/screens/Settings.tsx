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
import { voiceShortcutText } from '../../platform/shortcut'
import { lang, LANGS, setLang, tl } from '../../i18n'
import { LanguageList } from './Language'
import { usePremium } from '../../monetize/hooks'
import { adsPrivacyRequired, showAdsPrivacyOptions } from '../../monetize/ads'

type Panel = 'theme' | 'tap' | 'backup' | 'privacy' | 'icon' | 'lang' | null

const ICONS: { kind: PetKind; label: string }[] = [
  { kind: 'cat', label: tl('Gato') },
  { kind: 'dog', label: tl('Perro') },
  { kind: 'rabbit', label: tl('Conejo') },
  { kind: 'rodent', label: tl('Hámster') },
  { kind: 'bird', label: tl('Pájaro') },
  { kind: 'reptile', label: tl('Serpiente') },
]

const THEME = { system: tl('Automático'), light: tl('Claro'), dark: tl('Oscuro') } as const
const TAP = { instant: tl('Registrar al instante'), sheet: tl('Pedir detalles antes') } as const

export function Settings() {
  const settings = useSettings()
  const nav = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
  const premium = usePremium()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const iconSupported = canChangeAppIcon()
  const [icon, setIcon] = useState<PetKind | null>(null)
  const [shortcut, setShortcut] = useState<string | null>(null)
  useEffect(() => {
    if (panel === 'icon') void voiceShortcutText().then(setShortcut)
  }, [panel, icon])
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
      setIconMsg({ ok: true, text: tl('Icono cambiado. El lanzador del teléfono puede tardar unos segundos en mostrarlo.') })
    } catch {
      setIconMsg({ ok: false, text: tl('No se pudo cambiar el icono en este teléfono.') })
    }
  }

  const backup = async () => {
    try {
      const file = await createBackup(repo)
      const blob = new Blob([serializeBackup(file)], { type: 'application/json' })
      await saveFile(blob, backupFileName(), tl('Copia de seguridad de PetLog'))
      setMsg({ ok: true, text: tl('Copia generada. Guárdala en un lugar seguro: contiene datos privados.') })
    } catch (e) {
      setMsg({ ok: false, text: tl('No se pudo crear la copia: {0}', e instanceof Error ? e.message : 'error') })
    }
  }
  const restore = async () => {
    const text = await pickTextFile()
    if (text === null) return
    try {
      const r = await restoreBackup(repo, text)
      setMsg({ ok: true, text: tl('Copia restaurada: {0} registros nuevos, {1} actualizados.', r.added, r.updated) })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : tl('No se pudo restaurar la copia.') })
    }
  }

  const storage = isNative()
    ? mirrorStatus().lastError
      ? tl('Aviso: la copia automática interna falló en el último intento. Haz una copia manual.')
      : tl('Además de la base de datos, la app guarda una copia interna automática en su carpeta privada por si el sistema limpia el almacenamiento.')
    : memoryMode
      ? tl('En esta vista de demostración los datos solo están en memoria y se borran al cerrarla.')
      : tl('En el navegador, los datos se guardan en el almacenamiento del propio navegador.')

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
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label={tl('Volver')}>
          <IconBack />
        </button>
        <h1>{tl('Ajustes')}</h1>
      </header>
      <main className="screen" style={{ gap: 'var(--s4)' }}>
        <div className="list">
          <Item ico={<SettingIcon name="language" />} title={tl('Idioma')} sub={LANGS.find((l) => l.code === lang())?.name} onClick={() => setPanel('lang')} />
          <Item ico={<SettingIcon name="theme" />} title={tl('Apariencia')} sub={THEME[settings.theme]} onClick={() => setPanel('theme')} />
          <Item ico={<SettingIcon name="tap" />} title={tl('Al tocar un botón')} sub={TAP[settings.tapMode]} onClick={() => setPanel('tap')} />
          {iconSupported && (
            <Item
              ico={
                <span className="app-ico-mini">
                  <IconLayer layer="full" kind={icon ?? 'cat'} />
                </span>
              }
              title={tl('Icono de la app')}
              sub={ICONS.find((i) => i.kind === icon)?.label ?? tl('Gato')}
              onClick={() => {
                setIconMsg(null)
                setPanel('icon')
              }}
            />
          )}
        </div>
        <div className="list">
          <Item
            ico={<SettingIcon name="premium" />}
            title={tl('PetLog Premium')}
            sub={premium.premium ? tl('Activado. ¡Gracias!') : tl('Sin anuncios y sin límite de mascotas')}
            onClick={() => nav('/premium')}
          />
          {adsPrivacyRequired() && (
            <Item ico={<SettingIcon name="privacy" />} title={tl('Privacidad de los anuncios')} sub={tl('Cambiar tu consentimiento')} onClick={() => void showAdsPrivacyOptions()} />
          )}
        </div>
        <div className="list">
          <Item ico={<SettingIcon name="share" />} title={tl('Compartir con otros dueños')} sub={tl('Llevar el diario entre varias personas')} onClick={() => nav('/compartir')} />
          <Item ico={<SettingIcon name="backup" />} title={tl('Copia de seguridad')} sub={tl('Guardar o restaurar tus datos')} onClick={() => setPanel('backup')} />
          <Item ico={<SettingIcon name="privacy" />} title={tl('Privacidad')} sub={tl('Sin cuentas; lo que anotas no se usa para anuncios')} onClick={() => setPanel('privacy')} />
        </div>
        <div className="list">
          <Item
            danger
            ico={<SettingIcon name="trash" />}
            title={tl('Borrar todos los datos')}
            onClick={async () => {
              if (await confirmDialog(tl('Se borrarán TODAS las mascotas y registros de este dispositivo. Esta acción no se puede deshacer.'), { confirmLabel: tl('Borrar todo') })) {
                await repo.wipeAll()
                nav('/', { replace: true })
              }
            }}
          />
        </div>
        <p className="hint about">
          {tl('PetLog')}{' '}{__APP_VERSION__} {tl('· organiza lo que registras; no sustituye al veterinario')}
        </p>
      </main>

      {panel === 'theme' && (
        <Sheet title={tl('Apariencia')} onClose={() => setPanel(null)}>
          <Seg
            label={tl('Tema')}
            value={settings.theme}
            onChange={(theme) => repo.saveSettings({ theme })}
            options={[
              { value: 'system', label: THEME.system },
              { value: 'light', label: THEME.light },
              { value: 'dark', label: THEME.dark },
            ]}
          />
          <p className="hint">{tl('«Automático» sigue el modo claro u oscuro del teléfono.')}</p>
        </Sheet>
      )}
      {panel === 'tap' && (
        <Sheet title={tl('Al tocar un botón')} onClose={() => setPanel(null)}>
          <div className="choices" role="radiogroup" aria-label={tl('Modo de registro')}>
            {(
              [
                { value: 'instant', text: tl('Un toque guarda la fecha y la hora. La intensidad o una nota se añaden después, si quieres.') },
                { value: 'sheet', text: tl('Cada toque abre el registro para completarlo antes de guardar.') },
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
        <Sheet title={tl('Copia de seguridad')} onClose={() => setPanel(null)}>
          <p className="muted">{tl('Tus datos viven solo en este dispositivo. Haz copias para no perderlos si cambias de móvil.')}</p>
          <button className="btn primary block" onClick={backup} disabled={memoryMode}>
            {tl('Guardar copia en un archivo')}
          </button>
          <button className="btn block" onClick={restore} disabled={memoryMode}>
            {tl('Restaurar o combinar una copia')}
          </button>
          {msg ? (
            <p role="status" className={msg.ok ? 'status ok' : 'status err'}>
              {msg.text}
            </p>
          ) : (
            memoryMode && <p className="hint">{tl('No disponible en la vista de demostración.')}</p>
          )}
        </Sheet>
      )}
      {panel === 'lang' && (
        <Sheet title={tl('Idioma')} onClose={() => setPanel(null)}>
          <LanguageList current={lang()} onPick={(l) => (l === lang() ? setPanel(null) : setLang(l))} />
          <p className="hint">{tl('Los comandos de voz, de momento, solo funcionan en español.')}</p>
        </Sheet>
      )}
      {panel === 'icon' && (
        <Sheet title={tl('Icono de la app')} onClose={() => setPanel(null)}>
          <div className="icon-grid" role="radiogroup" aria-label={tl('Icono de la app')}>
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
            <p className="hint">{tl('Cambia el icono en la pantalla de inicio. Algunos lanzadores quitan el acceso directo del escritorio al cambiarlo: la app sigue en el cajón de aplicaciones y tus datos no se tocan.')}</p>
          )}
          {shortcut && <p className="hint">{shortcut}</p>}
        </Sheet>
      )}
      {panel === 'privacy' && (
        <Sheet title={tl('Privacidad')} onClose={() => setPanel(null)}>
          <p>{tl('PetLog no tiene cuentas ni analítica. Tus datos viven en este dispositivo, y los informes solo salen cuando tú los compartes.')}
          </p>
          <p>
            {tl('En la versión gratis aparece un anuncio de Google (AdMob) en Historial, Gráficas y Consejos. Los anuncios no son personalizados y no reciben nada de lo que anotas; Google sí recibe datos técnicos del teléfono (como el identificador de publicidad) para mostrarlos y evitar fraudes. Con Premium no se carga ningún anuncio.')}</p>
          <p>
            {tl('Solo si compartes una mascota con otros dueños, sus datos se envían a un servidor de Google (Firebase) para que los demás los reciban. Van')}{' '}<b>{tl('cifrados en tu móvil')}</b> {tl('con una clave que solo está en la invitación: el servidor no puede leerlos.')}
          </p>
          <p>
            {tl('Al anotar por voz, el micrófono solo se activa mientras lo usas. El dictado lo hace el reconocimiento de voz de Android: si el teléfono tiene el idioma descargado se hace en el propio móvil; si no, el servicio de voz del teléfono puede usar internet. PetLog no guarda el audio.')}
          </p>
          <p className="hint">{storage}</p>
        </Sheet>
      )}
    </div>
  )
}
