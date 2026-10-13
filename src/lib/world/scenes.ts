// Where the train goes. The library is a car of the train itself, built in
// the car's own space. The other three are scenes of their own, standing
// alone on the sea, each built in its own local space: origin at its site,
// +y up, the visitor arriving from +z.
//
//   the library car        a great bookcase where the benches were
//   the clocktower archive an octagonal stone room behind a great clock face
//   the coastal signpost   one weathered post in a field of dandelion clocks
//   the bus stop shelter   a lantern, a bench and a telephone box by the sea
import { BufferAttribute, BufferGeometry, Color } from 'three'
import { blob, box, cone, cyl, extrude, hung, limb, part, put, ring, roughen, slab, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { BOOK, CAR, LIBRARY, PLAQUE, PLAQUES, STOP, TOWER } from './spec.ts'
import { seeded, shoreHeight, valueNoise } from './terrain.ts'

const QUARTER = Math.PI / 2
const walnut = [PAINT.walnutDeep, PAINT.walnut] as const
const BINDINGS = [PAINT.moss, PAINT.rug, PAINT.walnut, PAINT.honey, PAINT.cornflowerDeep, PAINT.violet, PAINT.teal, PAINT.terracottaDeep, PAINT.leafDeep, PAINT.wine]

/** A row of books standing on a shelf, spines out toward +z. `fill` is how much of the shelf is still occupied. */
function bookRow(x0: number, x1: number, y: number, z: number, tallest: number, fill: number, random: () => number): BufferGeometry[] {
  const pieces: BufferGeometry[] = []
  for (let x = x0; x < x1 - 0.12; ) {
    const width = 0.1 + random() * 0.16
    const height = tallest * (0.62 + random() * 0.38)
    if (random() < fill) {
      const lean = random() < 0.08 ? (random() - 0.5) * 0.5 : 0
      const cover = BINDINGS[Math.floor(random() * BINDINGS.length)]
      pieces.push(box(width, height, 0.62, [cover, cover], { at: [x + width / 2, y, z], rot: [0, 0, lean] }))
      if (random() < 0.5) pieces.push(box(width + 0.006, 0.035, 0.63, PAINT.gold, { at: [x + width / 2, y + height * 0.72, z], rot: [0, 0, lean] }))
    }
    x += width + 0.02
  }
  return pieces
}

/** A thick old book lying flat, gilt across its spine. */
function tome(x: number, y: number, z: number, width: number, thickness: number, colour: string, turn: number): BufferGeometry[] {
  return [
    roughen(box(width, thickness, width * 0.72, [colour, colour], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 31 + y * 17)),
    box(width - 0.03, thickness - 0.03, width * 0.72 - 0.01, PAINT.oat, { at: [x + Math.cos(turn) * 0.012, y + 0.015, z - Math.sin(turn) * 0.012], rot: [0, turn, 0] }),
    box(width + 0.006, 0.012, 0.05, PAINT.brass, { at: [x, y + thickness * 0.5, z], rot: [0, turn, 0] }),
  ]
}

/** A toothed brass wheel of radius 1, lying in the x/y plane and centred, for the app to size and turn. */
function gear(teeth: number): BufferGeometry[] {
  const pieces = [cyl(1, 1, 0.12, [PAINT.brass, PAINT.gold], { at: [0, 0, -0.06], rot: [QUARTER, 0, 0] }, 20), cyl(0.3, 0.3, 0.2, PAINT.walnutDeep, { at: [0, 0, -0.1], rot: [QUARTER, 0, 0] }, 10)]
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    pieces.push(cyl(0.2, 0.2, 0.13, PAINT.walnutDeep, { at: [Math.cos(angle) * 0.62, Math.sin(angle) * 0.62, -0.065], rot: [QUARTER, 0, 0] }, 8))
  }
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2
    pieces.push(box(0.2, 0.2, 0.12, PAINT.gold, { at: [Math.cos(angle) * 1.02, Math.sin(angle) * 1.02 - 0.1, 0], rot: [0, 0, angle - QUARTER] }))
  }
  return pieces
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

// ------------------------------------------------------------ the clocktower archive

function armchair(x: number, z: number, yaw: number, colour: readonly [string, string], winged: boolean): BufferGeometry[] {
  const pieces: BufferGeometry[] = []
  for (const lx of [-0.38, 0.38]) for (const lz of [-0.34, 0.34]) pieces.push(cyl(0.05, 0.04, 0.18, PAINT.walnutDeep, { at: [lx, 0, lz] }, 6))
  pieces.push(box(0.96, 0.34, 0.9, colour, { at: [0, 0.17, 0] }))
  pieces.push(blob(0.42, [colour[1], colour[1]], { at: [0, 0.56, 0.04], scale: [1.02, 0.3, 0.98] }, 0.08, 2, 1))
  pieces.push(box(0.96, winged ? 1.25 : 0.72, 0.22, colour, { at: [0, 0.45, -0.42], rot: [-0.12, 0, 0] }))
  for (const side of [-1, 1]) {
    pieces.push(box(0.22, 0.42, 0.9, colour, { at: [side * 0.52, 0.34, 0] }), cyl(0.13, 0.13, 0.9, colour, { at: [side * 0.52, 0.78, -0.45], rot: [QUARTER, 0, 0] }, 8))
    if (winged) pieces.push(box(0.14, 0.62, 0.32, colour, { at: [side * 0.45, 1.05, -0.26], rot: [-0.12, 0, 0] }))
  }
  return pieces.map((piece) => put(piece, { at: [x, 0, z], rot: [0, yaw, 0] }))
}

