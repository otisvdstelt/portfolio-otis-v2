// What the train is fitted out with. Every section of the site is a car of
// the train, and each of these is built in the space of the car it goes in:
// x along the car, z across it (north is negative), the floor at CAR.floor.
//
//   the library car   a great bookcase where the north benches were
//   the compartment   two facing seats, a table and somebody's luggage
//   the mail car      a sorting frame of pigeonholes over a desk
//   the driver's cab  the front of the train: a windscreen, dials and levers
import { type BufferGeometry, Color } from 'three'
import { blob, box, cone, cyl, hung, limb, part, ring, roughen, slab, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { BOOK, CAB, CAR, COMPARTMENT, LIBRARY, MAIL } from './spec.ts'
import { seeded } from './terrain.ts'

const QUARTER = Math.PI / 2
const walnut = [PAINT.walnutDeep, PAINT.walnut] as const
const BINDINGS = [PAINT.moss, PAINT.rug, PAINT.walnut, PAINT.honey, PAINT.cornflowerDeep, PAINT.violet, PAINT.teal, PAINT.terracottaDeep, PAINT.leafDeep, PAINT.wine]

/** A thick old book lying flat, gilt across its spine. */
function tome(x: number, y: number, z: number, width: number, thickness: number, colour: string, turn: number): BufferGeometry[] {
  return [
    roughen(box(width, thickness, width * 0.72, [colour, colour], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 31 + y * 17)),
    box(width - 0.03, thickness - 0.03, width * 0.72 - 0.01, PAINT.oat, { at: [x + Math.cos(turn) * 0.012, y + 0.015, z - Math.sin(turn) * 0.012], rot: [0, turn, 0] }),
    box(width + 0.006, 0.012, 0.05, PAINT.brass, { at: [x, y + thickness * 0.5, z], rot: [0, turn, 0] }),
  ]
}

// ------------------------------------------------------------ the library car

const mix = (a: string, b: string, t: number) => '#' + new Color(a).lerp(new Color(b), t).getHexString()
/** Bindings gone soft with age, so that the four books on the ledge are the brightest things on the wall. */
const FADED = BINDINGS.map((binding) => mix(binding, PAINT.walnutLight, 0.36))

/** A shelf of ordinary books at their true size, spines out toward +z. Not every shelf is full, and not every book stands straight. */
function shelfRow(x0: number, x1: number, y: number, front: number, tallest: number, random: () => number): BufferGeometry[] {
  const pieces: BufferGeometry[] = []
  const pick = () => FADED[Math.floor(random() * FADED.length)]
  for (let x = x0; x < x1 - 0.035; ) {
    const roll = random()
    if (roll < 0.045) {
      // A gap where something was taken down and never put back.
      x += 0.05 + random() * 0.07
      continue
    }
    if (roll < 0.1 && x < x1 - 0.3) {
      // A few laid flat in a pile.
      const length = 0.2 + random() * 0.05
      let top = y
      for (let i = 0, n = 2 + Math.floor(random() * 3); i < n; i++) {
        const thick = 0.028 + random() * 0.026
        const cover = pick()
        pieces.push(box(length - i * 0.012, thick, 0.16, [cover, cover], { at: [x + length / 2, top, front - 0.115], rot: [0, (random() - 0.5) * 0.2, 0] }))
        top += thick
      }
      x += length + 0.02
      continue
    }
    const width = 0.026 + random() * 0.04
    const height = tallest * (0.64 + random() * 0.36)
    const depth = 0.15 + random() * 0.05
    const leaning = random() < 0.05
    const cover = pick()
    pieces.push(box(width, height, depth, [cover, cover], { at: [x + width / 2, y, front - 0.03 - depth / 2], rot: [0, 0, leaning ? -0.16 : 0] }))
    // A gilt band across the spine of the better ones.
    if (!leaning && random() < 0.42) pieces.push(box(width + 0.003, 0.012, depth + 0.004, PAINT.gold, { at: [x + width / 2, y + height * (0.68 + random() * 0.14), front - 0.03 - depth / 2] }))
    x += width + (leaning ? 0.05 : 0.004)
  }
  return pieces
}

/** A low run of shelves under a window, with a top to put things on. */
function lowShelves(x0: number, x1: number, random: () => number): BufferGeometry[] {
  const F = CAR.floor
  const { back, front } = LIBRARY.case
  const pieces = [
    slab(x0, x1, F, F + 0.8, back, back + 0.02, PAINT.walnutDeep),
    slab(x0, x1, F, F + 0.05, back, front + 0.01, PAINT.walnutDeep),
    roughen(slab(x0 - 0.02, x1 + 0.02, F + 0.79, F + 0.825, back, front + 0.025, [PAINT.walnut, PAINT.walnutLight]), 0.004, Math.round(x0 * 7)),
    slab(x0 + 0.04, x1 - 0.04, F + 0.4, F + 0.43, back, front, [PAINT.walnut, PAINT.walnutLight]),
  ]
  for (const x of [x0, x1 - 0.04, (x0 + x1) / 2 - 0.02]) pieces.push(slab(x, x + 0.04, F, F + 0.8, back, front, walnut))
  for (const [a, b] of [
    [x0 + 0.05, (x0 + x1) / 2 - 0.03],
    [(x0 + x1) / 2 + 0.03, x1 - 0.05],
  ]) {
    pieces.push(...shelfRow(a, b, F + 0.05, front, 0.3, random), ...shelfRow(a, b, F + 0.43, front, 0.3, random))
  }
  return pieces
}

/**
 * What turns the middle car of the train into the library: a great bookcase
 * where the north benches were, low shelves under the windows either side of
 * it, and the things a reader leaves lying about. Built in the car's own
 * space, like the benches it replaces. With it, the four parts of a book that
 * opens in the middle.
 */
export function buildLibrary(): Part[] {
  const F = CAR.floor
  const random = seeded(61)
  const { west, east, back, front, top } = LIBRARY.case
  const [low, high] = LIBRARY.shelves
  const ledge = LIBRARY.ledge

  // The carcass: back, sides, plinth, a top with a cornice.
  const shelving: BufferGeometry[] = [
    slab(west, east, F, F + top, back, back + 0.02, PAINT.walnutDeep),
    slab(west - 0.02, east + 0.02, F, F + 0.06, back, front + 0.02, PAINT.walnutDeep),
    slab(west - 0.04, east + 0.04, F + top - 0.05, F + top, back, front + 0.04, [PAINT.walnut, PAINT.walnutLight]),
    slab(west - 0.02, east + 0.02, F + top - 0.085, F + top - 0.05, back, front + 0.02, PAINT.walnutDeep),
  ]
  for (const x of [west, east - 0.05]) shelving.push(roughen(slab(x, x + 0.05, F, F + top - 0.05, back, front, walnut), 0.004, Math.round(x * 9)))
  for (const y of [low, ledge, high]) shelving.push(roughen(slab(west + 0.05, east - 0.05, F + y - 0.03, F + y, back, front, [PAINT.walnut, PAINT.walnutLight]), 0.003, Math.round(y * 30)))
  for (const x of [-0.45, 0.45]) shelving.push(slab(x - 0.02, x + 0.02, F + 0.06, F + low - 0.03, back, front, walnut), slab(x - 0.02, x + 0.02, F + high, F + top - 0.085, back, front, walnut))

  // The ledge the four projects stand on: green baize behind them, a brass lip to stop them sliding with the train.
  shelving.push(slab(west + 0.05, east - 0.05, F + ledge, F + high - 0.03, -1.2, -1.185, [PAINT.pine, PAINT.moss]))
  shelving.push(slab(west + 0.05, east - 0.05, F + ledge, F + ledge + 0.022, front - 0.014, front + 0.004, PAINT.brass))

  // Under the ledge, the card catalogue: two rows of small drawers, each with a brass pull and a label.
  const drawer = (east - west - 0.1) / 8
  for (let column = 0; column < 8; column++) {
    for (let row = 0; row < 2; row++) {
      const x = west + 0.05 + drawer * (column + 0.5)
      const y = F + low + 0.012 + row * 0.146
      shelving.push(box(drawer - 0.02, 0.13, 0.02, [PAINT.walnut, PAINT.walnutLight], { at: [x, y, front - 0.01] }))
      shelving.push(box(0.07, 0.014, 0.016, PAINT.brass, { at: [x, y + 0.03, front + 0.006] }), box(0.1, 0.036, 0.004, PAINT.cream, { at: [x, y + 0.072, front + 0.001] }))
    }
  }

  // Everything else on it is books.
  for (const [a, b] of [
    [west + 0.06, -0.47],
    [-0.43, 0.43],
    [0.47, east - 0.06],
  ]) {
    shelving.push(...shelfRow(a, b, F + 0.06, front, 0.39, random), ...shelfRow(a, b, F + high, front, 0.4, random))
  }

  // Either side of it the windows are left open, with low shelves under them.
  const fittings: BufferGeometry[] = [...lowShelves(-4.0, west - 0.06, random), ...lowShelves(east + 0.06, 4.0, random)]
  const shelfTop = F + 0.825
  const glow: BufferGeometry[] = []

  // On the west shelf: a globe, and a plant that has done well by the window.
  fittings.push(cyl(0.07, 0.09, 0.02, PAINT.brass, { at: [-1.78, shelfTop, -1.1] }, 10), cyl(0.012, 0.012, 0.1, PAINT.brass, { at: [-1.78, shelfTop, -1.1] }, 6))
  fittings.push(blob(0.125, [PAINT.tealTinDeep, PAINT.mist], { at: [-1.78, shelfTop + 0.22, -1.1], rot: [0.3, 0.6, 0.2] }, 0.05, 5, 2), ring(0.14, 0.008, PAINT.brass, { at: [-1.78, shelfTop + 0.22, -1.1], rot: [0, 0.5, 0.35] }, 16))
  fittings.push(cyl(0.11, 0.08, 0.15, [PAINT.terracottaDeep, PAINT.terracotta], { at: [-2.7, shelfTop, -1.08] }, 9))
  for (let i = 0; i < 7; i++) {
    const angle = i * 0.9
    fittings.push(blob(0.07 + (i % 3) * 0.02, [PAINT.leafDeep, PAINT.leaf], { at: [-2.7 + Math.cos(angle) * 0.1, shelfTop + 0.22 + (i % 4) * 0.06, -1.08 + Math.sin(angle) * 0.07], scale: [1, 0.55, 1] }, 0.3, i, 1))
  }
  fittings.push(...tome(-3.4, shelfTop, -1.1, 0.26, 0.05, FADED[1], 0.3), ...tome(-3.38, shelfTop + 0.05, -1.1, 0.22, 0.04, FADED[4], -0.2))

  // On the east shelf: a reading lamp, a cup of tea, a pile waiting to be shelved, and the cat, asleep in the sun.
  fittings.push(cyl(0.06, 0.075, 0.02, PAINT.brass, { at: [3.15, shelfTop, -1.12] }, 10), limb([3.15, shelfTop + 0.02, -1.12], [3.15, shelfTop + 0.3, -1.12], 0.01, 0.01, PAINT.brass, 6), limb([3.15, shelfTop + 0.3, -1.12], [3.05, shelfTop + 0.34, -1.02], 0.01, 0.01, PAINT.brass, 6))
  fittings.push(cyl(0.05, 0.1, 0.085, [PAINT.pine, PAINT.pineLight], { at: [3.04, shelfTop + 0.29, -1.0] }, 10))
  glow.push(blob(0.035, PAINT.lamp, { at: [3.04, shelfTop + 0.3, -1.0] }, 0.02, 1, 1))
  fittings.push(cyl(0.036, 0.028, 0.05, [PAINT.oat, PAINT.white], { at: [2.82, shelfTop, -1.02] }, 9), cyl(0.05, 0.05, 0.008, PAINT.white, { at: [2.82, shelfTop, -1.02] }, 10))
  let pile = shelfTop
  for (let i = 0; i < 5; i++) {
    const thick = 0.03 + random() * 0.02
    fittings.push(...tome(3.55 + (random() - 0.5) * 0.03, pile, -1.1, 0.24 - i * 0.012, thick, FADED[(i * 3 + 2) % FADED.length], (random() - 0.5) * 0.5))
    pile += thick
  }
  const ginger = [PAINT.amberDeep, PAINT.amberLight] as const
  const [cx, cz] = [2.2, -1.1]
  fittings.push(blob(0.13, ginger, { at: [cx, shelfTop + 0.065, cz], scale: [1.35, 0.6, 0.95] }, 0.1, 3, 2))
  fittings.push(blob(0.068, ginger, { at: [cx - 0.15, shelfTop + 0.06, cz + 0.06], scale: [1, 0.85, 1] }, 0.06, 4, 2))
  for (const side of [-1, 1]) fittings.push(cone(0.022, 0.04, PAINT.amberDeep, { at: [cx - 0.15 + side * 0.035, shelfTop + 0.105, cz + 0.06], rot: [0, 0, -side * 0.25] }, 4))
  fittings.push(blob(0.03, PAINT.white, { at: [cx - 0.19, shelfTop + 0.045, cz + 0.105], scale: [1, 0.7, 0.8] }, 0.05, 5, 1))
  // The tail, brought round to the nose.
  fittings.push(limb([cx + 0.15, shelfTop + 0.03, cz + 0.02], [cx + 0.1, shelfTop + 0.03, cz + 0.13], 0.03, 0.026, ginger, 6), limb([cx + 0.1, shelfTop + 0.03, cz + 0.13], [cx - 0.08, shelfTop + 0.03, cz + 0.145], 0.026, 0.018, ginger, 6))

  // On the floor: a step stool for the top shelf, and the piles that never get smaller.
  fittings.push(box(0.4, 0.2, 0.3, [PAINT.wood, PAINT.woodLight], { at: [1.86, F, -0.82] }), box(0.4, 0.4, 0.15, [PAINT.wood, PAINT.woodLight], { at: [1.86, F, -0.9] }))
  fittings.push(...tome(1.86, F + 0.2, -0.76, 0.22, 0.04, FADED[6], 0.5))
  for (const [px, pz, count] of [
    [-1.62, -0.8, 6],
    [-1.9, -0.72, 3],
    [3.45, -0.74, 5],
    [-3.5, -0.76, 4],
  ] as const) {
    let y = F
    for (let i = 0; i < count; i++) {
      const thick = 0.035 + random() * 0.03
      fittings.push(...tome(px + (random() - 0.5) * 0.04, y, pz + (random() - 0.5) * 0.04, 0.26 + random() * 0.08, thick, FADED[Math.floor(random() * FADED.length)], (random() - 0.5) * 0.9))
      y += thick
    }
  }
  // And on the benches across the aisle, where somebody was reading.
  const seat = F + 0.47
  fittings.push(...tome(0.5, seat, 0.98, 0.26, 0.05, FADED[2], 0.2), ...tome(0.52, seat + 0.05, 0.99, 0.23, 0.04, FADED[7], -0.3), ...tome(0.5, seat + 0.09, 0.98, 0.2, 0.035, FADED[0], 0.5))
  fittings.push(box(0.36, 0.012, 0.25, [PAINT.oat, PAINT.white], { at: [1.2, seat, 0.95], rot: [0, 0.25, 0] }), box(0.012, 0.014, 0.25, FADED[3], { at: [1.2, seat, 0.95], rot: [0, 0.25, 0] }))
  fittings.push(roughen(box(0.4, 0.3, 0.16, [PAINT.leatherDeep, PAINT.leather], { at: [-2.5, seat, 1.0], rot: [0.12, 0.1, 0] }), 0.008, 7))

  // A project's book. It lies flat on its back board with the spine along its west edge, and opens in the middle:
  // the front board and half the leaves turn over about the spine, and the two faces of the cut lie level.
  const { width: W, height: H, thickness: T, board: b } = BOOK
  const neutral = ['#cdbba3', '#f2e6d4'] as const
  const half = T / 2
  const bands = [-H * 0.3, 0, H * 0.3]
  const backBoard = [box(W, b, H, neutral, { at: [0, 0, 0] }), box(0.016, half - 0.004, H, neutral, { at: [-W / 2 - 0.004, 0, 0] })]
  for (const z of bands) backBoard.push(box(0.022, half - 0.003, 0.02, neutral, { at: [-W / 2 - 0.005, -0.001, z] }))
  const leavesRight = [box(W - 0.022, half - b, H - 0.036, [PAINT.oat, PAINT.white], { at: [-0.009, b, 0] })]
  for (const side of [-1, 1]) leavesRight.push(box(0.052, b + 0.004, 0.052, PAINT.brass, { at: [W / 2 - 0.024, -0.002, side * (H / 2 - 0.024)] }))
  // These two are built from the hinge outward.
  const frontBoard = [box(W, b, H, neutral, { at: [W / 2, half - b, 0] }), box(0.016, half - 0.004, H, neutral, { at: [-0.004, 0.004, 0] })]
  for (const z of bands) frontBoard.push(box(0.022, half - 0.003, 0.02, neutral, { at: [-0.005, 0.004, z] }))
  // A blind-tooled frame on the cover, for the title to sit in.
  for (const side of [-1, 1]) {
    frontBoard.push(box(W - 0.08, 0.003, 0.008, neutral, { at: [W / 2, half, side * (H / 2 - 0.045)] }), box(0.008, 0.003, H - 0.08, neutral, { at: [W / 2 + side * (W / 2 - 0.045), half, 0] }))
  }
  const leavesLeft = [box(W - 0.022, half - b, H - 0.036, [PAINT.oat, PAINT.white], { at: [W / 2 - 0.009, 0, 0] })]
  for (const side of [-1, 1]) leavesLeft.push(box(0.052, b + 0.004, 0.052, PAINT.brass, { at: [W - 0.024, half - b - 0.002, side * (H / 2 - 0.024)] }))
  const hinge = [-W / 2, half, 0] as const

  return [
    part('Library_Case', shelving),
    part('Library_Fittings', fittings),
    part('Library_Glow', glow, 'glow'),
    part('Book_Back', backBoard),
    part('Book_LeavesRight', leavesRight),
    hung('Book_Front', frontBoard, hinge),
    hung('Book_LeavesLeft', leavesLeft, hinge),
  ]
}

// ------------------------------------------------------------ the compartment

/** The inner face of the car's north wall. */
const NORTH = -CAR.halfWidth + 0.08
/** A slab on one side of the car's middle or the other, given its near and far edge from the middle. */
const flank = (side: number, near: number, far: number, y0: number, y1: number, z0: number, z1: number, colour: Parameters<typeof slab>[6]) => (side > 0 ? slab(near, far, y0, y1, z0, z1, colour) : slab(-far, -near, y0, y1, z0, z1, colour))

/**
 * Somebody's own corner of the middle car: two deep seats facing each other
 * across a table under the window post, curtains, a lamp, and everything
 * they travel with. Built in the car's own space, where the north benches were.
 */
export function buildCompartment(): Part[] {
  const F = CAR.floor
  const velvet = [PAINT.wine, PAINT.wineLight] as const
  const { seat, table } = COMPARTMENT
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  for (const side of [-1, 1]) {
    // The high panelled back that makes this a place of its own, and the seat in front of it.
    pieces.push(roughen(flank(side, seat + 0.58, seat + 0.66, F, F + 1.66, NORTH, -0.2, walnut), 0.004, side + 5))
    pieces.push(flank(side, seat + 0.55, seat + 0.69, F + 1.66, F + 1.7, NORTH, -0.17, PAINT.brass))
    pieces.push(flank(side, seat, seat + 0.58, F, F + 0.4, NORTH + 0.02, -0.24, walnut))
    pieces.push(roughen(flank(side, seat - 0.02, seat + 0.56, F + 0.4, F + 0.5, NORTH + 0.03, -0.25, velvet), 0.01, side + 9))
    pieces.push(roughen(flank(side, seat + 0.45, seat + 0.58, F + 0.5, F + 1.2, NORTH + 0.03, -0.25, velvet), 0.01, side + 13))
    // A lace cloth where a head would rest, and an arm at the aisle end with a brass knob on it.
    pieces.push(flank(side, seat + 0.435, seat + 0.45, F + 0.98, F + 1.2, -0.94, -0.56, [PAINT.oat, PAINT.cream]))
    pieces.push(flank(side, seat + 0.02, seat + 0.58, F + 0.5, F + 0.68, -0.26, -0.2, walnut), blob(0.04, PAINT.brass, { at: [side * (seat + 0.04), F + 0.7, -0.23] }, 0.02, 1, 1))
    // Curtains, gathered back either side of each window.
    for (const x of [0.15, 1.16]) {
      pieces.push(roughen(box(0.17, 1.14, 0.05, [PAINT.terracottaDeep, PAINT.terracotta], { at: [side * x, F + 0.84, NORTH + 0.035] }), 0.014, Math.round(side * x * 20)))
      pieces.push(box(0.19, 0.03, 0.06, PAINT.brass, { at: [side * x, F + 1.2, NORTH + 0.035] }))
    }
  }
  pieces.push(box(2.75, 0.022, 0.022, PAINT.brass, { at: [0, F + 1.98, NORTH + 0.04] }))

  // The table, on two brass brackets from the wall.
  pieces.push(roughen(slab(-table.half, table.half, F + table.top - 0.035, F + table.top, NORTH, table.front, [PAINT.walnut, PAINT.walnutLight]), 0.003, 3))
  for (const x of [-table.half + 0.12, table.half - 0.12]) pieces.push(limb([x, F + table.top - 0.03, table.front - 0.06], [x, F + 0.36, NORTH + 0.02], 0.016, 0.016, PAINT.brass, 6))
  // On it, beside the journal: tea, a pencil, and a pot of something green.
  const top = F + table.top
  pieces.push(cyl(0.045, 0.035, 0.075, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [COMPARTMENT.mug[0], top, COMPARTMENT.mug[2]] }, 9), ring(0.024, 0.007, PAINT.cornflower, { at: [COMPARTMENT.mug[0] + 0.052, top + 0.04, COMPARTMENT.mug[2]] }, 8))
  pieces.push(limb([-0.44, top + 0.008, -0.86], [-0.35, top + 0.008, -1.02], 0.006, 0.006, PAINT.honey, 5))
  pieces.push(cyl(0.05, 0.038, 0.07, [PAINT.terracottaDeep, PAINT.terracotta], { at: [-0.44, top, -1.17] }, 8))
  for (let i = 0; i < 5; i++) pieces.push(blob(0.035 + (i % 2) * 0.012, [PAINT.leafDeep, PAINT.leaf], { at: [-0.44 + Math.cos(i * 1.3) * 0.04, top + 0.1 + (i % 3) * 0.03, -1.17 + Math.sin(i * 1.3) * 0.03], scale: [1, 0.6, 1] }, 0.3, i, 1))

  // A lamp on the window post over the table.
  pieces.push(limb([0, F + 1.7, NORTH], [0, F + 1.74, NORTH + 0.14], 0.011, 0.011, PAINT.brass, 6), cyl(0.045, 0.085, 0.09, [PAINT.oat, PAINT.cream], { at: [0, F + 1.64, NORTH + 0.14] }, 10))
  glow.push(blob(0.032, PAINT.lamp, { at: [0, F + 1.65, NORTH + 0.14] }, 0.02, 1, 1))

  // What they travel with. An open suitcase on the west seat, half unpacked.
  const sx = -(seat + 0.27)
  pieces.push(roughen(box(0.46, 0.13, 0.62, [PAINT.leatherDeep, PAINT.leather], { at: [sx, F + 0.5, -0.74] }), 0.006, 31))
  pieces.push(roughen(box(0.05, 0.6, 0.62, [PAINT.leatherDeep, PAINT.leather], { at: [sx - 0.2, F + 0.6, -0.74], rot: [0, 0, 0.16] }), 0.006, 32))
  pieces.push(blob(0.13, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [sx - 0.02, F + 0.63, -0.86], scale: [1.3, 0.4, 1.1] }, 0.25, 4, 1), blob(0.12, [PAINT.oat, PAINT.white], { at: [sx + 0.02, F + 0.63, -0.6], scale: [1.2, 0.4, 1.2] }, 0.25, 5, 1))
  pieces.push(...tome(sx + 0.05, F + 0.67, -0.74, 0.2, 0.035, FADED[5], 0.4))
  // A coat and a scarf over the back of the east seat.
  pieces.push(roughen(box(0.07, 0.72, 0.46, [PAINT.pine, PAINT.moss], { at: [seat + 0.41, F + 0.58, -0.66], rot: [0, 0, -0.05] }), 0.016, 41))
  pieces.push(limb([seat + 0.38, F + 1.24, -0.5], [seat + 0.36, F + 0.74, -0.44], 0.045, 0.04, [PAINT.terracottaDeep, PAINT.terracotta], 6))
  // A trunk and a hat box up on the rack.
  pieces.push(roughen(box(0.78, 0.3, 0.36, [PAINT.walnut, PAINT.woodLight], { at: [-0.75, CAR.lintel + 0.09, -1.05] }), 0.008, 51), box(0.8, 0.03, 0.38, PAINT.brass, { at: [-0.75, CAR.lintel + 0.2, -1.05] }))
  pieces.push(cyl(0.2, 0.2, 0.22, [PAINT.tealTinDeep, PAINT.tealTin], { at: [0.7, CAR.lintel + 0.09, -1.05] }, 12), cyl(0.21, 0.21, 0.04, PAINT.tealTinDeep, { at: [0.7, CAR.lintel + 0.29, -1.05] }, 12))
  // A rug between the seats.
  pieces.push(slab(-seat + 0.04, seat - 0.04, F + 0.001, F + 0.012, NORTH + 0.1, -0.3, [PAINT.rug, PAINT.terracottaDeep]), slab(-seat + 0.1, seat - 0.1, F + 0.012, F + 0.016, NORTH + 0.16, -0.36, [PAINT.terracottaDeep, PAINT.terracotta]))

  // One ticket, for the app to tuck along the window frame: a pale card with a coloured stub.
  const ticket = [box(0.15, 0.085, 0.004, [PAINT.oat, PAINT.white], { at: [0, 0, 0] }), box(0.034, 0.085, 0.005, PAINT.terracotta, { at: [-0.058, 0, 0] })]

  return [part('Compartment_Fittings', pieces), part('Compartment_Glow', glow, 'glow'), hung('Ticket', ticket, [0, 0, 0])]
}

