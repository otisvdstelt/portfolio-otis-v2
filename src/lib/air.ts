// The state of the air, shared by every shader in the world. One ticker in
// the scene moves these values; the materials only ever read them.

export type Weather = 'sun' | 'rain'
export type Phase = 'day' | 'night'

export const air = {
  /** Seconds since the world woke up. */
  time: { value: 0 },
  /** How hard things lean: about 1 on a still evening, more in the rain. */
  wind: { value: 1 },
  /** 0 dry, 1 raining. */
  rain: { value: 0 },
  /** 0 golden hour, 1 night. */
  night: { value: 0 },
  /** 0 nothing to be seen but fog or paper, 1 the whole picture. */
  reveal: { value: 0 },
  /**
   * How the picture comes and goes: 0 spreads from the middle of the sheet
   * (the first arrival), 1 is a bank of fog rolling in across it, 2 the same
   * fog rolling on and off the far side.
   */
  wipe: { value: 0 },
  /** How far up the train's own lamps are turned, 0..1. The picture car turns them down while the lantern is running. */
  house: { value: 1 },
  /**
   * A colour the sky is being asked to lean toward, and how far (0..1).
   * Nothing sets it at present; it is kept for a scene that wants its own hour.
   */
  tint: { r: 0, g: 0, b: 0, amount: 0 },
}

const PHASE_KEY = 'stillwater-hour'

/** The hour the visitor last chose on this device, or day. `?time=day` or `?time=night` overrides it. */
export function readPhase(): Phase {
  const asked = new URLSearchParams(window.location.search).get('time')
  if (asked === 'day' || asked === 'night') return asked
  try {
    return window.localStorage.getItem(PHASE_KEY) === 'night' ? 'night' : 'day'
  } catch {
    return 'day'
  }
}

/** Remember the visitor's choice of hour on this device, and put the page in it. */
export function keepPhase(phase: Phase) {
  try {
    window.localStorage.setItem(PHASE_KEY, phase)
  } catch {
    // Storage may be refused (a private window); the choice then lasts as long as the page.
  }
  paintPhase(phase)
}

/** The page's own paper and the browser's bar follow the hour. */
export function paintPhase(phase: Phase) {
  document.documentElement.dataset.theme = phase
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', phase === 'night' ? '#171b2e' : '#f7f4eb')
}
