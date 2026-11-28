import { useEffect } from 'react'
import { requestBanner } from './ads'
import { usePremium } from './hooks'

/** Muestra el banner mientras la pantalla está abierta (salvo con Premium). */
export function useBanner(): void {
  const { premium } = usePremium()
  useEffect(() => (premium ? undefined : requestBanner()), [premium])
}
