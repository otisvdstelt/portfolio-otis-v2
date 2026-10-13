import type { CSSProperties } from 'react'
import { SKILLS } from '../../content/site'
import type { Hot } from '../../lib/places'

interface FieldNotesProps {
  hot: Hot | null
  onHot: (hot: Hot | null) => void
}

/** The meadow's panel: the five mills written out. Pointing at a row spins its mill, and the other way round. */
export function FieldNotes({ hot, onHot }: FieldNotesProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        The windmill meadow
      </h2>
      <p className="panel-lede">Each mill grinds one kind of work. Point at one to set it spinning.</p>
      <ul className="mills">
        {SKILLS.map((mill, index) => (
          <li key={mill.name}>
            <button
              type="button"
              className="mill"
              data-hot={hot?.kind === 'mill' && hot.index === index}
              aria-pressed={hot?.kind === 'mill' && hot.index === index}
              style={{ '--dab': mill.accent } as CSSProperties}
              onPointerEnter={() => onHot({ kind: 'mill', index })}
              onPointerLeave={() => onHot(null)}
              onFocus={() => onHot({ kind: 'mill', index })}
              onBlur={() => onHot(null)}
              onClick={() => onHot({ kind: 'mill', index })}
            >
              <span className="mill-dab" aria-hidden="true" />
              <span className="mill-name">{mill.name}</span>
              <span className="mill-skills">{mill.skills.join(', ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
