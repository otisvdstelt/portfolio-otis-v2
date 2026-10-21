import { CAR, CINEMA, COMPARTMENT, MAIL } from './world/spec'
import { DECK } from './world/terrain'

/** Everywhere the camera can be. The halt stands outside, the cabin is the hub */
export type PlaceId = 'halt' | 'cabin' | 'cinema' | 'compartment' | 'cab' | 'mail'
export type Destination = Exclude<PlaceId, 'halt' | 'cabin'>

/** The four destinations, in the order of their benches along the car */
export const DESTINATIONS: readonly Destination[] = ['cinema', 'compartment', 'cab', 'mail']

/** The thing under the pointer, or picked from a list */
export interface Hot {
  kind: 'seat' | 'tome' | 'ticket' | 'lever' | 'hole'
  index: number
}

type Triple = readonly [number, number, number]

/** A camera position and the point it looks at */
export interface Shot {
  position: Triple
  target: Triple
  /** Vertical field of view in degrees. Rooms want a wider lens than the open sea */
  fov: number
  /** Measured from the middle car of the train, and carried along with it */
  onTrain?: boolean
  /** How near and how far the camera may be pulled from its target */
  reach: readonly [number, number]
  /** How far the camera may swing round the target either way, in radians */
  swing?: number
  /** The steepest and shallowest the camera may look, as angles from overhead */
  tilt: readonly [number, number]
}

/** What a scene does to the hour. Anything left out stays as the golden hour has it */
export interface Mood {
  skyTop?: string
  skyHorizon?: string
  skyGlow?: string
  water?: string
  sun?: string
  /** How much of the sea is mirror and how much its own colour, 0 to 1 */
  mirror?: number
  /** 1 where the sea is shallow enough to see light moving on the bottom */
  shallow?: number
  /** The colour of what drifts in the air */
  dust?: string
  /** It is always night here, whatever the hour */
  night?: boolean
}

export interface Place {
  name: string
  /** What a visitor finds there, in plain words */
  role: string
  /** One word for the phone menu */
  short: string
  /** The framing on a wide screen, where the camera is also free to turn */
  view: Shot
  /** The fixed framing on a tall screen */
  backdrop: Shot
  /** A closer framing, a seat before the screen or a table seen from above */
  reading?: Shot
  mood: Mood
}

const seat = CINEMA.seat
const journal = COMPARTMENT.journal
const card = MAIL.card
/** The cab is in the front car, one car ahead of the middle of the train */
const ahead = CAR.pitch
/** Straight down on something on a table, its far edge at the top of the picture */
const over = ([x, y, z]: Triple, height: number): Pick<Shot, 'position' | 'target'> => ({ position: [x, DECK + y + height, z + 0.02], target: [x, DECK + y, z] })

