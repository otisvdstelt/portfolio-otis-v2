import { useId, useState, type FormEvent } from 'react'
import { OWNER, PLANKS } from '../../content/site'

type Errors = Partial<Record<'message' | 'name' | 'reply', string>>

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/**
 * The notepad from the shelf of the telephone box, read under the lantern.
 * There is no server behind this site, so tearing the page off hands it to
 * the visitor's own mail app, addressed and written; they press send there.
 */
export function Notepad() {
  const id = useId()
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [torn, setTorn] = useState(false)
  const [copied, setCopied] = useState(false)

  const tear = (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    if (!message.trim()) found.message = 'The page is still blank. Write a line or two first.'
    if (!name.trim()) found.name = 'Sign it, so Otis knows who called.'
    if (reply.trim() && !looksLikeEmail(reply.trim())) found.reply = 'That address looks unfinished. Check it, or leave it empty.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setTorn(false)
      // Send the keyboard to the first line that needs attention.
      const first = (['message', 'name', 'reply'] as const).find((field) => found[field])
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const body = `${message.trim()}\n\n${name.trim()}${reply.trim() ? `\n${reply.trim()}` : ''}`
    window.location.href = `mailto:${OWNER.email}?subject=${encodeURIComponent(`A note from ${name.trim()}`)}&body=${encodeURIComponent(body)}`
    setTorn(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(OWNER.email)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="paper notepad lit">
      <form onSubmit={tear} noValidate>
        <h2 className="panel-title" tabIndex={-1} data-autofocus>
          Dear Otis,
        </h2>
        <p className="notepad-lede">The line is open. Leave a message on the pad.</p>

        <div className="field">
          <label htmlFor={`${id}-message`}>Your message</label>
          <textarea
            id={`${id}-message`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="I took your train and wanted to say…"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${id}-message-error` : undefined}
          />
          {errors.message && (
            <span id={`${id}-message-error`} className="field-error">
              {errors.message}
            </span>
          )}
        </div>

        <div className="grid gap-x-5 sm:grid-cols-2">
          <div className="field">
            <label htmlFor={`${id}-name`}>Signed</label>
            <input id={`${id}-name`} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
            {errors.name && (
              <span id={`${id}-name-error`} className="field-error">
                {errors.name}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor={`${id}-reply`}>Call back at (if you like)</label>
            <input
              id={`${id}-reply`}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.reply)}
              aria-describedby={errors.reply ? `${id}-reply-error` : undefined}
            />
            {errors.reply && (
              <span id={`${id}-reply-error`} className="field-error">
                {errors.reply}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="submit" className="inked" data-tone="rust">
            Tear it off and send
          </button>
          <button type="button" className="quiet" onClick={copy}>
            {copied ? 'address copied' : 'copy the address instead'}
          </button>
        </div>
        <p className="letter-note" role="status">
          {torn ? `Your mail app should have opened with the note inside. If nothing happened, write to ${OWNER.email}.` : 'Tearing it off opens your own mail app with the note written out. Nothing is sent until you press send there.'}
        </p>
      </form>

      <h3 className="notepad-heading">Or follow a plank on the pole</h3>
      <ul className="planks">
        {PLANKS.map(({ label, href }) => (
          <li key={label}>
            <a className="plank" href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
