// The two rooms of the tall house on the quay: the bakery on the ground floor
// and the attic under the roof. Both are measured from the middle of their
// own floor, with the shop front (and the sea) toward +z.
//
// The bakery is dark walnut shelving packed with bread in ordered rows, lit
// from the shop window. The attic is darker still and crammed to the rafters:
// olive and gold, with jewel colours wherever glass catches the light.
import { Color, type BufferGeometry } from 'three'
import { blob, box, cone, cyl, extrude, hung, limb, part, ring, roughen, slab, type Part } from './kit.ts'
import { JEWELS, PAINT } from './palette.ts'
import { ATTIC, BAKERY } from './spec.ts'
import { seeded } from './terrain.ts'

const QUARTER = Math.PI / 2
const walnut = [PAINT.walnutDeep, PAINT.walnut] as const
const crust = [PAINT.crustDeep, PAINT.crust] as const

// ------------------------------------------------------------ bread

const boule = (x: number, y: number, z: number, r: number, seed: number) => [
  blob(r, [PAINT.crustDeep, PAINT.crustLight], { at: [x, y + r * 0.62, z], scale: [1.1, 0.72, 1.05] }, 0.08, seed, 1),
  box(r * 1.1, 0.012, 0.03, PAINT.flour, { at: [x, y + r * 1.3, z], rot: [0, 0.7, 0] }),
  box(r * 1.1, 0.012, 0.03, PAINT.flour, { at: [x, y + r * 1.3, z], rot: [0, -0.7, 0] }),
]

/** A tin loaf: square in the tin, risen over the top of it. */
const tinLoaf = (x: number, y: number, z: number, seed: number) => [box(0.3, 0.2, 0.22, crust, { at: [x, y, z] }), blob(0.17, [PAINT.crust, PAINT.crustLight], { at: [x, y + 0.2, z], scale: [0.98, 0.5, 0.74] }, 0.06, seed, 1)]

const baguette = (from: readonly [number, number, number], to: readonly [number, number, number]) => limb(from, to, 0.05, 0.038, [PAINT.crustDeep, PAINT.crustLight], 6)

const roll = (x: number, y: number, z: number, seed: number) => blob(0.075, [PAINT.crustDeep, PAINT.crustLight], { at: [x, y + 0.05, z], scale: [1.15, 0.75, 1] }, 0.1, seed, 1)

// ------------------------------------------------------------ the bakery

