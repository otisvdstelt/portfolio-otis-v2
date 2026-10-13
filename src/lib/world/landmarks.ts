// The five places of the valley, built from the kit. Each returns named parts
// in its own local space: origin on the ground, +y up, +z the side that faces
// the visitor. The app stands them on the terrain and animates the parts with pivots.
import type { BufferGeometry } from 'three'
import { blob, box, cone, cyl, hung, limb, part, put, roughen, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { GREENHOUSE, POSTBOX, SIGN_BOARD, SIGN_BOARDS, STATION, TRAIN, WINDMILL } from './spec.ts'
import { seeded, TRACK_NORTH, TRACK_SOUTH } from './terrain.ts'

const QUARTER = Math.PI / 2

// ------------------------------------------------------------ signpost

/** The hand-carved signpost on the home hill: a leaning post and four boards. */
export function buildSignpost(): Part[] {
  const post = [
    roughen(cyl(0.13, 0.19, 3.5, [PAINT.woodDark, PAINT.wood], { at: [0, -0.2, 0], rot: [0.02, 0, -0.035] }, 7), 0.015),
    cone(0.17, 0.26, PAINT.woodLight, { at: [-0.11, 3.26, 0.06] }, 7),
    blob(0.3, [PAINT.stoneDark, PAINT.stoneLight], { at: [0.26, 0.05, 0.2], scale: [1.2, 0.6, 1] }, 0.3, 4, 1),
    blob(0.22, [PAINT.stoneDark, PAINT.stone], { at: [-0.28, 0.03, -0.1], scale: [1, 0.6, 1.2] }, 0.3, 5, 1),
  ]
  const { length, height, thickness, inset } = SIGN_BOARD
  const boards = SIGN_BOARDS.map(({ place, height: y, side, yaw }, i) => {
    const wood = i % 2 ? PAINT.woodPale : PAINT.woodLight
    const pieces = [
      box(length, height, thickness, [PAINT.wood, wood], { at: [side * (inset + length / 2), -height / 2, 0] }),
      // The pointed end: a square post turned on its corner.
      box(height / Math.SQRT2, height / Math.SQRT2, thickness, wood, { at: [side * (inset + length) + height / 4, -height / 4, 0], rot: [0, 0, QUARTER / 2] }),
      cyl(0.025, 0.025, 0.03, PAINT.iron, { at: [side * 0.3, -0.1, thickness / 2], rot: [QUARTER, 0, 0] }, 6),
      cyl(0.025, 0.025, 0.03, PAINT.iron, { at: [side * 0.3, 0.1, thickness / 2], rot: [QUARTER, 0, 0] }, 6),
    ]
    for (const piece of pieces) put(roughen(piece, 0.012, i), { rot: [0, yaw, side * 0.03] })
    return hung(`Signpost_${place}`, pieces, [-0.035 * y, y, 0])
  })
  return [part('Signpost_Post', post), ...boards]
}

// ------------------------------------------------------------ oak

/** The giant oak: a trunk as wide as a cottage, roots like buttresses, a canopy that shades the whole mound. */
export function buildOak(): Part[] {
  const bark = [PAINT.bark, PAINT.barkLight] as const
  const trunk: BufferGeometry[] = [limb([0, -0.8, 0], [0.3, 5.2, 0.2], 2.6, 1.75, bark, 11), limb([0.3, 5, 0.2], [-0.2, 10, 0], 1.75, 1.2, bark, 11)]

  // Roots spread like fingers; two of them hold the greenhouse between them.
  const roots = [0.08, 1.5, 2.3, 3.05, 3.85, 4.65, 5.5]
  roots.forEach((angle, i) => {
    const reach = 5.2 + (i % 3) * 0.9
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    trunk.push(limb([c * 1.3, 2.6, s * 1.3], [c * reach * 0.6, 0.5, s * reach * 0.6], 1.05, 0.7, bark, 8))
    trunk.push(limb([c * reach * 0.58, 0.62, s * reach * 0.58], [c * reach, -0.6, s * reach], 0.7, 0.24, bark, 8))
  })

  const random = seeded(404)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.4
    const out = 5 + random() * 2
    trunk.push(limb([Math.cos(angle) * 0.6, 8.4 + random(), Math.sin(angle) * 0.6], [Math.cos(angle) * out, 12 + random() * 1.5, Math.sin(angle) * out], 0.75, 0.3, bark, 7))
  }
  // A knot, and moss creeping up the shaded side.
  trunk.push(blob(0.5, [PAINT.woodDark, PAINT.bark], { at: [1.5, 4.2, 1.5], scale: [1, 1.2, 0.5] }, 0.2, 2, 1))
  trunk.push(blob(1.1, [PAINT.mossDeep, PAINT.moss], { at: [-1.9, 1.6, 1.1], scale: [0.5, 1.4, 1] }, 0.3, 3, 1))
  trunk.push(blob(0.8, [PAINT.mossDeep, PAINT.clover], { at: [1.2, 1.1, -2.2], scale: [1, 1, 0.5] }, 0.3, 6, 1))

  const canopy: BufferGeometry[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + random() * 0.3
    const out = 6.4 + random() * 1.4
    canopy.push(blob(3.7 + random() * 0.9, [PAINT.leafDeep, PAINT.leaf], { at: [Math.cos(angle) * out, 12.4 + random() * 1.6, Math.sin(angle) * out], scale: [1, 0.82, 1] }, 0.2, i))
  }
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.5
    canopy.push(blob(4 + random() * 0.6, [PAINT.leaf, PAINT.leafLight], { at: [Math.cos(angle) * 3.4, 15.8 + random(), Math.sin(angle) * 3.4], scale: [1, 0.85, 1] }, 0.2, 20 + i))
  }
  canopy.push(blob(3.9, [PAINT.leaf, PAINT.leafGold], { at: [0.3, 18.4, 0], scale: [1.1, 0.8, 1.1] }, 0.2, 40))

  return [part('Oak_Trunk', trunk), part('Oak_Canopy', canopy, 'paint', [0, 9, 0])]
}

