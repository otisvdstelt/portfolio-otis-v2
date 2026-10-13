// Whether the world is still on its way. A Suspense fallback holds this open
// for as long as it is mounted, and the sprout in the corner of the page keeps
// growing for as long as it is held. It lives outside the 3D chunk so the
// sprout can be drawn before three.js has even been downloaded.

let holds = 0
let everHeld = false
const listeners = new Set<() => void>()
const tell = () => {
  for (const listener of listeners) listener()
}

export const progress = {
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
