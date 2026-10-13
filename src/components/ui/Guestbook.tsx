import { GUESTBOOK, OWNER } from '../../content/site'

/**
 * The guestbook that lies open on the bakery counter: who Otis is, where
 * Otis studies, how Otis works and the journey so far, written out by hand.
 */
export function Guestbook() {
  return (
    <article className="guestbook">
      <div className="guestbook-pages">
        <div className="guestbook-spread">
          <section className="page">
            <h2 tabIndex={-1} data-autofocus>
              Hello, I’m Otis.
            </h2>
            {GUESTBOOK.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Where I’m learning</h3>
            <p>
              {GUESTBOOK.education.school}
              <br />
              <span className="page-margin">{GUESTBOOK.education.line}</span>
            </p>

            <h3>The journey so far</h3>
            <ol className="journey">
              {GUESTBOOK.journey.map(({ year, text }) => (
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
            {GUESTBOOK.philosophy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h3>Away from the screen</h3>
            <p>{GUESTBOOK.away}</p>
            <p className="page-margin">Written at the counter of the Warm Crust, over a mug of tea.</p>
          </section>
        </div>
      </div>
    </article>
  )
}