/** A brass-framed chart hung from the roof on two chains. */
function chart(x: number, y: number, z: number, yaw: number, w: number, h: number, seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const pieces = [box(w, h, 0.03, [PAINT.oat, PAINT.cream], { at: [0, -h / 2, 0] })]
  for (const side of [-1, 1]) pieces.push(box(0.07, h + 0.14, 0.06, PAINT.brass, { at: [side * (w / 2 + 0.02), -h / 2 - 0.07, 0] }), box(0.02, TOWER.height - y - h / 2, 0.02, PAINT.iron, { at: [side * (w / 2 - 0.2), h / 2 + 0.05, 0] }))
  for (const end of [-1, 1]) pieces.push(box(w + 0.18, 0.07, 0.06, PAINT.brass, { at: [0, end * (h / 2 + 0.02) - 0.035, 0] }))
  // Coastlines and soundings, in brown ink.
  for (let i = 0; i < 3; i++) pieces.push(ring(0.18 + i * 0.16 + random() * 0.05, 0.012, PAINT.walnut, { at: [(random() - 0.5) * w * 0.35, (random() - 0.5) * h * 0.3, 0.02], scale: [1.3, 0.8, 1] }, 14))
  for (let i = 0; i < 5; i++) pieces.push(box(w * (0.2 + random() * 0.4), 0.012, 0.004, PAINT.walnut, { at: [(random() - 0.5) * w * 0.4, -h / 2 + 0.2 + i * (h - 0.4) * 0.22, 0.018], rot: [0, 0, (random() - 0.5) * 0.5] }))
  return pieces.map((piece) => put(piece, { at: [x, y, z], rot: [0, yaw, 0] }))
}

/**
 * The archive in the clocktower: eight stone walls, one of them a clock face
 * of glass that the afternoon comes in through; charts hanging from the
 * roof, armchairs that do not match, and a drafting table in the middle.
 */
