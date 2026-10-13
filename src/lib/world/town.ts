// The coast at the eastern end of the line: the island's ground, the quay the
// train pulls up to, a short row of houses, the tall house that holds the
// bakery and the attic, and the trees on the hill behind.
import { BufferAttribute, BufferGeometry, Color } from 'three'
import { blob, box, cone, cyl, extrude, limb, part, roughen, slab, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { ATTIC, BAKERY, QUAY } from './spec.ts'
import { CLEARING, DECK, fbm, heightAt, LAND, pathDistance, seeded, smoothstep, TOWN, TOWN_X, townAmount, valueNoise } from './terrain.ts'

const QUARTER = Math.PI / 2

// ------------------------------------------------------------ ground

const paint = Object.fromEntries(Object.entries(PAINT).map(([name, hex]) => [name, new Color(hex)])) as Record<keyof typeof PAINT, Color>
const stroke = new Color()

/** The colour of the ground: cobbles in the town, meadow on the hill, deep moss in the clearing. */
function groundColour(x: number, z: number, h: number, out: Color): Color {
  const patch = fbm(x * 0.055 + 3, z * 0.055 + 8)
  out.copy(paint.mossLight).lerp(paint.clover, smoothstep(0.32, 0.68, patch))
  out.lerp(paint.sunlit, smoothstep(0.55, 0.8, fbm(x * 0.021 + 30, z * 0.021 - 12, 3)) * 0.5)
  out.lerp(paint.moss, smoothstep(9, 20, h) * 0.5)

  out.lerp(paint.sand, 1 - smoothstep(0.2, 1.1, h))
  out.lerp(paint.stoneDark, 1 - smoothstep(-1.6, -0.2, h))

  const cobbles = townAmount(x, z)
  out.lerp(stroke.copy(paint.cobble).lerp(paint.stoneLight, valueNoise(x * 1.3, z * 1.3)), smoothstep(0.35, 0.8, cobbles))

  out.lerp(paint.pathEdge, 1 - smoothstep(0.9, 1.9, pathDistance(x, z)))
  out.lerp(paint.path, 1 - smoothstep(0.35, 1.2, pathDistance(x, z)))

  // The clearing: moss gone dark under the trees, and trodden earth round the fire.
  const fromFire = Math.hypot(x - CLEARING.x, z - CLEARING.z)
  out.lerp(paint.moss, (1 - smoothstep(CLEARING.radius - 1, CLEARING.radius + 5, fromFire)) * 0.8)
  out.lerp(paint.pathEdge, 1 - smoothstep(1.6, 3.4, Math.hypot(x - CLEARING.x - 1.4, z - CLEARING.z - 1.2)))

  return out.multiplyScalar(0.94 + valueNoise(x * 1.9, z * 1.9) * 0.12)
}

function buildLand(): BufferGeometry {
  const across = 128
  const down = 106
  const positions = new Float32Array((across + 1) * (down + 1) * 3)
  const colors = new Float32Array((across + 1) * (down + 1) * 3)
  for (let j = 0; j <= down; j++) {
    for (let i = 0; i <= across; i++) {
      const x = LAND.west + ((LAND.east - LAND.west) * i) / across
      const z = LAND.north + ((LAND.south - LAND.north) * j) / down
      const h = heightAt(x, z)
      const o = (j * (across + 1) + i) * 3
      positions[o] = x
      positions[o + 1] = h
      positions[o + 2] = z
      groundColour(x, z, h, stroke)
      colors[o] = stroke.r
      colors[o + 1] = stroke.g
      colors[o + 2] = stroke.b
    }
  }
  const index = new Uint32Array(across * down * 6)
  let k = 0
  for (let j = 0; j < down; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * (across + 1) + i
      const b = a + 1
      const c = a + across + 1
      const d = c + 1
      index[k++] = a
      index[k++] = c
      index[k++] = b
      index[k++] = b
      index[k++] = c
      index[k++] = d
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.setIndex(new BufferAttribute(index, 1))
  geometry.computeVertexNormals()
  return geometry
}

// ------------------------------------------------------------ quay

function buildQuay(): { pieces: BufferGeometry[]; glow: BufferGeometry[] } {
  const pieces: BufferGeometry[] = []
  const glow: BufferGeometry[] = []
  const random = seeded(31)

  // The sea wall, in two courses of big dressed blocks.
  for (let course = 0; course < 2; course++) {
    let x = TOWN.west - (course ? 1.1 : 0)
    while (x < TOWN.east) {
      const length = 1.8 + random() * 1.2
      const tone = [PAINT.stone, PAINT.stoneLight, PAINT.stoneDark, PAINT.cobble][Math.floor(random() * 4)]
      pieces.push(roughen(slab(x, Math.min(TOWN.east, x + length - 0.05), -1.3 + course * 1.1, -0.2 + course * 1.1, TOWN.front - 0.75, TOWN.front + 0.06, tone), 0.03, Math.round(x)))
      x += length
    }
  }
  pieces.push(slab(TOWN.west, TOWN.east, DECK - 0.12, DECK, TOWN.front - 1.1, TOWN.front + 0.12, [PAINT.stoneLight, PAINT.white]))
  for (let x = TOWN.west + 4; x < TOWN.east; x += 8) {
    pieces.push(cyl(0.16, 0.2, 0.5, PAINT.iron, { at: [x, DECK, TOWN.front - 0.5] }, 8), cyl(0.24, 0.2, 0.12, PAINT.iron, { at: [x, DECK + 0.5, TOWN.front - 0.5] }, 8))
  }

  for (const [x, y, z] of QUAY.lamps) {
    pieces.push(cyl(0.06, 0.1, y - DECK - 0.2, PAINT.iron, { at: [x, DECK, z] }, 7), box(0.36, 0.05, 0.36, PAINT.iron, { at: [x, y + 0.18, z] }), cone(0.22, 0.22, PAINT.iron, { at: [x, y + 0.22, z] }, 6))
    glow.push(box(0.26, 0.38, 0.26, PAINT.lamp, { at: [x, y - 0.2, z] }))
  }

  // The station's name board, facing the train.
  const { at, width, height } = QUAY.sign
  pieces.push(roughen(slab(at[0] - width / 2, at[0] + width / 2, at[1] - height / 2, at[1] + height / 2, at[2] - 0.05, at[2], [PAINT.oat, PAINT.cream]), 0.01, 4))
  pieces.push(slab(at[0] - width / 2 - 0.06, at[0] + width / 2 + 0.06, at[1] + height / 2, at[1] + height / 2 + 0.08, at[2] - 0.08, at[2] + 0.03, PAINT.terracotta))
  for (const end of [-1, 1]) pieces.push(cyl(0.07, 0.08, at[1] + height / 2 - DECK, [PAINT.woodDark, PAINT.wood], { at: [at[0] + end * (width / 2 - 0.25), DECK, at[2] - 0.12] }, 6))

  // Things left on a working quay.
  for (const [x, z, turn] of [
    [TOWN_X - 9, -4.6, 0.2],
    [TOWN_X + 13, -4.4, -0.3],
  ] as const) {
    pieces.push(roughen(box(1.1, 0.7, 0.8, [PAINT.wood, PAINT.woodLight], { at: [x, DECK, z], rot: [0, turn, 0] }), 0.015, Math.round(x)))
    pieces.push(cyl(0.34, 0.3, 0.8, [PAINT.amberDeep, PAINT.amber], { at: [x + 1.1, DECK, z + 0.3] }, 10))
  }
  pieces.push(limb([TOWN_X + 26, DECK + 0.1, -3], [TOWN_X + 27.5, DECK + 0.1, -2.6], 0.12, 0.12, PAINT.oat, 6))

  // The lighthouse at the western end of the quay.
  const [lx, ly, lz] = QUAY.lighthouse
  pieces.push(cyl(2.3, 2.6, 1.3, [PAINT.stoneDark, PAINT.stone], { at: [lx, ly - 0.4, lz] }, 10))
  pieces.push(cyl(1.15, 1.75, 9.5, [PAINT.oat, PAINT.white], { at: [lx, ly + 0.9, lz] }, 12))
  for (const y of [3.2, 6.6]) pieces.push(cyl(1.6 - y * 0.063 + 0.02, 1.68 - y * 0.063 + 0.02, 1.1, PAINT.terracotta, { at: [lx, ly + y, lz] }, 12))
  pieces.push(cyl(1.6, 1.5, 0.16, PAINT.iron, { at: [lx, ly + 10.4, lz] }, 12), cone(1.2, 1.3, [PAINT.terracottaDeep, PAINT.terracotta], { at: [lx, ly + 11.9, lz] }, 10))
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    pieces.push(box(0.06, 1.3, 0.06, PAINT.iron, { at: [lx + Math.cos(angle) * 0.95, ly + 10.56, lz + Math.sin(angle) * 0.95] }))
  }
  glow.push(cyl(0.8, 0.8, 1.3, PAINT.lamp, { at: [lx, ly + 10.56, lz] }, 10))
  return { pieces, glow }
}

// ------------------------------------------------------------ houses

interface House {
  x: number
  /** The front wall's z; the house runs back (north) from it. */
  front: number
  width: number
  depth: number
  height: number
  roof: number
  wall: string
  shutters: string
}

/** A plain town house: plaster walls, a tiled gable roof with its ridge along the street, lit windows. */
function house({ x, front, width, depth, height, roof, wall, shutters }: House, pieces: BufferGeometry[], glow: BufferGeometry[], seed: number) {
  const base = heightAt(x, front - depth / 2) - 0.3
  const back = front - depth
  pieces.push(slab(x - width / 2, x + width / 2, base, base + height + 0.3, back, front, [PAINT.plasterShade, wall]))
  pieces.push(slab(x - width / 2 - 0.08, x + width / 2 + 0.08, base, base + 0.75, back - 0.08, front + 0.08, [PAINT.stoneDark, PAINT.stone]))
  const eave = base + height + 0.3
  pieces.push(
    extrude(
      [
        [-depth / 2 - 0.45, 0],
        [depth / 2 + 0.45, 0],
        [0, roof],
      ],
      width + 0.7,
      [PAINT.terracottaDeep, PAINT.terracotta],
      { at: [x, eave, front - depth / 2], rot: [0, QUARTER, 0] },
    ),
  )
  pieces.push(box(0.7, roof * 0.8, 0.7, [PAINT.brick, PAINT.brickLight], { at: [x + width * 0.27, eave + roof * 0.35, front - depth * 0.6] }), box(0.86, 0.14, 0.86, PAINT.stoneLight, { at: [x + width * 0.27, eave + roof * 1.15, front - depth * 0.6] }))

  const floors = Math.max(1, Math.round(height / 2.7))
  const random = seeded(seed)
  for (let floor = 0; floor < floors; floor++) {
    const y = base + 1.35 + floor * 2.6
    const count = width > 7.6 ? 3 : 2
    for (let i = 0; i < count; i++) {
      const wx = x + ((i + 0.5) / count - 0.5) * (width - 1.2)
      // The ground floor's middle bay is the front door.
      if (floor === 0 && i === Math.floor(count / 2)) {
        pieces.push(slab(wx - 0.5, wx + 0.5, base + 0.3, base + 2.4, front, front + 0.07, [PAINT.walnut, PAINT.walnutLight]), slab(wx - 0.75, wx + 0.75, base + 0.2, base + 0.34, front, front + 0.5, PAINT.stoneLight))
        continue
      }
      glow.push(slab(wx - 0.42, wx + 0.42, y, y + 1.15, front + 0.02, front + 0.07, PAINT.window))
      pieces.push(slab(wx - 0.5, wx + 0.5, y - 0.09, y, front, front + 0.16, PAINT.stoneLight))
      pieces.push(slab(wx - 0.03, wx + 0.03, y, y + 1.15, front + 0.07, front + 0.1, wall), slab(wx - 0.42, wx + 0.42, y + 0.6, y + 0.66, front + 0.07, front + 0.1, wall))
      if (random() > 0.3) for (const side of [-1, 1]) pieces.push(slab(wx + side * 0.45, wx + side * 0.82, y - 0.02, y + 1.17, front + 0.02, front + 0.08, shutters))
    }
  }
}

// ------------------------------------------------------------ the bakery's house

/** A stretch of wall in the bakery's own measure: x across, y up, at a given z. */
const wallAcross = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, colour: readonly [string, string]) => slab(x0, x1, y0, y1, z0, z1, colour)

