import { DIVISIONS, SOON } from '../../content/site'
import type { Hot } from '../../lib/places'

interface LeversProps {
  /** The lever being pointed at or left pulled, or none */
  pulled: number
  onHot: (hot: Hot | null) => void
  onLever: (index: number) => void
}

/** The four cab levers written out, for a phone. A row pulls that lever in the picture */
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
              <span className="way-skills">{division.skills.length > 0 ? division.skills.join(', ') : SOON}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
