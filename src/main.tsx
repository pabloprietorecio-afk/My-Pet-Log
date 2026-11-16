import '@fontsource-variable/figtree'
import '@fontsource-variable/bricolage-grotesque'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initStorage, repo } from './data/instance'
import './ui/styles.css'
import { App } from './ui/App'
import { installBackButton } from './platform/backButton'

// Solo en desarrollo: acceso al repositorio desde la consola/pruebas.
if (import.meta.env.DEV) Object.defineProperty(window, '__petlog', { get: () => ({ repo }) })

initStorage()
  .catch((e) => console.error('No se pudo iniciar el almacenamiento', e))
  .finally(() => {
    installBackButton()
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
