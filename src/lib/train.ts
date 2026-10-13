// Where the train is. The line is one straight run east from the halt, and
// once someone is aboard the train runs round a stretch of open sea for as
// long as they stay. The scene moves the cars from this; the camera, when it
// is aboard, is carried by the same number.
import type { PlaceId } from './places'
import { CRUISE } from './world/terrain'

export const train = {
  /** Position of the middle car along the line. It starts a little short of the halt, so that the first thing a visitor sees is the train pulling in. */
  x: -46,
  speed: 0,
  /** Distance covered, without the jump at the end of each lap: what the sea's surface slides past. */
  travel: 0,
  state: 'halt' as 'halt' | 'cruise',
  /** Seconds left before it pulls out, counted from the moment someone boards. */
  wait: 0,
}

const LAP = CRUISE.to - CRUISE.from
const settle = (from: number, to: number, rate: number, dt: number) => to + (from - to) * Math.exp(-rate * dt)

/**
 * Tell the train where its passenger is. `unseen` means the picture is
 * covered at this moment, so the train may be put where the story needs it:
 * already under way, or a little short of the platform it is pulling up to.
 * The library is a car of the train, so it is under way there too. The other
 * scenes are nowhere near the line, and leave the train as it is.
 */
export function sendTrain(place: PlaceId, unseen: boolean) {
  if (place === 'halt') {
    if (unseen && train.state !== 'halt') train.x = -22
    train.state = 'halt'
    train.speed = 0
  } else if (place === 'cabin' || place === 'library') {
    if (unseen) {
      train.x = CRUISE.from + LAP / 3
      train.speed = CRUISE.speed
      train.wait = 0
    } else if (train.state !== 'cruise') {
      // Boarded at the platform: give the passenger a moment to get through the door.
      train.wait = 2.6
    }
    train.state = 'cruise'
  }
}

/** Advance the train by one frame. `still` holds it where it stands, for devices that are shown fixed views. */
export function runTrain(dt: number, still: boolean) {
  if (still) {
    train.x = train.state === 'halt' ? 0 : CRUISE.from + LAP / 3
    return
  }
  const before = train.x
  if (train.state === 'halt') train.x = settle(train.x, 0, 1.15, dt)
  else {
    if (train.wait > 0) train.wait -= dt
    else train.speed = settle(train.speed, CRUISE.speed, 0.45, dt)
    train.x += train.speed * dt
    if (train.x >= CRUISE.to) {
      // Round again. The posts along this stretch stand a whole number of laps apart, so nothing is seen to jump.
      train.x -= LAP
      train.travel += LAP
    }
  }
  train.travel += train.x - before
}
