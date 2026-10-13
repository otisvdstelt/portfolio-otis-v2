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

// ------------------------------------------------------------ the map

/** The sea is perfectly flat, and it is the zero everything else is measured from. */
export const SEA_Y = 0
/** The halt's deck and the floors of the train stand at one height above the water. */
export const DECK = 1
/** The railway runs along z = 0, east from the halt at x = 0. */
export const TRACK = { west: -420, east: 420, gauge: 1.44 }
/** While the train is under way it runs round this stretch for ever; telegraph posts stand along it. */
export const CRUISE = { from: 80, to: 200, speed: 9, postEvery: 40 }

