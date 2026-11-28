/** Arranque de la app. Se importa después de cargar el idioma (ver main.tsx). */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initStorage, repo } from './data/instance'
import { App } from './ui/App'
import { installBackButton } from './platform/backButton'
import { startSyncIfShared } from './sync/instance'
import { closeQuickVoice, isQuickVoice } from './platform/quick'
import { QuickVoice } from './ui/QuickVoice'
import { App as CapApp } from '@capacitor/app'
import { startPremium } from './monetize/premium'
import { startAds } from './monetize/ads'

// Solo en desarrollo: acceso al repositorio desde la consola/pruebas.
if (import.meta.env.DEV) Object.defineProperty(window, '__petlog', { get: () => ({ repo }) })

// Atajo del icono: ventana flotante de voz (sin abrir la app). Ver platform/quick.ts.
void isQuickVoice().then((quick) => {
  if (quick) document.documentElement.classList.add('quick')
  initStorage()
    .catch((e) => console.error('No se pudo iniciar el almacenamiento', e))
    .finally(() => {
      if (quick) {
        // Solo micro y resultado: sin sincronización ni navegación. «Atrás» cierra la ventana.
        void CapApp.addListener('backButton', () => void closeQuickVoice()).catch(() => {})
        createRoot(document.getElementById('root')!).render(
          <StrictMode>
            <QuickVoice />
          </StrictMode>,
        )
        return
      }
      installBackButton()
      // Premium (Google Play) y, sin Premium, consentimiento y anuncios. Nada de esto se carga en el navegador.
      void startPremium().finally(() => void startAds())
      void startSyncIfShared().catch((e) => console.error('No se pudo iniciar la sincronización', e))
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    })
})