// ------------------------------------------------------------ greenhouse

/** A course of rough stone blocks between two points. */
function stoneCourse(from: readonly [number, number], to: readonly [number, number], y: number, height: number, seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const yaw = Math.atan2(-(to[1] - from[1]), to[0] - from[0])
  const pieces: BufferGeometry[] = []
  let along = 0
  while (along < length - 0.05) {
    const size = Math.min(length - along, 0.42 + random() * 0.4)
    const t = (along + size / 2) / length
    const tone = [PAINT.stone, PAINT.stoneLight, PAINT.stoneDark, PAINT.stoneLight][Math.floor(random() * 4)]
    pieces.push(
      roughen(box(size * 0.95, height * 0.94, 0.3 + random() * 0.05, tone, { at: [from[0] + (to[0] - from[0]) * t, y, from[1] + (to[1] - from[1]) * t], rot: [0, yaw, 0] }), 0.02, seed + pieces.length),
    )
    along += size
  }
  return pieces
}

/** The greenhouse: stone to the knee, glass above, a door that swings open on the journal. */
export function buildGreenhouse(): Part[] {
  const W = 2.2 // half width
  const D = 1.7 // half depth
  const WALL = 0.86
  const EAVE = 2.85
  const RIDGE = 3.75
  const DOOR = 0.62 // half the doorway
  const frame = [PAINT.oat, PAINT.cream] as const

  const stone: BufferGeometry[] = [box(W * 2 + 0.5, 0.14, D * 2 + 0.5, [PAINT.stoneDark, PAINT.stoneLight], { at: [0, -0.06, 0] })]
  const runs: (readonly [readonly [number, number], readonly [number, number]])[] = [
    [
      [-W, D],
      [-DOOR - 0.06, D],
    ],
    [
      [DOOR + 0.06, D],
      [W, D],
    ],
    [
      [W, D],
      [W, -D],
    ],
    [
      [W, -D],
      [-W, -D],
    ],
    [
      [-W, -D],
      [-W, D],
    ],
  ]
  runs.forEach(([from, to], i) => {
    stone.push(...stoneCourse(from, to, 0.04, WALL / 2, i * 2 + 1))
    stone.push(...stoneCourse(to, from, 0.04 + WALL / 2, WALL / 2, i * 2 + 2))
  })
  stone.push(roughen(box(1.5, 0.12, 0.7, PAINT.stoneLight, { at: [0, -0.04, D + 0.5] }), 0.03))

  // Timber frame, painted cream a long time ago.
  const timber: BufferGeometry[] = []
  const post = (x: number, z: number, from = WALL) => timber.push(box(0.1, EAVE - from, 0.1, frame, { at: [x, from, z] }))
  for (const x of [-W, W]) for (const z of [-D, D]) post(x, z)
  for (const x of [-DOOR - 0.06, DOOR + 0.06]) post(x, D, 0.04)
  for (const x of [-1.42, 1.42]) post(x, D)
  for (const z of [-0.57, 0.57]) for (const x of [-W, W]) post(x, z)
  timber.push(box(W * 2 + 0.16, 0.1, 0.12, frame, { at: [0, EAVE, D] }), box(W * 2 + 0.16, 0.1, 0.12, frame, { at: [0, EAVE, -D] }))
  timber.push(box(0.12, 0.1, D * 2, frame, { at: [-W, EAVE, 0] }), box(0.12, 0.1, D * 2, frame, { at: [W, EAVE, 0] }))
  timber.push(box(W * 2 + 0.5, 0.11, 0.11, frame, { at: [0, RIDGE, 0] }))
  for (const x of [-W, W]) {
    timber.push(box(0.09, RIDGE - EAVE, 0.09, frame, { at: [x, EAVE, 0] }))
    timber.push(cone(0.09, 0.3, PAINT.terracotta, { at: [x * 1.09, RIDGE + 0.05, 0] }, 6))
  }
  const slope = Math.hypot(D + 0.12, RIDGE - EAVE)
  const pitch = Math.atan2(RIDGE - EAVE, D + 0.12)
  for (let i = 0; i <= 6; i++) {
    const x = -W + (i / 6) * W * 2
    for (const side of [1, -1]) {
      timber.push(box(0.07, 0.07, slope, frame, { at: [x, (EAVE + RIDGE) / 2 + 0.02, (side * (D + 0.12)) / 2], rot: [side * pitch, 0, 0] }))
    }
  }

  const glass: BufferGeometry[] = []
  const pane = (width: number, height: number, depth: number, at: readonly [number, number, number], rot: readonly [number, number, number] = [0, 0, 0]) =>
    glass.push(box(width, height, depth, [PAINT.cornflower, PAINT.cream], { at, rot }))
  pane(W - DOOR - 0.1, EAVE - WALL, 0.03, [-(W + DOOR) / 2, WALL, D])
  pane(W - DOOR - 0.1, EAVE - WALL, 0.03, [(W + DOOR) / 2, WALL, D])
  pane(DOOR * 2, EAVE - 2.72, 0.03, [0, 2.72, D])
  pane(0.03, EAVE - WALL, D * 2, [-W, WALL, 0])
  pane(0.03, EAVE - WALL, D * 2, [W, WALL, 0])
  pane(W * 2, EAVE - WALL, 0.03, [0, WALL, -D])
  for (const side of [1, -1]) pane(W * 2 + 0.2, 0.03, slope, [0, (EAVE + RIDGE) / 2 - 0.03, (side * (D + 0.12)) / 2], [side * pitch, 0, 0])

  // Inside: a potting bench, a row of pots, and the journal waiting on the bench.
  const inside: BufferGeometry[] = [box(3.5, 0.08, 0.75, PAINT.woodLight, { at: [0, 0.82, -1.15] })]
  for (const x of [-1.6, 1.6]) inside.push(box(0.09, 0.82, 0.09, PAINT.wood, { at: [x, 0, -0.88] }), box(0.09, 0.82, 0.09, PAINT.wood, { at: [x, 0, -1.42] }))
  const pots: (readonly [number, number, number, number, string])[] = [
    [-1.35, 0.9, -1.15, 0.22, PAINT.leafLight],
    [-0.8, 0.9, -1.2, 0.16, PAINT.leaf],
    [0.95, 0.9, -1.15, 0.2, PAINT.leafGold],
    [1.45, 0.9, -1.2, 0.15, PAINT.clover],
    [-1.75, 0.02, 0.9, 0.3, PAINT.leaf],
    [1.72, 0.02, 0.7, 0.26, PAINT.leafLight],
  ]
  pots.forEach(([x, y, z, r, leaf], i) => {
    inside.push(cyl(r, r * 0.72, r * 1.5, [PAINT.terracottaDeep, PAINT.terracottaLight], { at: [x, y, z] }, 8))
    inside.push(blob(r * 1.5, [PAINT.leafDeep, leaf], { at: [x, y + r * 2.5, z], scale: [1, 1.25, 1] }, 0.3, 60 + i, 1))
  })
  inside.push(limb([-1.75, 0.5, 0.9], [-1.6, 2.3, 0.6], 0.04, 0.02, PAINT.leafDeep, 5), blob(0.5, [PAINT.leafDeep, PAINT.leafLight], { at: [-1.55, 2.3, 0.55], scale: [1, 0.7, 1] }, 0.35, 70, 1))
  inside.push(box(0.5, 0.07, 0.36, PAINT.terracottaDeep, { at: [0.05, 0.9, -1.12], rot: [0, 0.2, 0] }), box(0.44, 0.03, 0.32, PAINT.canvas, { at: [0.05, 0.965, -1.12], rot: [0, 0.2, 0] }))
  inside.push(box(0.36, 0.05, 0.26, PAINT.cornflowerDeep, { at: [-0.25, 0.9, -1.3], rot: [0, -0.5, 0] }))
  // Ivy climbing the corner nearest the oak.
  for (const [x, y, z, r] of [
    [-W - 0.05, 1.3, D - 0.2, 0.55],
    [-W, 2.3, D - 0.5, 0.48],
    [-W + 0.3, 3.05, D - 0.6, 0.42],
    [W + 0.05, 0.9, -D + 0.4, 0.5],
  ] as const) {
    inside.push(blob(r, [PAINT.leafDeep, PAINT.leaf], { at: [x, y, z], scale: [0.7, 1, 0.7] }, 0.35, Math.round(y * 10), 1))
  }

  const [lx, ly, lz] = GREENHOUSE.lantern
  const lantern = [box(0.2, 0.26, 0.2, PAINT.lamp, { at: [lx, ly, lz] })]
  timber.push(box(0.02, RIDGE - ly - 0.26, 0.02, PAINT.iron, { at: [lx, ly + 0.26, lz] }), box(0.26, 0.04, 0.26, PAINT.iron, { at: [lx, ly + 0.26, lz] }))

  // The door hangs on its left edge and opens outward.
  const hinge = [-DOOR, 0, D + 0.02] as const
  const doorTop = 2.7
  const door = [
    box(0.09, doorTop, 0.07, frame, { at: [-DOOR + 0.045, 0.04, D + 0.02] }),
    box(0.09, doorTop, 0.07, frame, { at: [DOOR - 0.045, 0.04, D + 0.02] }),
    box(DOOR * 2, 0.1, 0.07, frame, { at: [0, 0.04, D + 0.02] }),
    box(DOOR * 2, 0.09, 0.07, frame, { at: [0, 0.95, D + 0.02] }),
    box(DOOR * 2, 0.09, 0.07, frame, { at: [0, doorTop - 0.05, D + 0.02] }),
    box(DOOR * 2 - 0.16, 0.84, 0.04, [PAINT.oat, PAINT.cream], { at: [0, 0.13, D + 0.02] }),
    box(0.05, doorTop - 1.1, 0.05, frame, { at: [0, 1.02, D + 0.02] }),
    cyl(0.04, 0.04, 0.1, PAINT.brass, { at: [DOOR - 0.16, 1.05, D + 0.05], rot: [QUARTER, 0, 0] }, 7),
  ]
  const doorGlass = [box(DOOR * 2 - 0.16, doorTop - 1.1, 0.025, [PAINT.cornflower, PAINT.cream], { at: [0, 1.02, D + 0.02] })]

  return [
    part('Greenhouse_Stone', [...stone, ...timber, ...inside]),
    part('Greenhouse_Glass', glass, 'glass'),
    part('Greenhouse_Glow', lantern, 'glow'),
    part('Greenhouse_Door', door, 'paint', hinge),
    part('Greenhouse_DoorGlass', doorGlass, 'glass', hinge),
  ]
}

