// The lie of the land. One height function describes the whole valley; the
// asset script bakes it into the terrain mesh and the app asks it where the
// ground is when it plants grass, stands landmarks up and parks the camera.

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
const bump = (dx: number, dz: number, sigma: number) => Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))

// ------------------------------------------------------------ the map

/** Half the width of the terrain square. */
export const WORLD_HALF = 96
/** The lake's surface. */
export const WATER_Y = -0.45
/** The railway runs dead straight, north to south, along this line. */
export const TRACK_X = 15
export const TRACK_NORTH = -58
export const TRACK_SOUTH = 17.5

/** Where each thing stands, as [x, z]. North is -z; the home hill is in the south. */
export const SITES = {
  hill: [0, 44],
  signpost: [2.6, 42.4],
  oak: [-27, -6],
  greenhouse: [-22.6, -1.9],
  platform: [11.6, 5],
  train: [TRACK_X, -2],
  lake: [31, -3],
  meadow: [-2, -30],
  postbox: [-13, 21],
  campfire: [-10, 23.6],
} as const satisfies Record<string, readonly [number, number]>

/** The windmill meadow: x, z, size and how far each mill is turned from facing south. */
export const WINDMILLS: readonly (readonly [number, number, number, number])[] = [
  [-13.5, -26.5, 1.0, 0.5],
  [-7.6, -33.5, 1.22, 0.2],
  [-1.2, -27.6, 0.92, -0.1],
  [5.2, -34.4, 1.3, -0.3],
  [10.2, -27.2, 1.05, -0.55],
]

/** The footpaths, as chains of [x, z]. They are painted into the grass, not modelled. */
export const PATHS: readonly (readonly (readonly [number, number])[])[] = [
  [
    [2.2, 40.5],
    [1, 33],
    [-2, 24],
    [-1.2, 14],
    [0, 6],
  ],
  [
    [0, 6],
    [-8, 3.4],
    [-15.5, 1.2],
    [-20.4, -0.2],
  ],
  [
    [0, 6],
    [5, 6.4],
    [9.2, 6],
  ],
  [
    [0, 6],
    [0.6, -4],
    [-1.6, -14],
    [-2.4, -24.5],
  ],
  [
    [-2, 24],
    [-6.5, 23],
    [-11, 21.8],
  ],
]

function segmentDistance(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax
  const dz = bz - az
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - ax - dx * t, pz - az - dz * t)
}

/** Distance to the nearest footpath, wobbled so the edges are not ruler-straight. */
export function pathDistance(x: number, z: number): number {
  const wx = x + (valueNoise(x * 0.35, z * 0.35) - 0.5) * 1.5
  const wz = z + (valueNoise(x * 0.35 + 40, z * 0.35 + 40) - 0.5) * 1.5
  let best = Infinity
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      best = Math.min(best, segmentDistance(wx, wz, path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]))
    }
  }
  return best
}

/** 0 on dry land, rising to 1 well inside the lake. */
export function lakeAmount(x: number, z: number): number {
  const d = Math.hypot((x - SITES.lake[0]) / 14, (z - SITES.lake[1]) / 17) + (valueNoise(x * 0.16, z * 0.16) - 0.5) * 0.16
  return 1 - smoothstep(0.84, 1.1, d)
}

/** 1 on the railway's embankment, falling to 0 a few steps either side. */
export function trackAmount(x: number, z: number): number {
  // The embankment is wider on the west, where the platform stands.
  const dx = x - TRACK_X
  const across = dx < 0 ? 1 - smoothstep(6.2, 10, -dx) : 1 - smoothstep(2.2, 5.5, dx)
  // The cutting ends hard against the northern hills, where the tunnel mouth stands.
  return across * smoothstep(TRACK_NORTH - 4, TRACK_NORTH - 2, z) * (1 - smoothstep(TRACK_SOUTH + 2, TRACK_SOUTH + 8, z))
}

// The valley before anything was built in it.
function wildHeight(x: number, z: number): number {
  const r = Math.hypot(x, z + 2)
  // The ring of hills is lower in the south, so the home hill stands clear of it.
  const south = 1 - 0.75 * smoothstep(10, 50, z)
  const rim = Math.pow(smoothstep(34, 80, r), 1.5) * 26 * south
  const calm = 0.3 + 0.7 * smoothstep(12, 44, r)
  const roll = ((fbm(x * 0.03 + 11, z * 0.03 + 5) - 0.5) * 5 + (fbm(x * 0.11, z * 0.11) - 0.5) * 0.9) * calm
  const hill = 11 * bump(x - SITES.hill[0], z - SITES.hill[1], 13)
  const mound = 2.4 * bump(x - SITES.oak[0], z - SITES.oak[1], 8)
  return rim + roll + hill + mound + 0.6
}

/** Ground level under the railway and the platform. */
export const TRACK_Y = 0.55

// Level ground where something stands: x, z, radius of the flat part, width of the blend back to wild ground.
const PADS: readonly (readonly [number, number, number, number])[] = [
  [SITES.greenhouse[0], SITES.greenhouse[1], 3.6, 4],
  [SITES.oak[0], SITES.oak[1], 3, 5],
  [SITES.postbox[0] + 1.5, SITES.postbox[1] + 1.6, 4.6, 4],
  ...WINDMILLS.map(([x, z, size]) => [x, z, 1.8 * size, 3] as const),
]
const PAD_LEVELS = PADS.map(([x, z]) => wildHeight(x, z))

/** Height of the ground at any point of the valley. */
export function heightAt(x: number, z: number): number {
  let h = wildHeight(x, z)
  for (let i = 0; i < PADS.length; i++) {
    const [px, pz, radius, blend] = PADS[i]
    const d = Math.hypot(x - px, z - pz)
    if (d < radius + blend) h = mix(h, PAD_LEVELS[i], 1 - smoothstep(radius, radius + blend, d))
  }
  h = mix(h, TRACK_Y, trackAmount(x, z))
  h = mix(h, -6, lakeAmount(x, z))
  return h
}

/** A site's position on the ground, as [x, y, z]. */
export function groundAt([x, z]: readonly [number, number], lift = 0): [number, number, number] {
  return [x, heightAt(x, z) + lift, z]
}
