// The paper tags pinned to things in the world are ordinary page elements,
// but what they say and where they are is decided inside the 3D scene. This
// is the hand-over between the two: the scene writes each tag's words here
// and moves its element every frame; the page draws whatever is listed.
import type { ReactNode } from 'react'

export interface TagEntry {
  id: string
  shown: boolean
  content: ReactNode
}

const entries = new Map<string, TagEntry>()
const elements = new Map<string, HTMLElement>()
const listeners = new Set<() => void>()
let listed: readonly TagEntry[] = []

function publish() {
  listed = [...entries.values()]
  listeners.forEach((listener) => listener())
}

export const tags = {
  /** Add a tag, or change what it says. */
  write(id: string, shown: boolean, content: ReactNode) {
    entries.set(id, { id, shown, content })
    publish()
  },
  remove(id: string) {
    entries.delete(id)
    publish()
  },
  /** The page tells the scene which element is which tag's. */
  attach(id: string, element: HTMLElement | null) {
    if (element) elements.set(id, element)
    else elements.delete(id)
  },
  element: (id: string) => elements.get(id),
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  read: () => listed,
}