// ------------------------------------------------------------ station

/** The wooden halt: a plank platform on posts, a shelter with a terracotta roof, the rails and the tunnel they come from. */
export function buildStation(): Part[] {
  const deck = STATION.deck
  const track = STATION.trackOffset
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  const planks = [PAINT.woodLight, PAINT.woodPale, PAINT.wood, PAINT.woodPale]
  for (let i = 0; i < 8; i++) {
    pieces.push(roughen(box(0.47, 0.14, 21 - (i % 3) * 0.12, planks[i % 4], { at: [-1.75 + i * 0.5, deck - 0.14, 0] }), 0.014, i))
  }
  pieces.push(box(0.12, 0.2, 21, PAINT.cream, { at: [1.98, deck - 0.17, 0] }))
  for (const x of [-1.6, 1.6]) {
    pieces.push(box(0.2, 0.24, 21, PAINT.woodDark, { at: [x, deck - 0.38, 0] }))
    for (let z = -10; z <= 10; z += 4) pieces.push(cyl(0.13, 0.16, deck - 0.3, [PAINT.woodDark, PAINT.wood], { at: [x, -0.08, z] }, 7))
  }
  // Steps down to the footpath.
  for (let i = 0; i < 3; i++) pieces.push(roughen(box(0.52, deck - 0.28 * (i + 1), 1.7, [PAINT.wood, PAINT.woodLight], { at: [-2.28 - i * 0.5, -0.02, 1] }), 0.015, 20 + i))

  // The shelter.
  for (const x of [-1.72, 0.7]) for (const z of [4.6, 9.4]) pieces.push(box(0.14, 2.55, 0.14, [PAINT.wood, PAINT.woodLight], { at: [x, deck, z] }))
  pieces.push(box(0.08, 1.45, 4.7, [PAINT.wood, PAINT.woodPale], { at: [-1.76, deck, 7] }))
  pieces.push(box(0.5, 0.08, 3.1, PAINT.woodLight, { at: [-1.34, deck + 0.46, 7] }))
  for (const z of [5.7, 8.3]) pieces.push(box(0.4, 0.46, 0.08, PAINT.wood, { at: [-1.34, deck, z] }))
  const ridge = deck + 3.2
  for (const side of [1, -1]) {
    pieces.push(roughen(box(1.9, 0.11, 5.8, [PAINT.terracottaDeep, PAINT.terracotta], { at: [-0.5 + side * 0.86, ridge - 0.34, 7], rot: [0, 0, -side * 0.37] }), 0.02, 30 + side))
  }
  pieces.push(box(0.16, 0.12, 5.9, PAINT.terracottaLight, { at: [-0.5, ridge - 0.02, 7] }))
  pieces.push(box(2.4, 0.1, 0.1, PAINT.wood, { at: [-0.5, deck + 2.55, 4.6] }), box(2.4, 0.1, 0.1, PAINT.wood, { at: [-0.5, deck + 2.55, 9.4] }))

  // The name board, hung from the eave where the train can read it.
  const sign = STATION.sign
  pieces.push(roughen(box(0.07, sign.height, sign.width, [PAINT.oat, PAINT.cream], { at: [sign.at[0] - 0.05, sign.at[1] - sign.height / 2, sign.at[2]] }), 0.01, 40))
  for (const z of [-0.9, 0.9]) pieces.push(box(0.02, 0.4, 0.02, PAINT.iron, { at: [sign.at[0] - 0.05, sign.at[1] + sign.height / 2, sign.at[2] + z] }))
  pieces.push(box(1.0, 0.07, 0.07, PAINT.wood, { at: [0.9, sign.at[1] + sign.height / 2 + 0.4, 7] }))

  // Lamps, luggage, a flower box.
  const [north, eave] = STATION.lamps
  pieces.push(cyl(0.06, 0.09, north[1] - deck - 0.2, PAINT.iron, { at: [north[0], deck, north[2]] }, 7), box(0.34, 0.05, 0.34, PAINT.iron, { at: [north[0], north[1] + 0.17, north[2]] }), cone(0.2, 0.2, PAINT.iron, { at: [north[0], north[1] + 0.2, north[2]] }, 6))
  glow.push(box(0.24, 0.34, 0.24, PAINT.lamp, { at: [north[0], north[1] - 0.18, north[2]] }), box(0.2, 0.26, 0.2, PAINT.lamp, { at: [eave[0], eave[1] - 0.13, eave[2]] }))
  pieces.push(box(0.26, 0.04, 0.26, PAINT.iron, { at: [eave[0], eave[1] + 0.13, eave[2]] }), box(0.02, 0.3, 0.02, PAINT.iron, { at: [eave[0], eave[1] + 0.15, eave[2]] }))
  pieces.push(roughen(box(0.95, 0.5, 0.58, [PAINT.terracottaDeep, PAINT.terracotta], { at: [0.1, deck, 3.1], rot: [0, 0.2, 0] }), 0.012, 50))
  pieces.push(box(0.99, 0.06, 0.1, PAINT.woodPale, { at: [0.1, deck + 0.22, 3.1], rot: [0, 0.2, 0] }), box(0.5, 0.34, 0.4, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [0.05, deck + 0.5, 3.12], rot: [0, -0.15, 0] }))
  pieces.push(cyl(0.16, 0.22, 0.5, [PAINT.stone, PAINT.stoneLight], { at: [0.95, deck, 2.4] }, 9), cyl(0.1, 0.16, 0.16, PAINT.stoneLight, { at: [0.95, deck + 0.5, 2.4] }, 9))
  pieces.push(box(0.34, 0.26, 2.2, [PAINT.wood, PAINT.woodLight], { at: [-1.5, deck, -3] }))
  for (let i = 0; i < 5; i++) {
    pieces.push(blob(0.2, [PAINT.leafDeep, [PAINT.terracottaLight, PAINT.cream, PAINT.cornflower, PAINT.gold, PAINT.cream][i]], { at: [-1.5, deck + 0.4, -3.85 + i * 0.43] }, 0.3, 80 + i, 1))
  }

  // The railway: two rails on sleepers, a buffer stop, and the tunnel through the northern hills.
  const north0 = TRACK_NORTH - 1 - 5 // local z, north end
  const south0 = TRACK_SOUTH - 5
  const span = south0 - north0
  for (const side of [1, -1]) pieces.push(box(0.09, 0.14, span, [PAINT.iron, PAINT.stoneDark], { at: [track + side * 0.52, 0.12, (north0 + south0) / 2] }))
  for (let z = north0 + 0.4; z < south0; z += 1.15) pieces.push(roughen(box(1.75, 0.12, 0.27, PAINT.woodDark, { at: [track, 0.02, z] }), 0.02, Math.round(z * 3)))
  for (const side of [1, -1]) pieces.push(box(0.16, 1.0, 0.16, PAINT.woodDark, { at: [track + side * 0.6, 0, south0 + 0.2], rot: [-0.25, 0, 0] }))
  pieces.push(box(1.7, 0.3, 0.2, PAINT.terracotta, { at: [track, 0.72, south0 + 0.02] }), box(0.5, 0.3, 0.21, PAINT.cream, { at: [track, 0.72, south0 + 0.02] }))

  const mouth = north0 + 0.5
  for (const side of [1, -1]) {
    pieces.push(roughen(box(0.8, 2.7, 1.3, [PAINT.stoneDark, PAINT.stone], { at: [track + side * 2.05, -0.1, mouth] }), 0.04, 60 + side))
    pieces.push(roughen(box(4.6, 6.4, 1, [PAINT.stoneDark, PAINT.stone], { at: [track + side * 4.6, -0.3, mouth - 0.3] }), 0.06, 64 + side))
  }
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * Math.PI
    pieces.push(roughen(box(0.78, 0.74, 1.3, i % 2 ? PAINT.stoneLight : PAINT.stone, { at: [track + Math.cos(angle) * 2.05, 2.55 + Math.sin(angle) * 2.05 - 0.37, mouth], rot: [0, 0, angle - QUARTER] }), 0.04, 70 + i))
  }
  pieces.push(box(6, 2.2, 1, [PAINT.stoneDark, PAINT.stone], { at: [track, 4.3, mouth - 0.3] }))
  pieces.push(box(3.6, 4.4, 0.4, PAINT.soot, { at: [track, 0, mouth - 0.5] }))

  return [part('Station_Platform', pieces), part('Station_Glow', glow, 'glow')]
}

