/**
 * Botón «atrás» de Android: primero cierra la ventana abierta (hoja o confirmación),
 * después vuelve a la pantalla anterior y, si no hay más, sale de la app.
 */
import { App } from '@capacitor/app'
import { isNative } from './files'

export function installBackButton() {
  if (!isNative()) return
  void App.addListener('backButton', ({ canGoBack }) => {
    if (document.querySelector('.scrim')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      return
    }
    const atHome = /^#\/(pet\/[^/]+\/hoy)?$/.test(location.hash) || location.hash === '' || location.hash === '#/'
    if (canGoBack && !atHome) history.back()
    else void App.exitApp()
  })
}
