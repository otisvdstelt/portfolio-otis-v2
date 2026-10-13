import type { ReactNode } from 'react'

interface BookmarkProps {
  /** Something in the picture is open and being read. */
  shown: boolean
  /** What a screen reader calls these links: "Rotom Dex: links". */
  label: string
  links?: readonly { label: string; href: string }[]
  /** The words on the button that puts it away: "close the book". */
  closeLabel: string
  onClose: () => void
  /** The same words that are on the pages in the picture, as text. Never shown; read out. */
  children?: ReactNode
}

/**
 * The ribbon of whatever lies open in the picture. There the pages carry
 * their own words and their own links; this slip holds the same links and
 * the way to close it for the keyboard (it comes into view when the keyboard
 * reaches it), and repeats the pages as text for anyone who is not looking
 * at the picture.
 */
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
