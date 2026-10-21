// What the train is fitted out with, each built in the space of the car it goes in
// x runs along the car, z across it with north negative, and the floor sits at CAR.floor
import { type BufferGeometry, Color } from 'three'
import { blob, box, cone, cyl, hung, limb, part, ring, roughen, slab, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { BOOK, CAB, CAR, CINEMA, COMPARTMENT, MAIL } from './spec.ts'
import { seeded } from './terrain.ts'

const QUARTER = Math.PI / 2
const walnut = [PAINT.walnutDeep, PAINT.walnut] as const
const BINDINGS = [PAINT.moss, PAINT.rug, PAINT.walnut, PAINT.honey, PAINT.cornflowerDeep, PAINT.violet, PAINT.teal, PAINT.terracottaDeep, PAINT.leafDeep, PAINT.wine]

/** A thick old book lying flat, gilt across its spine */
function tome(x: number, y: number, z: number, width: number, thickness: number, colour: string, turn: number): BufferGeometry[] {
  return [
    roughen(box(width, thickness, width * 0.72, [colour, colour], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 31 + y * 17)),
    box(width - 0.03, thickness - 0.03, width * 0.72 - 0.01, PAINT.oat, { at: [x + Math.cos(turn) * 0.012, y + 0.015, z - Math.sin(turn) * 0.012], rot: [0, turn, 0] }),
    box(width + 0.006, 0.012, 0.05, PAINT.brass, { at: [x, y + thickness * 0.5, z], rot: [0, turn, 0] }),
  ]
}

// ============================================================ the picture car

const mix = (a: string, b: string, t: number) => '#' + new Color(a).lerp(new Color(b), t).getHexString()
/** Bindings gone soft with age, for the odd book left lying about */
const FADED = BINDINGS.map((binding) => mix(binding, PAINT.walnutLight, 0.36))

/** What turns the middle car into a picture house, a screen, a lantern and a rack of tins */
export function buildCinema(): Part[] {
  const F = CAR.floor
  const { screen, lens, tins } = CINEMA
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // The screen, a pale sheet on a roller weighted with a batten and hung on cords
  pieces.push(box(0.012, screen.top - screen.bottom, screen.width, [PAINT.oat, PAINT.white], { at: [screen.x, F + screen.bottom, screen.z] }))
  pieces.push(cyl(0.05, 0.05, screen.width + 0.12, walnut, { at: [screen.x, F + screen.top + 0.04, screen.z - screen.width / 2 - 0.06], rot: [QUARTER, 0, 0] }, 8))
  pieces.push(box(0.035, 0.035, screen.width + 0.04, [PAINT.walnut, PAINT.walnutLight], { at: [screen.x, F + screen.bottom - 0.035, screen.z] }))
  for (const side of [-1, 1]) pieces.push(cyl(0.006, 0.006, CAR.ceiling - F - screen.top - 0.08, PAINT.woodPale, { at: [screen.x, F + screen.top + 0.08, screen.z + side * (screen.width / 2 - 0.1)] }, 4))
  pieces.push(cyl(0.004, 0.004, 0.22, PAINT.woodPale, { at: [screen.x - 0.02, F + screen.bottom - 0.25, screen.z + 0.7] }, 4), blob(0.022, PAINT.walnut, { at: [screen.x - 0.02, F + screen.bottom - 0.27, screen.z + 0.7] }, 0.02, 1, 1))

  // The projector, a lamp house on a tripod with a chimney, a lens and two arms
  const [lx, ly, lz] = lens
  const body = lx - 0.36
  for (const [dx, dz] of [
    [-0.42, 0],
    [0.24, 0.36],
    [0.24, -0.36],
  ]) {
    pieces.push(limb([body + dx, F, lz + dz], [body, F + ly - 0.2, lz], 0.022, 0.03, [PAINT.wood, PAINT.woodLight], 6))
  }
  pieces.push(box(0.2, 0.05, 0.2, PAINT.brass, { at: [body, F + ly - 0.22, lz] }))
  pieces.push(roughen(box(0.46, 0.34, 0.28, [PAINT.walnutDeep, PAINT.walnut], { at: [body, F + ly - 0.17, lz] }), 0.004, 71))
  for (const x of [-0.2, 0.2]) pieces.push(box(0.03, 0.35, 0.3, PAINT.brass, { at: [body + x, F + ly - 0.175, lz] }))
  pieces.push(cyl(0.05, 0.065, 0.2, PAINT.iron, { at: [body - 0.06, F + ly + 0.17, lz] }, 8), cone(0.085, 0.07, PAINT.iron, { at: [body - 0.06, F + ly + 0.37, lz] }, 8))
  pieces.push(cyl(0.062, 0.075, 0.16, PAINT.brass, { at: [lx - 0.14, F + ly, lz], rot: [0, 0, -QUARTER] }, 12), cyl(0.07, 0.07, 0.03, PAINT.iron, { at: [lx - 0.01, F + ly, lz], rot: [0, 0, -QUARTER] }, 12))
  glow.push(cyl(0.05, 0.05, 0.012, PAINT.lamp, { at: [lx + 0.02, F + ly, lz], rot: [0, 0, -QUARTER] }, 12))
  for (const [rx, ry] of CINEMA.reels) pieces.push(limb([body + (rx - body) * 0.25, F + ly + 0.15, lz + 0.11], [rx, F + ry, lz + 0.11], 0.014, 0.012, PAINT.iron, 5))
  // A crank on its near side
  pieces.push(cyl(0.012, 0.012, 0.08, PAINT.brass, { at: [body + 0.05, F + ly - 0.02, lz + 0.14], rot: [QUARTER, 0, 0] }, 6), box(0.014, 0.1, 0.014, PAINT.brass, { at: [body + 0.05, F + ly - 0.02, lz + 0.215] }), blob(0.02, PAINT.walnut, { at: [body + 0.05, F + ly + 0.09, lz + 0.235] }, 0.02, 2, 1))

  // The rack of tins, on a cabinet of shallow drawers where the north benches were
  const [west, east] = [tins.xs[0] - 0.24, tins.xs[tins.xs.length - 1] + 0.24]
  pieces.push(slab(west, east, F, F + tins.shelf - 0.03, NORTH, -0.8, walnut), roughen(slab(west - 0.02, east + 0.02, F + tins.shelf - 0.03, F + tins.shelf, NORTH, -0.77, [PAINT.walnut, PAINT.walnutLight]), 0.003, 72))
  const drawer = (east - west) / 3
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 4; row++) {
      const x = west + drawer * (column + 0.5)
      const y = F + 0.05 + row * 0.172
      pieces.push(box(drawer - 0.04, 0.15, 0.02, [PAINT.walnut, PAINT.walnutLight], { at: [x, y, -0.79] }), box(0.09, 0.016, 0.018, PAINT.brass, { at: [x, y + 0.066, -0.776] }))
    }
  }
  for (const z of [tins.z - 0.06, tins.z + 0.06]) pieces.push(slab(west + 0.04, east - 0.04, F + tins.shelf, F + tins.shelf + 0.05, z - 0.012, z + 0.012, [PAINT.wood, PAINT.woodLight]))
  for (const x of [...tins.xs.map((tin) => tin - 0.18), east - 0.06]) pieces.push(slab(x - 0.01, x + 0.01, F + tins.shelf, F + tins.shelf + 0.12, tins.z - 0.07, tins.z + 0.07, [PAINT.wood, PAINT.woodLight]))
  // A book left on the floor beside it
  pieces.push(...tome(west - 0.3, F, -1.02, 0.26, 0.05, FADED[2], 0.4), ...tome(west - 0.28, F + 0.05, -1.03, 0.22, 0.04, FADED[6], -0.2))

  // The light the lantern throws, bright at the lens and gone before the audience
  const beam = [cyl(0.5, 0.045, 1.85, [PAINT.lamp, '#000000'], { at: [lx + 0.03, F + ly, lz], rot: [0, 0, -QUARTER] }, 20)]

  // A reel and a tin, each built about its own middle, for the app to turn and lift
  const reel: BufferGeometry[] = [ring(0.14, 0.012, PAINT.iron, { at: [0, 0, -0.02] }, 18), ring(0.14, 0.012, PAINT.iron, { at: [0, 0, 0.02] }, 18), cyl(0.09, 0.09, 0.036, PAINT.soot, { at: [0, 0, -0.018], rot: [QUARTER, 0, 0] }, 14), cyl(0.025, 0.025, 0.06, PAINT.brass, { at: [0, 0, -0.03], rot: [QUARTER, 0, 0] }, 8)]
  for (let i = 0; i < 3; i++) reel.push(box(0.27, 0.02, 0.006, PAINT.iron, { at: [0, -0.01, 0.022], rot: [0, 0, (i / 3) * Math.PI] }), box(0.27, 0.02, 0.006, PAINT.iron, { at: [0, -0.01, -0.022], rot: [0, 0, (i / 3) * Math.PI] }))
  const tin = [cyl(tins.radius, tins.radius, 0.05, [PAINT.stoneDark, PAINT.steel], { at: [0, 0, -0.025], rot: [QUARTER, 0, 0] }, 20), ring(tins.radius, 0.008, PAINT.brass, { at: [0, 0, 0.022] }, 20)]
  const label = [cyl(tins.radius * 0.74, tins.radius * 0.74, 0.004, ['#cdbba3', '#f2e6d4'], { at: [0, 0, 0.025], rot: [QUARTER, 0, 0] }, 20)]

  return [part('Cinema_Fittings', pieces), part('Cinema_Glow', glow, 'glow'), part('Cinema_Beam', beam, 'light'), hung('Cinema_Reel', reel, [0, 0, 0]), hung('Cinema_Tin', tin, [0, 0, 0]), hung('Cinema_Label', label, [0, 0, 0])]
}

