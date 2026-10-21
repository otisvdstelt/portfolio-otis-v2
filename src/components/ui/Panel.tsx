import { useEffect, useRef, type ReactNode } from 'react'

interface PanelProps {
  open: boolean
  /** What a screen reader calls this panel */
  label: string
  /** The words on the button that puts it away */
  closeLabel: string
  /** Needs the room of two pages side by side */
  wide?: boolean
  /** Laid over the middle of the picture instead of beside it */
  centre?: boolean
  onClose: () => void
  children: ReactNode
}

/** Where the words of a place are shown, beside the scene or as a sheet on a phone */
export function Panel({ open, label, closeLabel, wide = false, centre = false, onClose, children }: PanelProps) {
  const panel = useRef<HTMLElement>(null)

  // Hand the keyboard to the heading when it opens, so reading starts at the top
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true }), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  return (
    <aside ref={panel} className="panel" data-open={open} data-wide={wide} data-centre={centre} inert={!open} role="dialog" aria-modal="false" aria-label={label}>
      <button type="button" className="slip paper panel-close" onClick={onClose}>
        {closeLabel}
      </button>
      <div className="panel-body">{children}</div>
    </aside>
  )
}
