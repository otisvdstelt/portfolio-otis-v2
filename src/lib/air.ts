// The state of the air, shared by every shader. One ticker moves it, materials read it

export type Weather = 'sun' | 'rain'
export type Phase = 'day' | 'night'

export const air = {
  /** Seconds since the world woke up */
  time: { value: 0 },
  /** How hard things lean, about 1 on a still evening and more in the rain */
  wind: { value: 1 },
  /** 0 dry, 1 raining */
  rain: { value: 0 },
  /** 0 golden hour, 1 night */
  night: { value: 0 },
  /** 0 nothing to be seen but fog or paper, 1 the whole picture */
  reveal: { value: 0 },
  /** How the picture comes and goes, 0 spreading from the middle, 1 fog in, 2 fog off */
  wipe: { value: 0 },
  /** How far up the lamps of the train are turned, 0 to 1 */
  house: { value: 1 },
  /** A colour the sky is asked to lean toward, and how far. Nothing sets it yet */
  tint: { r: 0, g: 0, b: 0, amount: 0 },
}

const PHASE_KEY = 'stillwater-hour'

/** The hour last chosen on this device, or day. A time in the address overrides it */
export function readPhase(): Phase {
  const asked = new URLSearchParams(window.location.search).get('time')
  if (asked === 'day' || asked === 'night') return asked
  try {
    return window.localStorage.getItem(PHASE_KEY) === 'night' ? 'night' : 'day'
  } catch {
    return 'day'
  }
}

/** Remember the chosen hour on this device, and put the page in it */
export function keepPhase(phase: Phase) {
  try {
    window.localStorage.setItem(PHASE_KEY, phase)
  } catch {
    // Storage may be refused, and the choice then lasts as long as the page
  }
  paintPhase(phase)
}

/** The paper of the page and the browser bar follow the hour */
export function paintPhase(phase: Phase) {
  document.documentElement.dataset.theme = phase
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', phase === 'night' ? '#171b2e' : '#f7f4eb')
}
