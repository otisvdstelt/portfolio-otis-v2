import { DIVISIONS } from '../../content/site'
import type { Hot } from '../../lib/places'

interface LeversProps {
  /** The lever being pointed at or left pulled, or -1. */
  pulled: number
  onHot: (hot: Hot | null) => void
  onLever: (index: number) => void
}

/**
 * The cab's four levers written out, for a phone: each division of the craft
 * and what it is made of. Choosing a row pulls that lever in the picture.
 */
export function Levers({ pulled, onHot, onLever }: LeversProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        The levers
      </h2>
      <p className="panel-lede">Four of them, one for each kind of work. Pull one and its needle swings.</p>
      <ul className="ways">
        {DIVISIONS.map((division, index) => (
          <li key={division.name}>
            <button
              type="button"
              className="way"
              data-hot={pulled === index}
              aria-pressed={pulled === index}
              onPointerEnter={(event) => event.pointerType === 'mouse' && onHot({ kind: 'lever', index })}
              onPointerLeave={() => onHot(null)}
              onClick={() => onLever(index)}
            >
              <span className="way-dab" aria-hidden="true" />
              <span className="way-name">{division.name}</span>
              <span className="way-skills">{division.skills.join(', ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
