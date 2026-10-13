import type { Leaves } from '../../hooks/useProjects'

interface BookmarkProps {
  /** The words of the open book, or null when no book is open. */
  leaves: Leaves | null
  onClose: () => void
}

/**
 * The open book's ribbon. In the picture the book's pages carry its words
 * and its links; this slip holds the same links and the way to close the
 * book for the keyboard (it comes into view when the keyboard reaches it),
 * and repeats the pages as text for anyone who is not looking at the picture.
 */
export function Bookmark({ leaves, onClose }: BookmarkProps) {
  const figures = leaves?.figures
  return (
    <>
      <nav className="bookmark slip paper" data-shown={leaves !== null} inert={leaves === null} aria-label={leaves ? `${leaves.title}: links` : undefined}>
        {leaves?.live && (
          <a className="bookmark-link" href={leaves.live} target="_blank" rel="noreferrer">
            open the live site
          </a>
        )}
        {leaves && (
          <a className="bookmark-link" href={leaves.source} target="_blank" rel="noreferrer">
            read the source
          </a>
        )}
        <button type="button" className="bookmark-link" onClick={onClose}>
          close the book
        </button>
      </nav>

      <section className="sr-only" aria-live="polite">
        {leaves && (
          <>
            <h2>
              {leaves.volume}: {leaves.title}
            </h2>
            <p>{leaves.kind}</p>
            <p>{leaves.summary}</p>
            <p>Built with {leaves.stack}.</p>
            {figures && 'rows' in figures && (
              <>
                <p>
                  From GitHub, just now.{' '}
                  {figures.languages
                    .filter(({ share }) => share >= 0.01)
                    .slice(0, 5)
                    .map(({ name, share }) => `${name} ${Math.round(share * 100)} percent`)
                    .join(', ')}
                  .
                </p>
                <dl>
                  {figures.rows.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {figures && 'trouble' in figures && <p>{figures.trouble}</p>}
          </>
        )}
      </section>
    </>
  )
}
