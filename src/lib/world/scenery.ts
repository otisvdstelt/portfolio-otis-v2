// The valley itself: the ground with its footpaths painted in, the trees and
// stones scattered over it, and three cloud shapes for the sky.
import { BufferAttribute, BufferGeometry, Color } from 'three'
import { blob, box, cone, cyl, part, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { fbm, heightAt, lakeAmount, pathDistance, seeded, SITES, smoothstep, trackAmount, TRACK_NORTH, TRACK_SOUTH, TRACK_X, valueNoise, WATER_Y, WINDMILLS, WORLD_HALF } from './terrain.ts'

// ------------------------------------------------------------ ground

const paint = Object.fromEntries(Object.entries(PAINT).map(([name, hex]) => [name, new Color(hex)])) as Record<keyof typeof PAINT, Color>
const stroke = new Color()

/** The colour of the ground at a point: meadow greens, the footpaths, the shore and the lake bed. */
function groundColour(x: number, z: number, h: number, out: Color): Color {
  const patch = fbm(x * 0.055 + 3, z * 0.055 + 8)
  const sun = fbm(x * 0.021 + 30, z * 0.021 - 12, 3)
  out.copy(paint.moss).lerp(paint.clover, smoothstep(0.32, 0.68, patch))
  out.lerp(paint.sunlit, smoothstep(0.52, 0.8, sun) * 0.6)
  out.lerp(paint.mossDeep, smoothstep(0.6, 0.3, sun) * 0.35)
  // The far hills go blue-green with distance, as painted backgrounds do.
  out.lerp(paint.hillBlue, smoothstep(40, 86, Math.hypot(x, z + 2)) * 0.75)

  out.lerp(paint.pathEdge, 1 - smoothstep(0.9, 1.9, pathDistance(x, z)))
  out.lerp(paint.path, 1 - smoothstep(0.35, 1.2, pathDistance(x, z)))

  // Gravel under the rails, trodden earth round the campfire.
  const onLine = z > TRACK_NORTH - 1 && z < TRACK_SOUTH + 1.5 ? 1 - smoothstep(1.3, 2.2, Math.abs(x - TRACK_X)) : 0
  out.lerp(paint.ballast, onLine * trackAmount(x, z))
  out.lerp(paint.pathEdge, 1 - smoothstep(1.2, 2.6, Math.hypot(x - SITES.campfire[0], z - SITES.campfire[1])))

  out.lerp(paint.sand, (1 - smoothstep(WATER_Y + 0.1, WATER_Y + 0.9, h)) * smoothstep(0.02, 0.2, lakeAmount(x, z)))
  out.lerp(paint.lakeBed, 1 - smoothstep(WATER_Y - 1.1, WATER_Y - 0.1, h))
  out.lerp(paint.lakeDeep, 1 - smoothstep(-5.5, -2, h))

  // Dry-brush: every stroke a touch lighter or darker than its neighbour.
  return out.multiplyScalar(0.94 + valueNoise(x * 1.9, z * 1.9) * 0.12)
}

/** The ground mesh. The grid is finest in the middle of the valley, where the camera spends its time. */
function buildTerrain(): BufferGeometry {
  const cells = 176
  const side = cells + 1
  const positions = new Float32Array(side * side * 3)
  const colors = new Float32Array(side * side * 3)
  const spread = (u: number) => WORLD_HALF * (0.42 * u + 0.58 * u * u * u)

  for (let j = 0; j < side; j++) {
    for (let i = 0; i < side; i++) {
      const x = spread((i / cells) * 2 - 1)
      const z = spread((j / cells) * 2 - 1)
      const h = heightAt(x, z)
      const o = (j * side + i) * 3
      positions[o] = x
      positions[o + 1] = h
      positions[o + 2] = z
      groundColour(x, z, h, stroke)
      colors[o] = stroke.r
      colors[o + 1] = stroke.g
      colors[o + 2] = stroke.b
    }
  }

  const index = new Uint32Array(cells * cells * 6)
  let k = 0
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const a = j * side + i
      const b = a + 1
      const c = a + side
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

// ------------------------------------------------------------ trees

type Maker = (x: number, y: number, z: number, size: number, seed: number) => BufferGeometry[]

/** A round, generous tree: the kind that fills the middle distance of a painted valley. */
const broadleaf: Maker = (x, y, z, s, seed) => {
  const random = seeded(seed)
  const lean = (random() - 0.5) * 0.16
  const pieces = [cyl(0.2 * s, 0.34 * s, 2.3 * s, [PAINT.bark, PAINT.barkLight], { at: [x, y - 0.2, z], rot: [lean, random() * 6, lean] }, 7)]
  const crowns = 3 + Math.floor(random() * 2)
  for (let i = 0; i < crowns; i++) {
    const angle = (i / crowns) * Math.PI * 2 + random()
    const reach = i === 0 ? 0 : (0.7 + random() * 0.5) * s
    pieces.push(
      blob((1.25 + random() * 0.5) * s, [PAINT.leafDeep, i === 0 ? PAINT.leafGold : PAINT.leafLight], { at: [x + Math.cos(angle) * reach, y + (2.9 + (i === 0 ? 0.8 : random() * 0.5)) * s, z + Math.sin(angle) * reach], scale: [1, 0.86, 1] }, 0.22, seed + i, 1),
    )
  }
  return pieces
}

/** A tall, narrow tree for the skyline. */
const poplar: Maker = (x, y, z, s, seed) => {
  const random = seeded(seed)
  return [
    cyl(0.12 * s, 0.22 * s, 1.6 * s, [PAINT.bark, PAINT.barkLight], { at: [x, y - 0.2, z] }, 6),
    blob(1 * s, [PAINT.leafDeep, PAINT.leafLight], { at: [x, y + 3.3 * s, z], scale: [0.72, 2.3, 0.72], rot: [0, random() * 6, 0] }, 0.16, seed, 1),
  ]
}

/** A dark conifer, for the cooler slopes of the rim. */
const pine: Maker = (x, y, z, s, seed) => {
  const turn = seeded(seed)() * 6
  return [
    cyl(0.12 * s, 0.2 * s, 1.2 * s, [PAINT.bark, PAINT.barkLight], { at: [x, y - 0.2, z] }, 6),
    cone(1.35 * s, 2.2 * s, [PAINT.pine, PAINT.pineLight], { at: [x, y + 0.9 * s, z], rot: [0, turn, 0] }, 7),
    cone(1.05 * s, 1.9 * s, [PAINT.pine, PAINT.pineLight], { at: [x, y + 2.1 * s, z], rot: [0, turn + 0.4, 0] }, 7),
    cone(0.7 * s, 1.6 * s, [PAINT.pine, PAINT.leafLight], { at: [x, y + 3.2 * s, z], rot: [0, turn + 0.8, 0] }, 7),
  ]
}

const bush: Maker = (x, y, z, s, seed) => [
  blob(0.8 * s, [PAINT.leafDeep, PAINT.leafLight], { at: [x, y + 0.35 * s, z], scale: [1.2, 0.8, 1] }, 0.25, seed, 1),
  blob(0.55 * s, [PAINT.leafDeep, PAINT.leafGold], { at: [x + 0.7 * s, y + 0.25 * s, z + 0.2 * s] }, 0.25, seed + 1, 1),
]

/** True where nothing wild may grow: on paths, rails, water, and where the landmarks stand. */
function isKeptClear(x: number, z: number, margin: number): boolean {
  if (pathDistance(x, z) < 1.6 + margin) return true
  if (trackAmount(x, z) > 0.05 || lakeAmount(x, z) > 0.02) return true
  const sites: readonly (readonly [number, number, number])[] = [
    [...SITES.oak, 11],
    [...SITES.greenhouse, 6],
    // A wide clearing, so the postbox and its fire are seen against open meadow.
    [...SITES.postbox, 10],
    [...SITES.campfire, 8],
    [...SITES.signpost, 5],
    ...WINDMILLS.map(([wx, wz, size]) => [wx, wz, 3.2 * size] as const),
  ]
  return sites.some(([sx, sz, radius]) => Math.hypot(x - sx, z - sz) < radius + margin)
}

function buildTrees(): BufferGeometry[] {
  const random = seeded(20261013)
  const pieces: BufferGeometry[] = []
  let planted = 0
  for (let tries = 0; tries < 2600 && planted < 96; tries++) {
    const x = (random() * 2 - 1) * 84
    const z = (random() * 2 - 1) * 84
    const r = Math.hypot(x, z + 2)
    // Woods gather in clumps and thicken toward the hills; the valley floor stays open meadow.
    const grove = fbm(x * 0.045 + 50, z * 0.045 + 20, 3)
    const chance = smoothstep(0.46, 0.62, grove) * (0.25 + 0.75 * smoothstep(18, 46, r))
    if (random() > chance || r < 13 || isKeptClear(x, z, 1.5)) continue
    // Keep the view from the home hill open down the middle of the valley.
    if (z > 12 && Math.abs(x) < 15 && z < 60) continue
    const y = heightAt(x, z)
    const size = 0.85 + random() * 0.75
    const high = smoothstep(4, 14, y)
    const pick = random()
    const maker = pick < high * 0.7 ? pine : pick > 0.82 ? poplar : broadleaf
    pieces.push(...maker(x, y, z, size, Math.floor(random() * 1e6)))
    planted++
  }
  for (let tries = 0, bushes = 0; tries < 900 && bushes < 46; tries++) {
    const x = (random() * 2 - 1) * 52
    const z = (random() * 2 - 1) * 52
    if (isKeptClear(x, z, 0.4) || random() > 0.35) continue
    pieces.push(...bush(x, heightAt(x, z), z, 0.6 + random() * 0.7, Math.floor(random() * 1e6)))
    bushes++
  }
  return pieces
}

function buildRocks(): BufferGeometry[] {
  const random = seeded(77)
  const pieces: BufferGeometry[] = []
  for (let tries = 0, rocks = 0; tries < 900 && rocks < 44; tries++) {
    const x = (random() * 2 - 1) * 60
    const z = (random() * 2 - 1) * 60
    if (isKeptClear(x, z, 0.2) && lakeAmount(x, z) < 0.02) continue
    const y = heightAt(x, z)
    // Stones sit on dry land or in the shallows, never out in the deep.
    if (y < WATER_Y - 0.5) continue
    const size = 0.3 + random() * random() * 1.1
    pieces.push(blob(size, [PAINT.stoneDark, PAINT.stoneLight], { at: [x, y + size * 0.25, z], scale: [1.25, 0.72, 1], rot: [0, random() * 6, random() * 0.3] }, 0.3, rocks, 1))
    rocks++
  }

  // A split-rail fence keeping the meadow path company on its way to the windmills.
  const fence: (readonly [number, number])[] = [
    [3.4, -6],
    [2.6, -11],
    [1.2, -16],
    [0.6, -21],
  ]
  for (let i = 0; i < fence.length; i++) {
    const [x, z] = fence[i]
    const y = heightAt(x, z)
    pieces.push(cyl(0.09, 0.11, 1.15, [PAINT.woodDark, PAINT.woodLight], { at: [x, y - 0.1, z], rot: [0.04 * (i % 2 ? 1 : -1), 0, 0.05] }, 6))
    if (i === fence.length - 1) continue
    const [nx, nz] = fence[i + 1]
    const ny = heightAt(nx, nz)
    const length = Math.hypot(nx - x, nz - z, ny - y)
    const yaw = Math.atan2(-(nz - z), nx - x)
    const pitch = Math.atan2(ny - y, Math.hypot(nx - x, nz - z))
    for (const lift of [0.42, 0.82]) {
      pieces.push(box(length, 0.09, 0.07, PAINT.woodLight, { at: [(x + nx) / 2, (y + ny) / 2 + lift, (z + nz) / 2], rot: [0, yaw, pitch] }))
    }
  }

  // Stepping stones where the paths arrive.
  for (const [x, z] of [
    [-20.9, -0.5],
    [-21.6, -1],
    [-11.4, 21.7],
    [9.3, 5.9],
  ] as const) {
    pieces.push(cyl(0.42, 0.46, 0.12, PAINT.stoneLight, { at: [x, heightAt(x, z) - 0.03, z], rot: [0, x, 0] }, 7))
  }
  return pieces
}

// ------------------------------------------------------------ clouds

function buildCloud(seed: number): BufferGeometry[] {
  const random = seeded(seed)
  const pieces: BufferGeometry[] = []
  const puffs = 5 + Math.floor(random() * 3)
  for (let i = 0; i < puffs; i++) {
    const along = (i / (puffs - 1) - 0.5) * 2
    const size = (1.5 - Math.abs(along) * 0.7) * (0.8 + random() * 0.5)
    pieces.push(blob(size, [PAINT.cloudShade, PAINT.cloud], { at: [along * 3.4, size * 0.42 + random() * 0.3, (random() - 0.5) * 1.4], scale: [1.35, 0.8, 1] }, 0.14, seed + i))
  }
  return pieces
}

export function buildScenery(): Part[] {
  return [
    { name: 'Terrain', geometry: buildTerrain(), material: 'paint' },
    part('Trees', buildTrees()),
    part('Rocks', buildRocks()),
    part('Cloud_1', buildCloud(11)),
    part('Cloud_2', buildCloud(23)),
    part('Cloud_3', buildCloud(37)),
  ]
}
