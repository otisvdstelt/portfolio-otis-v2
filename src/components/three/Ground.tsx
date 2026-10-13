import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Object3D, type InstancedMesh } from 'three'
import { PAINT } from '../../lib/world/palette'
import { fbm, heightAt, lakeAmount, pathDistance, seeded, SITES, smoothstep, trackAmount, WINDMILLS } from '../../lib/world/terrain'
import { useValley } from './assets'
import { MEADOW_LAYER } from './look'
import { land, paint, paintedToon } from './materials'

// ------------------------------------------------------------ shapes

/** A tuft: three blades fanned from one root, each a tapering strip. Shaded darker at the root, as a brush leaves it. */
function tuftGeometry(): BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const colors: number[] = []
  const index: number[] = []
  for (let b = 0; b < 3; b++) {
    const yaw = b * 2.1 + 0.3
    const lean = 0.1 + b * 0.05
    const cos = Math.cos(yaw)
    const sin = Math.sin(yaw)
    const base = positions.length / 3
    // root left, root right, waist left, waist right, tip (local x across the blade, z the way it leans)
    const points: [number, number, number, number][] = [
      [-0.05, 0, 0, 0.7],
      [0.05, 0, 0, 0.7],
      [-0.034, 0.3, lean * 0.4, 0.94],
      [0.034, 0.3, lean * 0.4, 0.94],
      [0, 0.56 - b * 0.08, lean, 1.16],
    ]
    for (const [x, y, z, shade] of points) {
      positions.push(x * cos + z * sin, y, -x * sin + z * cos)
      // Blades are lit as the ground under them is, so a meadow reads as one wash and not as a thousand facets.
      normals.push(0, 1, 0)
      colors.push(shade, shade, shade)
    }
    index.push(base, base + 1, base + 3, base, base + 3, base + 2, base + 2, base + 3, base + 4)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.setIndex(index)
  return geometry
}