// ------------------------------------------------------------ the mail car

/** A parcel done up in brown paper and string. */
function parcel(x: number, y: number, z: number, w: number, h: number, d: number, turn: number): BufferGeometry[] {
  return [
    roughen(box(w, h, d, [PAINT.pathEdge, PAINT.path], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 13 + z * 7)),
    box(w + 0.006, h + 0.006, 0.014, PAINT.bleachedLight, { at: [x, y - 0.003, z], rot: [0, turn, 0] }),
    box(0.014, h + 0.006, d + 0.006, PAINT.bleachedLight, { at: [x, y - 0.003, z], rot: [0, turn, 0] }),
  ]
}

/**
 * The travelling post office: a sorting frame of pigeonholes over a desk
 * where the north benches were, sacks and parcels round it, and a brass slot
 * for whatever is ready to go.
 */
export function buildMail(): Part[] {
  const F = CAR.floor
  const random = seeded(47)
  const { west, east, desk, rows, columns, shelf, depth } = MAIL
  const frame: BufferGeometry[] = []
  const fittings: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // The desk: a deep top on a carcass of drawers.
  frame.push(slab(west, east, F, F + desk - 0.04, NORTH, -0.78, walnut))
  frame.push(roughen(slab(west - 0.03, east + 0.03, F + desk - 0.04, F + desk, NORTH, MAIL.front, [PAINT.walnut, PAINT.walnutLight]), 0.003, 2))
  const drawer = (east - west) / 4
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 2; row++) {
      const x = west + drawer * (column + 0.5)
      const y = F + 0.08 + row * 0.34
      frame.push(box(drawer - 0.05, 0.3, 0.02, [PAINT.walnut, PAINT.walnutLight], { at: [x, y, -0.77] }), box(0.12, 0.018, 0.02, PAINT.brass, { at: [x, y + 0.14, -0.755] }))
    }
  }
  // The board behind the desk, with the slot in it.
  frame.push(slab(west, east, F + desk, F + shelf, NORTH, NORTH + 0.03, [PAINT.pine, PAINT.moss]))
  const [slotX, slotY] = MAIL.slot
  frame.push(box(0.4, 0.09, 0.012, PAINT.brass, { at: [slotX, F + slotY - 0.045, NORTH + 0.036] }), box(0.3, 0.022, 0.006, PAINT.soot, { at: [slotX, F + slotY - 0.011, NORTH + 0.044] }))

  // The pigeonholes.
  const cell = (east - west) / columns
  const rise = (MAIL.top - shelf) / rows
  frame.push(slab(west, east, F + shelf, F + MAIL.top, NORTH, NORTH + 0.02, PAINT.walnutDeep))
  for (let column = 0; column <= columns; column++) frame.push(slab(west + column * cell - 0.012, west + column * cell + 0.012, F + shelf, F + MAIL.top, NORTH, NORTH + depth, walnut))
  for (let row = 0; row <= rows; row++) frame.push(slab(west - 0.012, east + 0.012, F + shelf + row * rise - 0.012, F + shelf + row * rise + 0.012, NORTH, NORTH + depth + (row === 0 ? 0.03 : 0), [PAINT.walnut, PAINT.walnutLight]))
  frame.push(slab(west - 0.04, east + 0.04, F + MAIL.top + 0.012, F + MAIL.top + 0.05, NORTH, NORTH + depth + 0.03, [PAINT.walnut, PAINT.walnutLight]))
  // Letters in most of them, bundled and leaning.
  const envelope = [PAINT.white, PAINT.oat, PAINT.cream, PAINT.bleachedLight, PAINT.mist, PAINT.cornflower]
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x0 = west + column * cell + 0.03
      const y = F + shelf + row * rise + 0.012
      for (let x = x0, n = 2 + Math.floor(random() * 9); n > 0 && x < x0 + cell - 0.07; n--) {
        const thick = 0.008 + random() * 0.02
        const colour = envelope[Math.floor(random() * envelope.length)]
        fittings.push(box(thick, rise * (0.5 + random() * 0.32), 0.2, [colour, colour], { at: [x + thick / 2, y, NORTH + 0.14], rot: [0, 0, (random() - 0.5) * 0.18] }))
        x += thick + 0.006 + random() * 0.012
      }
    }
  }
  // Four of them have a brass plate: the app writes a name on each.
  for (const [column, row] of MAIL.named) frame.push(box(cell - 0.07, 0.05, 0.008, PAINT.brass, { at: [west + (column + 0.5) * cell, F + shelf + row * rise - 0.025, NORTH + depth + 0.012] }))

  // On the desk: an oil lamp, scales, a stamp and its pad, letters tied in a bundle, a pen.
  const top = F + desk
  fittings.push(cyl(0.06, 0.075, 0.05, PAINT.brass, { at: [-1.05, top, -1.05] }, 10), cyl(0.03, 0.045, 0.05, PAINT.brass, { at: [-1.05, top + 0.05, -1.05] }, 8), cyl(0.028, 0.05, 0.16, [PAINT.mist, PAINT.white], { at: [-1.05, top + 0.1, -1.05] }, 8))
  glow.push(blob(0.03, PAINT.lamp, { at: [-1.05, top + 0.15, -1.05], scale: [1, 1.6, 1] }, 0.02, 1, 1))
  fittings.push(cyl(0.09, 0.11, 0.03, PAINT.brass, { at: [0.95, top, -1.08] }, 10), cyl(0.012, 0.012, 0.24, PAINT.brass, { at: [0.95, top + 0.03, -1.08] }, 6), box(0.36, 0.014, 0.014, PAINT.brass, { at: [0.95, top + 0.26, -1.08] }))
  for (const side of [-1, 1]) fittings.push(cyl(0.07, 0.05, 0.014, PAINT.brass, { at: [0.95 + side * 0.17, top + 0.13 + side * 0.02, -1.08] }, 10), cyl(0.003, 0.003, 0.13 - side * 0.02, PAINT.iron, { at: [0.95 + side * 0.17, top + 0.14 + side * 0.02, -1.08] }, 4))
  fittings.push(box(0.14, 0.022, 0.09, PAINT.soot, { at: [0.45, top, -0.86] }), box(0.12, 0.006, 0.07, PAINT.rug, { at: [0.45, top + 0.022, -0.86] }))
  fittings.push(cyl(0.022, 0.03, 0.035, PAINT.brass, { at: [0.62, top, -0.92] }, 8), cyl(0.014, 0.014, 0.06, walnut, { at: [0.62, top + 0.035, -0.92] }, 6), blob(0.022, PAINT.walnut, { at: [0.62, top + 0.1, -0.92] }, 0.02, 1, 1))
  let stack = top
  for (let i = 0; i < 6; i++) {
    fittings.push(box(0.22, 0.008, 0.13, i % 2 ? PAINT.oat : PAINT.white, { at: [-0.55 + (random() - 0.5) * 0.012, stack, -0.92], rot: [0, 0.2 + (random() - 0.5) * 0.08, 0] }))
    stack += 0.008
  }
  fittings.push(box(0.012, 0.052, 0.14, PAINT.terracotta, { at: [-0.55, top - 0.002, -0.92], rot: [0, 0.2, 0] }))
  fittings.push(limb([0.2, top + 0.006, -0.8], [0.34, top + 0.006, -0.9], 0.005, 0.004, PAINT.soot, 5))

  // Sacks on the floor, and parcels wherever there is room for them.
  for (const [x, z, size, seed] of [
    [-1.95, -0.88, 0.3, 1],
    [-2.42, -1.0, 0.34, 2],
    [-2.2, -0.62, 0.26, 3],
    [1.95, -0.92, 0.32, 4],
  ] as const) {
    fittings.push(blob(size, [PAINT.bleachedDark, PAINT.bleachedLight], { at: [x, F + size * 0.92, z], scale: [0.95, 1.25, 0.95] }, 0.16, seed, 2))
    fittings.push(cyl(size * 0.2, size * 0.34, size * 0.3, [PAINT.bleachedDark, PAINT.bleached], { at: [x + size * 0.1, F + size * 1.95, z] }, 7), ring(size * 0.26, 0.012, PAINT.woodDark, { at: [x + size * 0.07, F + size * 1.98, z], rot: [QUARTER, 0, 0] }, 8))
  }
  fittings.push(...lowRack(-4.0, -2.75), ...lowRack(2.45, 4.0))
  for (const [x, y, z, w, h, d, turn] of [
    [-3.55, 0.47, -1.05, 0.5, 0.3, 0.32, 0.1],
    [-3.0, 0.47, -1.08, 0.34, 0.22, 0.26, -0.2],
    [-3.5, 0.77, -1.06, 0.3, 0.16, 0.24, 0.5],
    [-3.3, 0.06, -1.05, 0.6, 0.3, 0.3, 0],
    [3.0, 0.47, -1.06, 0.44, 0.26, 0.3, -0.12],
    [3.55, 0.47, -1.08, 0.3, 0.36, 0.26, 0.2],
    [3.2, 0.06, -1.05, 0.7, 0.3, 0.3, 0.05],
    [3.02, 0.73, -1.06, 0.26, 0.14, 0.2, 0.6],
    [2.2, 0, -0.62, 0.44, 0.34, 0.36, 0.3],
    [0.3, 0.47, 0.98, 0.4, 0.24, 0.3, 0.15],
  ] as const) {
    fittings.push(...parcel(x, F + y, z, w, h, d, turn))
  }

  // The card on the desk, for the app to lift when it is pointed at.
  const card = [box(0.31, 0.004, 0.2, [PAINT.oat, PAINT.white], { at: [0, 0, 0] }), box(0.004, 0.005, 0.16, PAINT.bleachedDark, { at: [0.02, 0, 0] }), box(0.05, 0.005, 0.06, PAINT.terracotta, { at: [0.115, 0, -0.055] })]

  return [part('Mail_Frame', frame), part('Mail_Fittings', fittings), part('Mail_Glow', glow, 'glow'), hung('Mail_Card', card, [0, 0, 0])]
}