/**
 * The tall house on the quay: plastered walls with real openings, because the
 * camera stands inside it twice: once in the shop, once under the roof.
 */
function buildBakeryShell(): { shell: BufferGeometry[]; glass: BufferGeometry[]; glow: BufferGeometry[] } {
  const X = BAKERY.halfWidth
  const Z = BAKERY.halfDepth
  const H = BAKERY.height
  const T = 0.22
  const plaster = [PAINT.plasterShade, PAINT.plaster] as const
  const shell: BufferGeometry[] = []
  const glass: BufferGeometry[] = []
  const glow: BufferGeometry[] = []

  // Front (south) wall, with the shop window, the door and a small window.
  const front: (readonly [number, number, number, number])[] = [
    [-X - T, -4.3, 0, H],
    [-4.3, -0.5, 0, 0.85],
    [-4.3, -0.5, 2.75, H],
    [-0.5, 1.0, 0, H],
    [1.0, 2.4, 2.5, H],
    [2.4, 3.1, 0, H],
    [3.1, 4.5, 0, 1.1],
    [3.1, 4.5, 2.5, H],
    [4.5, X + T, 0, H],
  ]
  for (const [x0, x1, y0, y1] of front) shell.push(wallAcross(x0, x1, y0, y1, Z, Z + T, plaster))
  // West wall with its window; the east and back walls are solid.
  shell.push(slab(-X - T, -X, 0, H, -Z - T, -2.6, plaster), slab(-X - T, -X, 0, 1.0, -2.6, -0.2, plaster), slab(-X - T, -X, 2.6, H, -2.6, -0.2, plaster), slab(-X - T, -X, 0, H, -0.2, Z, plaster))
  shell.push(slab(X, X + T, 0, H, -Z - T, Z + T, plaster), slab(-X, X, 0, H, -Z - T, -Z, plaster))
  shell.push(slab(-X - T - 0.06, X + T + 0.06, -0.3, 0.5, Z + T, Z + T + 0.07, [PAINT.stoneDark, PAINT.stone]))
  shell.push(slab(-X - T - 0.07, -X - T, -0.3, 0.5, -Z - T, Z + T, [PAINT.stoneDark, PAINT.stone]), slab(X + T, X + T + 0.07, -0.3, 0.5, -Z - T, Z + T, [PAINT.stoneDark, PAINT.stone]))

  // The shop floor, board by board, and the ceiling that is also the attic's floor.
  for (let i = 0; i < 13; i++) shell.push(slab(-X + i * 0.8, -X + (i + 1) * 0.8 - 0.02, -0.14, 0, -Z, Z, i % 2 ? PAINT.walnut : PAINT.walnutLight))
  shell.push(slab(-X - T, X + T, -0.4, -0.14, -Z - T, Z + T, PAINT.stoneDark))
  shell.push(slab(-X - T, X + T, H, H + 0.2, -Z - T, Z + T, [PAINT.walnutDeep, PAINT.walnut]))
  for (const z of [-2.6, 0, 2.6]) shell.push(slab(-X, X, H - 0.2, H, z - 0.09, z + 0.09, PAINT.walnutDeep))

  // The roof space: low walls front and back, a gable at each end.
  const base = ATTIC.floor
  const top = base + ATTIC.knee
  shell.push(slab(-X - T, X + T, base, top, Z, Z + T, plaster), slab(-X - T, X + T, base, top, -Z - T, -Z, plaster))
  for (const side of [1, -1]) {
    shell.push(
      extrude(
        [
          [-Z - T, 0],
          [Z + T, 0],
          [Z + T, ATTIC.knee],
          [0, ATTIC.knee + ATTIC.rise],
          [-Z - T, ATTIC.knee],
        ],
        T,
        plaster,
        { at: [side * (X + T / 2), base, 0], rot: [0, QUARTER, 0] },
      ),
    )
  }

  // The roof, laid slab by slab so that a skylight can be left open on the sunny side.
  const run = Z + T + 0.45
  const pitch = Math.atan2(ATTIC.rise, Z + T)
  const ridge = top + ATTIC.rise + 0.06
  const slope = run / Math.cos(pitch)
  const tile = (x0: number, x1: number, t0: number, t1: number, side: 1 | -1) => {
    const mid = (t0 + t1) / 2
    return roughen(box(x1 - x0, 0.16, slope * (t1 - t0), [PAINT.terracottaDeep, PAINT.terracotta], { at: [(x0 + x1) / 2, ridge - run * mid * Math.tan(pitch), side * run * mid], rot: [side * pitch, 0, 0] }), 0.02, Math.round(x0 * 7 + t0 * 13))
  }
  shell.push(tile(-X - 0.7, X + 0.7, 0, 1, -1))
  shell.push(tile(-X - 0.7, -1.7, 0, 1, 1), tile(0.9, X + 0.7, 0, 1, 1), tile(-1.7, 0.9, 0, 0.3, 1), tile(-1.7, 0.9, 0.64, 1, 1))
  shell.push(box(X * 2 + 1.5, 0.2, 0.3, PAINT.terracottaLight, { at: [0, ridge + 0.02, 0] }))
  glass.push(box(2.6, 0.03, slope * 0.34, [PAINT.mist, PAINT.white], { at: [-0.4, ridge - run * 0.47 * Math.tan(pitch) + 0.08, run * 0.47], rot: [pitch, 0, 0] }))
  // Rafters, seen from inside.
  for (let x = -4.4; x <= 4.41; x += 1.1) {
    for (const side of [1, -1] as const) shell.push(box(0.12, 0.14, slope * 0.88, PAINT.walnutDeep, { at: [x, ridge - 0.2 - run * 0.46 * Math.tan(pitch), side * run * 0.46], rot: [side * pitch, 0, 0] }))
  }
  shell.push(slab(-X, X, ridge - 0.5, ridge - 0.32, -0.09, 0.09, PAINT.walnutDeep))
  // The oven's chimney: up the east wall of the shop, through the attic as a brick breast, and out of the roof.
  shell.push(roughen(box(0.95, ridge - 1.4, 0.95, [PAINT.brick, PAINT.brickLight], { at: [BAKERY.chimney[0], 1.7, BAKERY.chimney[1]] }), 0.015, 12), box(1.15, 0.16, 1.15, PAINT.stoneLight, { at: [BAKERY.chimney[0], ridge + 0.3, BAKERY.chimney[1]] }))

  // The shop front: timbering, an awning over the window, a hanging sign, a lantern by the door.
  for (const x of [-X - T, -0.3, 2.75, X + T - 0.16]) shell.push(slab(x, x + 0.16, 0.5, H, Z + T, Z + T + 0.05, PAINT.walnut))
  shell.push(slab(-X - T, X + T, H - 0.02, H + 0.2, Z + T, Z + T + 0.07, PAINT.walnut))
  for (let i = 0; i < 6; i++) shell.push(box(0.74, 0.05, 1.5, i % 2 ? PAINT.cream : PAINT.terracotta, { at: [-4.3 + 0.37 + i * 0.76 - 0.38, 3.0, Z + T + 0.62], rot: [0.5, 0, 0] }))
  const { at, width, height } = BAKERY.sign
  shell.push(roughen(slab(at[0] - width / 2, at[0] + width / 2, at[1] - height / 2, at[1] + height / 2, at[2] - 0.06, at[2], [PAINT.walnut, PAINT.walnutLight]), 0.008, 9))
  shell.push(slab(1.0, 1.08, 0, 2.5, Z, Z + T + 0.03, PAINT.walnut), slab(2.32, 2.4, 0, 2.5, Z, Z + T + 0.03, PAINT.walnut), slab(1.0, 2.4, 2.42, 2.5, Z, Z + T + 0.03, PAINT.walnut))
  // The door stands open, inward.
  shell.push(box(1.24, 2.36, 0.07, [PAINT.walnut, PAINT.walnutLight], { at: [1.5, 0.02, Z - 0.55], rot: [0, 1.1, 0] }))
  shell.push(slab(0.6, 2.8, -0.12, 0.02, Z + T, Z + T + 0.7, PAINT.stoneLight))
  // Window bars.
  for (const x of [-3.05, -1.75]) shell.push(slab(x - 0.035, x + 0.035, 0.85, 2.75, Z + 0.06, Z + 0.14, PAINT.walnut))
  shell.push(slab(-4.3, -0.5, 2.1, 2.16, Z + 0.06, Z + 0.14, PAINT.walnut), slab(-4.34, -0.46, 0.78, 0.85, Z - 0.1, Z + T + 0.18, PAINT.walnutLight))
  shell.push(slab(3.76, 3.84, 1.1, 2.5, Z + 0.06, Z + 0.14, PAINT.walnut), slab(3.1, 4.5, 1.76, 1.82, Z + 0.06, Z + 0.14, PAINT.walnut))
  shell.push(slab(-X - 0.14, -X - 0.06, 1.0, 2.6, -1.44, -1.36, PAINT.walnut))
  glass.push(slab(-4.3, -0.5, 0.85, 2.75, Z + 0.09, Z + 0.12, [PAINT.mist, PAINT.white]), slab(3.1, 4.5, 1.1, 2.5, Z + 0.09, Z + 0.12, [PAINT.mist, PAINT.white]), slab(-X - 0.12, -X - 0.09, 1.0, 2.6, -2.6, -0.2, [PAINT.mist, PAINT.white]))
  // A box of flowers under the small window.
  shell.push(slab(3.05, 4.55, 0.82, 1.08, Z + T, Z + T + 0.3, [PAINT.wood, PAINT.woodLight]))
  for (let i = 0; i < 5; i++) shell.push(blob(0.2, [PAINT.leafDeep, [PAINT.terracottaLight, PAINT.cream, PAINT.sunflower, PAINT.rose, PAINT.cream][i]], { at: [3.25 + i * 0.28, 1.18, Z + T + 0.16] }, 0.3, 80 + i, 1))
  shell.push(box(0.04, 0.3, 0.04, PAINT.iron, { at: [0.5, 2.5, Z + T + 0.22] }), box(0.3, 0.04, 0.3, PAINT.iron, { at: [0.5, 2.5, Z + T + 0.22] }))
  glow.push(box(0.2, 0.26, 0.2, PAINT.lamp, { at: [0.5, 2.24, Z + T + 0.22] }))

  // Seen from the quay, the round window in the west gable glows.
  glow.push(cyl(0.6, 0.6, 0.05, PAINT.window, { at: [-X - T - 0.03, base + 2.3, 0], rot: [0, 0, QUARTER] }, 14))
  shell.push(cyl(0.72, 0.72, 0.04, PAINT.walnut, { at: [-X - T - 0.01, base + 2.3, 0], rot: [0, 0, QUARTER] }, 14))
  return { shell, glass, glow }
}