// ------------------------------------------------------------ train

/** A wheel on the rails, its axle along x. `x` is the outer face. */
function wheel(x: number, z: number, radius: number, hub: string): BufferGeometry[] {
  const side = Math.sign(x)
  return [
    cyl(radius, radius, 0.12, PAINT.iron, { at: [x, 0.27 + radius, z], rot: [0, 0, side * QUARTER] }, 12),
    cyl(radius * 0.42, radius * 0.42, 0.05, hub, { at: [x + side * 0.03, 0.27 + radius, z], rot: [0, 0, side * QUARTER] }, 8),
  ]
}

function buildCar(body: readonly [string, string], roof: readonly [string, string]): { paint: BufferGeometry[]; glow: BufferGeometry[] } {
  const paint: BufferGeometry[] = []
  const glow: BufferGeometry[] = []
  for (const x of [0.66, -0.66]) for (const z of [-2.0, -1.3, 1.3, 2.0]) paint.push(...wheel(x, z, 0.36, body[1]))
  paint.push(box(2.0, 0.22, 5.3, PAINT.iron, { at: [0, 0.82, 0] }))
  paint.push(box(2.2, 0.8, 5.0, body, { at: [0, 1.04, 0] }))
  paint.push(box(2.14, 0.92, 4.96, [PAINT.oat, PAINT.cream], { at: [0, 1.84, 0] }))
  paint.push(box(2.22, 0.16, 5.02, body[1], { at: [0, 2.74, 0] }))
  for (const side of [1, -1]) {
    paint.push(box(0.08, 0.06, 4.8, PAINT.woodDark, { at: [side * 1.1, 1.84, 0] }))
    for (let i = 0; i < 4; i++) {
      const z = -1.74 + i * 1.16
      glow.push(box(0.05, 0.6, 0.78, PAINT.window, { at: [side * 1.08, 1.98, z] }))
      paint.push(box(0.07, 0.06, 0.86, body[1], { at: [side * 1.09, 2.58, z] }))
    }
    for (const z of [-2.38, 2.38]) paint.push(box(0.06, 0.92, 0.12, body[0], { at: [side * 1.08, 1.84, z] }))
  }
  // The roof is a flattened barrel, with a raised lantern strip along the top.
  paint.push(cyl(1.2, 1.2, 5.4, roof, { at: [0, 2.86, -2.7], rot: [QUARTER, 0, 0], scale: [1, 1, 0.34] }, 14))
  paint.push(box(0.9, 0.2, 4.5, roof[1], { at: [0, 3.2, 0] }))
  glow.push(box(0.92, 0.09, 4.2, PAINT.window, { at: [0, 3.24, 0] }))
  paint.push(box(1.0, 0.06, 4.7, roof[0], { at: [0, 3.39, 0] }))
  for (const z of [-2.85, 2.85]) paint.push(box(0.22, 0.14, 0.5, PAINT.iron, { at: [0, 0.74, z] }))
  return { paint, glow }
}

