// How the valley's loading is going. The sprout on the loading paper grows by
// `value`; the loader in the 3D chunk writes it. `pending` is true for as long
// as a Suspense fallback is on screen, which is what tells the sprout to stay.

let value = 0.06
let holds = 0
let everHeld = false
const listeners = new Set<() => void>()
const tell = () => {
  for (const listener of listeners) listener()
}

export const progress = {
  /** 0 to 1. Only ever grows. */
  get: () => value,
  set(next: number) {
    const clamped = Math.min(1, Math.max(value, next))
    if (clamped === value) return
    value = clamped
    tell()
  },
  /** True until the first Suspense fallback has come and gone. */
  pending: () => holds > 0 || !everHeld,
  /** Called by the fallback while it is mounted; returns the release. */
  hold() {
    holds++
    everHeld = true
    tell()
    return () => {
      holds--
      tell()
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
