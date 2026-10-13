// The railway: one red railcar (the train is three of them), the halt that
// floats at the western end of the line, and the rails and telegraph posts
// that cross the sea between the halt and the town.
import type { BufferGeometry } from 'three'
import { blob, box, cyl, limb, mirrorZ, part, ring, roughen, slab, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { CAR, HALT } from './spec.ts'
import { DECK, seeded, TRACK } from './terrain.ts'

const QUARTER = Math.PI / 2
const amber = [PAINT.walnutLight, PAINT.amberDeep] as const

// ------------------------------------------------------------ the railcar

/** A slatted amber bench against a side wall. `side` is the wall it backs onto: 1 south, -1 north. */
function bench(x: number, z: number, side: 1 | -1): BufferGeometry[] {
  const back = z + side * 0.27
  const pieces = [
    box(1.62, 0.36, 0.42, amber, { at: [x, CAR.floor, z] }),
    box(1.72, 0.07, 0.54, PAINT.walnutLight, { at: [x, CAR.floor + 0.36, z] }),
    roughen(box(1.72, 0.42, 0.07, [PAINT.amberDeep, PAINT.amber], { at: [x, CAR.floor + 0.42, back] }), 0.006, Math.round(x * 10)),
  ]
  // Three slats to sit on, with daylight between them.
  for (let i = 0; i < 3; i++) pieces.push(box(1.7, 0.035, 0.15, i % 2 ? PAINT.amberDeep : PAINT.amber, { at: [x, CAR.floor + 0.43, z - 0.17 + i * 0.17] }))
  for (const end of [1, -1]) {
    pieces.push(box(0.07, 0.34, 0.52, PAINT.walnut, { at: [x + end * 0.86, CAR.floor + 0.43, z] }))
    pieces.push(blob(0.045, PAINT.brass, { at: [x + end * 0.86, CAR.floor + 0.8, z - side * 0.24] }, 0.02, 1, 1))
  }
  return pieces
}

/**
 * One railcar: red below the windows, cream above, a grey barrel roof. It is
 * hollow, with a real floor, benches, a leather runner and brass rails,
 * because the camera goes inside. All three cars of the train are this one.
 */
export function buildCar(): Part[] {
  const half = CAR.length / 2
  const W = CAR.halfWidth
  const red = [PAINT.redDeep, PAINT.red] as const
  const cream = [PAINT.oat, PAINT.cream] as const
  const body: BufferGeometry[] = []
  const glass: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Running gear. The wheels sit on rails that lie just at the water's surface.
  for (const x of [-3.4, -2.5, 2.5, 3.4]) {
    for (const side of [1, -1]) {
      body.push(cyl(0.4, 0.4, 0.12, PAINT.iron, { at: [x, 0.48, side * 0.8], rot: [-side * QUARTER, 0, 0] }, 12))
      body.push(cyl(0.16, 0.16, 0.05, PAINT.redDeep, { at: [x, 0.48, side * 0.83], rot: [-side * QUARTER, 0, 0] }, 8))
    }
  }
  for (const x of [-2.95, 2.95]) for (const side of [1, -1]) body.push(box(1.7, 0.14, 0.1, PAINT.iron, { at: [x, 0.52, side * 0.9] }))
  body.push(box(CAR.length - 0.3, 0.2, 2.2, PAINT.iron, { at: [0, 0.7, 0] }))
  for (const end of [1, -1]) body.push(box(0.5, 0.14, 0.2, PAINT.iron, { at: [end * (half + 0.12), 0.72, 0] }))

  body.push(slab(-half, half, CAR.floor - 0.1, CAR.floor, -W, W, [PAINT.walnutDeep, PAINT.walnut]))

  // Side walls: a red dado, a pillar between each pair of windows, a cream band under the roof.
  const bays = 6
  const bay = (CAR.length - 0.14) / bays
  for (const side of [1, -1]) {
    const inner = side * (W - 0.08)
    const outer = side * W
    body.push(slab(-half, half, CAR.floor, CAR.sill, inner, outer, red))
    body.push(slab(-half - 0.01, half + 0.01, CAR.sill - 0.1, CAR.sill - 0.02, outer, side * (W + 0.025), PAINT.gold))
    body.push(slab(-half, half, CAR.lintel, CAR.ceiling + 0.3, inner, outer, cream))
    for (let i = 0; i <= bays; i++) {
      const x = -half + 0.07 + i * bay
      body.push(slab(x - 0.07, x + 0.07, CAR.sill, CAR.lintel, inner, outer, red))
      if (i < bays) glass.push(slab(x + 0.07, x + bay - 0.07, CAR.sill, CAR.lintel, side * (W - 0.055), side * (W - 0.03), [PAINT.mist, PAINT.white]))
    }
  }

  // The ends, each with an open gangway to the next car.
  for (const end of [1, -1]) {
    const inner = end * (half - 0.08)
    const outer = end * half
    for (const side of [1, -1]) body.push(slab(inner, outer, CAR.floor, CAR.ceiling + 0.3, side * 0.46, side * W, red))
    body.push(slab(inner, outer, CAR.lintel, CAR.ceiling + 0.3, -0.46, 0.46, red))
    for (const side of [1, -1]) body.push(slab(end * (half - 0.1), end * (half + 0.01), CAR.floor, CAR.lintel, side * 0.44, side * 0.5, PAINT.brass))
  }

  // Roof: a low barrel over a flat ceiling.
  body.push(slab(-half + 0.06, half - 0.06, CAR.ceiling, CAR.ceiling + 0.05, -W + 0.06, W - 0.06, [PAINT.bleachedDark, PAINT.bleached]))
  body.push(cyl(1.47, 1.47, CAR.length + 0.3, [PAINT.soot, PAINT.roofGrey], { at: [-half - 0.15, CAR.ceiling + 0.3, 0], rot: [0, 0, -QUARTER], scale: [0.2, 1, 1] }, 16))
  body.push(box(CAR.length * 0.8, 0.12, 0.8, PAINT.roofGrey, { at: [0, CAR.ceiling + 0.56, 0] }))

  // Inside: the leather runner down the aisle, the south benches, brass to hold on to.
  body.push(slab(-3.85, 3.85, CAR.floor, CAR.floor + 0.02, -0.36, 0.36, [PAINT.leatherDeep, PAINT.leatherDeep]))
  for (const z of [-0.31, 0.31]) body.push(slab(-3.85, 3.85, CAR.floor + 0.02, CAR.floor + 0.026, z - 0.015, z + 0.015, PAINT.amberLight))
  for (const x of CAR.benches) body.push(...bench(x, -CAR.benchZ, 1))
  for (const x of [-1.84, 1.84]) for (const z of [-0.52, 0.52]) body.push(cyl(0.028, 0.028, CAR.ceiling - CAR.floor, PAINT.brass, { at: [x, CAR.floor, z] }, 7))
  for (const side of [1, -1]) {
    body.push(box(7.5, 0.04, 0.04, PAINT.brass, { at: [0, CAR.ceiling - 0.3, side * 0.62] }))
    for (let x = -3.6; x <= 3.61; x += 1.2) body.push(box(0.03, 0.3, 0.03, PAINT.brass, { at: [x, CAR.ceiling - 0.3, side * 0.62] }))
    // A row of strap rings to hold, each on its leather loop.
    for (let x = -3.3; x <= 3.31; x += 0.6) {
      body.push(box(0.025, 0.16, 0.05, PAINT.leatherDeep, { at: [x, CAR.ceiling - 0.46, side * 0.62] }))
      body.push(ring(0.085, 0.016, PAINT.cream, { at: [x, CAR.ceiling - 0.55, side * 0.62] }, 10))
    }
    // The luggage rack over the windows.
    body.push(slab(-3.9, 3.9, CAR.lintel + 0.06, CAR.lintel + 0.09, side * (W - 0.5), side * (W - 0.1), PAINT.brass))
    for (let x = -3.6; x <= 3.61; x += 1.8) body.push(limb([x, CAR.lintel + 0.07, side * (W - 0.5)], [x, CAR.lintel + 0.3, side * (W - 0.1)], 0.018, 0.018, PAINT.brass, 5))
  }
  body.push(roughen(box(0.7, 0.34, 0.42, [PAINT.leatherDeep, PAINT.leather], { at: [2.6, CAR.lintel + 0.09, W - 0.32] }), 0.01, 3))
  body.push(box(0.5, 0.26, 0.34, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [-1.4, CAR.lintel + 0.09, W - 0.3], rot: [0, 0.15, 0] }))

  for (const x of CAR.lamps) glow.push(blob(0.14, PAINT.lamp, { at: [x, CAR.ceiling - 0.04, 0], scale: [1, 0.45, 1] }, 0.02, 1, 1))

  // The headlamps: the app hangs these on the two ends of the train only.
  const lamps = [1, -1].flatMap((side) => [
    cyl(0.17, 0.17, 0.06, PAINT.brass, { at: [half, 1.5, side * 0.72], rot: [0, 0, -QUARTER] }, 10),
    cyl(0.13, 0.13, 0.08, PAINT.lamp, { at: [half, 1.5, side * 0.72], rot: [0, 0, -QUARTER] }, 10),
  ])

  return [part('Car_Body', body), part('Car_Bench', bench(0, 0, -1)), part('Car_Glass', glass, 'glass'), part('Car_Glow', glow, 'glow'), part('Car_Lamps', lamps, 'glow')]
}