export function buildTower(): Part[] {
  const A = TOWER.apothem
  const H = TOWER.height
  const W = 2 * A * Math.tan(Math.PI / 8) + 0.5
  const { y: clockY, radius: clockR } = TOWER.clock
  const stone = [PAINT.stoneDark, PAINT.stone] as const
  const random = seeded(606)
  const room: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Seven plain walls and the eighth with the hole for the clock.
  for (let k = 1; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2
    room.push(roughen(box(W, H, 0.7, stone, { at: [Math.sin(angle) * (A + 0.35), 0, Math.cos(angle) * (A + 0.35)], rot: [0, angle, 0] }), 0.04, k))
    // A band of timber round the room at head height, and a few stones standing proud.
    room.push(box(W, 0.26, 0.2, PAINT.walnutDeep, { at: [Math.sin(angle) * (A - 0.08), 4.6, Math.cos(angle) * (A - 0.08)], rot: [0, angle, 0] }))
    for (let i = 0; i < 5; i++) {
      const along = (random() - 0.5) * (W - 1.6)
      room.push(roughen(box(0.9 + random() * 0.7, 0.5, 0.2, i % 2 ? PAINT.stoneLight : PAINT.stoneDark, { at: [Math.sin(angle) * (A - 0.02) + Math.cos(angle) * along, 0.6 + random() * (H - 2), Math.cos(angle) * (A - 0.02) - Math.sin(angle) * along], rot: [0, angle, 0] }), 0.03, k * 10 + i))
    }
  }
  room.push(
    roughen(
      extrude(
        [
          [-W / 2, 0],
          [W / 2, 0],
          [W / 2, H],
          [-W / 2, H],
        ],
        0.7,
        stone,
        { at: [0, 0, A + 0.35] },
        [0, clockY, clockR],
      ),
      0.03,
      77,
    ),
  )
  // Floor of broad boards, and a roof of dark beams.
  for (let i = 0; i < 20; i++) room.push(slab(-A - 0.4 + i * ((A * 2 + 0.8) / 20), -A - 0.4 + (i + 1) * ((A * 2 + 0.8) / 20) - 0.03, -0.2, 0, -A - 0.4, A + 0.4, i % 2 ? PAINT.walnut : PAINT.walnutLight))
  room.push(slab(-A - 0.6, A + 0.6, H, H + 0.4, -A - 0.6, A + 0.6, PAINT.walnutDeep))
  for (const x of [-5, 0, 5]) room.push(slab(x - 0.2, x + 0.2, H - 0.5, H, -A, A, walnut))
  for (const z of [-5, 5]) room.push(slab(-A, A, H - 0.8, H - 0.5, z - 0.16, z + 0.16, walnut))

  // The clock: an iron rim, an inner ring, twelve marks, and the works behind it.
  const face = A + 0.02
  room.push(ring(clockR + 0.04, 0.17, PAINT.iron, { at: [0, clockY, face] }, 32), ring(clockR * 0.76, 0.06, PAINT.iron, { at: [0, clockY, face] }, 28), cyl(0.3, 0.3, 0.3, PAINT.brass, { at: [0, clockY, face - 0.15], rot: [QUARTER, 0, 0] }, 12))
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const long = i % 3 === 0
    room.push(box(long ? 0.16 : 0.09, long ? 0.7 : 0.42, 0.06, PAINT.iron, { at: [Math.sin(angle) * (clockR * 0.88), clockY + Math.cos(angle) * (clockR * 0.88) - (long ? 0.35 : 0.21) * Math.cos(angle), face], rot: [0, 0, -angle] }))
  }
  const glass = [cyl(clockR, clockR, 0.04, [PAINT.amberLight, PAINT.cream], { at: [0, clockY, A + 0.3], rot: [QUARTER, 0, 0] }, 32)]
  const hour = [box(0.2, clockR * 0.5, 0.05, PAINT.iron, { at: [0, -0.2, 0] }), cone(0.2, 0.36, PAINT.iron, { at: [0, clockR * 0.5 - 0.2, 0] }, 4)]
  const minute = [box(0.13, clockR * 0.8, 0.05, PAINT.iron, { at: [0, -0.3, 0] }), cone(0.14, 0.3, PAINT.iron, { at: [0, clockR * 0.8 - 0.3, 0] }, 4)]
  const pendulum = [box(0.07, 5.2, 0.05, PAINT.brass, { at: [0, -5.2, 0] }), cyl(0.5, 0.5, 0.1, [PAINT.brass, PAINT.gold], { at: [0, -5.3, -0.05], rot: [QUARTER, 0, 0] }, 18)]
  room.push(box(1.2, 0.3, 0.6, PAINT.iron, { at: [TOWER.pendulum[0], TOWER.pendulum[1], TOWER.pendulum[2]] }))

  // Bookshelves on the two side walls.
  for (const side of [-1, 1]) {
    const x = side * (A - 0.5)
    const unit: BufferGeometry[] = [box(5.4, 6.4, 0.1, PAINT.walnutDeep, { at: [0, 0, -0.3] })]
    for (const end of [-2.7, 2.7]) unit.push(box(0.12, 6.4, 0.7, walnut, { at: [end, 0, 0] }))
    for (let y = 0.1; y < 6.2; y += 1.02) {
      unit.push(box(5.4, 0.07, 0.7, PAINT.walnutLight, { at: [0, y, 0] }))
      if (y < 5.5) unit.push(...bookRow(-2.6, 2.6, y + 0.07, 0.02, 0.8, 0.88, random))
    }
    room.push(...unit.map((piece) => put(piece, { at: [x, 0, -0.5], rot: [0, -side * QUARTER, 0] })))
  }

  // Charts hung from the roof, at every height and angle.
  room.push(...chart(-4.6, 8.6, 1.5, 0.5, 2.6, 1.8, 1), ...chart(4.2, 9.6, 2.6, -0.4, 2.2, 2.6, 2), ...chart(-2.4, 10.6, -3.4, 0.2, 3, 1.9, 3), ...chart(3.6, 7.8, -3.6, -0.7, 2.1, 1.5, 4), ...chart(-5.6, 6.6, -3, 1.0, 1.8, 2.3, 5), ...chart(0.6, 11.4, 4.2, 0.1, 2.4, 1.6, 6))

  // Armchairs that were never a set, each with something beside it.
  room.push(...armchair(-4.4, 2.3, 2.2, [PAINT.wine, PAINT.wineLight], true), ...armchair(-5.4, -0.6, 1.5, [PAINT.moss, PAINT.mossLight], false), ...armchair(4.6, 1.6, -2.3, [PAINT.amberDeep, PAINT.honey], false), ...armchair(4.9, -2.9, -1.2, [PAINT.cornflowerDeep, PAINT.cornflower], true))
  room.push(cyl(0.34, 0.3, 0.52, walnut, { at: [-5.6, 0, 1.1] }, 9), ...tome(-5.6, 0.52, 1.1, 0.5, 0.1, PAINT.rug, 0.4), cyl(0.34, 0.3, 0.52, walnut, { at: [5.7, 0, -0.6] }, 9))
  room.push(cyl(0.05, 0.07, 1.5, PAINT.brass, { at: [TOWER.lamp[0], 0, TOWER.lamp[2]] }, 6), cyl(0.15, 0.32, 0.34, [PAINT.oat, PAINT.cream], { at: [TOWER.lamp[0], 1.46, TOWER.lamp[2]] }, 10))
  glow.push(blob(0.11, PAINT.lamp, { at: [TOWER.lamp[0], 1.55, TOWER.lamp[2]] }, 0.02, 1, 1))
  // Rugs, laid over one another.
  room.push(cyl(4.6, 4.6, 0.02, [PAINT.wine, PAINT.wine], { at: [0, 0, -0.4] }, 28), ring(4.2, 0.07, PAINT.brass, { at: [0, 0.025, -0.4], rot: [QUARTER, 0, 0], scale: [1, 1, 0.2] }, 28), ring(3.1, 0.05, PAINT.honey, { at: [0, 0.025, -0.4], rot: [QUARTER, 0, 0], scale: [1, 1, 0.2] }, 24))
  room.push(box(2.6, 0.02, 1.6, [PAINT.moss, PAINT.pine], { at: [-4.8, 0.01, 1], rot: [0, 0.5, 0] }))

  // The drafting table, and everything that has been put down on it.
  const [tx, ty, tz] = TOWER.table
  room.push(roughen(box(3.5, 0.09, 2.1, [PAINT.walnut, PAINT.walnutLight], { at: [tx, ty - 0.09, tz] }), 0.01, 9))
  for (const sx of [-1.4, 1.4]) room.push(limb([tx + sx, 0, tz + 0.8], [tx + sx, ty - 0.1, tz - 0.5], 0.06, 0.05, PAINT.walnutDeep, 6), limb([tx + sx, 0, tz - 0.8], [tx + sx, ty - 0.1, tz + 0.5], 0.06, 0.05, PAINT.walnutDeep, 6))
  room.push(cyl(0.06, 0.06, 1.3, [PAINT.oat, PAINT.white], { at: [tx + 0.5, ty + 0.06, tz - 0.7], rot: [0, 0.3, QUARTER] }, 7), cyl(0.05, 0.05, 1.0, PAINT.blueprintLight, { at: [tx + 0.9, ty + 0.05, tz - 0.4], rot: [0, -0.4, QUARTER] }, 7), cyl(0.055, 0.055, 0.9, PAINT.cream, { at: [tx - 0.1, ty + 0.055, tz - 0.85], rot: [0, 0.1, QUARTER] }, 7))
  room.push(...tome(tx + 1.15, ty, tz + 0.55, 0.55, 0.12, PAINT.moss, 0.3), ...tome(tx + 1.18, ty + 0.12, tz + 0.52, 0.46, 0.1, PAINT.rug, -0.4), ...tome(tx - 1.35, ty, tz + 0.6, 0.5, 0.1, PAINT.cornflowerDeep, 1.1))
  room.push(box(1.3, 0.008, 0.9, [PAINT.blueprint, PAINT.blueprintLight], { at: [tx + 0.7, ty, tz + 0.1], rot: [0, -0.25, 0] }), ring(0.2, 0.01, PAINT.white, { at: [tx + 0.7, ty + 0.012, tz + 0.1], rot: [QUARTER, 0, 0] }, 14))
  room.push(cyl(0.07, 0.085, 0.09, PAINT.ink, { at: [tx - 1.2, ty, tz - 0.3] }, 8), cyl(0.045, 0.045, 0.02, PAINT.brass, { at: [tx - 1.2, ty + 0.09, tz - 0.3] }, 8))
  room.push(ring(0.14, 0.014, PAINT.brass, { at: [tx + 0.2, ty + 0.014, tz + 0.75], rot: [QUARTER, 0, 0] }, 14), box(0.9, 0.012, 0.07, PAINT.woodPale, { at: [tx - 0.5, ty, tz + 0.82], rot: [0, 0.2, 0] }))
  room.push(cyl(0.085, 0.07, 0.15, [PAINT.terracottaDeep, PAINT.terracotta], { at: [tx + 1.45, ty, tz - 0.6] }, 10), ring(0.05, 0.012, PAINT.terracotta, { at: [tx + 1.56, ty + 0.08, tz - 0.6] }, 8))
  room.push(cyl(0.035, 0.04, 0.16, PAINT.cream, { at: [tx - 1.5, ty, tz - 0.75] }, 6), cyl(0.07, 0.07, 0.015, PAINT.brass, { at: [tx - 1.5, ty, tz - 0.75] }, 8))
  glow.push(cone(0.022, 0.07, [PAINT.flame, PAINT.flameCore], { at: [tx - 1.5, ty + 0.16, tz - 0.75] }, 5))
  // A globe, a trunk, and piles of books wherever there was floor.
  room.push(limb([-2.6, 0, -4.8], [-2.6, 0.9, -4.8], 0.06, 0.035, PAINT.brass, 6), blob(0.42, [PAINT.cornflowerDeep, PAINT.mist], { at: [-2.6, 1.25, -4.8] }, 0.02, 1), ring(0.48, 0.02, PAINT.brass, { at: [-2.6, 1.25, -4.8], rot: [0, 0.6, 0.4] }, 18))
  room.push(roughen(box(1.3, 0.62, 0.74, [PAINT.leatherDeep, PAINT.leather], { at: [2.4, 0, -5.2], rot: [0, -0.3, 0] }), 0.012, 4))
  for (const [px, pz, count] of [
    [-2.2, 2.6, 6],
    [2.4, 3.2, 4],
    [-6.4, -3.6, 5],
    [6.3, 3.4, 5],
    [1.2, -4.2, 3],
    [-1.1, 4.4, 4],
  ] as const) {
    let y = 0.03
    for (let i = 0; i < count; i++) {
      const thickness = 0.09 + random() * 0.07
      room.push(...tome(px + (random() - 0.5) * 0.12, y, pz + (random() - 0.5) * 0.12, 0.5 + random() * 0.16, thickness, BINDINGS[Math.floor(random() * BINDINGS.length)], (random() - 0.5) * 0.9))
      y += thickness
    }
  }

  // The afternoon, coming through the clock in bars: brightest at the glass, spent by the floor.
  const beams: BufferGeometry[] = []
  const reach = 13
  for (const x of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
    const tall = 2 * Math.sqrt(clockR * clockR - x * x) * 0.8
    const beam = box(0.62, tall, reach, [PAINT.soot, PAINT.soot], { at: [x, clockY - 0.25 * reach - tall / 2 + 0.1, A - 0.433 * reach], rot: [-Math.PI / 6, 0, 0] })
    const points = beam.getAttribute('position')
    const shade = beam.getAttribute('color')
    for (let i = 0; i < points.count; i++) {
      const spent = Math.min(1, Math.max(0, (A - points.getZ(i)) / (0.866 * reach)))
      const light = 0.13 * (1 - spent) * (1 - spent)
      shade.setXYZ(i, light, light * 0.78, light * 0.42)
    }
    beams.push(beam)
  }

  // The open sketchpad: wire-bound along its top, a page half drawn, the pencil beside it.
  const pad: BufferGeometry[] = [box(1.16, 0.03, 0.84, PAINT.walnutDeep, { at: [0, 0, 0] }), box(1.1, 0.035, 0.78, [PAINT.oat, PAINT.white], { at: [0, 0.03, 0] })]
  for (let i = 0; i < 11; i++) pad.push(ring(0.03, 0.007, PAINT.steel, { at: [-0.5 + i * 0.1, 0.05, -0.4], rot: [0, QUARTER, 0] }, 8))
  for (let line = 0; line < 6; line++) pad.push(box(0.5 - (line % 3) * 0.08, 0.003, 0.012, PAINT.ink, { at: [-0.22 - (line % 3) * 0.04, 0.067, -0.2 + line * 0.085] }))
  pad.push(ring(0.14, 0.006, PAINT.ink, { at: [0.3, 0.068, -0.08], rot: [QUARTER, 0, 0] }, 14), box(0.3, 0.003, 0.008, PAINT.ink, { at: [0.3, 0.067, 0.16], rot: [0, 0.4, 0] }), box(0.26, 0.003, 0.008, PAINT.ink, { at: [0.32, 0.067, 0.2], rot: [0, -0.3, 0] }))
  pad.push(limb([0.7, 0.03, 0.3], [0.86, 0.03, -0.2], 0.014, 0.014, PAINT.honey, 6), limb([0.86, 0.03, -0.2], [0.88, 0.03, -0.27], 0.014, 0.002, PAINT.woodPale, 5))

  return [
    part('Tower_Room', room),
    part('Tower_Glass', glass, 'glass'),
    part('Tower_Glow', glow, 'glow'),
    part('Tower_Beams', beams, 'light'),
    part('Tower_Gear', gear(14)),
    hung('Tower_Hour', hour, [0, clockY, A + 0.08]),
    hung('Tower_Minute', minute, [0, clockY, A + 0.14]),
    hung('Tower_Pendulum', pendulum, TOWER.pendulum),
    hung('Tower_Pad', pad, TOWER.pad),
  ]
}

