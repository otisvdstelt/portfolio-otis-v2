import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Color, DoubleSide } from 'three'
import { PAINT } from '../../lib/world/palette'
import { CAMPFIRE, POSTBOX } from '../../lib/world/spec'
import { CLEARING, fbm, heightAt, pathDistance, seeded, smoothstep, townAmount } from '../../lib/world/terrain'
import { MEADOW_LAYER } from './look'
import { paintedToon } from './materials'

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
      [-0.055, 0, 0, 0.7],
      [0.055, 0, 0, 0.7],
      [-0.036, 0.3, lean * 0.4, 0.94],
      [0.036, 0.3, lean * 0.4, 0.94],
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

interface Tuft {
  position: [number, number, number]
  turn: number
  scale: [number, number, number]
  colour: Color
}

const moss = new Color(PAINT.moss)
const clover = new Color(PAINT.clover)
const sunlit = new Color(PAINT.sunlit)

/** Seeded tufts over the hill behind the town, thickest round the clearing and thin where the ground is trodden. */
function plant(count: number): Tuft[] {
  const random = seeded(5)
  const tufts: Tuft[] = []
  for (let tries = 0; tries < count * 8 && tufts.length < count; tries++) {
    // Two in three grow round the clearing, where the visitor sits closest to the ground.
    const near = random() < 0.66
    const angle = random() * Math.PI * 2
    const reach = Math.sqrt(random()) * (near ? 15 : 46)
    const x = (near ? CLEARING.x : CLEARING.x - 14) + Math.cos(angle) * reach
    const z = (near ? CLEARING.z : CLEARING.z + 6) + Math.sin(angle) * reach
    const y = heightAt(x, z)
    if (y < 1.5 || townAmount(x, z) > 0.15 || pathDistance(x, z) < 1.1) continue
    if (Math.hypot(x - CAMPFIRE.at[0], z - CAMPFIRE.at[1]) < 2.4 || Math.hypot(x - POSTBOX.at[0], z - POSTBOX.at[1]) < 0.9) continue
    if (random() > 0.4 + 0.6 * fbm(x * 0.21 + 9, z * 0.21 + 2, 2)) continue
    const size = 0.75 + random() * 0.8
    // In the clearing the moss has gone dark; out on the open slope the same greens the ground is painted in, a shade brighter.
    const shaded = 1 - smoothstep(CLEARING.radius - 1, CLEARING.radius + 5, Math.hypot(x - CLEARING.x, z - CLEARING.z))
    const colour = new Color().copy(moss).lerp(clover, (1 - shaded * 0.7) * smoothstep(0.3, 0.7, fbm(x * 0.055 + 3, z * 0.055 + 8)))
    colour.lerp(sunlit, (1 - shaded) * (0.2 + random() * 0.25)).multiplyScalar(1.02 + random() * 0.14)
    tufts.push({ position: [x, y - 0.03, z], turn: random() * Math.PI * 2, scale: [size * 1.05, size * (0.75 + random() * 0.55), size * 1.05], colour })
  }
  return tufts
}

/**
 * The grass: an instanced canopy. Every tuft is one `<Instance>`, written to
 * the instance buffer once and then left alone; the rolling wave of wind is
 * worked out per vertex in the material's shader, from the clock and where
 * each tuft stands.
 */
export function Meadow({ tufts }: { tufts: number }) {
  const tuft = useMemo(() => tuftGeometry(), [])
  const planted = useMemo(() => plant(tufts), [tufts])
  const material = useMemo(() => {
    const blades = paintedToon({ sway: true })
    blades.side = DoubleSide
    // Left out of the depth buffer on purpose: grass is brushwork, and nothing should draw an edge round a blade.
    blades.depthWrite = false
    return blades
  }, [])

  return (
    <Instances key={planted.length} limit={planted.length} range={planted.length} frames={1} geometry={tuft} material={material} layers={MEADOW_LAYER} renderOrder={5} frustumCulled={false} receiveShadow>
      {planted.map(({ position, turn, scale, colour }, i) => (
        <Instance key={i} position={position} rotation={[0, turn, 0]} scale={scale} color={colour} />
      ))}
    </Instances>
  )
}
