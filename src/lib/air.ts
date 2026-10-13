// The state of the air, shared by every shader in the world. One ticker in
// the scene moves these values; the materials only ever read them.

export type Weather = 'sun' | 'rain'
export type Phase = 'day' | 'night'

export const air = {
  /** Seconds since the world woke up. */
  time: { value: 0 },
  /** How hard the grass leans: about 1 on a still evening, more in the rain. */
  wind: { value: 1 },
  /** 0 dry, 1 raining. */
  rain: { value: 0 },
  /** 0 golden hour, 1 night. */
  night: { value: 0 },
  /** 0 bare paper, 1 the whole painting washed in. */
  reveal: { value: 0 },
}

/** Night falls at seven and lifts at six, by the visitor's own clock. `?time=day` or `?time=night` overrides it. */
export function readPhase(now = new Date()): Phase {
  const asked = new URLSearchParams(window.location.search).get('time')
  if (asked === 'day' || asked === 'night') return asked
  const hour = now.getHours()
  return hour >= 19 || hour < 6 ? 'night' : 'day'
}
