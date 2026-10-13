import { useState, type CSSProperties } from 'react'
import { DIVISIONS } from '../../content/site'
import type { Hot } from '../../lib/places'
import { PLAQUES } from '../../lib/world/spec'

interface WaysProps {
  /** The plaque being pointed at or pinned, or -1. */
  pointed: number
  onHot: (hot: Hot | null) => void
  onPlaque: (index: number) => void
}

/** The signpost written out, for a phone: the four plaques and what each one points to. Choosing a row turns the sky its way. */
export function Ways({ pointed, onHot, onPlaque }: WaysProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        The signpost
      </h2>
      <p className="panel-lede">It points four ways, and each has its own hour. Choose one and the sky turns with you.</p>
      <ul className="ways">
        {DIVISIONS.map((division, index) => (
          <li key={division.name}>
            <button
              type="button"
              className="way"
              data-hot={pointed === index}
              aria-pressed={pointed === index}
              style={{ '--dab': division.sky } as CSSProperties}
              onPointerEnter={(event) => event.pointerType === 'mouse' && onHot({ kind: 'plaque', index })}
              onPointerLeave={() => onHot(null)}
              onClick={() => onPlaque(index)}
            >
              <span className="way-dab" aria-hidden="true" />
              <span className="way-name">{division.name}</span>
              <span className="way-hour">{division.hour}</span>
              <span className="way-skills">{division.skills.join(', ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The sheet of parchment that blows in when a plaque is chosen, carrying
 * what lies that way. It arrives on the wind from the upper right, settles
 * on the side of the picture the camera has turned toward (the post is on
 * the other), and is carried on to the left when the visitor looks elsewhere.
 */
export function Gust({ index }: { index: number }) {
  // Keep the last sheet while it blows away (adjusted during render, not in an effect).
  const [last, setLast] = useState(index)
  if (index >= 0 && index !== last) setLast(index)
  const division = DIVISIONS[last]

  return (
    <aside className="gust" data-shown={index >= 0} data-side={PLAQUES[last]?.side === -1 ? 'left' : 'right'} aria-live="polite" aria-label="What lies that way">
      {division && (
        // A new sheet for each plaque, so each one arrives on its own gust.
        <div key={last} className="gust-sheet paper lit" aria-hidden={index < 0}>
          <p className="gust-hour">{division.hour}</p>
          <h2 className="gust-title">{division.name}</h2>
          <ul className="gust-skills">
            {division.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
