import { CAR, LIBRARY, PLAQUES, SIGNPOST, STOP, TOWER } from './world/spec'
import { DECK, shoreHeight, SITES, TOWER_FLOOR } from './world/terrain'

/**
 * Everywhere the camera can be. `halt` is the title card outside the train;
 * `cabin` is the train car, the hub everything else is reached from;
 * `library` is the same car fitted out with books; the other three are
 * scenes of their own, standing on the sea.
 */
export type PlaceId = 'halt' | 'cabin' | 'library' | 'tower' | 'signpost' | 'busstop'
export type Destination = Exclude<PlaceId, 'halt' | 'cabin'>

/** The four destinations, in the order of their benches along the car. */
export const DESTINATIONS: readonly Destination[] = ['library', 'tower', 'signpost', 'busstop']

/** The thing under the pointer, or picked from a list. */
export interface Hot {
  kind: 'seat' | 'tome' | 'plaque' | 'plank'
  index: number
}

type Triple = readonly [number, number, number]

/** A camera position and the point it looks at. */
export interface Shot {
  position: Triple
  target: Triple
  /** Vertical field of view in degrees. Rooms want a wider lens than the open sea. */
  fov: number
  /** Measured from the middle car of the train, and carried along with it. */
  onTrain?: boolean
  /** How near and how far the visitor may pull the camera from its target. */
  reach: readonly [number, number]
  /** How far the visitor may swing round the target either way, in radians. Left out, the orbit is free. */
  swing?: number
  /** The steepest and the shallowest the camera may look, as angles from straight overhead. */
  tilt: readonly [number, number]
}

/** What a scene does to the hour: colours given as hex, anything left out stays as the golden hour has it. */
export interface Mood {
  skyTop?: string
  skyHorizon?: string
  skyGlow?: string
  water?: string
  sun?: string
  /** How much of the sea is mirror and how much its own colour, 0..1. */
  mirror?: number
  /** 1 where the sea is shallow and clear enough to see light moving on the bottom. */
  shallow?: number
  /** The colour of what drifts in the air. */
  dust?: string
  /** It is always night here, whatever the hour. */
  night?: boolean
}

export interface Place {
  name: string
  /** What a visitor finds there, in plain words. */
  role: string
  /** One word for the phone menu. */
  short: string
  /** The framing on a wide screen, where the camera is also free to turn. */
  view: Shot
  /** The fixed framing on a tall screen. */
  backdrop: Shot
  /** A closer framing for reading: the open book held at arm's length, the sketchpad seen from straight above. */
  reading?: Shot
  mood: Mood
}

const at = ([sx, sz]: readonly [number, number], [x, y, z]: Triple): Triple => [sx + x, y, sz + z]

/** A point in the clocktower's room, which is turned to face the sun and hangs high over the sea. */
function inTower([x, y, z]: Triple): Triple {
  const cos = Math.cos(TOWER.yaw)
  const sin = Math.sin(TOWER.yaw)
  return [SITES.tower[0] + x * cos + z * sin, TOWER_FLOOR + y, SITES.tower[1] - x * sin + z * cos]
}

const knoll = shoreHeight(SIGNPOST.at[0], SIGNPOST.at[1])
const pad = TOWER.pad
const lectern = LIBRARY.lectern

