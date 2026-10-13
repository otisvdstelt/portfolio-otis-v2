import { ATTIC, BAKERY, CAMPFIRE, POSTBOX } from './world/spec'
import { DECK, heightAt } from './world/terrain'

/** The five scenes of the world, in the order the railway reaches them. */
export type PlaceId = 'halt' | 'train' | 'bakery' | 'attic' | 'campfire'

/** The thing under the pointer, or picked from a list: a bench in the train, a cluster in the attic, a charm on the postbox. */
export interface Hot {
  kind: 'bench' | 'cluster' | 'charm'
  index: number
}

type Triple = readonly [number, number, number]

/** A camera position and the point it looks at. */
export interface Shot {
  position: Triple
  target: Triple
  /** Vertical field of view in degrees. Interiors want a wider lens than the open sea. */
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
  /** A closer framing for when the place's panel is open: the guestbook seen from above. */
  reading?: Shot
  /** It is always night here, whatever the hour. */
  night?: boolean
}

const inBakery = ([x, y, z]: Triple): Triple => [BAKERY.at[0] + x, BAKERY.at[1] + y, BAKERY.at[2] + z]
const inAttic = ([x, y, z]: Triple): Triple => inBakery([x, y + ATTIC.floor, z])
const onHill = (x: number, z: number, lift: number): Triple => [x, heightAt(x, z) + lift, z]

export const PLACES: Record<PlaceId, Place> = {
  halt: {
    name: 'Stillwater Halt',
    role: 'the start',
    short: 'Home',
    // Low over the water and side-on, so the train sits on the horizon and three quarters of the picture is sky.
    view: { position: [-4, 2.3, 45], target: [1.5, 8.8, 0], fov: 40, reach: [14, 80], tilt: [1.0, 1.72] },
    backdrop: { position: [-1, 2.4, 40], target: [0.5, 11.5, 0], fov: 58, reach: [14, 70], tilt: [1.0, 1.8] },
  },
  train: {
    name: 'The train',
    role: 'projects',
    short: 'Work',
    // Standing in the aisle with your back to the sea-side windows, looking at the row of benches.
    view: { position: [-3.45, DECK + 1.3, 0.92], target: [0.2, DECK + 1.05, -1.32], fov: 60, onTrain: true, reach: [0.6, 4.4], swing: 0.5, tilt: [1.0, 1.95] },
    backdrop: { position: [-0.5, DECK + 1.32, 1.05], target: [0.35, DECK + 1.12, -1.3], fov: 74, onTrain: true, reach: [0.6, 2.9], swing: 1.0, tilt: [1.0, 1.95] },
  },
  bakery: {
    name: 'The bakery',
    role: 'about me',
    short: 'About',
    view: { position: inBakery([0.6, 1.72, 3.35]), target: inBakery([-0.45, 1.42, -3.2]), fov: 52, reach: [1, 7.2], swing: 0.62, tilt: [1.05, 1.75] },
    backdrop: { position: inBakery([-0.3, 1.8, 3.5]), target: inBakery([-0.7, 1.75, -3.2]), fov: 70, reach: [1, 7.2], swing: 0.62, tilt: [1.05, 1.75] },
    reading: { position: inBakery([BAKERY.book[0], 2.02, BAKERY.book[2] + 0.62]), target: inBakery([BAKERY.book[0], BAKERY.book[1], BAKERY.book[2] + 0.04]), fov: 44, reach: [0.6, 2.4], swing: 0.5, tilt: [0.15, 1.2] },
  },
  attic: {
    name: 'The attic',
    role: 'skills',
    short: 'Skills',
    view: { position: inAttic([0.55, 1.72, 2.5]), target: inAttic([-0.25, 1.38, -2.9]), fov: 64, reach: [1, 5.8], swing: 0.55, tilt: [1.2, 1.72] },
    backdrop: { position: inAttic([0, 1.8, 2.5]), target: inAttic([-0.3, 1.7, -2.9]), fov: 76, reach: [1, 5.8], swing: 0.55, tilt: [1.2, 1.72] },
  },
  campfire: {
    name: 'The campfire',
    role: 'contact',
    short: 'Write',
    view: { position: onHill(POSTBOX.at[0] + 5.9, POSTBOX.at[1] + 7.5, 3.4), target: onHill(POSTBOX.at[0] + 0.8, POSTBOX.at[1] + 1, 1.05), fov: 42, reach: [3, 26], tilt: [0.7, 1.5] },
    backdrop: { position: onHill(POSTBOX.at[0] + 4.8, POSTBOX.at[1] + 8.4, 3.4), target: onHill(POSTBOX.at[0] + 0.6, POSTBOX.at[1] + 0.4, 2.2), fov: 58, reach: [3, 26], tilt: [0.7, 1.5] },
    night: true,
  },
}

/** The places in the order of the trail along the bottom of the page. */
export const TRAIL: readonly PlaceId[] = ['halt', 'train', 'bakery', 'attic', 'campfire']

export const isPlaceId = (value: string): value is PlaceId => value in PLACES

/** Where the campfire burns, for anything that needs to stand near it. */
export const FIRESIDE = onHill(CAMPFIRE.at[0], CAMPFIRE.at[1], 0)
