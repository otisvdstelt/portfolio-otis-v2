// Whether the world is still on its way, held open by a Suspense fallback
// It lives outside the 3D chunk, so the sprout is drawn before three.js arrives

let holds = 0
let everHeld = false
const listeners = new Set<() => void>()
const tell = () => {
  for (const listener of listeners) listener()
}

export const progress = {
  /** True until the first Suspense fallback has come and gone */
  pending: () => holds > 0 || !everHeld,
  /** Called by the fallback while it is mounted, and returns the release */
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
