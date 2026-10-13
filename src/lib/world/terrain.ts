// The lie of the sea, and of the one piece of land in it. The world is a flat
// sea with five scenes standing far apart on it; the asset script and the app
// both ask this file where things are.

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
/** The halt's deck and the floors of the train stand at one height above the water. */
export const DECK = 1
/** The railway runs along z = 0, east from the halt at x = 0. */
export const TRACK = { west: -420, east: 420, gauge: 1.44 }
/** While the train is under way it runs round this stretch for ever; telegraph posts stand along it. */
export const CRUISE = { from: 80, to: 200, speed: 9, postEvery: 40 }

/**
 * Where each standalone scene stands, as [x, z]. They are a thousand apart, so
 * that from any one of them the others are lost in the haze: each has the sea
 * and the sky to itself.
 */
export const SITES = {
  tower: [2000, 0],
  signpost: [3000, 0],
  busstop: [4000, 0],
} as const satisfies Record<string, readonly [number, number]>

/** The clocktower's room hangs high over the sea, so its window looks out on sky. */
export const TOWER_FLOOR = 34

/**
 * The coast where the signpost stands, measured from the signpost's site: a
 * low shore running east to west, with the sea to the north (-z) and a
 * meadow rising gently inland. Below zero is open water.
 */
export function shoreHeight(x: number, z: number): number {
  // The waterline wanders, and the land gives out toward either end.
  const waterline = -3.2 + (fbm(x * 0.06 + 5, 1.7, 3) - 0.5) * 5
  const inland = z - waterline
  const ends = 1 - smoothstep(46, 78, Math.abs(x))
  const rise = smoothstep(-1.5, 16, inland) * 2.1 + (fbm(x * 0.07, z * 0.07, 3) - 0.5) * 0.7 * smoothstep(1, 9, inland)
  // A small knoll for the signpost to stand on.
  const knoll = 0.55 * Math.exp(-((x - 2) * (x - 2) + z * z) / 30)
  return mix(-1.6, rise + knoll + 0.12, smoothstep(-2.5, 1.5, inland) * ends)
}
