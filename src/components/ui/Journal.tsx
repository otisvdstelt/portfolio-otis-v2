import { ABOUT, OWNER } from '../../content/site'

/** The journal from the table as text, for a phone and for anyone not looking */
export function Journal() {
  return (
    <article className="sketchpad">
      <div className="sketchpad-wire" aria-hidden="true" />
      <div className="sketchpad-pages lit">
        <div className="sketchpad-spread">
          <section className="page">
            <h2 tabIndex={-1} data-autofocus>
              Hello, I’m Otis.
            </h2>
            {ABOUT.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Where I’m learning</h3>
            <p>
              {ABOUT.education.school}
              <br />
              <span className="page-margin">{ABOUT.education.line}</span>
            </p>

            <h3>The timeline so far</h3>
            <ol className="journey">
              {ABOUT.timeline.map(({ year, text }) => (
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
            {ABOUT.philosophy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Away from the screen</h3>
            <p>{ABOUT.away}</p>
            <p className="page-margin">Written at the table by the window, with the tea going cold.</p>
          </section>
        </div>
      </div>
    </article>
  )
}