function buildLoco(): { paint: BufferGeometry[]; glow: BufferGeometry[] } {
  const green = [PAINT.mossDeep, PAINT.moss] as const
  const paint: BufferGeometry[] = []
  const glow: BufferGeometry[] = []
  paint.push(box(1.9, 0.25, 6.0, PAINT.iron, { at: [0, 0.8, 0] }))
  paint.push(box(2.2, 0.4, 0.2, PAINT.terracotta, { at: [0, 0.72, 3.0] }))
  for (const x of [0.7, -0.7]) paint.push(cyl(0.16, 0.16, 0.22, PAINT.iron, { at: [x, 0.92, 3.1], rot: [QUARTER, 0, 0] }, 8))
  for (const x of [0.8, -0.8]) {
    for (const z of [-0.5, 0.9, 2.3]) paint.push(...wheel(x, z, 0.6, PAINT.terracotta))
    paint.push(box(0.06, 0.1, 2.9, PAINT.stoneLight, { at: [x + Math.sign(x) * 0.08, 0.72, 0.9] }))
    paint.push(...wheel(x * 0.95, -2.3, 0.36, PAINT.terracotta))
  }
  // Boiler, with brass bands, and the smokebox at the front.
  paint.push(cyl(0.85, 0.85, 3.2, green, { at: [0, 2.0, -0.2], rot: [QUARTER, 0, 0] }, 14))
  for (const z of [0.5, 1.5, 2.5]) paint.push(cyl(0.875, 0.875, 0.08, PAINT.brass, { at: [0, 2.0, z], rot: [QUARTER, 0, 0] }, 14))
  paint.push(cyl(0.88, 0.88, 0.4, PAINT.soot, { at: [0, 2.0, 2.95], rot: [QUARTER, 0, 0] }, 14))
  paint.push(cyl(0.6, 0.6, 0.06, PAINT.iron, { at: [0, 2.0, 3.35], rot: [QUARTER, 0, 0] }, 12), cyl(0.09, 0.09, 0.05, PAINT.brass, { at: [0, 2.0, 3.41], rot: [QUARTER, 0, 0] }, 7))
  paint.push(cyl(0.2, 0.27, 0.85, PAINT.iron, { at: [0, 2.8, 2.45] }, 9), cyl(0.34, 0.2, 0.26, PAINT.brass, { at: [0, 3.65, 2.45] }, 9))
  paint.push(blob(0.42, [PAINT.brass, PAINT.gold], { at: [0, 2.92, 1.1] }, 0.05, 1, 1), cyl(0.07, 0.1, 0.3, PAINT.brass, { at: [0, 2.82, 0.2] }, 6))
  for (const x of [0.86, -0.86]) paint.push(box(0.46, 0.95, 2.5, green, { at: [x, 0.95, 1.0] }))
  // Cab and coal bunker.
  paint.push(box(2.1, 2.0, 1.9, green, { at: [0, 0.95, -1.5] }))
  paint.push(box(2.4, 0.1, 2.4, [PAINT.oat, PAINT.cream], { at: [0, 2.95, -1.5] }), box(1.9, 0.1, 2.2, PAINT.cream, { at: [0, 3.04, -1.5] }))
  for (const x of [1.06, -1.06]) glow.push(box(0.04, 0.62, 0.9, PAINT.window, { at: [x, 2.08, -1.5] }))
  for (const x of [0.5, -0.5]) glow.push(cyl(0.22, 0.22, 0.04, PAINT.window, { at: [x, 2.45, -0.56], rot: [QUARTER, 0, 0] }, 10))
  paint.push(box(1.9, 1.15, 0.8, green, { at: [0, 0.95, -2.8] }))
  for (const [x, z, r] of [
    [-0.4, -2.8, 0.34],
    [0.35, -2.7, 0.3],
    [0, -2.95, 0.3],
  ] as const) {
    paint.push(blob(r, PAINT.soot, { at: [x, 2.1, z], scale: [1, 0.7, 1] }, 0.3, Math.round(r * 100), 1))
  }
  glow.push(blob(0.17, PAINT.lamp, { at: [0, 2.98, 3.2] }, 0.02, 2, 1))
  paint.push(box(0.12, 0.2, 0.12, PAINT.iron, { at: [0, 2.78, 3.2] }), box(0.22, 0.14, 0.5, PAINT.iron, { at: [0, 0.74, -3.2] }))
  return { paint, glow }
}