// ------------------------------------------------------------ trees and clouds

type Maker = (x: number, y: number, z: number, size: number, seed: number) => BufferGeometry[]

const broadleaf: Maker = (x, y, z, s, seed) => {
  const random = seeded(seed)
  const lean = (random() - 0.5) * 0.16
  const pieces = [cyl(0.2 * s, 0.34 * s, 2.3 * s, [PAINT.bark, PAINT.barkLight], { at: [x, y - 0.2, z], rot: [lean, random() * 6, lean] }, 7)]
  const crowns = 3 + Math.floor(random() * 2)
  for (let i = 0; i < crowns; i++) {
    const angle = (i / crowns) * Math.PI * 2 + random()
    const reach = i === 0 ? 0 : (0.7 + random() * 0.5) * s
    pieces.push(blob((1.25 + random() * 0.5) * s, [PAINT.leafDeep, i === 0 ? PAINT.leafGold : PAINT.leafLight], { at: [x + Math.cos(angle) * reach, y + (2.9 + (i === 0 ? 0.8 : random() * 0.5)) * s, z + Math.sin(angle) * reach], scale: [1, 0.86, 1] }, 0.22, seed + i, 1))
  }
  return pieces
}

/** A tall dark conifer: the silhouettes that close in the campfire clearing. */
const pine: Maker = (x, y, z, s, seed) => {
  const turn = seeded(seed)() * 6
  return [
    cyl(0.14 * s, 0.24 * s, 1.6 * s, [PAINT.bark, PAINT.barkLight], { at: [x, y - 0.3, z] }, 6),
    cone(1.5 * s, 2.6 * s, [PAINT.pine, PAINT.pineLight], { at: [x, y + 1.1 * s, z], rot: [0, turn, 0] }, 7),
    cone(1.15 * s, 2.3 * s, [PAINT.pine, PAINT.pineLight], { at: [x, y + 2.5 * s, z], rot: [0, turn + 0.4, 0] }, 7),
    cone(0.78 * s, 2 * s, [PAINT.pine, PAINT.pineLight], { at: [x, y + 3.8 * s, z], rot: [0, turn + 0.8, 0] }, 7),
  ]
}

