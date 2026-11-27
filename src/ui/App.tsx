import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { HashRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { usePets } from '../data/hooks'
import { memoryMode } from '../data/instance'
import { Avatar, ConfirmHost, ToastProvider } from './components'
import { IconBack, IconGear, IconNext, IconPlus } from './icons'
import { Paged, type PagedItem } from './layout'
import { Gallery } from './Gallery'
import { ArtGallery } from './ArtGallery'
import { IconStudio } from './IconStudio'
import { Backdrop } from './art/Backdrop'
import { PetIllustration } from './art/pets'
import { ageShort } from '../domain/time'
import { speciesLabel } from '../domain/eventTypes'
import { lastPet } from './nav'
import { Buttons } from './screens/Buttons'
import { Tips } from './screens/Tips'
import { Share } from './screens/Share'
import { Charts } from './screens/Charts'
import { History } from './screens/History'
import { Medication } from './screens/Medication'
import { PetForm, PetFormEdit } from './screens/PetForm'
import { Report } from './screens/Report'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'
import { PetShell } from './Shell'
import { useTheme } from './theme'

function Home() {
  const pets = usePets()
  const nav = useNavigate()
  if (pets === undefined) return null
  const last = lastPet()
  if (pets.length > 0 && last && pets.some((p) => p.id === last)) return <Navigate to={`/pet/${last}/hoy`} replace />
  if (pets.length === 1) return <Navigate to={`/pet/${pets[0].id}/hoy`} replace />
  const items: PagedItem[] = pets.map((p) => ({
    key: p.id,
    onClick: () => nav(`/pet/${p.id}/hoy`),
    label: `Abrir ${p.name}`,
    node: (
      <>
        <Avatar pet={p} />
        <span className="txt">
          <span className="lab" style={{ fontSize: 'var(--fs-lg)' }}>{p.name}</span>
          <span className="det">{[speciesLabel(p.species), ageShort(p.birthDate, new Date())].filter(Boolean).join(' · ')}</span>
        </span>
        <IconNext />
      </>
    ),
  }))
  return (
    <div className="app">
      <Backdrop scene="home" />
      <header className="topbar">
        <h1 style={{ paddingLeft: 'var(--s2)' }}>PetLog</h1>
        <Link to="/ajustes" className="icon-btn" aria-label="Ajustes">
          <IconGear />
        </Link>
      </header>
      <main className="screen">
        {pets.length === 0 ? (
          <div className="empty welcome">
            <div className="hero-duo" aria-hidden="true">
              <span>
                <PetIllustration species="dog" />
              </span>
              <span>
                <PetIllustration species="cat" />
              </span>
            </div>
            <h2>El diario de salud de tu mascota</h2>
            <p>Un toque para anotar lo que pasa. Un informe claro para el veterinario. Todo se queda en tu teléfono.</p>
            <Link to="/nueva" className="btn pill-cta" style={{ marginTop: 'var(--s3)' }}>
              <IconPlus />
              Añadir mi mascota
            </Link>
            <Link to="/compartir?codigo=" className="link-btn invited">
              ¿Te han invitado? Unirme con un código
            </Link>
          </div>
        ) : (
          <>
            <h2 className="eyebrow" style={{ padding: '0 var(--s1)' }}>¿De quién vas a anotar?</h2>
            <Paged items={items} rowRem={4.5} rowClass="nt pets" label="Mascotas" />
            <Link to="/nueva" className="btn tonal block" style={{ flex: 'none' }}>
              <IconPlus />
              Añadir mascota
            </Link>
          </>
        )}
      </main>
    </div>
  )
}

function NewPet() {
  return (
    <div className="app">
      <Backdrop scene="form" />
      <header className="topbar">
        <Link to="/" className="icon-btn" aria-label="Volver">
          <IconBack />
        </Link>
        <h1>Nueva mascota</h1>
      </header>
      <main className="screen">
        <PetForm />
      </main>
    </div>
  )
}

/** Abre la app desde un enlace petlog://unirse/<código> (p. ej. al escanear el QR con la cámara). */
function DeepLinks() {
  const nav = useNavigate()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const open = (url?: string) => {
      const m = url?.match(/^petlog:\/\/unirse\/(.+)$/)
      if (m) return nav(`/compartir?codigo=${encodeURIComponent(decodeURIComponent(m[1]))}`)
      // Ventana flotante de voz → «Abrir»: petlog://abrir/<ruta de la app>
      const o = url?.match(/^petlog:\/\/abrir(\/[\w\-/?=&]*)$/)
      if (o) return nav(o[1])
      // Widget, atajo y ajustes rápidos: petlog://voz y petlog://anotar/<botón>?pet=<mascota>
      const v = url?.match(/^petlog:\/\/voz(?:\?pet=([\w-]+))?/)
      const a = url?.match(/^petlog:\/\/anotar\/([\w-]+)\?pet=([\w-]+)/)
      const pet = a?.[2] ?? v?.[1] ?? lastPet()
      if (v) return nav(pet ? `/pet/${pet}/hoy?voz=1` : '/')
      if (a) return nav(`/pet/${a[2]}/hoy?anotar=${a[1]}`)
    }
    void CapApp.getLaunchUrl().then((r) => open(r?.url))
    const h = CapApp.addListener('appUrlOpen', (e) => open(e.url))
    return () => {
      void h.then((x) => x.remove())
    }
  }, [nav])
  return null
}

export function App() {
  useTheme()
  return (
    <ToastProvider>
      <ConfirmHost />
      {memoryMode && (
        <div className="demo-banner" role="note">
          Vista de demostración: los datos se borran al cerrar y el visor puede bloquear descargas o abrir otras apps. En la app instalada funciona todo.
        </div>
      )}
      <HashRouter>
        <DeepLinks />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nueva" element={<NewPet />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/compartir" element={<Share />} />
          {import.meta.env.DEV && <Route path="/galeria" element={<Gallery />} />}
          {import.meta.env.DEV && <Route path="/arte" element={<ArtGallery />} />}
          {import.meta.env.DEV && <Route path="/icono" element={<IconStudio />} />}
          <Route path="/pet/:petId" element={<PetShell />}>
            <Route index element={<Navigate to="hoy" replace />} />
            <Route path="hoy" element={<Today />} />
            <Route path="historial" element={<History />} />
            <Route path="medicacion" element={<Medication />} />
            <Route path="graficas" element={<Charts />} />
            <Route path="informe" element={<Report />} />
            <Route path="ficha" element={<PetFormEdit />} />
            <Route path="botones" element={<Buttons />} />
            <Route path="consejos" element={<Tips />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}