/** The shop: counter in front, a wall of bread behind, a guestbook open on the counter. */
export function buildBakery(): Part[] {
  const X = BAKERY.halfWidth
  const Z = BAKERY.halfDepth
  const H = BAKERY.height
  const TOP = BAKERY.counter
  const inside: BufferGeometry[] = []
  const glass: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Walnut to the waist on the side and front walls.
  inside.push(slab(-X, -X + 0.04, 0, 1.0, -Z, Z, walnut), slab(X - 0.04, X, 0, 1.0, -Z, Z, walnut))
  inside.push(slab(-X, 1.0, 0, 0.85, Z - 0.04, Z, walnut), slab(2.4, X, 0, 1.0, Z - 0.04, Z, walnut))
  inside.push(slab(-X, -X + 0.07, 1.0, 1.06, -Z, Z, PAINT.walnutLight), slab(X - 0.07, X, 1.0, 1.06, -Z, Z, PAINT.walnutLight))

  // The back wall is one piece of furniture: cupboards below, four shelves of bread above.
  const back = -Z
  inside.push(slab(-X, X, 0, H, back, back + 0.06, PAINT.walnutDeep))
  inside.push(slab(-X, 1.82, 0, 0.9, back + 0.06, back + 0.66, walnut), slab(-X, 1.86, 0.9, 0.96, back + 0.06, back + 0.72, PAINT.walnutLight))
  for (let x = -X + 0.15; x < 1.7; x += 1.12) {
    inside.push(slab(x, x + 1.0, 0.1, 0.8, back + 0.66, back + 0.685, PAINT.walnutLight), blob(0.035, PAINT.brass, { at: [x + 0.88, 0.48, back + 0.7] }, 0.02, 1, 1))
  }
  const shelves = [1.5, 2.08, 2.66]
  for (const y of shelves) inside.push(slab(-X, 1.82, y, y + 0.05, back + 0.06, back + 0.6, PAINT.walnutLight))
  for (const x of [-X + 0.02, -3.45, -1.7, 0.05, 1.76]) inside.push(slab(x, x + 0.08, 0.96, H - 0.14, back + 0.06, back + 0.62, PAINT.walnut))
  inside.push(slab(-X, 1.9, H - 0.16, H, back + 0.06, back + 0.7, walnut))

  // Bread in ordered rows, one kind to a shelf.
  for (let x = -X + 0.42, i = 0; x < 1.6; x += 0.37, i++) if ((i + 1) % 5) inside.push(...boule(x, 0.96, back + 0.36, 0.16, i))
  for (let x = -X + 0.36, i = 0; x < 1.62; x += 0.345, i++) if (i % 5 !== 4) inside.push(...tinLoaf(x, shelves[0] + 0.05, back + 0.33, i))
  for (let bay = 0; bay < 4; bay++) {
    const from = -X + 0.2 + bay * 1.75
    if (bay % 2) {
      for (let i = 0; i < 4; i++) inside.push(baguette([from + 0.1, shelves[1] + 0.1 + (i % 2) * 0.085, back + 0.2 + i * 0.09], [from + 1.5, shelves[1] + 0.1 + (i % 2) * 0.085, back + 0.24 + i * 0.09]))
    } else {
      for (let i = 0; i < 18; i++) inside.push(roll(from + 0.15 + (i % 9) * 0.165, shelves[1] + 0.05 + Math.floor(i / 9) * 0.11, back + 0.24 + (i % 2) * 0.16 + Math.floor(i / 9) * 0.04, bay * 20 + i))
    }
  }
  // Jars and tins along the top.
  for (let x = -X + 0.3, i = 0; x < 1.66; x += 0.27, i++) {
    const jar = JEWELS[(i * 3) % JEWELS.length]
    if (i % 7 === 5) continue
    inside.push(cyl(0.085, 0.09, 0.2 + (i % 3) * 0.04, i % 4 === 0 ? [PAINT.tealTinDeep, PAINT.tealTin] : [jar, PAINT.cream], { at: [x, shelves[2] + 0.05, back + 0.32] }, 8))
    inside.push(cyl(0.09, 0.09, 0.035, PAINT.cream, { at: [x, shelves[2] + 0.25 + (i % 3) * 0.04, back + 0.32] }, 8))
  }

  // The chalkboard, and the dresser with the baguette baskets under it.
  const board = BAKERY.chalkboard
  inside.push(slab(board.at[0] - board.width / 2 - 0.09, board.at[0] + board.width / 2 + 0.09, board.at[1] - board.height / 2 - 0.09, board.at[1] + board.height / 2 + 0.09, back + 0.06, back + 0.12, PAINT.walnutLight))
  inside.push(slab(board.at[0] - board.width / 2, board.at[0] + board.width / 2, board.at[1] - board.height / 2, board.at[1] + board.height / 2, back + 0.12, back + 0.14, PAINT.chalkboard))
  inside.push(slab(2.0, 4.6, 0, 0.9, back + 0.06, back + 0.7, walnut), slab(1.96, 4.64, 0.9, 0.96, back + 0.06, back + 0.74, PAINT.walnutLight))
  for (const x of [2.6, 3.9]) {
    inside.push(cyl(0.3, 0.22, 0.42, [PAINT.amberDeep, PAINT.amberLight], { at: [x, 0.96, back + 0.42] }, 9))
    for (let i = 0; i < 6; i++) {
      const angle = i * 1.05 + x
      inside.push(baguette([x + Math.cos(angle) * 0.1, 1.05, back + 0.42 + Math.sin(angle) * 0.1], [x + Math.cos(angle) * 0.26, 1.85 + (i % 3) * 0.08, back + 0.42 + Math.sin(angle) * 0.2]))
    }
  }

  // The counter: a glass case of pastries with a thick walnut top.
  const c0 = -3.7
  const c1 = 3.0
  const cz0 = -0.85
  const cz1 = 0.12
  inside.push(slab(c0, c1, 0, 0.2, cz0, cz1, PAINT.walnutDeep), slab(c0 - 0.08, c1 + 0.08, TOP - 0.08, TOP, cz0 - 0.08, cz1 + 0.1, [PAINT.walnut, PAINT.walnutLight]))
  inside.push(slab(c0, c1, 0.2, TOP - 0.08, cz0, cz0 + 0.05, walnut))
  for (const x of [c0, -1.48, 0.72, c1 - 0.09]) inside.push(slab(x, x + 0.09, 0.2, TOP - 0.08, cz0, cz1, PAINT.walnut))
  for (const y of [0.24, 0.56]) {
    inside.push(slab(c0 + 0.1, c1 - 0.1, y, y + 0.025, cz0 + 0.08, cz1 - 0.06, PAINT.woodPale))
    for (let x = c0 + 0.24, i = 0; x < c1 - 0.2; x += 0.155, i++) {
      if (i % 14 === 13) continue
      for (const row of [0, 1, 2]) {
        inside.push(blob(0.058, (i + row) % 3 ? [PAINT.crustDeep, PAINT.crustLight] : [PAINT.crust, PAINT.flour], { at: [x + row * 0.04, y + 0.065, cz0 + 0.2 + row * 0.24], scale: [1.2, 0.72, 0.9], rot: [0, i + row, 0] }, 0.12, i + row, 1))
      }
    }
  }
  glass.push(slab(c0 + 0.09, c1 - 0.09, 0.2, TOP - 0.08, cz1 - 0.03, cz1, [PAINT.mist, PAINT.white]))

  // On the counter: the till in its one cool colour, sunflowers, a brass bell, bread on a board.
  inside.push(box(0.62, 0.42, 0.5, [PAINT.tealTinDeep, PAINT.tealTin], { at: [-2.9, TOP, -0.4] }), box(0.5, 0.2, 0.32, PAINT.tealTin, { at: [-2.9, TOP + 0.42, -0.5] }), box(0.4, 0.06, 0.16, PAINT.cream, { at: [-2.9, TOP + 0.62, -0.5] }))
  for (let i = 0; i < 6; i++) inside.push(cyl(0.022, 0.022, 0.03, PAINT.brass, { at: [-3.08 + (i % 3) * 0.18, TOP + 0.42, -0.3 + Math.floor(i / 3) * 0.08] }, 6))
  inside.push(cyl(0.11, 0.14, 0.34, [PAINT.oat, PAINT.white], { at: [2.35, TOP, -0.45] }, 9))
  for (let i = 0; i < 4; i++) {
    const head: [number, number, number] = [2.35 + Math.cos(i * 1.7) * 0.22, TOP + 0.62 + (i % 2) * 0.16, -0.45 + Math.sin(i * 1.7) * 0.2]
    inside.push(limb([2.35, TOP + 0.3, -0.45], head, 0.014, 0.012, PAINT.leaf, 5))
    inside.push(cyl(0.12, 0.12, 0.03, PAINT.sunflower, { at: head, rot: [QUARTER * 0.8, i, 0] }, 10), cyl(0.05, 0.05, 0.045, PAINT.walnut, { at: head, rot: [QUARTER * 0.8, i, 0] }, 8))
  }
  inside.push(cone(0.07, 0.08, PAINT.brass, { at: [1.5, TOP + 0.02, 0.0] }, 9), cyl(0.085, 0.085, 0.02, PAINT.brass, { at: [1.5, TOP, 0.0] }, 9))
  inside.push(slab(-2.2, -1.5, TOP, TOP + 0.03, -0.62, -0.18, PAINT.amberLight), ...boule(-1.85, TOP + 0.03, -0.4, 0.17, 3))

  // The mug of tea, cooling.
  const [mx, my, mz] = BAKERY.mug
  inside.push(cyl(0.13, 0.11, 0.015, [PAINT.oat, PAINT.white], { at: [mx, my, mz] }, 10), cyl(0.078, 0.064, 0.14, [PAINT.cornflowerDeep, PAINT.cornflower], { at: [mx, my + 0.015, mz] }, 10))
  inside.push(cyl(0.068, 0.068, 0.01, PAINT.amber, { at: [mx, my + 0.15, mz] }, 10), ring(0.045, 0.012, PAINT.cornflower, { at: [mx + 0.105, my + 0.09, mz] }, 8))

  // Dried lavender hung from a beam over the counter, and two lamps.
  inside.push(slab(c0, c1, H - 0.5, H - 0.4, -0.42, -0.3, PAINT.walnutDeep))
  for (const x of [c0 + 0.1, c1 - 0.1]) inside.push(slab(x - 0.04, x + 0.04, H - 0.4, H - 0.2, -0.4, -0.32, PAINT.walnutDeep))
  for (let i = 0; i < 9; i++) {
    const x = c0 + 0.5 + i * 0.72
    if (i === 3 || i === 6) continue
    const drop = 0.1 + (i % 3) * 0.07
    inside.push(box(0.012, drop, 0.012, PAINT.oat, { at: [x, H - 0.5 - drop, -0.36] }))
    // Tied at the stalks, hung head down: a thin sheaf of green opening into a soft purple brush.
    inside.push(cone(0.035, 0.2, PAINT.leaf, { at: [x, H - 0.7 - drop, -0.36], rot: [Math.PI, 0, 0] }, 5))
    inside.push(blob(0.075 + (i % 2) * 0.012, [PAINT.lavender, PAINT.lavenderDeep], { at: [x, H - 0.86 - drop, -0.36], scale: [0.8, 2.1, 0.8], rot: [0, i, (i % 2 ? 1 : -1) * 0.07] }, 0.18, i, 1))
  }
  for (const x of [c0 + 2.66, c0 + 4.82]) {
    inside.push(box(0.014, 0.42, 0.014, PAINT.iron, { at: [x, H - 0.92, -0.36] }), cone(0.2, 0.16, PAINT.brass, { at: [x, H - 1.06, -0.36] }, 10))
    glow.push(blob(0.075, PAINT.lamp, { at: [x, H - 1.08, -0.36] }, 0.02, 1, 1))
  }

  // The oven in the east wall, the reason the shop is warm.
  const [ox, oy, oz] = BAKERY.oven
  inside.push(roughen(slab(ox - 0.5, X - 0.04, 0, 1.7, oz - 1.0, oz + 1.0, [PAINT.brick, PAINT.brickLight]), 0.02, 5), slab(ox - 0.56, X - 0.04, 1.7, 1.8, oz - 1.06, oz + 1.06, PAINT.stoneLight))
  inside.push(extrude([[-0.42, 0], [0.42, 0], [0.42, 0.3], [0.25, 0.52], [0, 0.6], [-0.25, 0.52], [-0.42, 0.3]], 0.06, PAINT.soot, { at: [ox - 0.5, oy - 0.2, oz], rot: [0, QUARTER, 0] }))
  glow.push(extrude([[-0.3, 0], [0.3, 0], [0.22, 0.26], [0, 0.34], [-0.22, 0.26]], 0.07, [PAINT.terracotta, PAINT.flame], { at: [ox - 0.5, oy - 0.2, oz], rot: [0, QUARTER, 0] }))
  inside.push(limb([ox - 0.3, 0, oz + 1.5], [ox - 0.1, 1.9, oz + 1.2], 0.03, 0.03, PAINT.wood, 5), box(0.5, 0.03, 0.4, PAINT.woodPale, { at: [ox - 0.1, 1.9, oz + 1.2], rot: [0.3, 0, 0] }))

  // By the window: a basket of baguettes on the floor and a ring loaf hung in the glass.
  inside.push(cyl(0.36, 0.26, 0.7, [PAINT.amberDeep, PAINT.amberLight], { at: [-4.3, 0, 3.0] }, 10))
  for (let i = 0; i < 7; i++) inside.push(baguette([-4.3 + Math.cos(i) * 0.12, 0.2, 3.0 + Math.sin(i) * 0.12], [-4.3 + Math.cos(i) * 0.32, 1.35 + (i % 3) * 0.1, 3.0 + Math.sin(i) * 0.3]))
  inside.push(ring(0.42, 0.11, [PAINT.crustDeep, PAINT.crustLight], { at: [-2.4, 1.85, Z - 0.22] }, 14), box(0.012, 0.5, 0.012, PAINT.oat, { at: [-2.4, 2.25, Z - 0.22] }))
  inside.push(slab(-4.2, -0.6, 0.85, 0.9, Z - 0.5, Z - 0.04, PAINT.walnutLight))
  for (let i = 0; i < 6; i++) inside.push(...boule(-3.9 + i * 0.62, 0.9, Z - 0.28, 0.15, 40 + i).slice(0, i % 2 ? 1 : 3))
  inside.push(slab(1.1, 2.3, 0, 0.02, 2.9, 3.9, [PAINT.rug, PAINT.terracotta]), cyl(0.2, 0.17, 0.55, walnut, { at: [3.6, 0, 1.4] }, 9))

  // A shaft of afternoon sun through the shop window, falling the way the light falls.
  const [w0, w1, wy0, wy1] = BAKERY.window
  const reach = 3.4
  const shaft = box(w1 - w0, wy1 - wy0, reach * 0.69, [PAINT.soot, PAINT.soot], { at: [(w0 + w1) / 2, wy0, Z - (reach * 0.69) / 2] })
  const points = shaft.getAttribute('position')
  const shade = shaft.getAttribute('color')
  for (let i = 0; i < points.count; i++) {
    const inward = (Z - points.getZ(i)) / 0.69
    points.setXYZ(i, points.getX(i) + inward * 0.52, points.getY(i) - inward * 0.5, points.getZ(i))
    // Brightest at the glass, gone by the time it reaches the floor.
    const light = 0.075 * (1 - inward / reach)
    shade.setXYZ(i, light * 1.0, light * 0.86, light * 0.6)
  }
  shaft.computeVertexNormals()

  // The guestbook: open, half written, with the pen laid beside it.
  const book: BufferGeometry[] = [box(0.94, 0.03, 0.64, [PAINT.leatherDeep, PAINT.leather], { at: [0, 0, 0] })]
  for (const side of [-1, 1]) {
    book.push(box(0.43, 0.035, 0.58, [PAINT.oat, PAINT.white], { at: [side * 0.225, 0.03, 0], rot: [0, 0, -side * 0.05] }))
    for (let line = 0; line < 7; line++) {
      const written = side < 0 || line < 3
      if (written) book.push(box(0.3 - ((line * 7) % 3) * 0.05, 0.003, 0.012, PAINT.ink, { at: [side * 0.225 - ((line * 7) % 3) * 0.025, 0.07, -0.21 + line * 0.07] }))
    }
  }
  book.push(box(0.03, 0.004, 0.75, PAINT.terracotta, { at: [0.02, 0.066, 0.06] }))
  book.push(limb([0.58, 0.02, 0.2], [0.78, 0.02, -0.16], 0.014, 0.012, PAINT.ink, 6), limb([0.78, 0.02, -0.16], [0.82, 0.02, -0.23], 0.012, 0.002, PAINT.brass, 5))
  book.push(cyl(0.05, 0.06, 0.07, PAINT.ink, { at: [0.72, 0, 0.3] }, 8), cyl(0.035, 0.035, 0.02, PAINT.brass, { at: [0.72, 0.07, 0.3] }, 8))

  return [part('Bakery_Inside', inside), part('Bakery_Case', glass, 'glass'), part('Bakery_Glow', glow, 'glow'), { name: 'Bakery_Shaft', geometry: shaft, material: 'light' }, hung('Bakery_Book', book, BAKERY.book)]
}