// ------------------------------------------------------------ the halt

/**
 * A primitive plank platform on barrels: the whole of the first station. It is
 * drawn here on the north side of the rails and flipped to the south at the
 * end, so that from the open sea it lies in front of the train, pale and thin.
 */
export function buildHalt(): Part[] {
  const L = HALT.halfLength
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []
  // Bleached by salt and sun: the halt is the palest thing on the water.
  const planks = [PAINT.bleachedLight, PAINT.bleached, PAINT.bleachedDark, PAINT.bleached]

  for (let i = 0; i < 8; i++) {
    const z = -1.85 - i * 0.5
    pieces.push(roughen(slab(-L + (i % 3) * 0.08, L - (i % 2) * 0.1, DECK - 0.13, DECK, z - 0.235, z + 0.235, planks[i % 4]), 0.014, i))
  }
  for (const z of [-2.1, -3.6, -5.1]) pieces.push(slab(-L + 0.2, L - 0.2, DECK - 0.33, DECK - 0.13, z - 0.1, z + 0.1, PAINT.bleachedDark))
  // The barrels it floats on, low in the water.
  for (let x = -12; x <= 12.01; x += 4) {
    for (const z of [-2.5, -4.8]) {
      pieces.push(cyl(0.44, 0.44, 1.5, [PAINT.woodDark, PAINT.wood], { at: [x - 0.75, 0.26, z], rot: [0, 0, -QUARTER] }, 10))
      for (const band of [-0.45, 0.45]) pieces.push(cyl(0.455, 0.455, 0.07, PAINT.iron, { at: [x + band - 0.035, 0.26, z], rot: [0, 0, -QUARTER] }, 10))
    }
  }
  // Mooring piles at the corners, with a rope strung along the back.
  const piles: (readonly [number, number])[] = [
    [-L + 0.3, -5.75],
    [-10.4, -5.75],
    [10.4, -5.75],
    [L - 0.3, -5.75],
  ]
  piles.forEach(([x, z], i) => {
    pieces.push(roughen(cyl(0.1, 0.13, 2.9, [PAINT.bleachedDark, PAINT.bleachedLight], { at: [x, -0.9, z], rot: [0, 0, (i % 2 ? 1 : -1) * 0.02] }, 7), 0.012, i))
  })
  // A white rail along the back, so nobody steps off into the sea.
  // White rails at the two ends only; the middle is left open, for boarding and for the view.
  for (const end of [-1, 1]) {
    const from = Math.min(end * 10.4, end * (L - 0.3))
    const to = Math.max(end * 10.4, end * (L - 0.3))
    for (const y of [DECK + 0.5, DECK + 0.9]) pieces.push(slab(from, to, y, y + 0.06, -5.78, -5.72, PAINT.white))
    for (let x = from; x <= to + 0.01; x += (to - from) / 3) pieces.push(slab(x - 0.03, x + 0.03, DECK, DECK + 0.9, -5.78, -5.72, PAINT.white))
  }
  // One tall, thin mast with a lamp at its head: the halt's only vertical.
  pieces.push(limb([L - 1.4, DECK, -5.2], [L - 1.38, DECK + 7.6, -5.2], 0.05, 0.025, [PAINT.bleachedDark, PAINT.white], 6))
  glow.push(blob(0.1, PAINT.lamp, { at: [L - 1.38, DECK + 7.66, -5.2] }, 0.02, 1, 1))

  // The name board.
  const { at, width, height } = HALT.sign
  pieces.push(roughen(slab(at[0] - width / 2, at[0] + width / 2, at[1] - height / 2, at[1] + height / 2, at[2] - 0.05, at[2], [PAINT.oat, PAINT.cream]), 0.01, 40))
  pieces.push(slab(at[0] - width / 2 - 0.05, at[0] + width / 2 + 0.05, at[1] + height / 2, at[1] + height / 2 + 0.07, at[2] - 0.07, at[2] + 0.02, PAINT.woodDark))
  for (const end of [-1, 1]) pieces.push(cyl(0.06, 0.07, at[1] + height / 2 - DECK, [PAINT.woodDark, PAINT.wood], { at: [at[0] + end * (width / 2 - 0.2), DECK, at[2] - 0.1] }, 6))

  // A lamp, a bench to wait on, and somebody's luggage.
  const [lx, ly, lz] = HALT.lamp
  pieces.push(cyl(0.045, 0.07, ly - DECK - 0.2, PAINT.white, { at: [lx, DECK, lz] }, 7), box(0.34, 0.05, 0.34, PAINT.bleachedDark, { at: [lx, ly + 0.17, lz] }))
  glow.push(box(0.24, 0.36, 0.24, PAINT.lamp, { at: [lx, ly - 0.2, lz] }))
  pieces.push(...bench(2.2, -4.85, -1).map((piece) => piece.translate(0, DECK - CAR.floor, 0)))
  pieces.push(roughen(box(0.95, 0.5, 0.58, [PAINT.terracottaDeep, PAINT.terracotta], { at: [-1.6, DECK, -4.7], rot: [0, 0.25, 0] }), 0.012, 50))
  pieces.push(box(0.5, 0.34, 0.4, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [-1.65, DECK + 0.5, -4.7], rot: [0, -0.1, 0] }))
  pieces.push(cyl(0.16, 0.22, 0.5, [PAINT.stone, PAINT.stoneLight], { at: [-0.6, DECK, -5] }, 9), cyl(0.1, 0.16, 0.16, PAINT.stoneLight, { at: [-0.6, DECK + 0.5, -5] }, 9))
  // Three rungs down into the water at the western end.
  for (let i = 0; i < 3; i++) pieces.push(box(0.36, 0.06, 0.9, PAINT.wood, { at: [-L - 0.2 - i * 0.02, DECK - 0.3 - i * 0.33, -3] }))

  return [part('Halt_Deck', pieces.map(mirrorZ)), part('Halt_Glow', glow.map(mirrorZ), 'glow')]
}

