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
   * A colour the sky is being asked to lean toward, and how far (0..1). The
   * Nothing sets it at present; it is kept for a scene that wants its own hour.
   */
  tint: { r: 0, g: 0, b: 0, amount: 0 },
}

/** Night falls at seven and lifts at six, by the visitor's own clock. `?time=day` or `?time=night` overrides it. */
export function readPhase(now = new Date()): Phase {
  const asked = new URLSearchParams(window.location.search).get('time')
  if (asked === 'day' || asked === 'night') return asked
  const hour = now.getHours()
  return hour >= 19 || hour < 6 ? 'night' : 'day'
}