/** The journal, a bound book that lies flat and opens about its spine */
export function buildBook(): Part[] {
  const { width: W, height: H, thickness: T, board: b } = BOOK
  const neutral = ['#cdbba3', '#f2e6d4'] as const
  const half = T / 2
  const bands = [-H * 0.3, 0, H * 0.3]
  const backBoard = [box(W, b, H, neutral, { at: [0, 0, 0] }), box(0.016, half - 0.004, H, neutral, { at: [-W / 2 - 0.004, 0, 0] })]
  for (const z of bands) backBoard.push(box(0.022, half - 0.003, 0.02, neutral, { at: [-W / 2 - 0.005, -0.001, z] }))
  const leavesRight = [box(W - 0.022, half - b, H - 0.036, [PAINT.oat, PAINT.white], { at: [-0.009, b, 0] })]
  for (const side of [-1, 1]) leavesRight.push(box(0.052, b + 0.004, 0.052, PAINT.brass, { at: [W / 2 - 0.024, -0.002, side * (H / 2 - 0.024)] }))
  // These two are built from the hinge outward
  const frontBoard = [box(W, b, H, neutral, { at: [W / 2, half - b, 0] }), box(0.016, half - 0.004, H, neutral, { at: [-0.004, 0.004, 0] })]
  for (const z of bands) frontBoard.push(box(0.022, half - 0.003, 0.02, neutral, { at: [-0.005, 0.004, z] }))
  const leavesLeft = [box(W - 0.022, half - b, H - 0.036, [PAINT.oat, PAINT.white], { at: [W / 2 - 0.009, 0, 0] })]
  for (const side of [-1, 1]) leavesLeft.push(box(0.052, b + 0.004, 0.052, PAINT.brass, { at: [W - 0.024, half - b - 0.002, side * (H / 2 - 0.024)] }))
  const hinge = [-W / 2, half, 0] as const
  return [part('Book_Back', backBoard), part('Book_LeavesRight', leavesRight), hung('Book_Front', frontBoard, hinge), hung('Book_LeavesLeft', leavesLeft, hinge)]
}

