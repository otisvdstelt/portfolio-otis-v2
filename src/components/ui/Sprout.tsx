import { useIsFetching } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { progress } from '../../lib/progress'

/**
 * The Suspense fallback. It draws nothing itself: while it is mounted it
 * tells the sprout in the corner that something is still on its way, and
 * when React swaps it for the loaded thing the sprout knows to finish. The
 * sprout stays one element throughout, so nothing shifts when loading ends.
 */
export function Sprouting() {
  useLayoutEffect(() => progress.hold(), [])
  return null
}

/**
 * A small watercolour sprout in the corner of the page. It grows, slowly,
 * for as long as anything is being fetched: the world's model at the start,
 * a repository's figures later on. The page behind it is never blanked or
 * moved; the sprout is the whole of the loading state.
 */
export function Sprout() {
  const pending = useSyncExternalStore(progress.subscribe, progress.pending)
  const fetching = useIsFetching() > 0
  const busy = pending || fetching
  // Stay a moment after the work is done, long enough to be seen to finish growing.
  const [shown, setShown] = useState(busy)
  if (busy && !shown) setShown(true)

  useEffect(() => {
    if (busy) return
    const timer = window.setTimeout(() => setShown(false), 1300)
    return () => window.clearTimeout(timer)
  }, [busy])

  return shown ? <Plant done={!busy} /> : null
}

function Plant({ done }: { done: boolean }) {
  // Drawn first as a bare patch of earth; growing starts on the next frame, so there is something to grow from.
  const [growing, setGrowing] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrowing(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="sprout" data-growing={growing} data-done={done} role="status" aria-live="polite">
      <svg viewBox="0 0 160 190" aria-hidden="true">
        {/* The damp patch of earth it grows from. */}
        <ellipse cx="80" cy="172" rx="50" ry="11" fill="#8c5f3e" opacity="0.28" filter="url(#bleed)" />
        <ellipse cx="80" cy="172" rx="34" ry="6.5" fill="#6c4b37" opacity="0.5" filter="url(#wobble)" />
        <g className="sprout-sway">
          <g filter="url(#bleed)" opacity="0.4">
            <path className="sprout-leaf" style={{ '--at': 0.3, transformOrigin: '100% 100%' } as CSSProperties} d="M80 128C58 124 42 106 44 84c20 4 34 22 36 44Z" fill="#86ae4a" />
            <path className="sprout-leaf" style={{ '--at': 0.55, transformOrigin: '0% 100%' } as CSSProperties} d="M80 106c22-4 40-22 38-46-20 6-36 22-38 46Z" fill="#b9c75c" />
          </g>
          <path className="sprout-stem" pathLength={1} d="M80 172C77 150 86 128 80 92" fill="none" stroke="#3b533e" strokeWidth="5.5" strokeLinecap="round" filter="url(#wobble)" />
          <g filter="url(#wobble)">
            <path className="sprout-leaf" style={{ '--at': 0.3, transformOrigin: '100% 100%' } as CSSProperties} d="M80 128C58 124 42 106 44 84c20 4 34 22 36 44Z" fill="#86ae4a" fillOpacity="0.82" stroke="#2c2823" strokeOpacity="0.5" strokeWidth="1.1" />
            <path className="sprout-leaf" style={{ '--at': 0.55, transformOrigin: '0% 100%' } as CSSProperties} d="M80 106c22-4 40-22 38-46-20 6-36 22-38 46Z" fill="#a2c256" fillOpacity="0.82" stroke="#2c2823" strokeOpacity="0.5" strokeWidth="1.1" />
            <path className="sprout-leaf" style={{ '--at': 0.82, transformOrigin: '50% 100%' } as CSSProperties} d="M80 92c-9-7-11-19-6-30 8 6 11 18 6 30Zm0 0c9-5 16-14 15-26-9 3-15 13-15 26Z" fill="#c8cf68" fillOpacity="0.9" stroke="#2c2823" strokeOpacity="0.5" strokeWidth="1" />
          </g>
        </g>
      </svg>
      <span className="sr-only">{done ? 'Loaded' : 'Loading'}</span>
    </div>
  )
}
