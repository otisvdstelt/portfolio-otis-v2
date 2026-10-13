import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { OWNER } from '../../content/site'
import { NUMERALS, Refused, useRepository, useSeats, written, type Repository, type Seat } from '../../hooks/useProjects'
import type { Hot } from '../../lib/places'
import { LEATHERS } from '../../lib/world/palette'

interface CatalogueProps {
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
}

function Volumes({ hot, onHot, onProject }: CatalogueProps) {
  const { data: seats } = useSeats()
  return (
    <ul className="volumes">
      {seats.map((seat, index) => (
        <li key={seat.id}>
          <button
            type="button"
            className="volume"
            data-hot={hot?.kind === 'tome' && hot.index === index}
            style={{ '--leather': LEATHERS[index % LEATHERS.length] } as CSSProperties}
            onClick={() => onProject(index)}
            onPointerEnter={() => onHot({ kind: 'tome', index })}
            onPointerLeave={() => onHot(null)}
            onFocus={() => onHot({ kind: 'tome', index })}
            onBlur={() => onHot(null)}
          >
            <span className="volume-spine">
              <span>reel</span>
              <b>{NUMERALS[index]}</b>
            </span>
            <span className="volume-face">
              <span className="volume-name">{seat.title}</span>
              <span className="volume-kind">{seat.kind}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The picture car's programme: one entry per tin in the rack. Picking one puts it in the lantern. */
export function Catalogue(props: CatalogueProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        The programme
      </h2>
      <p className="panel-lede">One tin of film in the rack for each project. Pick one and the lantern shows it.</p>
      <Suspense
        fallback={
          <ul className="volumes" aria-busy="true">
            {LEATHERS.map((leather) => (
              <li key={leather}>
                <span className="volume" data-waiting="true" style={{ '--leather': leather } as CSSProperties}>
                  <span className="volume-spine" />
                  <span className="volume-face">
                    <span />
                    <span />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        }
      >
        <Volumes {...props} />
      </Suspense>
    </div>
  )
}

// ------------------------------------------------------------ the open book

/** A web address as it would be written on a luggage label: no scheme, no trailing slash. */
const asPath = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function Figures({ repository }: { repository: Repository }) {
  const shares = repository.languages.filter(({ share }) => share >= 0.01).slice(0, 5)
  return (
    <>
      {shares.length > 0 && (
        <>
          {/* What the code is actually made of, as GitHub measures it. */}
          <div className="blend" role="img" aria-label={`Languages: ${shares.map(({ name, share }) => `${name} ${Math.round(share * 100)} percent`).join(', ')}`}>
            {shares.map(({ name, share }) => (
              <span key={name} style={{ flexGrow: share }} />
            ))}
          </div>
          <p className="blend-key">
            {shares.map(({ name, share }) => (
              <span key={name}>
                {name} {Math.max(1, Math.round(share * 100))}%
              </span>
            ))}
          </p>
        </>
      )}
      <dl className="specs">
        <dt>Last worked on</dt>
        <dd>{written(repository.pushedAt)}</dd>
        <dt>Started</dt>
        <dd>{written(repository.createdAt)}</dd>
        <dt>Stars</dt>
        <dd>{repository.stars}</dd>
        <dt>Forks</dt>
        <dd>{repository.forks}</dd>
        <dt>Open issues</dt>
        <dd>{repository.openIssues}</dd>
        {repository.licence && (
          <>
            <dt>Licence</dt>
            <dd>{repository.licence}</dd>
          </>
        )}
      </dl>
    </>
  )
}

function Spread({ seat, index, onClose }: { seat: Seat; index: number; onClose: () => void }) {
  const { data: repository, isPending, error, refetch, isFetching } = useRepository(seat.repo)
  const source = repository?.url ?? `https://github.com/${seat.repo}`
  const refused = error instanceof Refused

  return (
    <article className="tome-boards" style={{ '--leather': LEATHERS[index % LEATHERS.length] } as CSSProperties}>
      <div className="tome-leaves lit">
        <div className="tome-spread">
          <section className="leaf">
            {seat.image && <img className="leaf-still" src={`${import.meta.env.BASE_URL}${seat.image}`} alt={`A still of ${seat.title}`} loading="lazy" />}
            <p className="leaf-number">Reel {NUMERALS[index]}</p>
            <h2 id="tome-title" className="sheet-title">
              {seat.title}
            </h2>
            <p className="page-margin mt-1">{seat.kind}</p>
            <p className="sheet-summary">{seat.summary || repository?.description || 'No description has been written for this one yet.'}</p>

            <h3 className="sheet-heading">Built with</h3>
            <p className="sheet-stack">{seat.stack.join(', ')}</p>

            <h3 className="sheet-heading">Where to find it</h3>
            <dl className="specs paths">
              <dt>Live</dt>
              <dd>
                {repository?.homepage ? (
                  <a className="pen-link" href={repository.homepage} target="_blank" rel="noreferrer">
                    {asPath(repository.homepage)}
                  </a>
                ) : (
                  <span className="page-margin">{isPending ? 'looking it up' : 'no live address given'}</span>
                )}
              </dd>
              <dt>Source</dt>
              <dd>
                <a className="pen-link" href={source} target="_blank" rel="noreferrer">
                  {asPath(source)}
                </a>
              </dd>
            </dl>
          </section>

          <section className="leaf">
            <h3 className="sheet-heading leaf-first">From GitHub, just now</h3>
            <div aria-live="polite" aria-busy={isPending}>
              {repository ? (
                <Figures repository={repository} />
              ) : error ? (
                <div>
                  <p>{refused ? error.message : 'GitHub could not be reached. Check your connection.'}</p>
                  <button type="button" className="inked mt-3" disabled={isFetching} onClick={() => refetch()}>
                    {isFetching ? 'Asking again' : 'Ask GitHub again'}
                  </button>
                </div>
              ) : (
                <div className="waiting" aria-label="Fetching the figures">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <div className="sheet-foot">
              <a className="pen-link" href={OWNER.github} target="_blank" rel="noreferrer">
                Everything else on GitHub
              </a>
              <button type="button" className="quiet ml-auto" onClick={onClose}>
                stop the projector
              </button>
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

interface OpenBookProps {
  /** Which book is open, or null for none. */
  index: number | null
  /** The catalogue, if it has arrived. */
  seats: readonly Seat[] | undefined
  onClose: () => void
}

/**
 * One project, on the two parchment pages of its book, for a phone: there
 * the book in the picture is too small to read, so its pages are laid over
 * it as text. (On a wide screen the words are set on the book itself; see
 * three/Cinema.tsx.) It is a true modal: it takes the whole of the
 * visitor's attention and gives it back with Escape, the words at its foot,
 * or a press outside the book.
 */
export function OpenBook({ index, seats, onClose }: OpenBookProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const seat = index === null ? undefined : seats?.[index]
  // Keep the last pages in the book while it closes, so it does not blank mid-way (adjusted during render, not in an effect).
  const [shown, setShown] = useState<{ seat: Seat; index: number } | null>(null)
  if (seat && index !== null && shown?.seat !== seat) setShown({ seat, index })

  useEffect(() => {
    const book = dialog.current
    if (!book) return
    if (!seat) {
      if (book.open) book.close()
      return
    }
    if (!book.open) book.showModal()
  }, [seat])

  return (
    <dialog
      ref={dialog}
      className="tome"
      aria-labelledby="tome-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close()
      }}
    >
      {shown && <Spread seat={shown.seat} index={shown.index} onClose={() => dialog.current?.close()} />}
    </dialog>
  )
}
