// The lie of the land, and of the sea. The world is one railway laid straight
// across a flat sea: a floating halt at one end, a coastal town at the other.
// The asset script bakes the coast from these functions and the app asks them
// where the ground is when it plants things and parks the camera.

// ------------------------------------------------------------ noise

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Smooth value noise in 0..1; the same everywhere it is asked. */
export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz)
  const b = hash2(ix + 1, iz)
  const c = hash2(ix, iz + 1)
  const d = hash2(ix + 1, iz + 1)
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz
}

/** A few octaves of value noise, still 0..1. */
export function fbm(x: number, z: number, octaves = 4): number {
  let sum = 0
  let amplitude = 0.5
  let total = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x, z) * amplitude
    total += amplitude
    x = x * 2.03 + 17.1
    z = z * 2.03 + 9.7
    amplitude *= 0.5
  }
  return sum / total
}

/** A small seeded random stream, so every bake and every visit scatter things the same way. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

// ------------------------------------------------------------ the map

/** The sea is perfectly flat, and it is the zero everything else is measured from. */
export const SEA_Y = 0
/** Platforms, the quay and the floors of the train all stand at one height above the water. */
export const DECK = 1
/** The railway runs along z = 0, from the halt at x = 0 east to the town. */
export const TOWN_X = 300
export const TRACK = { west: -420, east: TOWN_X + 30, gauge: 1.44 }
/** While the train is under way it runs round this stretch for ever; telegraph posts stand along it. */
export const CRUISE = { from: 80, to: 200, speed: 9, postEvery: 40 }

/** The town's level ground behind the quay. */
export const TOWN = { west: 270, east: 334, front: -1.9, back: -25 }
/** The clearing on the hill behind the town, where the campfire burns. */
export const CLEARING = { x: TOWN_X + 35, z: -58, radius: 8 }

/** The coast as a patch of ground: the terrain mesh covers exactly this rectangle. */
export const LAND = { west: 232, east: 396, north: -134, south: 2 }

// The island before anyone levelled it: one rounded hill with a ragged shoreline.
function wildHeight(x: number, z: number): number {
  const d = Math.hypot((x - 314) / 68, (z + 66) / 62) + (fbm(x * 0.024, z * 0.024) - 0.5) * 0.36
  if (d >= 1) return -1 - (d - 1) * 9
  const crown = Math.pow(1 - d * d, 0.8)
  return crown * 17 * (0.72 + 0.56 * fbm(x * 0.03 + 9, z * 0.03 + 4)) + (fbm(x * 0.12, z * 0.12) - 0.5) * 0.7 - 0.7
}

const CLEARING_LEVEL = wildHeight(CLEARING.x, CLEARING.z)

/** 1 on the town's level ground, 0 away from it. */
export function townAmount(x: number, z: number): number {
  return smoothstep(TOWN.west - 8, TOWN.west + 2, x) * (1 - smoothstep(TOWN.east - 2, TOWN.east + 8, x)) * (1 - smoothstep(-TOWN.back, -TOWN.back + 12, -z))
}

/** Height of the ground. Below the sea's surface means open water. */
export function heightAt(x: number, z: number): number {
  // South of the quay wall there is only sea.
  if (z > TOWN.front) return -4
  let h = wildHeight(x, z)
  h = mix(h, DECK, townAmount(x, z))
  const d = Math.hypot(x - CLEARING.x, z - CLEARING.z)
  h = mix(h, CLEARING_LEVEL, 1 - smoothstep(CLEARING.radius, CLEARING.radius + 6, d))
  return h
}

/** The footpath from the back of the town up to the clearing, as a chain of [x, z]. */
export const PATH: readonly (readonly [number, number])[] = [
  [TOWN_X + 9, -19],
  [TOWN_X + 13, -30],
  [TOWN_X + 22, -41],
  [TOWN_X + 30, -50],
  [CLEARING.x - 1, CLEARING.z + 3],
]

/** Distance to the footpath, wobbled so its edges are not ruler-straight. */
export function pathDistance(x: number, z: number): number {
  const wx = x + (valueNoise(x * 0.35, z * 0.35) - 0.5) * 1.4
  const wz = z + (valueNoise(x * 0.35 + 40, z * 0.35 + 40) - 0.5) * 1.4
  let best = Infinity
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i]
    const [bx, bz] = PATH[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.min(1, Math.max(0, ((wx - ax) * dx + (wz - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(wx - ax - dx * t, wz - az - dz * t))
  }
  return best
}

/** A point on the ground, as [x, y, z]. */
export function groundAt(x: number, z: number, lift = 0): [number, number, number] {
  return [x, heightAt(x, z) + lift, z]
}