// ============================================================ the compartment

/** The inner face of the north wall of the car */
const NORTH = -CAR.halfWidth + 0.08
/** A slab one side of the middle or the other, by its near and far edge */
const flank = (side: number, near: number, far: number, y0: number, y1: number, z0: number, z1: number, colour: Parameters<typeof slab>[6]) => (side > 0 ? slab(near, far, y0, y1, z0, z1, colour) : slab(-far, -near, y0, y1, z0, z1, colour))

/** A corner of the middle car, two seats facing across a table, with curtains and a lamp */
export function buildCompartment(): Part[] {
  const F = CAR.floor
  const velvet = [PAINT.wine, PAINT.wineLight] as const
  const { seat, table } = COMPARTMENT
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  for (const side of [-1, 1]) {
    // The high panelled back that makes this a place of its own, and its seat
    pieces.push(roughen(flank(side, seat + 0.58, seat + 0.66, F, F + 1.66, NORTH, -0.2, walnut), 0.004, side + 5))
    pieces.push(flank(side, seat + 0.55, seat + 0.69, F + 1.66, F + 1.7, NORTH, -0.17, PAINT.brass))
    pieces.push(flank(side, seat, seat + 0.58, F, F + 0.4, NORTH + 0.02, -0.24, walnut))
    pieces.push(roughen(flank(side, seat - 0.02, seat + 0.56, F + 0.4, F + 0.5, NORTH + 0.03, -0.25, velvet), 0.01, side + 9))
    pieces.push(roughen(flank(side, seat + 0.45, seat + 0.58, F + 0.5, F + 1.2, NORTH + 0.03, -0.25, velvet), 0.01, side + 13))
    // An arm at the aisle end, with a brass knob on it
    pieces.push(flank(side, seat + 0.02, seat + 0.58, F + 0.5, F + 0.68, -0.26, -0.2, walnut), blob(0.04, PAINT.brass, { at: [side * (seat + 0.04), F + 0.7, -0.23] }, 0.02, 1, 1))
    // Curtains, gathered back either side of each window
    for (const x of [0.15, 1.16]) {
      pieces.push(roughen(box(0.17, 1.14, 0.05, [PAINT.terracottaDeep, PAINT.terracotta], { at: [side * x, F + 0.84, NORTH + 0.035] }), 0.014, Math.round(side * x * 20)))
      pieces.push(box(0.19, 0.03, 0.06, PAINT.brass, { at: [side * x, F + 1.2, NORTH + 0.035] }))
    }
  }
  pieces.push(box(2.75, 0.022, 0.022, PAINT.brass, { at: [0, F + 1.98, NORTH + 0.04] }))

  // The table, on two brass brackets from the wall
  pieces.push(roughen(slab(-table.half, table.half, F + table.top - 0.035, F + table.top, NORTH, table.front, [PAINT.walnut, PAINT.walnutLight]), 0.003, 3))
  for (const x of [-table.half + 0.12, table.half - 0.12]) pieces.push(limb([x, F + table.top - 0.03, table.front - 0.06], [x, F + 0.36, NORTH + 0.02], 0.016, 0.016, PAINT.brass, 6))
  // On it, beside the journal, tea, a pencil and a pot of something green
  const top = F + table.top
  pieces.push(cyl(0.045, 0.035, 0.075, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [COMPARTMENT.mug[0], top, COMPARTMENT.mug[2]] }, 9), ring(0.024, 0.007, PAINT.cornflower, { at: [COMPARTMENT.mug[0] + 0.052, top + 0.04, COMPARTMENT.mug[2]] }, 8))
  pieces.push(limb([-0.44, top + 0.008, -0.86], [-0.35, top + 0.008, -1.02], 0.006, 0.006, PAINT.honey, 5))
  pieces.push(cyl(0.05, 0.038, 0.07, [PAINT.terracottaDeep, PAINT.terracotta], { at: [-0.44, top, -1.17] }, 8))
  for (let i = 0; i < 5; i++) pieces.push(blob(0.035 + (i % 2) * 0.012, [PAINT.leafDeep, PAINT.leaf], { at: [-0.44 + Math.cos(i * 1.3) * 0.04, top + 0.1 + (i % 3) * 0.03, -1.17 + Math.sin(i * 1.3) * 0.03], scale: [1, 0.6, 1] }, 0.3, i, 1))

  // A lamp on the window post over the table
  pieces.push(limb([0, F + 1.7, NORTH], [0, F + 1.74, NORTH + 0.14], 0.011, 0.011, PAINT.brass, 6), cyl(0.045, 0.085, 0.09, [PAINT.oat, PAINT.cream], { at: [0, F + 1.64, NORTH + 0.14] }, 10))
  glow.push(blob(0.032, PAINT.lamp, { at: [0, F + 1.65, NORTH + 0.14] }, 0.02, 1, 1))

  // A trunk up on the rack
  pieces.push(roughen(box(0.78, 0.3, 0.36, [PAINT.walnut, PAINT.woodLight], { at: [-0.75, CAR.lintel + 0.09, -1.05] }), 0.008, 51), box(0.8, 0.03, 0.38, PAINT.brass, { at: [-0.75, CAR.lintel + 0.2, -1.05] }))
  // A rug between the seats
  pieces.push(slab(-seat + 0.04, seat - 0.04, F + 0.001, F + 0.012, NORTH + 0.1, -0.3, [PAINT.rug, PAINT.terracottaDeep]), slab(-seat + 0.1, seat - 0.1, F + 0.012, F + 0.016, NORTH + 0.16, -0.36, [PAINT.terracottaDeep, PAINT.terracotta]))

  // One ticket for the app to tuck along the window frame, with a coloured stub
  const ticket = [box(0.15, 0.085, 0.004, [PAINT.oat, PAINT.white], { at: [0, 0, 0] }), box(0.034, 0.085, 0.005, PAINT.terracotta, { at: [-0.058, 0, 0] })]

  return [part('Compartment_Fittings', pieces), part('Compartment_Glow', glow, 'glow'), hung('Ticket', ticket, [0, 0, 0])]
}