export const PLACES: Record<PlaceId, Place> = {
  halt: {
    name: 'Stillwater Halt',
    role: 'the platform',
    short: 'Halt',
    // Low over the water and side-on, so the train sits on the horizon and three quarters of the picture is sky.
    view: { position: [-4, 2.3, 45], target: [1.5, 8.8, 0], fov: 40, reach: [14, 80], tilt: [1.0, 1.72] },
    backdrop: { position: [-1, 2.4, 40], target: [0.5, 11.5, 0], fov: 58, reach: [14, 70], tilt: [1.0, 1.8] },
    mood: {},
  },
  cabin: {
    name: 'The train',
    role: 'home',
    short: 'Home',
    // Standing at the end of the aisle, free to look round the whole car.
    // The target is an arm's length in front of the eye, so turning the view is turning your head, not circling the car.
    view: { position: [-3.5, DECK + 1.32, 0.22], target: [-2.82, DECK + 1.27, 0.07], fov: 62, onTrain: true, reach: [0.4, 1.3], tilt: [1.0, 2.0] },
    backdrop: { position: [-1.1, DECK + 1.3, 0.95], target: [0.4, DECK + 1.14, -1.3], fov: 74, onTrain: true, reach: [0.6, 3], swing: 1, tilt: [1.0, 1.95] },
    mood: {},
  },
  library: {
    name: 'The library car',
    role: 'projects',
    short: 'Work',
    // In the aisle, turned toward the bookcase, with an open window either side of it.
    view: { position: [-1.45, DECK + 1.46, 0.95], target: [-0.08, DECK + 1.2, -1.2], fov: 60, onTrain: true, reach: [1.5, 3.1], swing: 0.5, tilt: [1.1, 1.8] },
    backdrop: { position: [0.1, DECK + 1.38, 1.05], target: [0, DECK + 1.2, -1.2], fov: 76, onTrain: true, reach: [1.5, 3.0], swing: 0.4, tilt: [1.1, 1.8] },
    // An arm's length from the open book, square on to its pages.
    reading: { position: [lectern[0], DECK + lectern[1] + Math.sin(LIBRARY.tip) * LIBRARY.arm, lectern[2] + Math.cos(LIBRARY.tip) * LIBRARY.arm], target: [lectern[0], DECK + lectern[1], lectern[2]], fov: 40, onTrain: true, reach: [0.6, 1.3], swing: 0.3, tilt: [0.7, 1.5] },
    mood: {},
  },
  tower: {
    name: 'The clocktower',
    role: 'about me',
    short: 'About',
    view: { position: inTower([-1.9, 2.75, -7.4]), target: inTower([0.5, 3.95, 3.2]), fov: 58, reach: [1.2, 11.5], swing: 0.5, tilt: [1.1, 1.85] },
    backdrop: { position: inTower([0, 2.9, -7.6]), target: inTower([0, 5.4, 4]), fov: 76, reach: [1.2, 11.5], swing: 0.5, tilt: [1.1, 1.9] },
    // Straight down on the open sketchpad.
    reading: { position: inTower([pad[0], pad[1] + 1.55, pad[2] - 0.1]), target: inTower([pad[0], pad[1], pad[2]]), fov: 42, reach: [0.7, 2.4], swing: 0.3, tilt: [0.03, 0.5] },
    mood: { skyGlow: '#ffb060', sun: '#ffc27c', dust: '#ffd68a' },
  },
  signpost: {
    name: 'The signpost',
    role: 'skills',
    short: 'Skills',
    view: { position: at(SITES.signpost, [0.6, knoll + 1.85, 10.8]), target: at(SITES.signpost, [SIGNPOST.at[0] - 1.5, knoll + 2.6, 0]), fov: 42, reach: [4, 30], swing: 0.7, tilt: [1.05, 1.62] },
    backdrop: { position: at(SITES.signpost, [1, knoll + 2.1, 11.5]), target: at(SITES.signpost, [SIGNPOST.at[0], knoll + 3.3, 0]), fov: 60, reach: [4, 30], swing: 0.7, tilt: [1.05, 1.7] },
    mood: { skyTop: '#4d9be8', skyHorizon: '#e4f2f6', skyGlow: '#fff0c8', water: '#7fb8d2', sun: '#fff0d8', mirror: 0.62, dust: '#ffffff' },
  },
  busstop: {
    name: 'The bus stop',
    role: 'contact',
    short: 'Write',
    // From out over the water, so the lantern and the telephone box have their reflections under them.
    view: { position: at(SITES.busstop, [1.6, 1.75, 12]), target: at(SITES.busstop, [0.5, STOP.ground + 1.5, -1.8]), fov: 40, reach: [5, 28], swing: 0.9, tilt: [1.15, 1.62] },
    backdrop: { position: at(SITES.busstop, [1, 1.9, 13.5]), target: at(SITES.busstop, [1, STOP.ground + 2.3, -1.8]), fov: 60, reach: [5, 28], swing: 0.9, tilt: [1.15, 1.7] },
    mood: { night: true },
  },
}

/**
 * The window seat for a destination: on the bench across the aisle from the
 * bench it is pinned over, looking straight out of that window.
 */
export function seatShot(destination: Destination): Shot {
  const x = CAR.benches[DESTINATIONS.indexOf(destination)]
  return { position: [x, DECK + 1.06, 0.74], target: [x, DECK + 1.16, -1.34], fov: 54, onTrain: true, reach: [0.6, 2.4], swing: 0.3, tilt: [1.2, 1.8] }
}

/** The stops on the route map, in order. */
export const ROUTE: readonly PlaceId[] = ['cabin', ...DESTINATIONS]

export const isPlaceId = (value: string): value is PlaceId => value in PLACES
export const isDestination = (place: PlaceId): place is Destination => place !== 'halt' && place !== 'cabin'

/** Where the camera turns to look when a plaque of the signpost is chosen: a little way down the line it points along. */
export function plaqueGaze(index: number): readonly [number, number, number] {
  const { side, yaw } = PLAQUES[index]
  return [side * Math.cos(yaw) * 3.4, 0.4, -side * Math.sin(yaw) * 3.4 - 1.5]
}