/** The train stopped at the halt: a small green tank engine and three carriages, one per project. */
export function buildTrain(): Part[] {
  const loco = buildLoco()
  const liveries: (readonly [readonly [string, string], readonly [string, string]])[] = [
    [
      [PAINT.terracottaDeep, PAINT.terracotta],
      [PAINT.stoneDark, PAINT.stone],
    ],
    [
      [PAINT.cornflowerDeep, PAINT.cornflower],
      [PAINT.stoneDark, PAINT.stone],
    ],
    [
      [PAINT.brass, PAINT.gold],
      [PAINT.stoneDark, PAINT.stone],
    ],
  ]
  // Each vehicle is built centred on itself and hung at its place along the rails.
  const parts: Part[] = [hung('Train_Loco', loco.paint, [0, 0, TRAIN.loco]), hung('Train_Loco_Glow', loco.glow, [0, 0, TRAIN.loco], 'glow')]
  liveries.forEach(([body, roof], i) => {
    const car = buildCar(body, roof)
    parts.push(hung(`Train_Car${i + 1}`, car.paint, [0, 0, TRAIN.cars[i]]), hung(`Train_Car${i + 1}_Glow`, car.glow, [0, 0, TRAIN.cars[i]], 'glow'))
  })
  return parts
}

// ------------------------------------------------------------ windmill