// ------------------------------------------------------------ the coastal signpost

const paint = Object.fromEntries(Object.entries(PAINT).map(([name, hex]) => [name, new Color(hex)])) as Record<keyof typeof PAINT, Color>
const stroke = new Color()

/** The shore the signpost stands on: one sweep of meadow going down to sand and into the sea. */
function buildShore(): BufferGeometry {
  const across = 110
  const down = 60
  const x0 = -84
  const x1 = 84
  const z0 = -14
  const z1 = 60
  const positions = new Float32Array((across + 1) * (down + 1) * 3)
  const colors = new Float32Array((across + 1) * (down + 1) * 3)
  for (let j = 0; j <= down; j++) {
    for (let i = 0; i <= across; i++) {
      const x = x0 + ((x1 - x0) * i) / across
      // Finer near the water, where the camera is; coarser inland.
      const t = j / down
      const z = z0 + (z1 - z0) * t * t
      const h = shoreHeight(x, z)
      const o = (j * (across + 1) + i) * 3
      positions.set([x, h, z], o)
      const sun = valueNoise(x * 0.05 + 30, z * 0.05 - 12)
      stroke.copy(paint.mossLight).lerp(paint.clover, sun).lerp(paint.sunlit, Math.max(0, sun - 0.55) * 1.2)
      stroke.lerp(paint.sand, 1 - Math.min(1, Math.max(0, (h - 0.1) / 0.5)))
      stroke.lerp(paint.stoneDark, 1 - Math.min(1, Math.max(0, (h + 1.2) / 0.9)))
      stroke.multiplyScalar(0.94 + valueNoise(x * 1.9, z * 1.9) * 0.12)
      colors.set([stroke.r, stroke.g, stroke.b], o)
    }
  }
  const index: number[] = []
  for (let j = 0; j < down; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * (across + 1) + i
      index.push(a, a + across + 1, a + 1, a + 1, a + across + 1, a + across + 2)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

/** The shore, the post with its four plaques, and one dandelion clock for the app to sow across the field. */
export function buildCoast(): Part[] {
  const grey = [PAINT.bleachedDark, PAINT.bleached] as const
  const post = [
    roughen(cyl(0.13, 0.2, 3.9, grey, { at: [0, -0.3, 0], rot: [0.03, 0, -0.045] }, 7), 0.02, 3),
    cone(0.17, 0.24, PAINT.bleachedLight, { at: [-0.16, 3.58, 0.1] }, 7),
    blob(0.34, [PAINT.stoneDark, PAINT.stoneLight], { at: [0.3, 0.05, 0.22], scale: [1.2, 0.6, 1] }, 0.3, 4, 1),
    blob(0.24, [PAINT.stoneDark, PAINT.stone], { at: [-0.3, 0.03, -0.1], scale: [1, 0.6, 1.2] }, 0.3, 5, 1),
    // Lichen, and grass grown up round its foot.
    blob(0.12, PAINT.verdigris, { at: [0.1, 1.2, 0.14], scale: [1, 1.4, 0.3] }, 0.3, 6, 1),
    blob(0.1, PAINT.sunlit, { at: [-0.12, 2.3, 0.12], scale: [1, 1.2, 0.3] }, 0.3, 7, 1),
  ]
  for (let i = 0; i < 7; i++) post.push(cone(0.05, 0.5 + (i % 3) * 0.16, [PAINT.mossLight, PAINT.sunlit], { at: [Math.cos(i * 0.9) * 0.3, 0, Math.sin(i * 0.9) * 0.3], rot: [Math.sin(i) * 0.25, 0, Math.cos(i) * 0.25] }, 4))

  const { length, height, thickness, inset } = PLAQUE
  const plaques = PLAQUES.map(({ height: y, side, yaw }, i) => {
    const tone = i % 2 ? PAINT.bleachedLight : PAINT.woodPale
    const pieces = [
      box(length, height, thickness, [PAINT.bleachedDark, tone], { at: [side * (inset + length / 2), -height / 2, 0] }),
      // The pointed end: a square board turned on its corner.
      box(height / Math.SQRT2, height / Math.SQRT2, thickness, tone, { at: [side * (inset + length) + height / 4, -height / 4, 0], rot: [0, 0, QUARTER / 2] }),
      cyl(0.025, 0.025, 0.03, PAINT.iron, { at: [side * 0.3, -0.1, thickness / 2], rot: [QUARTER, 0, 0] }, 6),
      cyl(0.025, 0.025, 0.03, PAINT.iron, { at: [side * 0.3, 0.1, thickness / 2], rot: [QUARTER, 0, 0] }, 6),
    ]
    for (const piece of pieces) put(roughen(piece, 0.014, i), { rot: [0, yaw, side * (0.02 + i * 0.012)] })
    return hung(`Signpost_Plaque${i + 1}`, pieces, [-0.045 * y, y, 0.02])
  })

  // One dandelion gone to seed: a thin stalk and a ball of down.
  const dandelion = [limb([0, 0, 0], [0.03, 0.46, 0], 0.012, 0.008, [PAINT.mossLight, PAINT.sunlit], 4), blob(0.07, [PAINT.cream, PAINT.dandelion], { at: [0.03, 0.5, 0] }, 0.14, 2, 2), blob(0.03, PAINT.woodPale, { at: [0.03, 0.5, 0] }, 0.1, 3, 1)]

  const random = seeded(52)
  const rocks: BufferGeometry[] = []
  for (let i = 0; i < 9; i++) {
    const x = (random() * 2 - 1) * 30
    const z = -4 + random() * 3
    const size = 0.3 + random() * 0.6
    rocks.push(blob(size, [PAINT.stoneDark, PAINT.stoneLight], { at: [x, Math.max(-0.2, shoreHeight(x, z)) + size * 0.2, z], scale: [1.3, 0.6, 1], rot: [0, random() * 6, 0] }, 0.3, i, 1))
  }

  return [{ name: 'Coast_Land', geometry: buildShore(), material: 'paint' }, part('Coast_Rocks', rocks), part('Signpost_Post', post), ...plaques, part('Dandelion', dandelion)]
}

// ------------------------------------------------------------ the bus stop shelter

/** The lonely bus stop: a shelter with a lantern, a telephone box that glows, and a pole with four planks nailed to it. */
export function buildBusStop(): Part[] {
  const G = STOP.ground
  const weathered = [PAINT.bleachedDark, PAINT.bleached] as const
  const random = seeded(909)

  // The shore it stands on: gravel, a kerb of stones along the water, rough grass behind.
  const ground: BufferGeometry[] = [slab(-16, 16, -2, G, -12, 1.2, [PAINT.stoneDark, PAINT.cobble]), slab(-16, 16, G, G + 0.03, -12, -5.2, [PAINT.moss, PAINT.mossLight])]
  for (let x = -15.5; x < 15.8; x += 0.9 + random() * 0.5) ground.push(blob(0.3 + random() * 0.22, [PAINT.stoneDark, PAINT.stoneLight], { at: [x, G - 0.05, 1.2 + (random() - 0.5) * 0.3], scale: [1.2, 0.7, 1] }, 0.3, Math.round(x * 3), 1))
  for (let i = 0; i < 40; i++) {
    const x = (random() * 2 - 1) * 15
    const z = -5.4 - random() * 6
    ground.push(cone(0.06, 0.5 + random() * 0.6, [PAINT.moss, PAINT.clover], { at: [x, G, z], rot: [(random() - 0.5) * 0.4, 0, (random() - 0.5) * 0.4] }, 4))
  }
  for (const x of [-7.5, 8.2]) ground.push(roughen(cyl(0.13, 0.16, 1.5, weathered, { at: [x, G - 0.3, 0.9], rot: [0, 0, 0.04] }, 7), 0.012, Math.round(x)))

  // The shelter: three walls of weathered board, a lean-to roof, a bench.
  const [sx, sz] = STOP.shelter
  const shelter: BufferGeometry[] = []
  for (const x of [-2.3, 2.3]) {
    shelter.push(box(0.14, 2.6, 0.14, weathered, { at: [sx + x, G, sz + 0.95] }), box(0.14, 2.25, 0.14, weathered, { at: [sx + x, G, sz - 0.95] }))
    for (let i = 0; i < 5; i++) shelter.push(roughen(box(0.06, 1.2, 0.36, i % 2 ? PAINT.bleached : PAINT.bleachedDark, { at: [sx + x, G + 0.1, sz - 0.76 + i * 0.38] }), 0.008, i))
  }
  for (let i = 0; i < 12; i++) shelter.push(roughen(box(0.37, 2.15, 0.06, i % 3 ? PAINT.bleached : PAINT.bleachedDark, { at: [sx - 2.1 + i * 0.382, G + 0.05, sz - 0.95] }), 0.008, 20 + i))
  shelter.push(box(4.8, 0.12, 0.12, weathered, { at: [sx, G + 2.6, sz + 0.95] }), box(4.8, 0.1, 0.1, weathered, { at: [sx, G + 2.25, sz - 0.95] }))
  for (let i = 0; i < 9; i++) shelter.push(roughen(box(0.6, 0.06, 2.9, i % 2 ? PAINT.roofGrey : PAINT.stoneDark, { at: [sx - 2.4 + i * 0.6, G + 2.5, sz], rot: [0.185, 0, 0] }), 0.012, 40 + i))
  shelter.push(box(4.3, 0.09, 0.5, [PAINT.wood, PAINT.woodLight], { at: [sx, G + 0.5, sz - 0.6] }))
  for (const x of [-1.9, 0, 1.9]) shelter.push(box(0.09, 0.5, 0.42, PAINT.woodDark, { at: [sx + x, G, sz - 0.6] }))
  shelter.push(box(4.3, 0.34, 0.06, [PAINT.wood, PAINT.woodLight], { at: [sx, G + 0.86, sz - 0.86], rot: [-0.1, 0, 0] }))
  // A timetable nobody has changed in years, and a suitcase somebody is coming back for.
  shelter.push(box(1.1, 0.8, 0.04, [PAINT.oat, PAINT.cream], { at: [STOP.notice[0], G + STOP.notice[1] - 0.4, STOP.notice[2] - 0.02] }))
  shelter.push(roughen(box(0.72, 0.46, 0.26, [PAINT.leatherDeep, PAINT.leather], { at: [sx + 1.4, G, sz - 0.1], rot: [0, 0.2, 0] }), 0.01, 60))

  // The lantern, hung from the front beam.
  const [lx, ly, lz] = STOP.lantern
  shelter.push(box(0.016, 0.26, 0.016, PAINT.iron, { at: [lx, G + ly + 0.2, lz] }), box(0.26, 0.04, 0.26, PAINT.iron, { at: [lx, G + ly + 0.16, lz] }), cone(0.17, 0.12, PAINT.iron, { at: [lx, G + ly + 0.2, lz] }, 4), box(0.24, 0.03, 0.24, PAINT.iron, { at: [lx, G + ly - 0.17, lz] }))
  for (const [cx, cz] of [
    [0.1, 0.1],
    [-0.1, 0.1],
    [0.1, -0.1],
    [-0.1, -0.1],
  ] as const) {
    shelter.push(box(0.018, 0.32, 0.018, PAINT.iron, { at: [lx + cx, G + ly - 0.16, lz + cz] }))
  }
  const glow = [box(0.19, 0.3, 0.19, PAINT.lamp, { at: [lx, G + ly - 0.14, lz] })]

  // The telephone box.
  const [bx, bz] = STOP.booth
  const green = [PAINT.boothGreen, PAINT.boothGreenLight] as const
  const booth: BufferGeometry[] = [box(1.3, 0.1, 1.3, PAINT.stoneDark, { at: [0, G - 0.02, 0] })]
  for (const x of [-0.55, 0.55]) for (const z of [-0.55, 0.55]) booth.push(box(0.1, 2.4, 0.1, green, { at: [x, G + 0.06, z] }))
  booth.push(box(1.24, 0.36, 1.24, green, { at: [0, G + 2.44, 0] }), box(1.36, 0.08, 1.36, PAINT.boothGreen, { at: [0, G + 2.8, 0] }), cyl(0.2, 0.6, 0.2, green, { at: [0, G + 2.88, 0] }, 4), box(1.04, 0.24, 0.02, PAINT.cream, { at: [0, G + 2.5, 0.62] }))
  for (const y of [0.06, 1.0, 2.36]) {
    booth.push(box(1.1, 0.08, 0.08, green, { at: [0, G + y, -0.55] }))
    for (const x of [-0.55, 0.55]) booth.push(box(0.08, 0.08, 1.1, green, { at: [x, G + y, 0] }))
  }
  booth.push(box(1.0, 0.94, 0.04, green, { at: [0, G + 0.08, -0.55] }))
  for (const x of [-0.55, 0.55]) booth.push(box(0.04, 0.94, 1.0, green, { at: [x, G + 0.08, 0] }))
  // The telephone itself, on the back wall, over a shelf with the directory on it.
  booth.push(box(0.38, 0.52, 0.16, [PAINT.soot, PAINT.iron], { at: [0.06, G + 1.18, -0.44] }), cyl(0.1, 0.1, 0.03, PAINT.brass, { at: [0.06, G + 1.5, -0.35], rot: [QUARTER, 0, 0] }, 12), cyl(0.035, 0.035, 0.035, PAINT.iron, { at: [0.06, G + 1.5, -0.33], rot: [QUARTER, 0, 0] }, 8))
  booth.push(box(0.1, 0.03, 0.1, PAINT.brass, { at: [STOP.hook[0], G + STOP.hook[1] - 0.06, STOP.hook[2] - 0.1] }), box(0.7, 0.04, 0.26, PAINT.woodDark, { at: [0, G + 1.0, -0.36] }), ...tome(-0.05, G + 1.04, -0.36, 0.34, 0.07, PAINT.rug, 0.1))
  // Lit from inside: the panes are the light.
  const panes: BufferGeometry[] = [box(0.98, 1.3, 0.02, PAINT.lamp, { at: [0, G + 1.06, -0.54] })]
  for (const x of [-0.54, 0.54]) panes.push(box(0.02, 1.3, 0.98, PAINT.lamp, { at: [x, G + 1.06, 0] }))
  panes.push(blob(0.07, PAINT.lamp, { at: [0, G + 2.34, 0] }, 0.02, 1, 1))
  const receiver = [limb([0, -0.12, 0], [0, 0.12, 0], 0.022, 0.022, PAINT.soot, 6), blob(0.055, PAINT.soot, { at: [0, 0.14, 0.02], scale: [1, 0.8, 1.2] }, 0.05, 1, 1), blob(0.055, PAINT.soot, { at: [0, -0.14, 0.02], scale: [1, 0.8, 1.2] }, 0.05, 2, 1)]

  // The stop's own pole, with the round sign at its head.
  const pole = [roughen(cyl(0.06, 0.08, 3.1, [PAINT.iron, PAINT.steel], { at: [0, G - 0.1, 0], rot: [0, 0, 0.02] }, 7), 0.006), cyl(0.38, 0.38, 0.05, PAINT.terracotta, { at: [0.05, G + 2.78, 0.045], rot: [QUARTER, 0, 0] }, 16), cyl(0.31, 0.31, 0.06, PAINT.cream, { at: [0.05, G + 2.78, 0.05], rot: [QUARTER, 0, 0] }, 16)]
  const planks = STOP.planks.map((y, i) =>
    hung(`Stop_Plank${i + 1}`, [roughen(box(STOP.plank.width, STOP.plank.height, 0.05, i % 2 ? [PAINT.bleachedDark, PAINT.bleached] : [PAINT.wood, PAINT.woodPale], { at: [0.5, -STOP.plank.height / 2, 0], rot: [0, 0, (i % 2 ? 1 : -1) * 0.035] }), 0.012, i), cyl(0.022, 0.022, 0.03, PAINT.iron, { at: [0.04, 0, 0.025], rot: [QUARTER, 0, 0] }, 6)], [0, G + y, 0.08]),
  )

  return [
    part('Stop_Ground', ground),
    part('Stop_Shelter', shelter),
    part('Stop_Glow', glow, 'glow'),
    part('Stop_Booth', booth.map((piece) => put(piece, { at: [bx, 0, bz] }))),
    part('Stop_Panes', panes.map((piece) => put(piece, { at: [bx, 0, bz] })), 'glow'),
    hung('Stop_Receiver', receiver, [bx + STOP.hook[0], G + STOP.hook[1], bz + STOP.hook[2]]),
    part('Stop_Pole', pole.map((piece) => put(piece, { at: [STOP.pole[0], 0, STOP.pole[1]] }))),
    ...planks.map((plank) => ({ ...plank, pivot: [STOP.pole[0] + plank.pivot![0], plank.pivot![1], STOP.pole[1] + plank.pivot![2]] as const })),
  ]
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