// ------------------------------------------------------------ the line

/** The rails, lying at the surface of the sea, and one telegraph post for the app to repeat along them. */
export function buildLine(): Part[] {
  const rails: BufferGeometry[] = []
  for (const side of [1, -1]) rails.push(slab(TRACK.west, TRACK.east, -0.04, 0.085, side * 0.72 - 0.045, side * 0.72 + 0.045, PAINT.steel))
  rails.push(box(0.3, 1.1, 2.2, [PAINT.woodDark, PAINT.wood], { at: [TRACK.east + 0.2, -0.2, 0] }), box(0.34, 0.3, 2.3, PAINT.red, { at: [TRACK.east + 0.2, 0.75, 0] }))

  const post = [
    roughen(cyl(0.1, 0.15, 6.4, [PAINT.woodDark, PAINT.wood], { at: [0, -1.2, 0], rot: [0.02, 0, 0.03] }, 7), 0.015, 2),
    box(0.1, 0.1, 1.5, PAINT.wood, { at: [0.15, 4.6, 0] }),
    box(0.1, 0.1, 1.1, PAINT.wood, { at: [0.15, 4.15, 0] }),
  ]
  for (const z of [-0.6, -0.2, 0.2, 0.6]) post.push(blob(0.07, PAINT.verdigris, { at: [0.15, 4.76, z], scale: [1, 1.3, 1] }, 0.05, 1, 1))
  for (const z of [-0.4, 0.4]) post.push(blob(0.07, PAINT.verdigris, { at: [0.15, 4.31, z], scale: [1, 1.3, 1] }, 0.05, 2, 1))

  // A rock out at sea with one wind-bent pine: the only landmark the crossing has.
  const random = seeded(8)
  const rock: BufferGeometry[] = []
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const size = 1.6 + random() * 1.4
    rock.push(blob(size, [PAINT.stoneDark, PAINT.stoneLight], { at: [Math.cos(angle) * 1.8, size * 0.2 - 0.2, Math.sin(angle) * 1.5], scale: [1.2, 0.7 + random() * 0.4, 1], rot: [0, angle, 0] }, 0.3, i, 1))
  }
  rock.push(blob(1.5, [PAINT.moss, PAINT.clover], { at: [0.2, 1.9, 0], scale: [1.5, 0.35, 1.3] }, 0.2, 9, 1))
  rock.push(limb([0.4, 1.9, 0], [1.3, 4.2, 0.2], 0.2, 0.12, [PAINT.bark, PAINT.barkLight], 6), limb([1.3, 4.1, 0.2], [2.9, 5.2, 0.3], 0.12, 0.05, PAINT.barkLight, 5))
  for (const [x, y, z, r] of [
    [2.2, 5.3, 0.3, 1.2],
    [3.5, 5.6, 0.2, 0.9],
    [1.4, 4.7, -0.3, 0.8],
  ] as const) {
    rock.push(blob(r, [PAINT.pine, PAINT.pineLight], { at: [x, y, z], scale: [1.5, 0.5, 1.1] }, 0.25, Math.round(r * 10), 1))
  }

  return [part('Line_Rails', rails), part('Line_Post', post), part('Sea_Rock', rock)]
}