/** One small windmill. Its cap is painted pale so the app can wash each mill's cap in its own colour. */
export function buildWindmill(): Part[] {
  const [hx, hy, hz] = WINDMILL.hub
  const body = [
    roughen(cyl(1.36, 1.46, 0.36, [PAINT.stoneDark, PAINT.stone], undefined, 8), 0.03, 1),
    roughen(cyl(0.72, 1.22, 3.02, [PAINT.oat, PAINT.cream], { at: [0, 0.34, 0] }, 8), 0.02, 2),
    box(0.52, 0.98, 0.12, [PAINT.woodDark, PAINT.wood], { at: [0, 0.34, 1.12], rot: [-0.165, 0, 0] }),
    box(0.62, 0.08, 0.16, PAINT.woodLight, { at: [0, 1.3, 0.97], rot: [-0.165, 0, 0] }),
    cyl(0.98, 1.0, 0.1, PAINT.woodDark, { at: [0, 3.32, 0] }, 8),
    cyl(0.07, 0.07, hz - 0.3, PAINT.iron, { at: [hx, hy, 0.3], rot: [QUARTER, 0, 0] }, 6),
    // A tail pole, so the miller can turn the cap into the wind.
    limb([0, 3.5, -0.6], [0, 0.9, -2.3], 0.05, 0.04, PAINT.wood, 5),
  ]
  const cap = [cyl(0.16, 0.96, 0.98, [PAINT.oat, '#ffffff'], { at: [0, 3.4, 0] }, 8), blob(0.14, '#ffffff', { at: [0, 4.42, 0] }, 0.05, 1, 1)]
  const glow = [box(0.3, 0.38, 0.08, PAINT.window, { at: [0, 2.05, 0.88], rot: [-0.165, 0, 0] })]

  const sails: BufferGeometry[] = [cyl(0.17, 0.17, 0.16, PAINT.terracotta, { at: [hx, hy, hz - 0.08], rot: [QUARTER, 0, 0] }, 8)]
  for (let k = 0; k < 4; k++) {
    const arm = [
      box(0.07, 2.35, 0.05, [PAINT.wood, PAINT.woodLight], { at: [0, 0.08, 0] }),
      box(0.5, 1.7, 0.02, [PAINT.oat, PAINT.canvas], { at: [0.3, 0.58, 0.02] }),
      ...[0.58, 1.0, 1.43, 1.86, 2.26].map((y) => box(0.56, 0.035, 0.035, PAINT.wood, { at: [0.3, y, 0.04] })),
      box(0.035, 1.72, 0.035, PAINT.wood, { at: [0.56, 0.58, 0.04] }),
    ]
    for (const piece of arm) sails.push(put(piece, { at: [hx, hy, hz], rot: [0, 0, k * QUARTER + 0.3] }))
  }
  return [part('Windmill_Body', body), part('Windmill_Cap', cap), part('Windmill_Glow', glow, 'glow'), part('Windmill_Sails', sails, 'paint', WINDMILL.hub)]
}

// ------------------------------------------------------------ postbox and campfire

/** One wing, built for the right-hand side; `side` -1 builds its mirror. */
function wing(side: 1 | -1): BufferGeometry[] {
  const pieces: BufferGeometry[] = [blob(0.13, [PAINT.copper, PAINT.copperLight], undefined, 0.1, 1, 1)]
  // Five feathers, longest on top, fanned out to the side and swept back like a bird's.
  for (let i = 0; i < 5; i++) {
    const rise = -0.32 + i * 0.2
    const length = 0.62 + i * 0.16
    const feather = limb([0, 0, 0], [Math.cos(rise) * length * side, Math.sin(rise) * length, -0.16 - i * 0.1], 0.13, 0.03, [PAINT.brass, PAINT.canvas], 5)
    pieces.push(put(feather, { scale: [1, 1, 0.35] }))
  }
  // A second, shorter row over the shoulder.
  for (let i = 0; i < 3; i++) {
    const rise = -0.1 + i * 0.24
    const feather = limb([0, 0.02, 0.03], [Math.cos(rise) * 0.5 * side, Math.sin(rise) * 0.5 + 0.02, -0.02 - i * 0.05], 0.11, 0.04, [PAINT.copperLight, PAINT.gold], 5)
    pieces.push(put(feather, { scale: [1, 1, 0.35] }))
  }
  return pieces
}