/** A meadow flower: a thin stem and a four-petalled head, two crossed diamonds. */
function blossomGeometry(): BufferGeometry {
  const positions: number[] = [-0.012, 0, 0, 0.012, 0, 0, 0, 0.42, 0]
  const colors: number[] = [0.35, 0.5, 0.25, 0.35, 0.5, 0.25, 0.45, 0.6, 0.3]
  const index: number[] = [0, 1, 2]
  for (const [ax, az] of [
    [1, 0],
    [0, 1],
  ]) {
    const base = positions.length / 3
    positions.push(-0.085 * ax, 0.44, -0.085 * az, 0.085 * ax, 0.44, 0.085 * az, 0, 0.5, 0, 0, 0.38, 0)
    colors.push(1, 1, 1, 1, 1, 1, 1.1, 1.1, 1.0, 0.8, 0.8, 0.8)
    index.push(base, base + 1, base + 2, base, base + 3, base + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array((positions.length / 3) * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.setIndex(index)
  return geometry
}

// ------------------------------------------------------------ scatter

/** 0 where the meadow is trodden, built on or under water; up to 1 where it grows freely. */
function meadowAt(x: number, z: number): number {
  if (lakeAmount(x, z) > 0.03 || trackAmount(x, z) > 0.45) return 0
  const path = pathDistance(x, z)
  if (path < 1.05) return 0
  const clear: readonly (readonly [number, number, number])[] = [
    [...SITES.greenhouse, 3.4],
    [...SITES.oak, 3.6],
    [...SITES.campfire, 1.5],
    ...WINDMILLS.map(([wx, wz, size]) => [wx, wz, 1.5 * size] as const),
  ]
  for (const [sx, sz, radius] of clear) if (Math.hypot(x - sx, z - sz) < radius) return 0
  return smoothstep(1.05, 2.2, path)
}

interface Planted {
  x: number
  y: number
  z: number
}

/** Seeded points over the valley floor and the home hill, thinned by `keep` (a 0..1 chance at each point). */
function plant(count: number, seed: number, keep: (x: number, z: number) => number): Planted[] {
  const random = seeded(seed)
  const planted: Planted[] = []
  for (let tries = 0; tries < count * 6 && planted.length < count; tries++) {
    // Two in three land on the valley floor, the rest on the home hill, where the visit begins.
    const onHill = random() < 0.3
    const angle = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * (onHill ? 17 : 47)
    const x = Math.cos(angle) * radius + (onHill ? SITES.hill[0] : 0)
    const z = Math.sin(angle) * radius + (onHill ? SITES.hill[1] - 1 : -3)
    if (random() > keep(x, z)) continue
    planted.push({ x, y: heightAt(x, z), z })
  }
  return planted
}

const moss = new Color(PAINT.moss)
const clover = new Color(PAINT.clover)
const sunlit = new Color(PAINT.sunlit)
const BLOSSOMS = [PAINT.cream, PAINT.terracottaLight, PAINT.cornflower, PAINT.gold, PAINT.cream].map((hex) => new Color(hex))

interface GroundProps {
  /** How many tufts of grass to plant; fewer on phones. */
  tufts: number
}

/** The land: terrain, trees and stones from the baked valley, and the meadow planted over it as instances. */
export function Ground({ tufts }: GroundProps) {
  const valley = useValley()
  const grass = useRef<InstancedMesh>(null)
  const blossoms = useRef<InstancedMesh>(null)
  const flowers = Math.round(tufts * 0.06)

  const tuft = useMemo(() => tuftGeometry(), [])
  const blossom = useMemo(() => blossomGeometry(), [])
  const meadowPaint = useMemo(() => {
    const material = paintedToon({ sway: true, soft: true })
    material.side = DoubleSide
    // Left out of the depth buffer on purpose: the ink pass draws its lines from depth, and grass is brushwork, not linework.
    material.depthWrite = false
    return material
  }, [])

  useLayoutEffect(() => {
    const dummy = new Object3D()
    const colour = new Color()
    const random = seeded(9)

    if (grass.current) {
      const planted = plant(tufts, 5, (x, z) => meadowAt(x, z) * (0.4 + 0.6 * fbm(x * 0.21 + 9, z * 0.21 + 2, 2)))
      planted.forEach(({ x, y, z }, i) => {
        const size = 0.5 + random() * 0.55
        dummy.position.set(x, y - 0.03, z)
        dummy.rotation.set(0, random() * Math.PI * 2, 0)
        dummy.scale.set(size * 1.2, size * (0.75 + random() * 0.6), size * 1.2)
        dummy.updateMatrix()
        grass.current!.setMatrixAt(i, dummy.matrix)
        // The same greens the ground is painted in, a shade brighter, so the tufts catch the light without leaving the wash.
        colour.copy(moss).lerp(clover, smoothstep(0.32, 0.68, fbm(x * 0.055 + 3, z * 0.055 + 8)))
        colour.lerp(sunlit, smoothstep(0.52, 0.8, fbm(x * 0.021 + 30, z * 0.021 - 12, 3)) * 0.65 + random() * 0.12)
        grass.current!.setColorAt(i, colour.multiplyScalar(1.02 + random() * 0.14))
      })
      grass.current.count = planted.length
      grass.current.instanceMatrix.needsUpdate = true
      if (grass.current.instanceColor) grass.current.instanceColor.needsUpdate = true
    }

    if (blossoms.current) {
      // Flowers gather in drifts, each drift mostly one colour.
      const planted = plant(flowers, 23, (x, z) => meadowAt(x, z) * smoothstep(0.55, 0.7, fbm(x * 0.09 + 60, z * 0.09 + 14, 3)))
      planted.forEach(({ x, y, z }, i) => {
        const size = 0.55 + random() * 0.4
        dummy.position.set(x, y, z)
        dummy.rotation.set(0, random() * Math.PI * 2, 0)
        dummy.scale.setScalar(size)
        dummy.updateMatrix()
        blossoms.current!.setMatrixAt(i, dummy.matrix)
        const drift = Math.floor(fbm(x * 0.05 + 7, z * 0.05 + 90, 2) * 9 + random() * 0.8) % BLOSSOMS.length
        blossoms.current!.setColorAt(i, BLOSSOMS[drift])
      })
      blossoms.current.count = planted.length
      blossoms.current.instanceMatrix.needsUpdate = true
      if (blossoms.current.instanceColor) blossoms.current.instanceColor.needsUpdate = true
    }
  }, [tufts, flowers])

  return (
    <>
      <mesh name="Terrain" geometry={valley.geometry.Terrain} material={land} receiveShadow />
      <mesh geometry={valley.geometry.Trees} material={paint} castShadow receiveShadow />
      <mesh geometry={valley.geometry.Rocks} material={paint} castShadow receiveShadow />
      {/* Drawn after everything solid, so that skipping the depth write never lets something farther paint over a blade. */}
      <instancedMesh key={tufts} ref={grass} args={[tuft, meadowPaint, tufts]} layers={MEADOW_LAYER} renderOrder={5} frustumCulled={false} receiveShadow />
      <instancedMesh key={`f${flowers}`} ref={blossoms} args={[blossom, meadowPaint, flowers]} layers={MEADOW_LAYER} renderOrder={6} frustumCulled={false} />
    </>
  )
}
