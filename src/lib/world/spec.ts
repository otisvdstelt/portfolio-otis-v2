// Measurements the modeller and the app both need: where things stand, where
// lettering goes on the baked models, where light and steam come from.
// Kept free of geometry code so the app can read it without bundling the kit.
import { CLEARING, DECK, TOWN_X } from './terrain.ts'

export type Triple = readonly [number, number, number]

/** One railcar. It is built along x, centred, with its floor at the level of every platform. */
export const CAR = {
  length: 8.4,
  /** Centre-to-centre distance between coupled cars. */
  pitch: 8.9,
  halfWidth: 1.35,
  floor: DECK,
  sill: 1.85,
  lintel: 2.95,
  ceiling: 3.32,
  /** Where the four benches of the north side stand along the car: one project sits on each. */
  benches: [-2.76, -0.92, 0.92, 2.76],
  benchZ: -0.98,
  /** Where a bench's ticket is pinned: on the window post above it. */
  tag: [0, 2.05, -0.2] as Triple,
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

/** The town's quay runs along the north side of the rails. */
export const QUAY = {
  sign: { at: [TOWN_X - 16, DECK + 2.6, -5.4] as Triple, width: 3.6, height: 0.66 },
  lamps: [
    [TOWN_X - 22, DECK + 3.3, -5.3] as Triple,
    [TOWN_X + 20, DECK + 3.3, -5.3] as Triple,
  ],
  lighthouse: [TOWN_X - 36, DECK, -7] as Triple,
}

/**
 * The bakery, measured from the middle of its shop floor. The shop front
 * faces south (+z) over the quay to the sea. The attic is the same house's
 * roof space.
 */
export const BAKERY = {
  at: [TOWN_X, DECK, -13.6] as Triple,
  halfWidth: 5.2,
  halfDepth: 4.2,
  height: 3.3,
  counter: 1.0,
  book: [-0.75, 1.0, -0.28] as Triple,
  mug: [0.62, 1.0, -0.12] as Triple,
  chalkboard: { at: [3.25, 2.12, -4.02] as Triple, width: 2.3, height: 1.3 },
  /** The name board, on the front of the house above the awning. */
  sign: { at: [-2.4, 4.08, 4.5] as Triple, width: 3.6, height: 0.66 },
  lamp: [-0.4, 2.55, 0.4] as Triple,
  /** The shop window the afternoon sun comes through: x from, x to, y from, y to. */
  window: [-4.3, -0.5, 0.85, 2.75] as const,
  oven: [4.3, 0.75, -1.6] as Triple,
  /** Where the chimney stands, as [x, z]: against the east wall, at the back of the oven. */
  chimney: [4.72, -2.6] as const,
}

/** The attic, measured from the middle of its own floor, which is the bakery's ceiling. */
export const ATTIC = {
  floor: BAKERY.height + 0.2,
  /** Height of the low walls the roof springs from, and how far the ridge rises above them. */
  knee: 1.1,
  rise: 3.3,
  lantern: [0.4, 3.05, -0.4] as Triple,
  /**
   * The five clusters of artefacts, one per kind of skill, in the order of
   * SKILLS in src/content/site.ts. `at` is where the cluster rests, `tag`
   * where its hand-written label floats.
   */
  clusters: [
    { at: [-2.1, 1.02, -3.45] as Triple, tag: [-2.1, 2.0, -3.3] as Triple },
    { at: [1.7, 1.18, -1.5] as Triple, tag: [1.7, 2.75, -1.5] as Triple },
    { at: [-3.5, 0, 0.1] as Triple, tag: [-3.5, 1.75, 0.1] as Triple },
    { at: [-0.4, 2.55, -1.9] as Triple, tag: [-0.4, 3.3, -1.9] as Triple },
    { at: [4.35, 1.0, -0.3] as Triple, tag: [4.1, 2.45, -0.3] as Triple },
  ],
}

/** The postbox faces the campfire bench, a quarter turn east of south. */
export const POSTBOX = {
  at: [CLEARING.x - 1.6, CLEARING.z - 1.4] as readonly [number, number],
  yaw: 0.55,
  slot: [0, 1.98, 0.32] as Triple,
  wing: [0.36, 1.98, -0.05] as Triple,
  crossbar: 1.22,
  charms: [
    { x: -1.04, drop: 0.3 },
    { x: -0.43, drop: 0.46 },
    { x: 0.43, drop: 0.26 },
    { x: 1.04, drop: 0.4 },
  ],
  charm: { width: 0.56, height: 0.32 },
  /** Built a size larger than life, so its charms can be read from the bench. */
  scale: 1.25,
}

export const CAMPFIRE = { at: [CLEARING.x + 1.4, CLEARING.z + 1.2] as readonly [number, number] }
