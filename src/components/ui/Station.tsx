import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CHARMS } from '../../content/site'
import { useProjects, type Project } from '../../hooks/useProjects'
import type { Hot } from '../../lib/places'
import { PAINT } from '../../lib/world/palette'

/** The paint of each car, engine end first; the ticket stubs are cut from the same colours. */
const LIVERIES = [PAINT.terracotta, PAINT.cornflower, PAINT.gold]

interface TicketRackProps {
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
}

/** The station's panel: one ticket per train car. Picking a ticket opens that car's docket. */
export function TicketRack({ hot, onHot, onProject }: TicketRackProps) {
  const { data, isPending, isError, refetch, isFetching } = useProjects()

  return (
    <div className="paper sheet">
      <h2 className="panel-title" tabIndex={-1} data-autofocus>
        Clover Halt
      </h2>
      <p className="panel-lede">Three cars, one project in each. Pick a ticket to read its docket.</p>

      {isError ? (
        <div className="mt-5">
          <p>The dockets did not arrive. Check your connection and ask again.</p>
          <button type="button" className="inked mt-3" disabled={isFetching} onClick={() => refetch()}>
            {isFetching ? 'Asking again' : 'Ask the conductor again'}
          </button>
        </div>
      ) : (
        <ul className="tickets" aria-busy={isPending}>
          {(data ?? LIVERIES.map(() => null)).slice(0, LIVERIES.length).map((project, index) => (
            <li key={project?.id ?? index}>
              <button
                type="button"
                className="ticket"
                data-waiting={!project}
                data-hot={hot?.kind === 'car' && hot.index === index}
                disabled={!project}
                style={{ '--livery': LIVERIES[index] } as CSSProperties}
                onClick={() => onProject(index)}
                onPointerEnter={() => onHot({ kind: 'car', index })}
                onPointerLeave={() => onHot(null)}
                onFocus={() => onHot({ kind: 'car', index })}
                onBlur={() => onHot(null)}
              >
                <span className="ticket-stub">
                  <span>car</span>
                  <b>{index + 1}</b>
                </span>
                <span className="ticket-face">
                  <span className="ticket-name">{project?.title}</span>
                  <span className="ticket-kind">{project?.kind}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isPending && <p className="page-margin mt-3">The conductor is fetching the dockets.</p>}
    </div>
  )
}

interface DocketProps {
  /** Which car's docket is open, or null for none. */
  index: number | null
  onClose: () => void
}

function Link({ href, children, missing }: { href: string | null; children: string; missing: string }) {
  if (!href) {
    return (
      <span className="inked" aria-disabled="true">
        {missing}
      </span>
    )
  }
  return (
    <a className="inked" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

/**
 * One project, written out on a sheet of parchment. It is a true modal: it
 * takes the whole of the visitor's attention and gives it back with Escape,
 * the close button, or a click outside the sheet.
 */
export function Docket({ index, onClose }: DocketProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { data } = useProjects()
  const project: Project | undefined = index === null ? undefined : data?.[index]
  // Keep the last docket on the sheet while it closes, so it does not blank mid-way (adjusted during render, not in an effect).
  const [shown, setShown] = useState<{ project: Project; index: number } | null>(null)
  if (project && index !== null && shown?.project !== project) setShown({ project, index })

  useEffect(() => {
    const sheet = dialog.current
    if (!sheet) return
    if (project && !sheet.open) sheet.showModal()
    if (!project && sheet.open) sheet.close()
  }, [project])

  return (
    <dialog
      ref={dialog}
      className="docket"
      aria-labelledby="docket-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close()
      }}
    >
      {shown && (
        <div className="parchment">
          <div className="stamp" aria-hidden="true">
            <span>car</span>
            <b>{shown.index + 1}</b>
          </div>
          <h2 id="docket-title" className="docket-title">
            {shown.project.title}
          </h2>
          <p className="page-margin mt-1">{shown.project.kind}</p>
          {shown.project.placeholder && <p className="placeholder-note">Placeholder. A real project goes here.</p>}
          <p className="docket-summary">{shown.project.summary}</p>

          <dl className="specs">
            <dt>Year</dt>
            <dd>{shown.project.year}</dd>
            <dt>My part</dt>
            <dd>{shown.project.role}</dd>
            <dt>Built with</dt>
            <dd>{shown.project.stack.join(', ')}</dd>
          </dl>

          {shown.project.notes.length > 0 && (
            <ul className="docket-notes">
              {shown.project.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <div className="docket-foot">
            <Link href={shown.project.repo} missing="No repository yet">
              Code repository
            </Link>
            <Link href={shown.project.live} missing="No live site yet">
              Live site
            </Link>
            <button type="button" className="quiet ml-auto" onClick={() => dialog.current?.close()}>
              close the docket
            </button>
          </div>
          {!shown.project.repo && (
            <p className="letter-note">
              Until then, everything Otis has published is on{' '}
              <a className="pen-link" href={CHARMS[0].href} target="_blank" rel="noreferrer">
                GitHub
              </a>
              .
            </p>
          )}
        </div>
      )}
    </dialog>
  )
}