/** The winged copper postbox, its letter, and the wooden charms hanging beneath it. */
export function buildPostbox(): Part[] {
  const copper = [PAINT.copper, PAINT.copperLight] as const
  const body: BufferGeometry[] = [
    roughen(cyl(0.1, 0.14, 1.5, [PAINT.woodDark, PAINT.wood], { at: [0, -0.1, 0] }, 7), 0.012),
    limb([0, 0.75, 0], [0, 1.36, -0.34], 0.05, 0.045, PAINT.wood, 5),
    blob(0.2, [PAINT.stoneDark, PAINT.stoneLight], { at: [0.2, 0.04, 0.1], scale: [1.2, 0.6, 1] }, 0.3, 7, 1),
    blob(0.16, [PAINT.stoneDark, PAINT.stone], { at: [-0.18, 0.03, -0.12], scale: [1, 0.6, 1.2] }, 0.3, 8, 1),
    roughen(box(2.7, 0.09, 0.09, [PAINT.wood, PAINT.woodLight], { at: [0, POSTBOX.crossbar, 0.1] }), 0.012, 3),
    box(0.5, 0.07, 0.74, PAINT.woodDark, { at: [0, 1.42, 0] }),
    box(0.72, 0.46, 1.0, copper, { at: [0, 1.49, 0] }),
    cyl(0.36, 0.36, 1.0, [PAINT.copperLight, PAINT.copper], { at: [0, 1.94, -0.5], rot: [QUARTER, 0, 0] }, 14),
    box(0.62, 0.5, 0.03, PAINT.copper, { at: [0, 1.56, 0.5] }),
    box(0.44, 0.06, 0.03, PAINT.soot, { at: [0, 1.95, 0.515] }),
    cyl(0.04, 0.04, 0.05, PAINT.brass, { at: [0, 1.7, 0.52], rot: [QUARTER, 0, 0] }, 7),
    // A little flag on the side, raised.
    box(0.03, 0.42, 0.03, PAINT.iron, { at: [0.375, 1.75, 0.3] }),
    box(0.03, 0.18, 0.26, PAINT.terracotta, { at: [0.375, 1.99, 0.17] }),
  ]
  for (const z of [-0.36, 0.36]) body.push(cyl(0.372, 0.372, 0.05, PAINT.brass, { at: [0, 1.94, z], rot: [QUARTER, 0, 0] }, 14), box(0.74, 0.46, 0.05, PAINT.brass, { at: [0, 1.49, z] }))
  // Verdigris where the rain sits.
  for (const [x, y, z, r] of [
    [0.12, 2.28, 0.14, 0.13],
    [-0.16, 2.25, -0.24, 0.11],
    [0.3, 2.12, -0.1, 0.09],
    [-0.33, 1.72, 0.2, 0.1],
  ] as const) {
    body.push(blob(r, PAINT.verdigris, { at: [x, y, z], scale: [1, 0.3, 1] }, 0.3, Math.round(r * 100), 1))
  }

  const [sx, sy, sz] = POSTBOX.slot
  const letter = [
    box(0.4, 0.022, 0.56, [PAINT.oat, PAINT.canvas], { at: [sx, sy - 0.011, sz - 0.2] }),
    cyl(0.05, 0.05, 0.012, PAINT.terracotta, { at: [sx, sy + 0.011, sz - 0.2] }, 8),
    box(0.09, 0.006, 0.11, PAINT.cornflower, { at: [sx + 0.13, sy + 0.011, sz - 0.02] }),
  ]

  const [wx, wy, wz] = POSTBOX.wing
  const { width, height } = POSTBOX.charm
  const charms = POSTBOX.charms.map(({ x, drop }, i) =>
    hung(
      `Postbox_Charm${i + 1}`,
      [
        box(0.014, drop + 0.04, 0.014, PAINT.canvas, { at: [0, -drop - 0.04, 0] }),
        roughen(box(width, height, 0.045, i % 2 ? [PAINT.wood, PAINT.woodLight] : [PAINT.woodLight, PAINT.woodPale], { at: [0, -drop - height, 0], rot: [0, 0, (i % 2 ? 1 : -1) * 0.03] }), 0.012, i),
        cyl(0.03, 0.03, 0.02, PAINT.brass, { at: [0, -drop - 0.06, 0.03], rot: [QUARTER, 0, 0] }, 6),
      ],
      [x, POSTBOX.crossbar, 0.12],
    ),
  )

  return [part('Postbox_Body', body), hung('Postbox_WingR', wing(1), [wx, wy, wz]), hung('Postbox_WingL', wing(-1), [-wx, wy, wz]), part('Postbox_Letter', letter, 'paint', POSTBOX.slot), ...charms]
}

/** The campfire beside the postbox, with a log to sit on while the letter gets written. */
export function buildCampfire(): Part[] {
  const pieces: BufferGeometry[] = [cyl(0.62, 0.66, 0.04, [PAINT.soot, PAINT.stoneDark], undefined, 10)]
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2
    pieces.push(blob(0.2 + (i % 3) * 0.035, [PAINT.stoneDark, PAINT.stoneLight], { at: [Math.cos(angle) * 0.72, 0.08, Math.sin(angle) * 0.72], scale: [1.1, 0.75, 1], rot: [0, angle, 0] }, 0.3, i, 1))
  }
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.5
    pieces.push(limb([Math.cos(angle) * 0.5, 0.03, Math.sin(angle) * 0.5], [-Math.cos(angle) * 0.08, 0.62, -Math.sin(angle) * 0.08], 0.085, 0.07, [PAINT.woodDark, PAINT.wood], 6))
  }
  // The bench: a long log on two stumps, and a stump for a second sitter.
  pieces.push(limb([-1.15, 0.46, 1.95], [1.15, 0.46, 2.15], 0.3, 0.27, [PAINT.wood, PAINT.woodLight], 9))
  pieces.push(cyl(0.2, 0.24, 0.3, PAINT.woodDark, { at: [-0.75, 0, 1.98] }, 7), cyl(0.2, 0.24, 0.3, PAINT.woodDark, { at: [0.75, 0, 2.12] }, 7))
  pieces.push(cyl(0.32, 0.36, 0.42, [PAINT.wood, PAINT.woodPale], { at: [-1.75, 0, 0.2] }, 8))
  // A copper kettle keeping warm on a flat stone.
  pieces.push(cyl(0.3, 0.32, 0.1, PAINT.stoneLight, { at: [0.95, 0, -0.35] }, 7), blob(0.17, [PAINT.copper, PAINT.copperLight], { at: [0.95, 0.24, -0.35], scale: [1, 0.85, 1] }, 0.04, 3, 1))
  pieces.push(limb([1.08, 0.26, -0.35], [1.3, 0.36, -0.35], 0.035, 0.02, PAINT.copper, 5))

  return [
    part('Camp_Static', pieces),
    hung('Camp_Flame1', [cone(0.26, 0.74, [PAINT.terracotta, PAINT.flame], undefined, 6)], [0, 0.1, 0], 'glow'),
    hung('Camp_Flame2', [cone(0.17, 0.5, [PAINT.flame, PAINT.flameCore], undefined, 6)], [0.08, 0.1, 0.06], 'glow'),
    hung('Camp_Flame3', [cone(0.14, 0.44, [PAINT.terracotta, PAINT.flame], undefined, 6)], [-0.13, 0.1, -0.05], 'glow'),
  ]
}