// ------------------------------------------------------------ the attic

type Potion = 'flask' | 'vial' | 'cone' | 'square'
const POTIONS: Potion[] = ['flask', 'vial', 'cone', 'square', 'flask', 'vial']

/** A stoppered bottle of something bright, with one chip of light on its shoulder. */
function potion(x: number, y: number, z: number, kind: Potion, colour: string, size = 1): BufferGeometry[] {
  const s = size
  // Deep at the foot of the bottle, its true colour at the shoulder: glass with something dark in it.
  const glassy = [`#${new Color(colour).multiplyScalar(0.42).getHexString()}`, colour] as const
  const pieces: BufferGeometry[] = []
  let neck = 0
  if (kind === 'flask') {
    pieces.push(blob(0.1 * s, glassy, { at: [x, y + 0.09 * s, z], scale: [1, 0.9, 1] }, 0.03, 1, 1))
    neck = 0.16 * s
  } else if (kind === 'vial') {
    pieces.push(cyl(0.045 * s, 0.05 * s, 0.24 * s, glassy, { at: [x, y, z] }, 7))
    neck = 0.24 * s
  } else if (kind === 'cone') {
    pieces.push(cyl(0.03 * s, 0.11 * s, 0.2 * s, glassy, { at: [x, y, z] }, 8))
    neck = 0.2 * s
  } else {
    pieces.push(box(0.14 * s, 0.17 * s, 0.14 * s, glassy, { at: [x, y, z] }))
    neck = 0.17 * s
  }
  pieces.push(cyl(0.022 * s, 0.028 * s, 0.07 * s, PAINT.white, { at: [x, y + neck - 0.01, z] }, 6), cyl(0.027 * s, 0.024 * s, 0.035 * s, PAINT.woodPale, { at: [x, y + neck + 0.055 * s, z] }, 6))
  pieces.push(box(0.02 * s, 0.045 * s, 0.006, PAINT.white, { at: [x - 0.035 * s, y + 0.08 * s, z + 0.09 * s] }))
  return pieces
}

