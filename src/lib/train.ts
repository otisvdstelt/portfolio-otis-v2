// Where the train is, one straight run east from the halt and then a lap of open sea
// The scene moves the cars from this, and a camera aboard is carried by the same number
import type { PlaceId } from './places'
import { CRUISE } from './world/terrain'

export const train = {
  /** Position of the middle car. It starts short of the halt, so the train pulls in */
  x: -46,
  speed: 0,
  /** Distance covered, with no jump at the end of a lap, which the sea slides past */
  travel: 0,
  state: 'halt' as 'halt' | 'cruise',
  /** Seconds left before it pulls out, counted from the moment someone boards */
  wait: 0,
}

const LAP = CRUISE.to - CRUISE.from
const settle = (from: number, to: number, rate: number, dt: number) => to + (from - to) * Math.exp(-rate * dt)

/** Tell the train where its passenger is. Unseen means it can be moved unnoticed */
export function sendTrain(place: PlaceId, unseen: boolean) {
  if (place === 'halt') {
    if (unseen && train.state !== 'halt') train.x = -22
    train.state = 'halt'
    train.speed = 0
  } else {
    if (unseen) {
      train.x = CRUISE.from + LAP / 3
      train.speed = CRUISE.speed
      train.wait = 0
    } else if (train.state !== 'cruise') {
      // Boarded at the platform, so give the passenger a moment to get through the door
      train.wait = 2.6
    }
    train.state = 'cruise'
  }
}

/** Advance the train by one frame. Still holds it where it stands */
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
      // Round again. The posts stand a whole number of laps apart, so nothing jumps
      train.x -= LAP
      train.travel += LAP
    }
  }
  train.travel += train.x - before
}
