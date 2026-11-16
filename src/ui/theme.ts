import { useEffect, useState } from 'react'
import { PALETTE_DARK, PALETTE_LIGHT, type ChartPalette } from '../charts/svg'
import { useSettings } from '../data/hooks'

const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Aplica el tema (claro/oscuro/sistema) al documento y devuelve si es oscuro. */
export function useTheme(): boolean {
  const settings = useSettings()
  const pref = settings?.theme ?? 'system'
  const [sysDark, setSysDark] = useState(() => mq().matches)
  useEffect(() => {
    const m = mq()
    const on = () => setSysDark(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const dark = pref === 'dark' || (pref === 'system' && sysDark)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return dark
}

export function useChartPalette(): ChartPalette {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.dataset.theme === 'dark'))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return dark ? PALETTE_DARK : PALETTE_LIGHT
}