const BINDINGS = [PAINT.moss, PAINT.rug, PAINT.walnut, PAINT.honey, PAINT.cornflowerDeep, PAINT.violet, PAINT.teal, PAINT.terracottaDeep, PAINT.leafDeep]

/** A thick old book lying flat, gilt at the corners. `turn` skews it on the pile. */
function tome(x: number, y: number, z: number, width: number, thickness: number, colour: string, turn: number): BufferGeometry[] {
  return [
    roughen(box(width, thickness, width * 0.72, [colour, colour], { at: [x, y, z], rot: [0, turn, 0] }), 0.006, Math.round(x * 31 + y * 17)),
    box(width - 0.03, thickness - 0.03, width * 0.72 - 0.01, PAINT.oat, { at: [x + Math.cos(turn) * 0.012, y + 0.015, z - Math.sin(turn) * 0.012], rot: [0, turn, 0] }),
    box(width + 0.006, 0.012, 0.05, PAINT.brass, { at: [x, y + thickness * 0.5, z], rot: [0, turn, 0] }),
  ]
}

/** A hanging charm on its thread: a brass disc, a glass ball, a star, a little lantern or a bunch of herbs. */
function charm(x: number, top: number, z: number, drop: number, kind: number, glow: BufferGeometry[]): BufferGeometry[] {
  const y = top - drop
  const pieces = [box(0.01, drop, 0.01, PAINT.oat, { at: [x, y, z] })]
  if (kind % 5 === 0) pieces.push(cyl(0.12, 0.12, 0.014, [PAINT.brass, PAINT.gold], { at: [x, y - 0.12, z], rot: [QUARTER, 0, kind] }, 12), ring(0.075, 0.012, PAINT.gold, { at: [x, y - 0.12, z + 0.012] }, 10))
  else if (kind % 5 === 1) pieces.push(blob(0.09, [JEWELS[kind % JEWELS.length], PAINT.white], { at: [x, y - 0.09, z] }, 0.02, 1, 1), cyl(0.02, 0.03, 0.03, PAINT.brass, { at: [x, y - 0.01, z] }, 6))
  else if (kind % 5 === 2) pieces.push(cone(0.09, 0.14, PAINT.gold, { at: [x, y - 0.14, z] }, 4), cone(0.09, 0.14, PAINT.brass, { at: [x, y - 0.14, z], rot: [Math.PI, 0.78, 0] }, 4))
  else if (kind % 5 === 3) {
    pieces.push(box(0.14, 0.03, 0.14, PAINT.brass, { at: [x, y - 0.03, z] }), box(0.16, 0.03, 0.16, PAINT.brass, { at: [x, y - 0.24, z] }))
    glow.push(box(0.11, 0.18, 0.11, PAINT.lamp, { at: [x, y - 0.21, z] }))
  } else pieces.push(cone(0.1, 0.24, [PAINT.lavenderDeep, PAINT.leaf], { at: [x, y - 0.24, z] }, 6), cone(0.12, 0.18, [PAINT.rose, PAINT.ruby], { at: [x, y - 0.36, z], rot: [Math.PI, 0, 0] }, 6))
  return pieces
}

