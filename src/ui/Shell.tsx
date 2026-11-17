import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEventTypes, useEvents, usePet, usePets } from '../data/hooks'
import { ageShort, formatNumber } from '../domain/time'
import { speciesLabel } from '../domain/eventTypes'
import { Avatar, Sheet, useToast } from './components'
import { IconBack, IconBulb, IconChart, IconDoc, IconDown, IconGear, IconList, IconNext, IconPill, IconPlus, IconToday } from './icons'
import { rememberPet } from './nav'
import { Backdrop, type Scene } from './art/Backdrop'
import { SettingIcon } from './art/TypeIcon'

const TABS = [
  { to: 'hoy', label: 'Hoy', Icon: IconToday },
  { to: 'historial', label: 'Historial', Icon: IconList },
  { to: 'medicacion', label: 'Medicación', Icon: IconPill },
  { to: 'graficas', label: 'Gráficas', Icon: IconChart },
  { to: 'informe', label: 'Informe', Icon: IconDoc },
]

const SCENE: Record<string, Scene> = {
  hoy: 'today',
  historial: 'history',
  medicacion: 'meds',
  graficas: 'charts',
  informe: 'report',
  ficha: 'form',
  botones: 'form',
  consejos: 'history',
}

/** Subpantallas de detalle: cabecera con «volver» y sin navegación inferior. */
const SUB: Record<string, string> = {
  ficha: 'Ficha',
  botones: 'Personalizar botones',
  consejos: 'Consejos',
}

export function PetShell() {
  const { petId } = useParams()
  const pet = usePet(petId)
  const pets = usePets()
  const nav = useNavigate()
  const toast = useToast()
  const loc = useLocation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => toast.hide(), [loc.pathname])
  const [switcher, setSwitcher] = useState(false)
  const types = useEventTypes(petId)
  const weightType = types?.find((t) => t.key === 'weight')
  const events = useEvents(petId)
  useEffect(() => {
    if (petId) rememberPet(petId)
  }, [petId])

  if (pet === undefined) return null
  if (pet === null) return <Navigate to="/" replace />

  const last = weightType
    ? [...(events ?? [])].filter((e) => e.typeId === weightType.id && e.value !== undefined).sort((a, b) => b.at.localeCompare(a.at))[0]
    : undefined
  const meta = [speciesLabel(pet.species), ageShort(pet.birthDate, new Date()), last ? `${formatNumber(last.value!)} ${last.unit ?? weightType?.unit ?? 'kg'}` : undefined]
    .filter(Boolean)
    .join(' · ')
  const seg = loc.pathname.split('/').pop() ?? ''
  const sub = SUB[seg]
  const scene: Scene = SCENE[seg] ?? 'today'
  const go = (to: string) => {
    setSwitcher(false)
    nav(to)
  }

  return (
    <div className="app">
      <Backdrop scene={scene} />
      {sub ? (
        <header className="topbar">
          <Link className="icon-btn" to="hoy" replace aria-label="Volver">
            <IconBack />
          </Link>
          <h1>{sub === 'Ficha' ? `Ficha de ${pet.name}` : sub === 'Consejos' ? `Consejos para ${pet.name}` : sub}</h1>
        </header>
      ) : (
        <header className="topbar">
          <button className="who" onClick={() => setSwitcher(true)} aria-label={`${pet.name}, ${meta}. Cambiar de mascota o editar su ficha`}>
            <Avatar pet={pet} />
            <span className="txt">
              <h1>
                <span className="name">{pet.name}</span>
                <IconDown />
              </h1>
              <span className="meta">{meta}</span>
            </span>
          </button>
          <Link className="icon-btn" to="consejos" aria-label={`Consejos para ${pet.name}`}>
            <IconBulb />
          </Link>
          <Link className="icon-btn" to="/ajustes" aria-label="Ajustes">
            <IconGear />
          </Link>
        </header>
      )}
      <main className="screen">
        <Outlet context={{ pet }} />
      </main>
      {!sub && (
        <div className="tabbar">
          <nav aria-label="Secciones">
            {TABS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className="tab" replace>
                <span className="ic">
                  <Icon />
                </span>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
      {switcher && (
        <Sheet title="Mascotas" onClose={() => setSwitcher(false)}>
          <div className="list">
            {(pets ?? []).map((p) => (
              <button key={p.id} className="list-item" onClick={() => go(`/pet/${p.id}/hoy`)} aria-current={p.id === pet.id}>
                <Avatar pet={p} />
                <span className="txt">
                  <b>{p.name}</b>
                  <small>{speciesLabel(p.species)}{p.id === pet.id ? ' · ahora' : ''}</small>
                </span>
                {p.id === pet.id ? <span className="badge due">Actual</span> : <IconNext />}
              </button>
            ))}
          </div>
          <div className="list">
            <button className="list-item" onClick={() => go(`/pet/${pet.id}/ficha`)}>
              <span className="ico" aria-hidden="true">
                <SettingIcon name="card" />
              </span>
              <span className="txt">
                <b>Ficha de {pet.name}</b>
                <small>Datos, salud y veterinario</small>
              </span>
              <IconNext />
            </button>
            <button className="list-item" onClick={() => go(`/pet/${pet.id}/botones`)}>
              <span className="ico" aria-hidden="true">
                <SettingIcon name="sliders" />
              </span>
              <span className="txt">
                <b>Personalizar botones</b>
                <small>Ordenar, ocultar o crear los tuyos</small>
              </span>
              <IconNext />
            </button>
          </div>
          <button className="btn tonal block" onClick={() => go('/nueva')}>
            <IconPlus />
            Añadir mascota
          </button>
        </Sheet>
      )}
    </div>
  )
}
