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

/** Below this width the page is laid out for a phone or a small tablet: a menu along the bottom and sheets that slide up. */
export const COMPACT = '(max-width: 1023px)'

export type Mode = 'roam' | 'backdrop'

/**
 * The capability check. A wide window with a pointer and some headroom gets
 * the free camera and everything that moves (`roam`). A touch screen, a
 * window under 1024 px, or modest hardware gets fixed compositions that act
 * as animated backdrops: nothing in the scene is repositioned at run time,
 * and the lights and shadows that cost the most are left out. `?mode=roam`
 * or `?mode=backdrop` in the address overrides the guess.
 */
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