// ============================================================ the mail car

/** A parcel done up in brown paper and string */
function parcel(x: number, y: number, z: number, w: number, h: number, d: number, turn: number): BufferGeometry[] {
  return [
    roughen(box(w, h, d, [PAINT.pathEdge, PAINT.path], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 13 + z * 7)),
    box(w + 0.006, h + 0.006, 0.014, PAINT.bleachedLight, { at: [x, y - 0.003, z], rot: [0, turn, 0] }),
    box(0.014, h + 0.006, d + 0.006, PAINT.bleachedLight, { at: [x, y - 0.003, z], rot: [0, turn, 0] }),
  ]
}

/** A sorting frame of pigeonholes over a desk, with parcels round it */
export function buildMail(): Part[] {
  const F = CAR.floor
  const random = seeded(47)
  const { west, east, desk, rows, columns, shelf, depth } = MAIL
  const frame: BufferGeometry[] = []
  const fittings: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // The desk, a deep top on a carcass of drawers
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
  // The board behind the desk
  frame.push(slab(west, east, F + desk, F + shelf, NORTH, NORTH + 0.03, [PAINT.pine, PAINT.moss]))

  // The pigeonholes
  const cell = (east - west) / columns
  const rise = (MAIL.top - shelf) / rows
  frame.push(slab(west, east, F + shelf, F + MAIL.top, NORTH, NORTH + 0.02, PAINT.walnutDeep))
  for (let column = 0; column <= columns; column++) frame.push(slab(west + column * cell - 0.012, west + column * cell + 0.012, F + shelf, F + MAIL.top, NORTH, NORTH + depth, walnut))
  for (let row = 0; row <= rows; row++) frame.push(slab(west - 0.012, east + 0.012, F + shelf + row * rise - 0.012, F + shelf + row * rise + 0.012, NORTH, NORTH + depth + (row === 0 ? 0.03 : 0), [PAINT.walnut, PAINT.walnutLight]))
  frame.push(slab(west - 0.04, east + 0.04, F + MAIL.top + 0.012, F + MAIL.top + 0.05, NORTH, NORTH + depth + 0.03, [PAINT.walnut, PAINT.walnutLight]))
  // Letters in most of them, bundled and leaning
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
  // Four of them have a brass plate, and the app writes a name on each
  for (const [column, row] of MAIL.named) frame.push(box(cell - 0.07, 0.05, 0.008, PAINT.brass, { at: [west + (column + 0.5) * cell, F + shelf + row * rise - 0.025, NORTH + depth + 0.012] }))

  // On the desk, an oil lamp, a stamp and pad, a bundle of letters and a pen
  const top = F + desk
  fittings.push(cyl(0.06, 0.075, 0.05, PAINT.brass, { at: [-1.05, top, -0.84] }, 10), cyl(0.03, 0.045, 0.05, PAINT.brass, { at: [-1.05, top + 0.05, -0.84] }, 8), cyl(0.028, 0.05, 0.16, [PAINT.mist, PAINT.white], { at: [-1.05, top + 0.1, -0.84] }, 8))
  glow.push(blob(0.03, PAINT.lamp, { at: [-1.05, top + 0.15, -0.84], scale: [1, 1.6, 1] }, 0.02, 1, 1))
  fittings.push(box(0.14, 0.022, 0.09, PAINT.soot, { at: [0.45, top, -0.86] }), box(0.12, 0.006, 0.07, PAINT.rug, { at: [0.45, top + 0.022, -0.86] }))
  fittings.push(cyl(0.022, 0.03, 0.035, PAINT.brass, { at: [0.62, top, -0.92] }, 8), cyl(0.014, 0.014, 0.06, walnut, { at: [0.62, top + 0.035, -0.92] }, 6), blob(0.022, PAINT.walnut, { at: [0.62, top + 0.1, -0.92] }, 0.02, 1, 1))
  let stack = top
  for (let i = 0; i < 6; i++) {
    fittings.push(box(0.22, 0.008, 0.13, i % 2 ? PAINT.oat : PAINT.white, { at: [-0.55 + (random() - 0.5) * 0.012, stack, -0.92], rot: [0, 0.2 + (random() - 0.5) * 0.08, 0] }))
    stack += 0.008
  }
  fittings.push(box(0.012, 0.052, 0.14, PAINT.terracotta, { at: [-0.55, top - 0.002, -0.92], rot: [0, 0.2, 0] }))
  fittings.push(limb([0.2, top + 0.006, -0.8], [0.34, top + 0.006, -0.9], 0.005, 0.004, PAINT.soot, 5))

  // Parcels wherever there is room for them
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

  // The card on the desk, for the app to lift when it is pointed at
  const card = [box(0.31, 0.004, 0.2, [PAINT.oat, PAINT.white], { at: [0, 0, 0] }), box(0.004, 0.005, 0.16, PAINT.bleachedDark, { at: [0.02, 0, 0] }), box(0.05, 0.005, 0.06, PAINT.terracotta, { at: [0.115, 0, -0.055] })]

  return [part('Mail_Frame', frame), part('Mail_Fittings', fittings), part('Mail_Glow', glow, 'glow'), hung('Mail_Card', card, [0, 0, 0])]
}

