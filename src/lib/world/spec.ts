// Measurements the modeller and the app both need: where lettering goes on
// the baked models, which way things face, where smoke and light come from.
// Kept free of geometry code so the app can read it without bundling the kit.

export type Triple = readonly [number, number, number]

/** The four boards of the signpost on the home hill, top to bottom. `side` is the way the board points as you face it. */
export const SIGN_BOARDS = [
  { place: 'windmills', height: 3.0, side: 1, yaw: 0.34 },
  { place: 'greenhouse', height: 2.48, side: -1, yaw: -0.3 },
  { place: 'station', height: 1.96, side: 1, yaw: 0.14 },
  { place: 'postbox', height: 1.44, side: -1, yaw: -0.1 },
] as const

export const SIGN_BOARD = { length: 1.75, height: 0.42, thickness: 0.08, inset: 0.14 }

/** The greenhouse is turned to face the path that arrives from the south-east. */
export const GREENHOUSE = {
  yaw: Math.PI / 4,
  /** How far the glass door swings when the journal is open, in radians. */
  swing: -1.85,
  lantern: [0, 3.05, -0.2] as Triple,
}

/** Station furniture, relative to the middle of the platform at ground level. The rails run along +3.4. */
export const STATION = {
  deck: 1.1,
  trackOffset: 3.4,
  sign: { at: [1.12, 3.0, 7] as Triple, width: 2.3, height: 0.52 },
  lamps: [
    [-1.4, 4.05, -9] as Triple,
    [0.1, 3.3, 7] as Triple,
  ],
}

/** The train, relative to its site on the rails. The engine heads south (+z); the cars follow behind it. */
export const TRAIN = {
  loco: 8.3,
  cars: [1.7, -4.3, -10.3],
  /** Top of the engine's chimney, relative to the engine. */
  chimney: [0, 3.95, 2.45] as Triple,
  /** Where a car's name tag floats, relative to the car. */
  tag: [0, 3.9, 0] as Triple,
}

export const WINDMILL = {
  hub: [0, 3.62, 1.1] as Triple,
  top: 4.5,
}

/** The postbox faces the campfire bench, a quarter turn east of south. */
export const POSTBOX = {
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
  /** The postbox is built a size larger than life, so its charms can be read from the bench. */
  scale: 1.25,
}
