import '@fontsource-variable/figtree'
import '@fontsource-variable/bricolage-grotesque'
import './ui/styles.css'
import { loadLang } from './i18n'

// Primero el idioma: los textos de los módulos se traducen al importarlos, así que la app se carga después.
void loadLang()
  .catch((e) => console.error('No se pudo cargar el idioma', e))
  .finally(() => void import('./boot'))
