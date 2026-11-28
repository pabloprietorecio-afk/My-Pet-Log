/**
 * Elección de idioma: pantalla completa la primera vez y hoja en Ajustes.
 * Cada idioma se muestra en su propio nombre; el del teléfono aparece marcado como sugerido.
 */
import { deviceLang, LANGS, setLang, type Lang } from '../../i18n'
import { Backdrop } from '../art/Backdrop'
import { PetIllustration } from '../art/pets'

/** Saludo corto en cada idioma (para que se reconozca de un vistazo). */
const HELLO: Record<Lang, string> = { es: 'Hola', en: 'Hello', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', pt: 'Olá' }

export function LanguageList({ current, onPick }: { current?: Lang; onPick: (l: Lang) => void }) {
  const suggested = deviceLang()
  return (
    <ul className="lang-list" role="radiogroup" aria-label="Idioma · Language">
      {LANGS.map((l) => (
        <li key={l.code}>
          <button
            role="radio"
            aria-checked={current === l.code}
            className={`lang-opt${current === l.code ? ' on' : ''}${!current && suggested === l.code ? ' sug' : ''}`}
            lang={l.code}
            onClick={() => onPick(l.code)}
          >
            <span className="hello">{HELLO[l.code]}</span>
            <span className="name">{l.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Primera vez: antes de todo lo demás. */
export function LanguageScreen() {
  return (
    <div className="app lang-screen">
      <Backdrop scene="home" />
      <main className="screen">
        <div className="hero-duo" aria-hidden="true">
          <span>
            <PetIllustration species="dog" />
          </span>
          <span>
            <PetIllustration species="cat" />
          </span>
        </div>
        <h1>
          <span lang="es">Elige tu idioma</span>
          <span lang="en">Choose your language</span>
        </h1>
        <LanguageList onPick={(l) => setLang(l)} />
        <p className="lang-hint">
          <span lang="es">Puedes cambiarlo en Ajustes.</span> <span lang="en">You can change it in Settings.</span>
        </p>
      </main>
    </div>
  )
}


