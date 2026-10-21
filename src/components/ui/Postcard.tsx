import { useId, useState, type FormEvent } from 'react'
import { LINKS, OWNER } from '../../content/site'

type Errors = Partial<Record<'message' | 'name' | 'reply', string>>

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/** The card from the desk. With no server behind the site, posting it opens a mail app */
export function Postcard() {
  const id = useId()
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [posted, setPosted] = useState(false)
  const [copied, setCopied] = useState(false)

  const post = (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    if (!message.trim()) found.message = 'The card is still blank. Write a line or two first.'
    if (!name.trim()) found.name = 'Sign it, so Otis knows who wrote.'
    if (reply.trim() && !looksLikeEmail(reply.trim())) found.reply = 'That address looks unfinished. Check it, or leave it empty.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setPosted(false)
      // Send the keyboard to the first line that needs attention
      const first = (['message', 'name', 'reply'] as const).find((field) => found[field])
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const body = `${message.trim()}\n\n${name.trim()}${reply.trim() ? `\n${reply.trim()}` : ''}`
    window.location.href = `mailto:${OWNER.email}?subject=${encodeURIComponent(`A postcard from ${name.trim()}`)}&body=${encodeURIComponent(body)}`
    setPosted(true)
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
    <div className="paper postcard lit">
      <form className="postcard-faces" onSubmit={post} noValidate>
        <div className="postcard-message">
          <h2 className="panel-title" tabIndex={-1} data-autofocus>
            Dear Otis,
          </h2>
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
        </div>

        <div className="postcard-address">
          <p className="postcard-stamp" aria-hidden="true">
            Stillwater
            <br />
            Line
          </p>
          <p className="postcard-to">
            To
            <br />
            <b>{OWNER.name}</b>
          </p>
          <div className="field">
            <label htmlFor={`${id}-name`}>From</label>
            <input id={`${id}-name`} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
            {errors.name && (
              <span id={`${id}-name-error`} className="field-error">
                {errors.name}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor={`${id}-reply`}>Write back to (if you like)</label>
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

        <div className="postcard-foot">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="submit" className="inked" data-tone="rust">
              Post it
            </button>
            <button type="button" className="quiet" onClick={copy}>
              {copied ? 'address copied' : 'copy the address instead'}
            </button>
          </div>
          <p className="letter-note" role="status">
            {posted ? `Your mail app should have opened with the card inside. If nothing happened, write to ${OWNER.email}.` : 'Posting it opens your own mail app with the card written out. Nothing is sent until you press send there.'}
          </p>
          <p className="postcard-holes">
            Or look in a pigeonhole:{' '}
            {LINKS.map(({ label, href }, index) => (
              <span key={label}>
                {index > 0 && ', '}
                <a className="pen-link" href={href} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </form>
    </div>
  )
}
