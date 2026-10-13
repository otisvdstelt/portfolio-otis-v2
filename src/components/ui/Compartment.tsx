import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { OWNER } from '../../content/site'
import { Refused, useRepository, useSeats, type Repository, type Seat } from '../../hooks/useProjects'
import type { Hot } from '../../lib/places'
import { PAINT } from '../../lib/world/palette'

/** The ticket stubs take their colours from the train: its red, its cream band's gold, the sea, the moss of the far shore. */
const STUBS = [PAINT.redLight, PAINT.gold, PAINT.mist, PAINT.clover]

interface TicketRackProps {
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
}

function Tickets({ hot, onHot, onProject }: TicketRackProps) {
  const { data: seats } = useSeats()
  return (
    <ul className="tickets">
      {seats.map((seat, index) => (
        <li key={seat.id}>
          <button
            type="button"
            className="ticket"
            data-hot={hot?.kind === 'bench' && hot.index === index}
            style={{ '--livery': STUBS[index % STUBS.length] } as CSSProperties}
            onClick={() => onProject(index)}
            onPointerEnter={() => onHot({ kind: 'bench', index })}
            onPointerLeave={() => onHot(null)}
            onFocus={() => onHot({ kind: 'bench', index })}
            onBlur={() => onHot(null)}
          >
            <span className="ticket-stub">
              <span>seat</span>
              <b>{index + 1}</b>
            </span>
            <span className="ticket-face">
              <span className="ticket-name">{seat.title}</span>
              <span className="ticket-kind">{seat.kind}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The compartment's panel: one ticket per bench. Picking a ticket pulls down that project's sheet. */
export function TicketRack(props: TicketRackProps) {
  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        Passengers
      </h2>
      <p className="panel-lede">One project rides on each bench. Pick a ticket, or the bench itself, and its sheet comes down from the ceiling.</p>
      <Suspense
        fallback={
          <ul className="tickets" aria-busy="true">
            {STUBS.map((livery) => (
              <li key={livery}>
                <span className="ticket" data-waiting="true" style={{ '--livery': livery } as CSSProperties}>
                  <span className="ticket-stub" />
                  <span className="ticket-face">
                    <span />
                    <span />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        }
      >
        <Tickets {...props} />
      </Suspense>
    </div>
  )
}

// ------------------------------------------------------------ the sheet

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const written = (iso: string) => day.format(new Date(iso))
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
            {shares.map(({ name, share }, i) => (
              <span key={name} style={{ flexGrow: share, '--tone': i } as CSSProperties} />
            ))}
          </div>
          <p className="blend-key">
            {shares.map(({ name, share }, i) => (
              <span key={name} style={{ '--tone': i } as CSSProperties}>
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

function Sheet({ seat, index, onClose }: { seat: Seat; index: number; onClose: () => void }) {
  const { data: repository, isPending, error, refetch, isFetching } = useRepository(seat.repo)
  const source = repository?.url ?? `https://github.com/${seat.repo}`
  const refused = error instanceof Refused

  return (
    <div className="scroll">
      <div className="scroll-rod" aria-hidden="true" />
      <div className="parchment">
        <div className="stamp" aria-hidden="true">
          <span>seat</span>
          <b>{index + 1}</b>
        </div>
        <h2 id="sheet-title" className="sheet-title">
          {seat.title}
        </h2>
        <p className="page-margin mt-1">{seat.kind}</p>
        <p className="sheet-summary">{seat.summary || repository?.description || 'No description has been written for this one yet.'}</p>

        <h3 className="sheet-heading">Built with</h3>
        <p className="sheet-stack">{seat.stack.join(', ')}</p>

        <h3 className="sheet-heading">From GitHub, just now</h3>
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

        <div className="sheet-foot">
          <a className="pen-link" href={OWNER.github} target="_blank" rel="noreferrer">
            Everything else on GitHub
          </a>
          <button type="button" className="quiet ml-auto" onClick={onClose}>
            roll the sheet back up
          </button>
        </div>
      </div>
      <div className="scroll-rod" aria-hidden="true" />
    </div>
  )
}

interface ScrollProps {
  /** Which seat's sheet is down, or null for none. */
  index: number | null
  /** The passenger list, if it has arrived. */
  seats: readonly Seat[] | undefined
  onClose: () => void
}

/**
 * One project, on a sheet of parchment that drops from the ceiling of the
 * car like a blind. It is a true modal: it takes the whole of the visitor's
 * attention and gives it back with Escape, the button at its foot, or a
 * click outside the sheet.
 */
export function Scroll({ index, seats, onClose }: ScrollProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const seat = index === null ? undefined : seats?.[index]
  // Keep the last sheet on the roller while it goes back up, so it does not blank mid-way (adjusted during render, not in an effect).
  const [shown, setShown] = useState<{ seat: Seat; index: number } | null>(null)
  if (seat && index !== null && shown?.seat !== seat) setShown({ seat, index })

  useEffect(() => {
    const sheet = dialog.current
    if (!sheet) return
    if (seat && !sheet.open) sheet.showModal()
    if (!seat && sheet.open) sheet.close()
  }, [seat])

  return (
    <dialog
      ref={dialog}
      className="docket"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close()
      }}
    >
      {shown && <Sheet seat={shown.seat} index={shown.index} onClose={() => dialog.current?.close()} />}
    </dialog>
  )
}
