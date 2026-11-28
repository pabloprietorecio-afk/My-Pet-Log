/**
 * PetLog Premium: compra única que quita los anuncios y el límite de mascotas.
 * El precio lo da Google Play en la moneda de cada usuario; sin Google Play se explica y no se ofrece comprar.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { tl } from '../../i18n'
import { FREE_PETS } from '../../monetize/config'
import { usePremium } from '../../monetize/hooks'
import { buyPremium, restorePremium } from '../../monetize/premium'
import { Backdrop } from '../art/Backdrop'
import { SettingIcon } from '../art/TypeIcon'
import { IconBack } from '../icons'

export function Premium() {
  const nav = useNavigate()
  const loc = useLocation()
  const s = usePremium()
  const forPets = new URLSearchParams(loc.search).get('motivo') === 'mascotas'
  const perks = [
    { ico: '🚫', t: tl('Sin anuncios'), d: tl('Ni un banner en ninguna pantalla.') },
    { ico: '🐾', t: tl('Mascotas sin límite'), d: tl('La versión gratis permite {0} mascotas.', FREE_PETS) },
    { ico: '💛', t: tl('Un solo pago'), d: tl('Sin suscripción. Es tuyo para siempre en tu cuenta de Google Play.') },
  ]
  return (
    <div className="app">
      <Backdrop scene="settings" />
      <header className="topbar">
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label={tl('Volver')}>
          <IconBack />
        </button>
        <h1>{tl('PetLog Premium')}</h1>
      </header>
      <main className="screen premium">
        <div className="prem-hero">
          <span className="prem-ico" aria-hidden="true">
            <SettingIcon name="premium" size="100%" />
          </span>
          {s.premium ? (
            <p className="prem-lead">{tl('Tienes PetLog Premium. ¡Gracias por apoyar la app!')}</p>
          ) : forPets ? (
            <p className="prem-lead">{tl('La versión gratis permite {0} mascotas. Con Premium puedes añadir todas las que quieras.', FREE_PETS)}</p>
          ) : (
            <p className="prem-lead">{tl('Todo lo esencial es gratis. Premium es para quien quiera la app sin anuncios y sin límites.')}</p>
          )}
        </div>
        <ul className="prem-perks">
          {perks.map((p) => (
            <li key={p.t}>
              <span className="pi" aria-hidden="true">
                {p.ico}
              </span>
              <span>
                <b>{p.t}</b>
                <small>{p.d}</small>
              </span>
            </li>
          ))}
        </ul>
        <div className="prem-cta">
          {s.premium ? (
            <button className="btn primary block" onClick={() => nav('/')}>
              {tl('Volver a PetLog')}
            </button>
          ) : (
            <>
              <button className="btn primary block" disabled={s.busy || (!s.canBuy && !import.meta.env.DEV)} onClick={() => void buyPremium()}>
                {s.busy ? tl('Conectando con Google Play…') : s.price ? tl('Conseguir Premium · {0}', s.price) : tl('Conseguir Premium')}
              </button>
              <button className="btn tonal block" disabled={s.busy || !s.canBuy} onClick={() => void restorePremium()}>
                {tl('Ya lo compré: restaurar')}
              </button>
              {!s.canBuy && !import.meta.env.DEV && <p className="hint">{tl('La compra solo está disponible en la app instalada desde Google Play.')}</p>}
              {s.error && s.error !== 'unavailable' && <p className="status err">{tl('No se pudo completar la compra: {0}', s.error)}</p>}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
