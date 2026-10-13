import { JOURNAL, OWNER } from '../../content/site'

/** The worn leather journal kept in the greenhouse: who Otis is, where Otis studies, how Otis works. */
export function Journal() {
  return (
    <article className="journal">
      <div className="journal-pages">
        <div className="journal-spread">
          <section className="page">
            <h2 tabIndex={-1} data-autofocus>
              Hello, I’m Otis.
            </h2>
            {JOURNAL.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Where I’m learning</h3>
            <p>
              {JOURNAL.education.school}
              <br />
              <span className="page-margin">{JOURNAL.education.line}</span>
            </p>

            <h3>The trail so far</h3>
            <ol className="trail-log">
              {JOURNAL.history.map(({ year, text }) => (
                <li key={text}>
                  <time>{year}</time>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="page">
            <h2>How I work</h2>
            <p className="page-quote">“{OWNER.motto}”</p>
            {JOURNAL.philosophy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Away from the screen</h3>
            <p>{JOURNAL.away}</p>
            <p className="page-margin">Written in the greenhouse, under the old oak.</p>
          </section>
        </div>
      </div>
    </article>
  )
}