function buildTrees(): BufferGeometry[] {
  const random = seeded(20261013)
  const pieces: BufferGeometry[] = []
  // A ring of pines round the clearing, open toward the sea so the fire can be seen from the bench.
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + random() * 0.15
    // South-east of the clearing is where the visitor sits.
    if (Math.cos(angle - 0.9) > 0.55) continue
    const reach = CLEARING.radius + 3.5 + random() * 7
    const x = CLEARING.x + Math.cos(angle) * reach
    const z = CLEARING.z + Math.sin(angle) * reach
    pieces.push(...pine(x, heightAt(x, z), z, 1.1 + random() * 0.9, Math.floor(random() * 1e6)))
  }
  let planted = 0
  for (let tries = 0; tries < 2400 && planted < 70; tries++) {
    const x = LAND.west + random() * (LAND.east - LAND.west)
    const z = LAND.north + random() * (LAND.south - LAND.north)
    const y = heightAt(x, z)
    if (y < 1.6 || townAmount(x, z) > 0.05 || pathDistance(x, z) < 2.6) continue
    if (Math.hypot(x - CLEARING.x, z - CLEARING.z) < CLEARING.radius + 3) continue
    if (random() > smoothstep(0.42, 0.6, fbm(x * 0.05 + 50, z * 0.05 + 20, 3))) continue
    const maker = random() < smoothstep(5, 13, y) * 0.8 ? pine : broadleaf
    pieces.push(...maker(x, y, z, 0.85 + random() * 0.8, Math.floor(random() * 1e6)))
    planted++
  }
  for (let tries = 0, rocks = 0; tries < 600 && rocks < 26; tries++) {
    const x = LAND.west + random() * (LAND.east - LAND.west)
    const z = LAND.north + random() * (LAND.south - LAND.north)
    const y = heightAt(x, z)
    if (y < -0.4 || townAmount(x, z) > 0.05 || pathDistance(x, z) < 1.6) continue
    const size = 0.3 + random() * random() * 1.3
    pieces.push(blob(size, [PAINT.stoneDark, PAINT.stoneLight], { at: [x, y + size * 0.25, z], scale: [1.25, 0.72, 1], rot: [0, random() * 6, random() * 0.3] }, 0.3, rocks, 1))
    rocks++
  }
  return pieces
}

