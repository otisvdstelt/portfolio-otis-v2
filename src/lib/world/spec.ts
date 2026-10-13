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

/** Somebody's own corner of the middle car, where the north benches were. Measured from the middle of the car, heights from its floor. */
export const COMPARTMENT = {
  /** How far from the middle the front edge of each of the two facing seats is. */
  seat: 0.72,
  /** The table under the window post: half its length, the height of its top, its front edge. */
  table: { half: 0.6, top: 0.75, front: -0.7 },
  /** The journal lies open on the table: the middle of its spread, and its size beside a book of the library. */
  journal: [0, 0.75, -0.985] as Triple,
  scale: 0.66,
  mug: [0.47, 0.75, -1.08] as Triple,
  /** The tickets tucked along the bottom of the east window: the first, the step to the next, their height. */
  tickets: { from: 0.36, step: 0.19, y: 0.865 },
  lamp: [0, 1.5, -0.85] as Triple,
}

/** The travelling post office, where the north benches were. Measured from the middle of the car, heights from its floor. */
export const MAIL = {
  west: -1.38,
  east: 1.38,
  /** The desk's top, and its front edge. */
  desk: 0.82,
  front: -0.68,
  /** The pigeonholes stand on a shelf over the desk and run up to the luggage rack. */
  shelf: 1.06,
  top: 2.0,
  rows: 3,
  columns: 6,
  depth: 0.3,
  /** The four with a name on them, as [column, row]. */
  named: [
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
  ] as const,
  /** The brass slot in the board behind the desk: where along it, and how high. */
  slot: [0.5, 1.0] as const,
  /** The card on the desk. */
  card: [0, 0.824, -0.93] as Triple,
  lamp: [-1.05, 1.0, -1.0] as Triple,
}

/** The driver's cab, at the front of the front car. Measured from the middle of that car, heights from its floor. */
export const CAB = {
  back: 1.4,
  front: 4.2,
  /** The windows run from the sill to the head. */
  sill: 1.22,
  head: 2.0,
  /** The near edge of the desk. */
  desk: 3.45,
  /** The face of the board the dials are set in, and the height of their middles. */
  dials: [3.98, 1.06] as const,
  /** Where the levers stand on the desk, and the height they turn about. */
  levers: [3.66, 0.92] as const,
  /** The name plates, on the near edge of the desk. */
  plate: [3.4, 0.9] as const,
  /** Where the four dials, levers and plates are across the cab. */
  across: [-0.78, -0.26, 0.26, 0.78],
  /** The destination board over the windscreen. */
  board: { y: 2.14, height: 0.26, width: 2.2 },
  mug: [3.6, 0.9, 1.0] as Triple,
}
