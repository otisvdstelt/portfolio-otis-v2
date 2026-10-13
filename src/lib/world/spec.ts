// Measurements the modeller and the app both need: where things stand, where
// lettering goes on the baked models, where light comes from. Kept free of
// geometry code so the app can read it without bundling the kit.
import { DECK } from './terrain.ts'

export type Triple = readonly [number, number, number]

/** One railcar. It is built along x, centred, with its floor at the level of the halt's deck. */
export const CAR = {
  length: 8.4,
  /** Centre-to-centre distance between coupled cars. */
  pitch: 8.9,
  halfWidth: 1.35,
  floor: DECK,
  sill: 1.85,
  lintel: 2.95,
  ceiling: 3.32,
  /** Where the four pairs of facing benches stand along the car: one destination is reached from each. */
  benches: [-2.76, -0.92, 0.92, 2.76],
  benchZ: -0.98,
  /** Where a destination's card is pinned: on the window post above its bench. */
  tag: [0, 2.3, -0.3] as Triple,
  lamps: [-2.6, 0, 2.6],
}

/**
 * The floating halt, at x = 0. It is modelled north of the rails and flipped
 * to the south, so the z values here are the modeller's; `signFace` is where
 * the name board's lettering goes once flipped.
 */
export const HALT = {
  halfLength: 15.5,
  sign: { at: [-12.8, DECK + 2.25, -5.3] as Triple, width: 3.3, height: 0.62 },
  signFace: [-12.8, DECK + 2.25, 5.36] as Triple,
  lamp: [7.2, DECK + 3.1, -5.2] as Triple,
}

/** A project's book. Closed, it lies flat on its back board with its spine along its west edge; it opens in the middle. */
export const BOOK = { width: 0.42, height: 0.56, thickness: 0.09, board: 0.012 }

/**
 * The library: the middle car of the train, with a great bookcase where its
 * north benches were. Measured from the middle of the car, heights from its floor.
 */
export const LIBRARY = {
  /** The bookcase stands against the north wall, across the two middle windows. */
  case: { west: -1.38, east: 1.38, back: -1.27, front: -0.98, top: 2.0 },
  /** The two ordinary shelves, below and above the ledge. */
  shelves: [0.53, 1.47] as const,
  /** The ledge the four projects stand on, face out. */
  ledge: 0.86,
  /** Where each one stands along it, and how far it leans back against the case. */
  berths: [-0.84, -0.28, 0.28, 0.84],
  lean: 0.2,
  /** Where the middle of an open book comes to rest to be read, how far it is tipped back toward the reader, and how far away the reader's eye is. */
  lectern: [0.1, 1.36, -0.12] as Triple,
  tip: 0.42,
  arm: 0.92,
}

/**
 * The clocktower's room, measured from the middle of its floor. It is an
 * octagon; the wall at +z is the clock face, and the whole room is turned so
 * that wall faces the low sun.
 */
export const TOWER = {
  apothem: 9,
  height: 14,
  /** Turn of the room about its axis, so that +z points at the sun's bearing. */
  yaw: -0.6435,
  clock: { y: 6.5, radius: 3.3 },
  /** The drafting table's top, and the sketchpad lying on it. */
  table: [0, 1.12, -0.6] as Triple,
  pad: [-0.35, 1.2, -0.75] as Triple,
  pendulum: [0, 9.6, 7.4] as Triple,
  gears: [
    [0, 6.5, 8.35, 1.5] as const,
    [1.75, 5.2, 8.25, 0.8] as const,
    [-1.5, 7.9, 8.25, 0.65] as const,
  ],
  lamp: [2.6, 2.3, -2.2] as Triple,
}

/** The four plaques of the coastal signpost, top to bottom. `side` is the way each points as you face the post from inland. */
export const PLAQUES = [
  { height: 3.3, side: -1, yaw: -0.38 },
  { height: 2.76, side: 1, yaw: 0.34 },
  { height: 2.22, side: -1, yaw: -0.12 },
  { height: 1.68, side: 1, yaw: 0.1 },
] as const

export const PLAQUE = { length: 1.9, height: 0.44, thickness: 0.08, inset: 0.14 }

/** The signpost stands on a knoll, a little east of the middle of the shore. */
export const SIGNPOST = { at: [2, 0] as readonly [number, number] }

/** The bus stop, measured from its site at the water's edge. The shelter opens south (+z), on to the sea. */
export const STOP = {
  ground: 0.42,
  shelter: [0, -2.4] as readonly [number, number],
  lantern: [0.1, 2.42, -1.15] as Triple,
  booth: [3.9, -1.7] as readonly [number, number],
  /** The receiver's rest on its hook, relative to the booth. */
  hook: [-0.24, 1.52, -0.24] as Triple,
  boothSign: [0, 2.62, 0.52] as Triple,
  pole: [-3.7, 0.3] as readonly [number, number],
  /** Heights of the four planks nailed to the pole, top to bottom. */
  planks: [2.08, 1.72, 1.36, 1.0],
  plank: { width: 1.5, height: 0.3 },
  /** The timetable board on the shelter's back wall. */
  notice: [-1.3, 1.75, -3.27] as Triple,
}
