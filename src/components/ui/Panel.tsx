import { useEffect, useRef, type ReactNode } from 'react'

interface PanelProps {
  open: boolean
  /** What a screen reader calls this panel. */
  label: string
  /** The words on the button that puts it away: "close the journal". */
  closeLabel: string
  /** Needs the room of two pages side by side. */
  wide?: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Where a place's words are shown. Beside the landmark on a wide screen; a
 * sheet sliding up from the menu on a phone. It is real, selectable text over
 * the painting, never part of it, and it does not trap the visitor: the
 * valley and the menu stay usable while it is open.
 */
export function Panel({ open, label, closeLabel, wide = false, onClose, children }: PanelProps) {
  const panel = useRef<HTMLElement>(null)

  // Hand the keyboard to the panel's heading when it opens, so reading starts at the top.
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true }), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  return (
    <aside ref={panel} className="panel" data-open={open} data-wide={wide} inert={!open} role="dialog" aria-modal="false" aria-label={label}>
      <button type="button" className="slip paper panel-close" onClick={onClose}>
        {closeLabel}
      </button>
      <div className="panel-body">{children}</div>
    </aside>
  )
}