/** How high the roof is above the attic floor at a given z. */
const headroom = (z: number) => ATTIC.knee + (BAKERY.halfDepth - Math.abs(z)) * (ATTIC.rise / BAKERY.halfDepth)

/**
 * The attic workshop. Everything a wizard never threw away, and among it five
 * clusters of artefacts that the app lifts and lights when they are chosen:
 * potions, crystals, books, brass and tools.
 */
export function buildAttic(): Part[] {
  const X = BAKERY.halfWidth
  const Z = BAKERY.halfDepth
  const random = seeded(1313)
  const room: BufferGeometry[] = []
  const glow: BufferGeometry[] = []
  const dark = [PAINT.walnutDeep, PAINT.walnut] as const
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]

  // Dark boards under the tiles and on every wall: the room is a lantern-lit cave, and the things in it are what catch the light.
  const run = Z + 0.22 + 0.45
  const pitch = Math.atan2(ATTIC.rise, Z + 0.22)
  const slope = run / Math.cos(pitch)
  const ridge = ATTIC.knee + ATTIC.rise + 0.06
  const lining = (x0: number, x1: number, t0: number, t1: number, side: 1 | -1) => {
    const mid = (t0 + t1) / 2
    return box(x1 - x0, 0.03, slope * (t1 - t0), dark, { at: [(x0 + x1) / 2, ridge - 0.07 - run * mid * Math.tan(pitch), side * run * mid], rot: [side * pitch, 0, 0] })
  }
  const eave = Z / run
  room.push(lining(-X, X, 0, eave, -1), lining(-X, -1.7, 0, eave, 1), lining(0.9, X, 0, eave, 1), lining(-1.7, 0.9, 0, 0.3, 1), lining(-1.7, 0.9, 0.64, eave, 1))
  for (const side of [1, -1]) {
    room.push(
      extrude(
        [
          [-Z, 0],
          [Z, 0],
          [Z, ATTIC.knee],
          [0, ATTIC.knee + ATTIC.rise],
          [-Z, ATTIC.knee],
        ],
        0.02,
        dark,
        { at: [side * (X - 0.01), 0, 0], rot: [0, QUARTER, 0] },
      ),
    )
    room.push(slab(-X, X, 0, ATTIC.knee, side * (Z - 0.02), side * Z, dark))
  }

  // Rugs laid over one another, the colour of old wine.
  room.push(slab(-2.6, 2.4, 0, 0.02, -1.9, 1.9, [PAINT.wine, PAINT.wine]), slab(-2.4, 2.2, 0.02, 0.025, -1.7, 1.7, PAINT.brass), slab(-2.25, 2.05, 0.025, 0.03, -1.55, 1.55, [PAINT.wine, PAINT.wineLight]))
  for (let i = 0; i < 7; i++) room.push(box(0.36, 0.006, 0.36, i % 2 ? PAINT.brass : PAINT.moss, { at: [-1.8 + i * 0.6, 0.03, 0], rot: [0, QUARTER / 2, 0] }))
  room.push(box(1.8, 0.02, 1.2, [PAINT.moss, PAINT.pine], { at: [2.9, 0.02, 1.9], rot: [0, 0.4, 0] }), box(1.5, 0.02, 1.0, PAINT.violet, { at: [-3.1, 0.02, -1.9], rot: [0, -0.3, 0] }))

  // The long low shelf under the back slope, three tiers of it, bottles shoulder to shoulder.
  const backZ = -Z + 0.08
  for (const y of [0.02, 0.5, 0.96]) room.push(slab(-X + 0.1, X - 0.1, y, y + 0.05, backZ, backZ + 0.55, PAINT.walnutLight))
  for (let x = -X + 0.1; x <= X - 0.09; x += 1.26) room.push(slab(x, x + 0.07, 0, 1.0, backZ, backZ + 0.55, PAINT.walnut))
  room.push(slab(-X + 0.1, X - 0.1, 0, 1.0, backZ - 0.04, backZ, PAINT.walnutDeep))
  for (const [tier, y] of [0.07, 0.55, 1.01].entries()) {
    for (let x = -X + 0.3; x < X - 0.25; x += 0.2 + random() * 0.08) {
      // Leave room on the top tier for the cluster that lives there.
      if (tier === 2 && Math.abs(x - ATTIC.clusters[0].at[0]) < 1.15) continue
      if (tier === 0 && random() < 0.55) {
        room.push(...tome(x, y, backZ + 0.3, 0.3, 0.06 + random() * 0.05, pick(BINDINGS), (random() - 0.5) * 0.5))
        continue
      }
      for (const row of [0, 1]) room.push(...potion(x + row * 0.09, y, backZ + 0.16 + row * 0.24, pick(POTIONS), pick(JEWELS), 0.8 + random() * 0.6))
    }
  }

  // The west gable: a bookcase to the rafters.
  const caseX = -X + 0.06
  room.push(slab(caseX, caseX + 0.04, 0, 2.7, -2.1, 2.1, PAINT.walnutDeep))
  for (const z of [-2.1, -0.72, 0.66, 2.04]) room.push(slab(caseX, caseX + 0.42, 0, headroom(z + 0.03) - 0.25, z, z + 0.06, PAINT.walnut))
  for (const y of [0.04, 0.62, 1.2, 1.78, 2.36]) {
    room.push(slab(caseX, caseX + 0.42, y, y + 0.05, -2.1, 2.1, PAINT.walnutLight))
    for (let z = -2.0; z < 2.0; ) {
      const thickness = 0.05 + random() * 0.07
      const tall = 0.32 + random() * 0.18
      if (headroom(z) - 0.3 < y + tall || (y > 1.7 && Math.abs(z) > 1.2)) {
        z += 0.2
        continue
      }
      const lean = random() < 0.12 ? 0.22 : 0
      if (random() < 0.86) room.push(box(0.3, tall, thickness, [pick(BINDINGS), pick(BINDINGS)], { at: [caseX + 0.21, y + 0.05, z], rot: [lean, 0, 0] }), box(0.305, 0.02, thickness + 0.004, PAINT.gold, { at: [caseX + 0.21, y + 0.05 + tall * 0.75, z], rot: [lean, 0, 0] }))
      else room.push(...potion(caseX + 0.22, y + 0.05, z, pick(POTIONS), pick(JEWELS), 1.1))
      z += thickness + 0.012 + lean * 0.3
    }
  }

  // The east gable: a workbench, and a board of tools over it.
  const benchX = X - 1.15
  room.push(slab(benchX, X - 0.06, 0.92, 1.0, -1.9, 1.5, [PAINT.walnut, PAINT.walnutLight]), slab(benchX + 0.08, X - 0.1, 0, 0.92, -1.84, -1.74, dark), slab(benchX + 0.08, X - 0.1, 0, 0.92, 1.34, 1.44, dark))
  room.push(slab(benchX + 0.1, X - 0.08, 0.3, 0.86, -1.74, 1.34, dark))
  for (let i = 0; i < 6; i++) room.push(slab(benchX + 0.07, benchX + 0.1, 0.34 + Math.floor(i / 3) * 0.27, 0.57 + Math.floor(i / 3) * 0.27, -1.68 + (i % 3) * 1.0, -0.74 + (i % 3) * 1.0, PAINT.walnutLight), blob(0.03, PAINT.brass, { at: [benchX + 0.05, 0.46 + Math.floor(i / 3) * 0.27, -1.2 + (i % 3) * 1.0] }, 0.02, 1, 1))
  room.push(slab(X - 0.1, X - 0.06, 1.2, 2.5, -1.5, 1.2, PAINT.walnut))
  for (let i = 0; i < 9; i++) {
    const z = -1.35 + i * 0.3
    room.push(limb([X - 0.14, 2.3 - (i % 3) * 0.12, z], [X - 0.14, 1.5 + (i % 2) * 0.2, z], 0.018, 0.018, i % 2 ? PAINT.steel : PAINT.woodPale, 5))
    room.push(box(0.05, 0.1 + (i % 3) * 0.04, 0.12, i % 3 ? PAINT.steel : PAINT.brass, { at: [X - 0.14, 1.42 + (i % 2) * 0.2, z] }))
  }

  // The drawing table in the middle of the room, tilted toward the light, with the plans on it.
  const [tx, ty, tz] = ATTIC.clusters[1].at
  room.push(box(2.3, 0.06, 1.5, [PAINT.walnut, PAINT.walnutLight], { at: [tx, ty - 0.2, tz], rot: [0.26, 0, 0] }))
  for (const sx of [-0.95, 0.95]) room.push(limb([tx + sx, 0, tz + 0.55], [tx + sx, ty - 0.34, tz - 0.3], 0.045, 0.04, PAINT.walnutDeep, 6), limb([tx + sx, 0, tz - 0.6], [tx + sx, ty - 0.04, tz + 0.3], 0.045, 0.04, PAINT.walnutDeep, 6))
  room.push(box(1.5, 0.008, 1.05, [PAINT.blueprint, PAINT.blueprintLight], { at: [tx - 0.25, ty - 0.14, tz], rot: [0.26, 0.08, 0] }), box(0.8, 0.008, 0.6, PAINT.blueprintLight, { at: [tx + 0.7, ty - 0.13, tz + 0.3], rot: [0.26, -0.3, 0] }))
  for (let i = 0; i < 5; i++) room.push(box(1.1 - i * 0.16, 0.004, 0.012, PAINT.white, { at: [tx - 0.25, ty - 0.085 - (i - 2) * 0.047, tz - 0.36 + i * 0.18], rot: [0.26, 0.08, 0] }))
  room.push(ring(0.26, 0.008, PAINT.white, { at: [tx - 0.4, ty - 0.13, tz + 0.02], rot: [0.26 - QUARTER, 0, 0] }, 16), ring(0.13, 0.008, PAINT.white, { at: [tx - 0.4, ty - 0.13, tz + 0.02], rot: [0.26 - QUARTER, 0, 0] }, 12))
  room.push(cyl(0.05, 0.05, 0.9, [PAINT.oat, PAINT.white], { at: [tx + 0.5, ty - 0.02, tz - 0.6], rot: [0, 0.2, QUARTER] }, 7), cyl(0.045, 0.045, 0.7, PAINT.blueprintLight, { at: [tx + 0.3, ty + 0.02, tz - 0.7], rot: [0, -0.1, QUARTER] }, 7))
  room.push(cyl(0.035, 0.04, 0.16, PAINT.cream, { at: [tx - 1.0, ty - 0.0, tz - 0.5] }, 6))
  glow.push(cone(0.022, 0.07, [PAINT.flame, PAINT.flameCore], { at: [tx - 1.0, ty + 0.16, tz - 0.5] }, 5))

  // Things on the floor: the barrel the brass hangs over, a trunk, a globe, a telescope under the skylight.
  room.push(cyl(0.42, 0.36, 0.9, [PAINT.amberDeep, PAINT.amber], { at: [-0.4, 0, -2.3] }, 11), cyl(0.43, 0.43, 0.05, PAINT.iron, { at: [-0.4, 0.2, -2.3] }, 11), cyl(0.44, 0.44, 0.05, PAINT.iron, { at: [-0.4, 0.66, -2.3] }, 11))
  room.push(...tome(-0.4, 0.9, -2.3, 0.56, 0.1, PAINT.moss, 0.3))
  room.push(roughen(box(1.2, 0.6, 0.7, [PAINT.leatherDeep, PAINT.leather], { at: [2.9, 0, 2.2], rot: [0, 0.35, 0] }), 0.012, 4), box(1.24, 0.07, 0.74, PAINT.brass, { at: [2.9, 0.42, 2.2], rot: [0, 0.35, 0] }))
  room.push(limb([-3.2, 0, 2.3], [-3.2, 0.75, 2.3], 0.05, 0.03, PAINT.brass, 6), blob(0.3, [PAINT.cornflowerDeep, PAINT.mist], { at: [-3.2, 1.02, 2.3] }, 0.02, 1), ring(0.34, 0.014, PAINT.brass, { at: [-3.2, 1.02, 2.3], rot: [0, 0.6, 0.4] }, 16))
  for (const [ax, az] of [
    [0.4, 0.25],
    [-0.45, 0.2],
    [0, -0.4],
  ] as const) {
    room.push(limb([-0.6 + ax, 0, 2.6 + az], [-0.6, 1.0, 2.6], 0.025, 0.025, PAINT.walnut, 5))
  }
  room.push(limb([-0.72, 0.92, 2.9], [-0.42, 1.4, 2.05], 0.085, 0.06, [PAINT.brass, PAINT.gold], 9), cyl(0.09, 0.09, 0.04, PAINT.walnutDeep, { at: [-0.42, 1.4, 2.05], rot: [0.9, 0, 0] }, 9))
  for (let i = 0; i < 9; i++) {
    const x = -2.4 + random() * 5.2
    const z = 2.2 + random() * 1.2
    if (headroom(z) < 0.6) continue
    room.push(...potion(x, 0.02, z, pick(POTIONS), pick(JEWELS), 1.3 + random() * 0.7))
  }
  // Books in leaning piles, the nearest of them right under the visitor's nose.
  for (const [px, pz, count] of [
    [-1.55, 1.35, 9],
    [-2.3, 0.9, 5],
    [2.2, 1.0, 8],
    [2.9, 0.3, 4],
    [0.6, 2.5, 3],
    [-4.0, -3.0, 5],
    [3.3, -3.2, 4],
    [-2.9, -2.5, 6],
    [0.9, -3.1, 3],
    [3.4, -1.4, 5],
    [-0.9, 0.9, 2],
  ] as const) {
    let y = 0.03
    for (let i = 0; i < count; i++) {
      const thickness = 0.08 + random() * 0.07
      room.push(...tome(px + (random() - 0.5) * 0.12, y, pz + (random() - 0.5) * 0.12, 0.46 + random() * 0.14, thickness, pick(BINDINGS), (random() - 0.5) * 0.9))
      y += thickness
    }
  }
  room.push(cyl(0.3, 0.26, 0.26, [PAINT.rug, PAINT.rose], { at: [1.3, 0.03, 1.9] }, 10), cyl(0.28, 0.3, 0.22, [PAINT.violet, PAINT.lavender], { at: [0.9, 0.03, 2.35] }, 10))

  // Everything that hangs from the rafters, and an armillary over the reading corner.
  for (let i = 0; i < 52; i++) {
    const x = -4.4 + (i % 13) * 0.72 + (random() - 0.5) * 0.5
    const z = (i % 2 ? -1 : 1) * (0.2 + random() * 2.2)
    const top = headroom(z) - 0.12
    // Keep the middle of the room clear enough to see across.
    const drop = 0.25 + random() * (Math.abs(x) < 1.6 ? 0.5 : 1.3)
    if (Math.hypot(x - ATTIC.clusters[3].at[0], z - ATTIC.clusters[3].at[2]) < 0.75) continue
    room.push(...charm(x, top, z, drop, i, glow))
  }
  room.push(box(0.012, 0.9, 0.012, PAINT.oat, { at: [-1.9, 2.75, 0.5] }))
  for (const [rx, ry] of [
    [0, 0],
    [QUARTER, 0.3],
    [0.8, QUARTER],
  ] as const) {
    room.push(ring(0.42, 0.016, [PAINT.brass, PAINT.gold], { at: [-1.9, 2.3, 0.5], rot: [rx, ry, 0] }, 20))
  }
  room.push(blob(0.2, [PAINT.teal, PAINT.white], { at: [-1.9, 2.3, 0.5] }, 0.02, 2))

  // Lamplight: the big lantern, and candles wherever there was somewhere to stand one.
  const [lx, ly, lz] = ATTIC.lantern
  room.push(box(0.014, headroom(lz) - ly - 0.3, 0.014, PAINT.iron, { at: [lx, ly + 0.2, lz] }), box(0.3, 0.04, 0.3, PAINT.brass, { at: [lx, ly + 0.17, lz] }), box(0.3, 0.04, 0.3, PAINT.brass, { at: [lx, ly - 0.2, lz] }))
  glow.push(box(0.22, 0.34, 0.22, PAINT.lamp, { at: [lx, ly - 0.17, lz] }))
  for (const [cx, cy, cz] of [
    [benchX + 0.5, 1.0, 1.1],
    [-4.6, 1.01, -3.6],
    [2.2, 1.01, -3.7],
    [-2.4, 0.03, 2.9],
  ] as const) {
    room.push(cyl(0.03, 0.035, 0.14, PAINT.cream, { at: [cx, cy, cz] }, 6), cyl(0.07, 0.07, 0.015, PAINT.brass, { at: [cx, cy, cz] }, 8))
    glow.push(cone(0.02, 0.065, [PAINT.flame, PAINT.flameCore], { at: [cx, cy + 0.14, cz] }, 5))
  }
  glow.push(cyl(0.58, 0.58, 0.03, PAINT.window, { at: [-X + 0.05, 2.3, 0], rot: [0, 0, -QUARTER] }, 14))
  room.push(cyl(0.68, 0.68, 0.025, PAINT.brass, { at: [-X + 0.03, 2.3, 0], rot: [0, 0, -QUARTER] }, 14))

  // --- The five clusters. Each is three parts so its pieces can rise a little out of step.
  const clusters: Part[] = []
  const add = (index: number, pieces: BufferGeometry[][]) => pieces.forEach((group, i) => clusters.push(hung(`Attic_C${index + 1}${'abc'[i]}`, group, ATTIC.clusters[index].at)))

  // 1. Frontend Sorcery: the brightest potions on the shelf.
  add(
    0,
    [-0.72, 0, 0.72].map((cx, g) => {
      const group: BufferGeometry[] = []
      for (let i = 0; i < 5; i++) group.push(...potion(cx - 0.26 + (i % 3) * 0.26, 0, (i < 3 ? -0.1 : 0.14) + (i % 2) * 0.03, POTIONS[(g + i) % POTIONS.length], JEWELS[(g * 3 + i * 2) % JEWELS.length], 1.3 + ((g + i) % 3) * 0.3))
      return group
    }),
  )
  // 2. 3D Canvas Alchemy: solids that have got up off the drawing and are turning in the air.
  add(1, [
    [cone(0.2, 0.34, [PAINT.teal, PAINT.white], { at: [-0.5, 0.52, 0] }, 6), cone(0.2, 0.3, [PAINT.sapphire, PAINT.teal], { at: [-0.5, 0.52, 0], rot: [Math.PI, 0.5, 0] }, 6)],
    [ring(0.24, 0.022, [PAINT.brass, PAINT.gold], { at: [0.12, 0.62, -0.1], rot: [0.5, 0.3, 0] }, 16), ring(0.24, 0.022, PAINT.gold, { at: [0.12, 0.62, -0.1], rot: [QUARTER, 0.9, 0.3] }, 16), blob(0.09, [PAINT.violet, PAINT.white], { at: [0.12, 0.62, -0.1] }, 0.02, 3, 1)],
    [box(0.2, 0.2, 0.2, [PAINT.rose, PAINT.white], { at: [0.72, 0.36, 0.1], rot: [0.5, 0.6, 0.3] }), cone(0.13, 0.24, [PAINT.lime, PAINT.white], { at: [0.5, 0.78, 0.18], rot: [0.2, 0, -0.3] }, 4), cone(0.09, 0.16, [PAINT.honey, PAINT.white], { at: [-0.1, 0.3, 0.26], rot: [0.3, 0.4, 0.2] }, 3)],
  ])
  // 3. Runes and Languages: the grammar books, one of them open.
  add(2, [
    [...tome(0, 0.03, 0, 0.62, 0.13, PAINT.moss, 0.1), ...tome(0.03, 0.16, -0.02, 0.56, 0.11, PAINT.rug, -0.35)],
    [...tome(-0.02, 0.27, 0.02, 0.5, 0.1, PAINT.cornflowerDeep, 0.4), ...tome(0.04, 0.37, 0, 0.44, 0.09, PAINT.honey, -0.1)],
    [box(0.34, 0.03, 0.44, PAINT.oat, { at: [-0.12, 0.47, 0], rot: [0, 0.3, 0.12] }), box(0.34, 0.03, 0.44, PAINT.white, { at: [0.2, 0.47, -0.1], rot: [0, 0.3, -0.12] }), limb([0.3, 0.52, 0.1], [0.5, 0.86, 0.2], 0.012, 0.03, [PAINT.white, PAINT.cornflower], 5)],
  ])
  // 4. Data Infrastructure: brass wheels and a key, hung where they can turn.
  const gear = (x: number, y: number, radius: number, teeth: number, colour: readonly [string, string]) => {
    const pieces = [cyl(radius, radius, 0.05, colour, { at: [x, y, -0.025], rot: [QUARTER, 0, 0] }, 16), cyl(radius * 0.3, radius * 0.3, 0.09, PAINT.walnutDeep, { at: [x, y, -0.045], rot: [QUARTER, 0, 0] }, 8)]
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2
      pieces.push(box(radius * 0.26, radius * 0.24, 0.05, colour[1], { at: [x + Math.cos(angle) * radius * 1.05, y + Math.sin(angle) * radius * 1.05 - radius * 0.12, 0], rot: [0, 0, angle - QUARTER] }))
    }
    return pieces
  }
  add(3, [
    [box(0.012, 0.7, 0.012, PAINT.oat, { at: [0, 0.3, 0] }), ...gear(0, 0, 0.3, 10, [PAINT.brass, PAINT.gold])],
    [box(0.012, 0.5, 0.012, PAINT.oat, { at: [-0.5, 0.36, 0.05] }), ...gear(-0.5, 0.2, 0.17, 8, [PAINT.copper, PAINT.copperLight]), box(0.012, 0.84, 0.012, PAINT.oat, { at: [0.46, 0.02, 0.05] }), ...gear(0.46, -0.12, 0.14, 7, [PAINT.gold, PAINT.cream])],
    [box(0.012, 0.4, 0.012, PAINT.oat, { at: [0.16, 0.5, 0.14] }), ring(0.07, 0.016, PAINT.brass, { at: [0.16, 0.44, 0.14] }, 10), box(0.035, 0.3, 0.02, PAINT.brass, { at: [0.16, 0.08, 0.14] }), box(0.11, 0.035, 0.02, PAINT.brass, { at: [0.2, 0.1, 0.14] }), box(0.08, 0.035, 0.02, PAINT.brass, { at: [0.19, 0.18, 0.14] })],
  ])
  // 5. Workshop Tools: what is actually in use, laid out on the bench.
  add(4, [
    [limb([-0.2, 0.03, -0.5], [0.05, 0.03, -0.1], 0.025, 0.02, [PAINT.walnut, PAINT.woodPale], 6), box(0.22, 0.09, 0.1, PAINT.steel, { at: [0.08, 0, -0.08], rot: [0, 0.55, 0] }), limb([0.2, 0.03, -0.55], [0.3, 0.03, -0.15], 0.012, 0.02, PAINT.steel, 5)],
    [ring(0.16, 0.018, [PAINT.brass, PAINT.gold], { at: [0, 0.19, 0.12], rot: [0, QUARTER, 0] }, 14), limb([0, 0.03, 0.12], [0, 0.36, 0.12], 0.014, 0.014, PAINT.brass, 5), limb([0, 0.2, 0.12], [0, 0.3, 0.28], 0.012, 0.012, PAINT.brass, 5), cyl(0.1, 0.1, 0.03, PAINT.brass, { at: [0.2, 0, 0.42] }, 12), limb([0.2, 0.035, 0.42], [0.26, 0.035, 0.36], 0.006, 0.006, PAINT.red, 4)],
    [cyl(0.085, 0.075, 0.2, [PAINT.tealTinDeep, PAINT.tealTin], { at: [-0.1, 0, 0.72] }, 9), ...[0, 1, 2, 3].map((i) => limb([-0.1, 0.1, 0.72], [-0.1 + Math.cos(i * 1.6) * 0.09, 0.44 + (i % 2) * 0.06, 0.72 + Math.sin(i * 1.6) * 0.09], 0.012, 0.012, i % 2 ? PAINT.woodPale : PAINT.red, 5)), cyl(0.04, 0.04, 0.5, [PAINT.oat, PAINT.white], { at: [0.25, 0.04, 0.6], rot: [0, 0.4, QUARTER] }, 7)],
  ])

  return [part('Attic_Room', room), part('Attic_Glow', glow, 'glow'), ...clusters]
}