function buildCloud(seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const pieces: BufferGeometry[] = []
  const puffs = 6 + Math.floor(random() * 4)
  for (let i = 0; i < puffs; i++) {
    const along = (i / (puffs - 1) - 0.5) * 2
    const size = (1.7 - Math.abs(along) * 0.8) * (0.8 + random() * 0.6)
    // Flat underneath, heaped on top, as a cloud bank is at the end of the day.
    pieces.push(blob(size, [PAINT.cloudShade, PAINT.cloud], { at: [along * 4.2, size * 0.5 + random() * 0.4, (random() - 0.5) * 1.6], scale: [1.5, 0.82, 1] }, 0.14, seed + i))
  }
  return pieces
}

export function buildTown(): Part[] {
  const quay = buildQuay()
  const bakery = buildBakeryShell()
  const houses: BufferGeometry[] = []
  const glow: BufferGeometry[] = [...quay.glow]
  const street = BAKERY.at[2] + BAKERY.halfDepth
  const row: House[] = [
    { x: TOWN_X - 21.5, front: street + 0.3, width: 8.4, depth: 7, height: 5.4, roof: 2.9, wall: PAINT.plaster, shutters: PAINT.cornflowerDeep },
    { x: TOWN_X - 11.6, front: street - 0.2, width: 7.2, depth: 7.6, height: 7.6, roof: 3.1, wall: '#ecd3ae', shutters: PAINT.moss },
    { x: TOWN_X + 11.6, front: street, width: 8, depth: 7.2, height: 5.6, roof: 3, wall: '#eed6c4', shutters: PAINT.terracottaDeep },
    { x: TOWN_X + 21.4, front: street + 0.4, width: 7.6, depth: 7.4, height: 4.6, roof: 2.7, wall: PAINT.mist, shutters: PAINT.walnut },
    { x: TOWN_X - 15, front: -27, width: 8, depth: 6.4, height: 4.8, roof: 2.8, wall: PAINT.plaster, shutters: PAINT.terracottaDeep },
    { x: TOWN_X - 2, front: -29, width: 7, depth: 6, height: 5.2, roof: 2.9, wall: '#ecd3ae', shutters: PAINT.cornflowerDeep },
    { x: TOWN_X + 20, front: -27.5, width: 7.4, depth: 6.2, height: 4.6, roof: 2.6, wall: '#eed6c4', shutters: PAINT.moss },
  ]
  row.forEach((spec, i) => house(spec, houses, glow, 100 + i))

  return [
    { name: 'Land', geometry: buildLand(), material: 'paint' },
    part('Town_Quay', quay.pieces),
    part('Town_Houses', houses),
    part('Town_Glow', glow, 'glow'),
    part('Town_Trees', buildTrees()),
    part('Bakery_Shell', bakery.shell),
    part('Bakery_Glass', bakery.glass, 'glass'),
    part('Bakery_Shell_Glow', bakery.glow, 'glow'),
    part('Cloud_1', buildCloud(11)),
    part('Cloud_2', buildCloud(23)),
    part('Cloud_3', buildCloud(37)),
  ]
}
