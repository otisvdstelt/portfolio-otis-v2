import type { CSSProperties } from 'react'
import { SKILLS } from '../../content/site'
import type { Hot } from '../../lib/places'

interface AtticNotesProps {
  hot: Hot | null
  onHot: (hot: Hot | null) => void
}

/** The attic's panel: the five clusters written out. Pointing at a row lifts its artefacts off the shelf, and the other way round. */
export function AtticNotes({ hot, onHot }: AtticNotesProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        The inventory
      </h2>
      <p className="panel-lede">Somewhere in all this are five things worth knowing. Point at one and it rises off its shelf.</p>
      <ul className="shelves">
        {SKILLS.map((cluster, index) => {
          const isHot = hot?.kind === 'cluster' && hot.index === index
          return (
            <li key={cluster.name}>
              <button
                type="button"
                className="shelf"
                data-hot={isHot}
                aria-pressed={isHot}
                style={{ '--dab': cluster.accent } as CSSProperties}
                onPointerEnter={() => onHot({ kind: 'cluster', index })}
                onPointerLeave={() => onHot(null)}
                onFocus={() => onHot({ kind: 'cluster', index })}
                onBlur={() => onHot(null)}
                onClick={() => onHot({ kind: 'cluster', index })}
              >
                <span className="shelf-dab" aria-hidden="true" />
                <span className="shelf-name">{cluster.name}</span>
                <span className="shelf-things">{cluster.things}</span>
                <span className="shelf-skills">{cluster.skills.join(', ')}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
