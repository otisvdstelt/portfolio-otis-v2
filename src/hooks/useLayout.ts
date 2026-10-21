import { useSyncExternalStore } from 'react'

/** Live result of a CSS media query */
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

/** Below this width the page is laid out for a phone, with a menu along the bottom */
export const COMPACT = '(max-width: 1023px)'

export type Mode = 'roam' | 'backdrop'

/** A wide window with a pointer gets the free camera, anything else fixed views */
// A mode of roam or backdrop in the address overrides the guess
export function useMode(): Mode {
  const coarse = useMediaQuery('(pointer: coarse)')
  const compact = useMediaQuery(COMPACT)
  const asked = new URLSearchParams(window.location.search).get('mode')
  if (asked === 'roam' || asked === 'backdrop') return asked
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const modest = cores <= 2 || (cores <= 4 && memory <= 4)
  return coarse || compact || modest ? 'backdrop' : 'roam'
}