export const PLACES: Record<PlaceId, Place> = {
  halt: {
    name: 'Stillwater Halt',
    role: 'the platform',
    short: 'Halt',
    // Low over the water and side on, so the train sits on the horizon under a wide sky
    view: { position: [-4, 2.3, 45], target: [1.5, 8.8, 0], fov: 40, reach: [14, 80], tilt: [1.0, 1.72] },
    backdrop: { position: [-1, 2.4, 40], target: [0.5, 11.5, 0], fov: 58, reach: [14, 70], tilt: [1.0, 1.8] },
    mood: {},
  },
  cabin: {
    name: 'The train',
    role: 'home',
    short: 'Home',
    // At the end of the aisle, with the target close, so turning the view turns the head
    view: { position: [-3.5, DECK + 1.32, 0.22], target: [-2.82, DECK + 1.27, 0.07], fov: 62, onTrain: true, reach: [0.4, 1.3], tilt: [1.0, 2.0] },
    backdrop: { position: [-1.1, DECK + 1.3, 0.95], target: [0.4, DECK + 1.14, -1.3], fov: 74, onTrain: true, reach: [0.6, 3], swing: 1, tilt: [1.0, 1.95] },
    mood: {},
  },
  cinema: {
    name: 'The picture car',
    role: 'projects',
    short: 'Work',
    // Down the car, the tins near at hand, the lantern in the middle, the screen at the end
    view: { position: [-3.45, DECK + 1.4, 0.32], target: [0.5, DECK + 1.24, -0.28], fov: 62, onTrain: true, reach: [1.6, 4.6], swing: 0.45, tilt: [1.15, 1.8] },
    backdrop: { position: [-3.2, DECK + 1.4, 0.2], target: [0.5, DECK + 1.3, -0.5], fov: 80, onTrain: true, reach: [1.6, 4.6], swing: 0.4, tilt: [1.15, 1.8] },
    // In a seat in front of the lantern, square on to the screen
    reading: { position: [seat[0], DECK + seat[1], seat[2]], target: [CINEMA.screen.x, DECK + (CINEMA.screen.top + CINEMA.screen.bottom) / 2, CINEMA.screen.z - 0.04], fov: 40, onTrain: true, reach: [1.7, 2.7], swing: 0.22, tilt: [1.4, 1.75] },
    mood: {},
  },
  compartment: {
    name: 'The compartment',
    role: 'about me',
    short: 'About',
    // From the aisle, a seat either side and the table between them
    view: { position: [-0.3, DECK + 1.42, 1.02], target: [0.06, DECK + 1.0, -1.2], fov: 64, onTrain: true, reach: [1.4, 2.6], swing: 0.45, tilt: [1.0, 1.75] },
    backdrop: { position: [0, DECK + 1.42, 1.05], target: [0, DECK + 1.1, -1.2], fov: 78, onTrain: true, reach: [1.4, 2.6], swing: 0.4, tilt: [1.0, 1.8] },
    // Straight down on the open journal
    reading: { ...over(journal, 0.68), fov: 40, onTrain: true, reach: [0.45, 0.9], swing: 0.2, tilt: [0.02, 0.4] },
    mood: {},
  },
  cab: {
    name: "The driver's cab",
    role: 'skills',
    short: 'Skills',
    // Behind the stool, with the line running away ahead through the middle pane
    view: { position: [ahead + 1.9, DECK + 1.52, -0.02], target: [ahead + 4.3, DECK + 1.48, -0.3], fov: 66, onTrain: true, reach: [1.2, 2.7], swing: 0.5, tilt: [1.15, 1.8] },
    backdrop: { position: [ahead + 1.75, DECK + 1.52, 0], target: [ahead + 4.3, DECK + 1.45, 0], fov: 82, onTrain: true, reach: [1.2, 2.7], swing: 0.4, tilt: [1.15, 1.8] },
    mood: {},
  },
  mail: {
    name: 'The mail car',
    role: 'contact',
    short: 'Write',
    // In the aisle, turned toward the sorting frame
    view: { position: [-1.35, DECK + 1.46, 0.95], target: [-0.05, DECK + 1.24, -1.2], fov: 60, onTrain: true, reach: [1.5, 3.1], swing: 0.5, tilt: [1.1, 1.8] },
    backdrop: { position: [0.1, DECK + 1.4, 1.05], target: [0, DECK + 1.3, -1.2], fov: 76, onTrain: true, reach: [1.5, 3.0], swing: 0.4, tilt: [1.1, 1.8] },
    // Straight down on the card on the desk
    reading: { ...over(card, 0.62), fov: 40, onTrain: true, reach: [0.4, 0.9], swing: 0.2, tilt: [0.02, 0.4] },
    mood: {},
  },
}

/** The window seat for a destination, across the aisle from its own bench */
export function seatShot(destination: Destination): Shot {
  const x = CAR.benches[DESTINATIONS.indexOf(destination)]
  return { position: [x, DECK + 1.06, 0.74], target: [x, DECK + 1.16, -1.34], fov: 54, onTrain: true, reach: [0.6, 2.4], swing: 0.3, tilt: [1.2, 1.8] }
}

/** The stops on the route map, in order */
export const ROUTE: readonly PlaceId[] = ['cabin', ...DESTINATIONS]

export const isPlaceId = (value: string): value is PlaceId => value in PLACES
export const isDestination = (place: PlaceId): place is Destination => place !== 'halt' && place !== 'cabin'
