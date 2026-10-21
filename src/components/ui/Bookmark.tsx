import type { ReactNode } from 'react'

interface BookmarkProps {
  /** Something in the picture is open and being read */
  shown: boolean
  /** What a screen reader calls these links */
  label: string
  links?: readonly { label: string; href: string }[]
  /** The words on the button that puts it away */
  closeLabel: string
  onClose: () => void
  /** The words on the pages in the picture, as text, never shown but read out */
  children?: ReactNode
}

/** The links of whatever lies open in the picture, for the keyboard and for readers */
export function Bookmark({ shown, label, links = [], closeLabel, onClose, children }: BookmarkProps) {
  return (
    <>
      <nav className="bookmark slip paper" data-shown={shown} inert={!shown} aria-label={label}>
        {links.map(({ label: words, href }) => (
          <a key={words} className="bookmark-link" href={href} target="_blank" rel="noreferrer">
            {words}
          </a>
        ))}
        <button type="button" className="bookmark-link" onClick={onClose}>
          {closeLabel}
        </button>
      </nav>
      <section className="sr-only" aria-live="polite">
        {shown && children}
      </section>
    </>
  )
}
