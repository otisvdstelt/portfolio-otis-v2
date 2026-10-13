import { OWNER, SKETCHPAD } from '../../content/site'

/**
 * The sketchpad on the drafting table, seen from straight above: who Otis
 * is, where Otis studies, the timeline so far and how Otis works, written
 * out by hand across two pages.
 */
export function Sketchpad() {
  return (
    <article className="sketchpad">
      <div className="sketchpad-wire" aria-hidden="true" />
      <div className="sketchpad-pages lit">
        <div className="sketchpad-spread">
          <section className="page">
            <h2 tabIndex={-1} data-autofocus>
              Hello, I’m Otis.
            </h2>
            {SKETCHPAD.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Where I’m learning</h3>
            <p>
              {SKETCHPAD.education.school}
              <br />
              <span className="page-margin">{SKETCHPAD.education.line}</span>
            </p>

            <h3>The timeline so far</h3>
            <ol className="journey">
              {SKETCHPAD.timeline.map(({ year, text }) => (
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
            {SKETCHPAD.philosophy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Away from the screen</h3>
            <p>{SKETCHPAD.away}</p>
            <p className="page-margin">Written at the drafting table behind the clock, with the tea going cold.</p>
          </section>
        </div>
      </div>
    </article>
  )
}
