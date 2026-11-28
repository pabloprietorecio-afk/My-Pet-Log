import { useEffect, useState } from 'react'
import { onPremium, premiumState, type PremiumState } from './premium'

export function usePremium(): PremiumState {
  const [s, set] = useState(premiumState)
  useEffect(() => onPremium(set), [])
  return s
}