/** A low slatted rack under a window, two tiers, for parcels. */
function lowRack(x0: number, x1: number): BufferGeometry[] {
  const F = CAR.floor
  const pieces: BufferGeometry[] = []
  for (const x of [x0, x1 - 0.04]) for (const z of [NORTH + 0.02, -0.82]) pieces.push(slab(x, x + 0.04, F, F + 0.5, z, z + 0.04, walnut))
  for (const y of [0.05, 0.46]) for (let i = 0; i < 4; i++) pieces.push(slab(x0, x1, F + y - 0.02, F + y, NORTH + 0.03 + i * 0.12, NORTH + 0.11 + i * 0.12, [PAINT.wood, PAINT.woodLight]))
  return pieces
}

// ------------------------------------------------------------ the driver's cab

/**
 * The cab at the head of the train, built in the front car's own space and
 * taking its front end: a windscreen in three panes over a desk of brass
 * gauges and levers, a board over the glass for the destination, and the
 * few things a driver keeps by them. Only its inside is ever seen.
 */
export function buildCab(): Part[] {
  const F = CAR.floor
  const W = CAR.halfWidth
  const { back, front, sill, head, board } = CAB
  const red = [PAINT.redDeep, PAINT.red] as const
  const cream = [PAINT.oat, PAINT.cream] as const
  const shell: BufferGeometry[] = []
  const glass: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Floor and roof, as in the cars behind.
  shell.push(slab(back, front, F - 0.1, F, -W, W, [PAINT.walnutDeep, PAINT.walnut]))
  for (let i = 0; i < 9; i++) shell.push(slab(back + 0.1, front - 0.7, F, F + 0.004, -1.2 + i * 0.3 - 0.004, -1.2 + i * 0.3 + 0.004, PAINT.walnutDeep))
  shell.push(slab(back, front, CAR.ceiling, CAR.ceiling + 0.05, -W, W, [PAINT.bleachedDark, PAINT.bleached]), slab(back - 0.1, front + 0.1, CAR.ceiling + 0.05, CAR.ceiling + 0.3, -W - 0.05, W + 0.05, [PAINT.soot, PAINT.roofGrey]))

  // Side walls: red below, cream above, one window each.
  for (const side of [1, -1]) {
    const inner = side * (W - 0.08)
    const z0 = Math.min(inner, side * W)
    const z1 = Math.max(inner, side * W)
    shell.push(slab(back, front, F, F + sill, z0, z1, red), slab(back, front, F + head, CAR.ceiling + 0.3, z0, z1, cream))
    for (const x of [back, back + 1.3, front - 0.14]) shell.push(slab(x, x + 0.14, F + sill, F + head, z0, z1, red))
    glass.push(slab(back + 0.14, back + 1.3, F + sill, F + head, side * (W - 0.055), side * (W - 0.055) + 0.02, [PAINT.mist, PAINT.white]), slab(back + 1.44, front - 0.14, F + sill, F + head, side * (W - 0.055), side * (W - 0.055) + 0.02, [PAINT.mist, PAINT.white]))
    shell.push(slab(back, front, F + sill - 0.03, F + sill + 0.02, side > 0 ? W - 0.14 : -W + 0.08, side > 0 ? W - 0.08 : -W + 0.14, PAINT.brass))
  }

  // The bulkhead behind, with the door back into the train.
  shell.push(slab(back, back + 0.08, F, CAR.ceiling + 0.3, -W, W, walnut))
  shell.push(slab(back + 0.08, back + 0.1, F + 0.05, F + 1.95, -0.42, 0.42, [PAINT.walnut, PAINT.walnutLight]), slab(back + 0.1, back + 0.11, F + 1.25, F + 1.7, -0.2, 0.2, [PAINT.mist, PAINT.white]))
  shell.push(blob(0.03, PAINT.brass, { at: [back + 0.13, F + 1.0, 0.33] }, 0.02, 1, 1))
  // A cap and a coat on their hooks beside it.
  shell.push(blob(0.11, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [back + 0.16, F + 1.78, -0.85], scale: [0.6, 0.55, 1] }, 0.08, 2, 1), box(0.1, 0.012, 0.18, PAINT.soot, { at: [back + 0.22, F + 1.72, -0.85], rot: [0, 0, -0.25] }))
  shell.push(roughen(box(0.1, 0.9, 0.44, [PAINT.walnut, PAINT.woodLight], { at: [back + 0.14, F + 0.72, 0.88] }), 0.016, 6))

  // The front: three panes over the desk, a cream band above them.
  shell.push(slab(front - 0.08, front, F, F + sill, -W, W, red), slab(front - 0.08, front, F + head, CAR.ceiling + 0.3, -W, W, cream))
  for (const z of [-W + 0.07, -0.5, 0.5, W - 0.07]) shell.push(slab(front - 0.08, front, F + sill, F + head, z - 0.07, z + 0.07, red))
  for (const [z0, z1] of [
    [-W + 0.14, -0.57],
    [-0.43, 0.43],
    [0.57, W - 0.14],
  ]) {
    glass.push(slab(front - 0.05, front - 0.03, F + sill, F + head, z0, z1, [PAINT.mist, PAINT.white]))
  }

  // The desk: a carcass, a flat top for the levers, an upright board for the dials.
  const { desk, dials, levers, plate } = CAB
  shell.push(slab(desk, front - 0.08, F, F + 0.86, -1.24, 1.24, walnut), roughen(slab(desk - 0.05, front - 0.08, F + 0.86, F + 0.9, -1.27, 1.27, [PAINT.walnut, PAINT.walnutLight]), 0.003, 8))
  shell.push(slab(dials[0], front - 0.08, F + 0.9, F + sill, -1.24, 1.24, [PAINT.walnutDeep, PAINT.walnut]), slab(dials[0] - 0.012, dials[0], F + sill - 0.03, F + sill, -1.24, 1.24, PAINT.brass))
  for (const z of CAB.across) {
    // A dial: a brass bezel, a pale face, a tick for every tenth.
    shell.push(cyl(0.118, 0.118, 0.035, PAINT.brass, { at: [dials[0], F + dials[1], z], rot: [0, 0, QUARTER] }, 20), cyl(0.1, 0.1, 0.04, [PAINT.oat, PAINT.white], { at: [dials[0], F + dials[1], z], rot: [0, 0, QUARTER] }, 20))
    for (let i = 0; i <= 10; i++) {
      const angle = -2.1 + (i / 10) * 4.2
      shell.push(box(0.004, i % 5 ? 0.014 : 0.024, 0.005, PAINT.soot, { at: [dials[0] - 0.041, F + dials[1] + Math.cos(angle) * 0.078, z + Math.sin(angle) * 0.078], rot: [angle, 0, 0] }))
    }
    // Its name plate, on the edge of the desk under it.
    shell.push(box(0.01, 0.06, 0.34, PAINT.brass, { at: [plate[0], F + plate[1] - 0.03, z] }))
    // The quadrant its lever stands in.
    shell.push(box(0.2, 0.02, 0.07, PAINT.brass, { at: [levers[0], F + 0.9, z] }), box(0.16, 0.022, 0.016, PAINT.soot, { at: [levers[0], F + 0.9, z] }))
  }

  // The board over the glass, where the destination is written.
  shell.push(box(0.03, board.height, board.width, [PAINT.oat, PAINT.white], { at: [front - 0.1, F + board.y - board.height / 2, 0] }))
  for (const side of [-1, 1]) shell.push(box(0.05, board.height + 0.05, 0.03, PAINT.brass, { at: [front - 0.105, F + board.y - board.height / 2 - 0.025, side * (board.width / 2 + 0.015)] }))
  shell.push(box(0.05, 0.025, board.width + 0.06, PAINT.brass, { at: [front - 0.105, F + board.y + board.height / 2, 0] }), box(0.05, 0.025, board.width + 0.06, PAINT.brass, { at: [front - 0.105, F + board.y - board.height / 2 - 0.025, 0] }))

  // The driver's stool, the brake wheel, the whistle cord, a flask and a mug, a lunch tin, a lantern.
  shell.push(cyl(0.035, 0.05, 0.56, PAINT.iron, { at: [desk - 0.55, F, 0.62] }, 7), cyl(0.19, 0.19, 0.06, [PAINT.leatherDeep, PAINT.leather], { at: [desk - 0.55, F + 0.56, 0.62] }, 12), cyl(0.16, 0.16, 0.02, PAINT.iron, { at: [desk - 0.55, F, 0.62] }, 10))
  shell.push(cyl(0.03, 0.04, 0.22, PAINT.iron, { at: [desk + 0.12, F + 0.9, 1.08] }, 7), ring(0.15, 0.016, PAINT.brass, { at: [desk + 0.12, F + 1.13, 1.08], rot: [0, 0, 0.5] }, 16), cyl(0.012, 0.012, 0.3, PAINT.brass, { at: [desk + 0.12 - 0.07, F + 1.0, 1.08], rot: [0, 0, 0.5 - QUARTER] }, 5))
  shell.push(cyl(0.004, 0.004, 0.62, PAINT.woodPale, { at: [desk - 0.25, CAR.ceiling - 0.62, -0.42] }, 4), cyl(0.018, 0.018, 0.1, [PAINT.wood, PAINT.woodLight], { at: [desk - 0.25, CAR.ceiling - 0.7, -0.42] }, 6))
  shell.push(cyl(0.035, 0.04, 0.2, [PAINT.tealTinDeep, PAINT.tealTin], { at: [desk + 0.1, F + 0.9, -1.1] }, 9), cyl(0.028, 0.035, 0.04, PAINT.steel, { at: [desk + 0.1, F + 1.1, -1.1] }, 8))
  shell.push(cyl(0.04, 0.032, 0.065, [PAINT.oat, PAINT.white], { at: [CAB.mug[0], F + 0.9, CAB.mug[2]] }, 9))
  shell.push(roughen(box(0.2, 0.09, 0.13, [PAINT.rug, PAINT.terracotta], { at: [desk + 0.14, F + 0.9, -0.62], rot: [0, 0.2, 0] }), 0.004, 9))
  shell.push(cyl(0.003, 0.003, 0.2, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.2, -0.95] }, 4), box(0.11, 0.02, 0.11, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.22, -0.95] }), box(0.1, 0.02, 0.1, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.4, -0.95] }))
  glow.push(box(0.08, 0.16, 0.08, PAINT.lamp, { at: [back + 0.7, CAR.ceiling - 0.38, -0.95] }), blob(0.12, PAINT.lamp, { at: [back + 1.5, CAR.ceiling - 0.04, 0], scale: [1, 0.45, 1] }, 0.02, 1, 1))
  // A rug under the driver's feet.
  shell.push(slab(back + 0.5, desk - 0.12, F + 0.004, F + 0.014, -0.5, 0.5, [PAINT.rug, PAINT.terracottaDeep]), slab(back + 0.58, desk - 0.2, F + 0.014, F + 0.018, -0.42, 0.42, [PAINT.terracottaDeep, PAINT.terracotta]))

  // A needle and a lever, each built from where it turns.
  const needle = [box(0.004, 0.082, 0.008, PAINT.soot, { at: [0, -0.012, 0] }), cyl(0.012, 0.012, 0.008, PAINT.brass, { at: [0.004, 0, 0], rot: [0, 0, QUARTER] }, 8)]
  const lever = [limb([0, 0, 0], [0, 0.3, 0], 0.014, 0.011, PAINT.brass, 7), blob(0.034, [PAINT.walnutDeep, PAINT.walnutLight], { at: [0, 0.32, 0] }, 0.03, 2, 2), cyl(0.022, 0.022, 0.05, PAINT.brass, { at: [0, -0.01, -0.025], rot: [QUARTER, 0, 0] }, 8)]

  return [part('Cab_Shell', shell), part('Cab_Glass', glass, 'glass'), part('Cab_Glow', glow, 'glow'), hung('Cab_Needle', needle, [0, 0, 0]), hung('Cab_Lever', lever, [0, 0, 0])]
}

// ------------------------------------------------------------ clouds

function buildCloud(seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const pieces: BufferGeometry[] = []
  const puffs = 6 + Math.floor(random() * 4)
  for (let i = 0; i < puffs; i++) {
    const along = (i / (puffs - 1) - 0.5) * 2
    const size = (1.7 - Math.abs(along) * 0.8) * (0.8 + random() * 0.6)
    // Flat underneath, heaped on top.
    pieces.push(blob(size, [PAINT.cloudShade, PAINT.cloud], { at: [along * 4.2, size * 0.5 + random() * 0.4, (random() - 0.5) * 1.6], scale: [1.5, 0.82, 1] }, 0.14, seed + i))
  }
  return pieces
}

export function buildClouds(): Part[] {
  return [part('Cloud_1', buildCloud(11)), part('Cloud_2', buildCloud(23)), part('Cloud_3', buildCloud(37))]
}