/** A low slatted rack under a window, two tiers, for parcels */
function lowRack(x0: number, x1: number): BufferGeometry[] {
  const F = CAR.floor
  const pieces: BufferGeometry[] = []
  for (const x of [x0, x1 - 0.04]) for (const z of [NORTH + 0.02, -0.82]) pieces.push(slab(x, x + 0.04, F, F + 0.5, z, z + 0.04, walnut))
  for (const y of [0.05, 0.46]) for (let i = 0; i < 4; i++) pieces.push(slab(x0, x1, F + y - 0.02, F + y, NORTH + 0.03 + i * 0.12, NORTH + 0.11 + i * 0.12, [PAINT.wood, PAINT.woodLight]))
  return pieces
}

// ============================================================ the cab

/** The cab at the head of the train, a windscreen over a desk of gauges and levers */
export function buildCab(): Part[] {
  const F = CAR.floor
  const W = CAR.halfWidth
  const { back, front, sill, head, board } = CAB
  const red = [PAINT.redDeep, PAINT.red] as const
  const cream = [PAINT.oat, PAINT.cream] as const
  const shell: BufferGeometry[] = []
  const glass: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Floor and roof, as in the cars behind
  shell.push(slab(back, front, F - 0.1, F, -W, W, [PAINT.walnutDeep, PAINT.walnut]))
  for (let i = 0; i < 9; i++) shell.push(slab(back + 0.1, front - 0.7, F, F + 0.004, -1.2 + i * 0.3 - 0.004, -1.2 + i * 0.3 + 0.004, PAINT.walnutDeep))
  shell.push(slab(back, front, CAR.ceiling, CAR.ceiling + 0.05, -W, W, [PAINT.bleachedDark, PAINT.bleached]), slab(back - 0.1, front + 0.1, CAR.ceiling + 0.05, CAR.ceiling + 0.3, -W - 0.05, W + 0.05, [PAINT.soot, PAINT.roofGrey]))

  // Side walls, red below, cream above, one window each
  for (const side of [1, -1]) {
    const inner = side * (W - 0.08)
    const z0 = Math.min(inner, side * W)
    const z1 = Math.max(inner, side * W)
    shell.push(slab(back, front, F, F + sill, z0, z1, red), slab(back, front, F + head, CAR.ceiling + 0.3, z0, z1, cream))
    for (const x of [back, back + 1.3, front - 0.14]) shell.push(slab(x, x + 0.14, F + sill, F + head, z0, z1, red))
    glass.push(slab(back + 0.14, back + 1.3, F + sill, F + head, side * (W - 0.055), side * (W - 0.055) + 0.02, [PAINT.mist, PAINT.white]), slab(back + 1.44, front - 0.14, F + sill, F + head, side * (W - 0.055), side * (W - 0.055) + 0.02, [PAINT.mist, PAINT.white]))
    shell.push(slab(back, front, F + sill - 0.03, F + sill + 0.02, side > 0 ? W - 0.14 : -W + 0.08, side > 0 ? W - 0.08 : -W + 0.14, PAINT.brass))
  }

  // The bulkhead behind, with the door back into the train
  shell.push(slab(back, back + 0.08, F, CAR.ceiling + 0.3, -W, W, walnut))
  shell.push(slab(back + 0.08, back + 0.1, F + 0.05, F + 1.95, -0.42, 0.42, [PAINT.walnut, PAINT.walnutLight]), slab(back + 0.1, back + 0.11, F + 1.25, F + 1.7, -0.2, 0.2, [PAINT.mist, PAINT.white]))
  shell.push(blob(0.03, PAINT.brass, { at: [back + 0.13, F + 1.0, 0.33] }, 0.02, 1, 1))
  // A cap and a coat on their hooks beside it
  shell.push(blob(0.11, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [back + 0.16, F + 1.78, -0.85], scale: [0.6, 0.55, 1] }, 0.08, 2, 1), box(0.1, 0.012, 0.18, PAINT.soot, { at: [back + 0.22, F + 1.72, -0.85], rot: [0, 0, -0.25] }))
  shell.push(roughen(box(0.1, 0.9, 0.44, [PAINT.walnut, PAINT.woodLight], { at: [back + 0.14, F + 0.72, 0.88] }), 0.016, 6))

  // The front, three panes over the desk with a cream band above them
  shell.push(slab(front - 0.08, front, F, F + sill, -W, W, red), slab(front - 0.08, front, F + head, CAR.ceiling + 0.3, -W, W, cream))
  for (const z of [-W + 0.07, -0.5, 0.5, W - 0.07]) shell.push(slab(front - 0.08, front, F + sill, F + head, z - 0.07, z + 0.07, red))
  for (const [z0, z1] of [
    [-W + 0.14, -0.57],
    [-0.43, 0.43],
    [0.57, W - 0.14],
  ]) {
    glass.push(slab(front - 0.05, front - 0.03, F + sill, F + head, z0, z1, [PAINT.mist, PAINT.white]))
  }

  // The desk, a carcass, a flat top for the levers and a board for the dials
  const { desk, dials, levers, plate } = CAB
  shell.push(slab(desk, front - 0.08, F, F + 0.86, -1.24, 1.24, walnut), roughen(slab(desk - 0.05, front - 0.08, F + 0.86, F + 0.9, -1.27, 1.27, [PAINT.walnut, PAINT.walnutLight]), 0.003, 8))
  shell.push(slab(dials[0], front - 0.08, F + 0.9, F + sill, -1.24, 1.24, [PAINT.walnutDeep, PAINT.walnut]), slab(dials[0] - 0.012, dials[0], F + sill - 0.03, F + sill, -1.24, 1.24, PAINT.brass))
  for (const z of CAB.across) {
    // A dial, a brass bezel, a pale face and a tick for every tenth
    shell.push(cyl(0.118, 0.118, 0.035, PAINT.brass, { at: [dials[0], F + dials[1], z], rot: [0, 0, QUARTER] }, 20), cyl(0.1, 0.1, 0.04, [PAINT.oat, PAINT.white], { at: [dials[0], F + dials[1], z], rot: [0, 0, QUARTER] }, 20))
    for (let i = 0; i <= 10; i++) {
      const angle = -2.1 + (i / 10) * 4.2
      shell.push(box(0.004, i % 5 ? 0.014 : 0.024, 0.005, PAINT.soot, { at: [dials[0] - 0.041, F + dials[1] + Math.cos(angle) * 0.078, z + Math.sin(angle) * 0.078], rot: [angle, 0, 0] }))
    }
    // Its name plate, on the edge of the desk under it
    shell.push(box(0.01, 0.06, 0.34, PAINT.brass, { at: [plate[0], F + plate[1] - 0.03, z] }))
    // The quadrant its lever stands in
    shell.push(box(0.2, 0.02, 0.07, PAINT.brass, { at: [levers[0], F + 0.9, z] }), box(0.16, 0.022, 0.016, PAINT.soot, { at: [levers[0], F + 0.9, z] }))
  }

  // The board over the glass, where the destination is written
  shell.push(box(0.03, board.height, board.width, [PAINT.oat, PAINT.white], { at: [front - 0.1, F + board.y - board.height / 2, 0] }))
  for (const side of [-1, 1]) shell.push(box(0.05, board.height + 0.05, 0.03, PAINT.brass, { at: [front - 0.105, F + board.y - board.height / 2 - 0.025, side * (board.width / 2 + 0.015)] }))
  shell.push(box(0.05, 0.025, board.width + 0.06, PAINT.brass, { at: [front - 0.105, F + board.y + board.height / 2, 0] }), box(0.05, 0.025, board.width + 0.06, PAINT.brass, { at: [front - 0.105, F + board.y - board.height / 2 - 0.025, 0] }))

  // The stool, the brake wheel, the whistle cord, a mug and a lantern
  shell.push(cyl(0.035, 0.05, 0.56, PAINT.iron, { at: [desk - 0.55, F, 0.62] }, 7), cyl(0.19, 0.19, 0.06, [PAINT.leatherDeep, PAINT.leather], { at: [desk - 0.55, F + 0.56, 0.62] }, 12), cyl(0.16, 0.16, 0.02, PAINT.iron, { at: [desk - 0.55, F, 0.62] }, 10))
  shell.push(cyl(0.03, 0.04, 0.22, PAINT.iron, { at: [desk + 0.12, F + 0.9, 1.08] }, 7), ring(0.15, 0.016, PAINT.brass, { at: [desk + 0.12, F + 1.13, 1.08], rot: [0, 0, 0.5] }, 16), cyl(0.012, 0.012, 0.3, PAINT.brass, { at: [desk + 0.12 - 0.07, F + 1.0, 1.08], rot: [0, 0, 0.5 - QUARTER] }, 5))
  shell.push(cyl(0.004, 0.004, 0.62, PAINT.woodPale, { at: [desk - 0.25, CAR.ceiling - 0.62, -0.42] }, 4), cyl(0.018, 0.018, 0.1, [PAINT.wood, PAINT.woodLight], { at: [desk - 0.25, CAR.ceiling - 0.7, -0.42] }, 6))
  shell.push(cyl(0.04, 0.032, 0.065, [PAINT.oat, PAINT.white], { at: [CAB.mug[0], F + 0.9, CAB.mug[2]] }, 9))
  shell.push(cyl(0.003, 0.003, 0.2, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.2, -0.95] }, 4), box(0.11, 0.02, 0.11, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.22, -0.95] }), box(0.1, 0.02, 0.1, PAINT.iron, { at: [back + 0.7, CAR.ceiling - 0.4, -0.95] }))
  glow.push(box(0.08, 0.16, 0.08, PAINT.lamp, { at: [back + 0.7, CAR.ceiling - 0.38, -0.95] }), blob(0.12, PAINT.lamp, { at: [back + 1.5, CAR.ceiling - 0.04, 0], scale: [1, 0.45, 1] }, 0.02, 1, 1))
  // A rug underfoot
  shell.push(slab(back + 0.5, desk - 0.12, F + 0.004, F + 0.014, -0.5, 0.5, [PAINT.rug, PAINT.terracottaDeep]), slab(back + 0.58, desk - 0.2, F + 0.014, F + 0.018, -0.42, 0.42, [PAINT.terracottaDeep, PAINT.terracotta]))

  // A needle and a lever, each built from where it turns
  const needle = [box(0.004, 0.082, 0.008, PAINT.soot, { at: [0, -0.012, 0] }), cyl(0.012, 0.012, 0.008, PAINT.brass, { at: [0.004, 0, 0], rot: [0, 0, QUARTER] }, 8)]
  const lever = [limb([0, 0, 0], [0, 0.3, 0], 0.014, 0.011, PAINT.brass, 7), blob(0.034, [PAINT.walnutDeep, PAINT.walnutLight], { at: [0, 0.32, 0] }, 0.03, 2, 2), cyl(0.022, 0.022, 0.05, PAINT.brass, { at: [0, -0.01, -0.025], rot: [QUARTER, 0, 0] }, 8)]

  return [part('Cab_Shell', shell), part('Cab_Glass', glass, 'glass'), part('Cab_Glow', glow, 'glow'), hung('Cab_Needle', needle, [0, 0, 0]), hung('Cab_Lever', lever, [0, 0, 0])]
}

// ============================================================ clouds

function buildCloud(seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const pieces: BufferGeometry[] = []
  const puffs = 6 + Math.floor(random() * 4)
  for (let i = 0; i < puffs; i++) {
    const along = (i / (puffs - 1) - 0.5) * 2
    const size = (1.7 - Math.abs(along) * 0.8) * (0.8 + random() * 0.6)
    // Flat underneath, heaped on top
    pieces.push(blob(size, [PAINT.cloudShade, PAINT.cloud], { at: [along * 4.2, size * 0.5 + random() * 0.4, (random() - 0.5) * 1.6], scale: [1.5, 0.82, 1] }, 0.14, seed + i))
  }
  return pieces
}

export function buildClouds(): Part[] {
  return [part('Cloud_1', buildCloud(11)), part('Cloud_2', buildCloud(23)), part('Cloud_3', buildCloud(37))]
}
