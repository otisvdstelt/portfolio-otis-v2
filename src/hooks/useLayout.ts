import { useSyncExternalStore } from 'react'

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

export type Mode = 'roam' | 'backdrop'

/**
 * How the valley is shown on this device. A pointer and some headroom get the
 * free camera (`roam`); touch screens, small windows and modest hardware get
 * fixed views that act as animated backdrops. `?mode=roam` or `?mode=backdrop`
 * in the address overrides the guess.
 */
export function useMode(): Mode {
  const coarse = useMediaQuery('(pointer: coarse)')
  const small = useMediaQuery('(max-width: 767px)')
  const asked = new URLSearchParams(window.location.search).get('mode')
  if (asked === 'roam' || asked === 'backdrop') return asked
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const modest = cores <= 2 || (cores <= 4 && memory <= 4)
  return coarse || small || modest ? 'backdrop' : 'roam'
}
