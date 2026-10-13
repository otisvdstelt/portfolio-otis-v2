import { useId, useState, type FormEvent } from 'react'
import { CHARMS, OWNER } from '../../content/site'

type Errors = Partial<Record<'message' | 'name' | 'reply', string>>

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/**
 * The letter that slides out of the postbox. There is no server behind this
 * site, so sealing the letter hands it to the visitor's own mail app,
 * addressed and written; they press send there.
 */
export function Letter() {
  const id = useId()
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [reply, setReply] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sealed, setSealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const seal = (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    if (!message.trim()) found.message = 'The letter is still blank. Write a line or two first.'
    if (!name.trim()) found.name = 'Sign it, so Otis knows who wrote.'
    if (reply.trim() && !looksLikeEmail(reply.trim())) found.reply = 'That address looks unfinished. Check it, or leave it empty.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setSealed(false)
      // Send the keyboard to the first line that needs attention.
      const first = (['message', 'name', 'reply'] as const).find((field) => found[field])
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const body = `${message.trim()}\n\n${name.trim()}${reply.trim() ? `\n${reply.trim()}` : ''}`
    window.location.href = `mailto:${OWNER.email}?subject=${encodeURIComponent(`A letter from ${name.trim()}`)}&body=${encodeURIComponent(body)}`
    setSealed(true)
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
    <div className="paper letter">
      <form onSubmit={seal} noValidate>
        <div className="letter-head">
          <h2 className="panel-title" tabIndex={-1} data-autofocus>
            Dear Otis,
          </h2>
          <div className="postage" aria-hidden="true">
            <svg viewBox="0 0 40 50">
              <path d="M0 38c8-5 14-2 20-5s12-7 20-3v20H0Z" fill="#86ae4a" />
              <path d="M17 36l2-17h2l2 17Z" fill="#f2e7ce" />
              <path d="M19 17h2l1 3h-4Z" fill="#c2643f" />
              <path d="M20 19 9 12l2-2Zm0 0 11-7-2-2Zm0 0-7 11-2-2Zm0 0 7 11 2-2Z" fill="#f8f1e0" stroke="#3a2a20" strokeWidth="0.6" />
            </svg>
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${id}-message`}>Your letter</label>
          <textarea
            id={`${id}-message`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="I saw your valley and wanted to say…"
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

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="submit" className="inked" data-tone="rust">
            Seal and send
          </button>
          <button type="button" className="quiet" onClick={copy}>
            {copied ? 'address copied' : 'copy the address instead'}
          </button>
        </div>
        <p className="letter-note" role="status">
          {sealed ? `Your mail app should have opened with the letter inside. If nothing happened, write to ${OWNER.email}.` : 'Sealing it opens your own mail app with the letter written out. Nothing is sent until you press send there.'}
        </p>
      </form>

      <h3 className="mt-7 font-display text-[1.14rem] text-rust">Or pull one of the charms</h3>
      <ul className="charms">
        {CHARMS.map(({ label, href }) => (
          <li key={label}>
            <a className="charm" href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
