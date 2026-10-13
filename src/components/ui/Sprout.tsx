import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { progress } from '../../lib/progress'

/**
 * The Suspense fallback for the valley. It draws nothing itself: while it is
 * mounted it tells the sprout to keep growing, and when React swaps it for
 * the loaded world the sprout takes its leave. The sprout stays one element
 * throughout, so nothing jumps when loading ends.
 */
export function Sprouting() {
  useLayoutEffect(() => progress.hold(), [])
  return null
}

const unfurl = (grown: number, from: number, over: number) => Math.min(1, Math.max(0, (grown - from) / over))

/** A watercolour sprout growing out of the bare paper while the valley loads. */
export function Sprout() {
  const grown = useSyncExternalStore(progress.subscribe, progress.get)
  const pending = useSyncExternalStore(progress.subscribe, progress.pending)
  const [gone, setGone] = useState(false)

  // Once the valley is in, the sprout lingers for the wash to spread, then is taken off the page.
  useEffect(() => {
    if (pending) return
    const timer = window.setTimeout(() => setGone(true), 1400)
    return () => window.clearTimeout(timer)
  }, [pending])

  if (gone) return null
  // Never let the sprout sit still: it is always at least a little way up.
  const height = pending ? Math.max(0.12, grown) : 1

  return (
    <div className="sprout" data-leaving={!pending} role="status" aria-live="polite" style={{ '--grown': height } as CSSProperties}>
      <div className="sprout-figure">
        <svg viewBox="0 0 160 190" aria-hidden="true">
          {/* The damp patch of earth it grows from. */}
          <ellipse cx="80" cy="172" rx="50" ry="11" fill="#8c5f3e" opacity="0.28" filter="url(#bleed)" />
          <ellipse cx="80" cy="172" rx="34" ry="6.5" fill="#6c4b37" opacity="0.5" filter="url(#wobble)" />
          <g className="sprout-sway">
            <g filter="url(#bleed)" opacity="0.4">
              <path className="sprout-leaf" style={{ '--leaf': unfurl(height, 0.3, 0.3), transformOrigin: '100% 100%' } as CSSProperties} d="M80 128C58 124 42 106 44 84c20 4 34 22 36 44Z" fill="#86ae4a" />
              <path className="sprout-leaf" style={{ '--leaf': unfurl(height, 0.55, 0.3), transformOrigin: '0% 100%' } as CSSProperties} d="M80 106c22-4 40-22 38-46-20 6-36 22-38 46Z" fill="#b9c75c" />
            </g>
            <path className="sprout-stem" pathLength={1} d="M80 172C77 150 86 128 80 92" fill="none" stroke="#5e8038" strokeWidth="5.5" strokeLinecap="round" filter="url(#wobble)" />
            <g filter="url(#wobble)">
              <path className="sprout-leaf" style={{ '--leaf': unfurl(height, 0.3, 0.3), transformOrigin: '100% 100%' } as CSSProperties} d="M80 128C58 124 42 106 44 84c20 4 34 22 36 44Z" fill="#86ae4a" fillOpacity="0.82" stroke="#3a2a20" strokeOpacity="0.5" strokeWidth="1.1" />
              <path className="sprout-leaf" style={{ '--leaf': unfurl(height, 0.55, 0.3), transformOrigin: '0% 100%' } as CSSProperties} d="M80 106c22-4 40-22 38-46-20 6-36 22-38 46Z" fill="#a2c256" fillOpacity="0.82" stroke="#3a2a20" strokeOpacity="0.5" strokeWidth="1.1" />
              <path className="sprout-leaf" style={{ '--leaf': unfurl(height, 0.84, 0.16), transformOrigin: '50% 100%' } as CSSProperties} d="M80 92c-9-7-11-19-6-30 8 6 11 18 6 30Zm0 0c9-5 16-14 15-26-9 3-15 13-15 26Z" fill="#c8cf68" fillOpacity="0.9" stroke="#3a2a20" strokeOpacity="0.5" strokeWidth="1" />
            </g>
          </g>
        </svg>
        <span className="sprout-note">{pending ? 'painting the valley' : ''}</span>
      </div>
    </div>
  )
}
