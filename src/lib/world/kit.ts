// A small modelling kit of painted primitives, stacked and merged into the world
// All of it is simple solids coloured per vertex, so one material paints it all
import { BoxGeometry, BufferAttribute, Color, CylinderGeometry, Euler, ExtrudeGeometry, IcosahedronGeometry, Matrix4, Path, Quaternion, Shape, TorusGeometry, Vector2, Vector3, type BufferGeometry } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { valueNoise } from './terrain.ts'

/** One colour, or a wash from the foot of a piece to its top */
export type Tint = string | readonly [bottom: string, top: string]

/** Where a piece goes once it is made */
export interface Place {
  at?: readonly [number, number, number]
  rot?: readonly [number, number, number]
  scale?: number | readonly [number, number, number]
}

/** A named mesh in the baked model, given relative to the point it turns about */
export interface Part {
  name: string
  geometry: BufferGeometry
  /** paint is cel shaded, glass is see through, glow is unlit, light is a sunbeam */
  material: 'paint' | 'glass' | 'glow' | 'light'
  pivot?: readonly [number, number, number]
}

const scratch = { color: new Color(), bottom: new Color(), top: new Color(), matrix: new Matrix4(), position: new Vector3(), quaternion: new Quaternion(), scale: new Vector3(), euler: new Euler() }

function fleck(x: number, y: number, z: number): number {
  return valueNoise(x * 3.1 + y * 1.7, z * 3.1 - y * 2.3)
}

/** Paints a piece. Brush flecks keep flat colours from looking printed */
export function tint<G extends BufferGeometry>(geometry: G, colour: Tint, flecks = 0.07): G {
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(position.count * 3)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const height = Math.max(1e-6, box.max.y - box.min.y)
  const washed = typeof colour !== 'string'
  if (washed) {
    scratch.bottom.set(colour[0])
    scratch.top.set(colour[1])
  } else {
    scratch.bottom.set(colour)
  }
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    scratch.color.copy(scratch.bottom)
    if (washed) scratch.color.lerp(scratch.top, (y - box.min.y) / height)
    scratch.color.multiplyScalar(1 + (fleck(x, y, z) - 0.5) * 2 * flecks)
    colors[i * 3] = scratch.color.r
    colors[i * 3 + 1] = scratch.color.g
    colors[i * 3 + 2] = scratch.color.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/** Moves, turns and scales a piece into its place */
export function put<G extends BufferGeometry>(geometry: G, place?: Place): G {
  if (!place) return geometry
  const { at = [0, 0, 0], rot = [0, 0, 0], scale = 1 } = place
  scratch.position.set(at[0], at[1], at[2])
  scratch.quaternion.setFromEuler(scratch.euler.set(rot[0], rot[1], rot[2]))
  if (typeof scale === 'number') scratch.scale.setScalar(scale)
  else scratch.scale.set(scale[0], scale[1], scale[2])
  geometry.applyMatrix4(scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale))
  return geometry
}

const finish = (geometry: BufferGeometry, colour: Tint, place?: Place) => {
  geometry.deleteAttribute('uv')
  return put(tint(geometry, colour), place)
}

/** A block standing on its base */
export function box(width: number, height: number, depth: number, colour: Tint, place?: Place): BufferGeometry {
  return finish(new BoxGeometry(width, height, depth).translate(0, height / 2, 0), colour, place)
}

/** A block named by its corners instead of its middle, for walls and shelves */
export function slab(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, colour: Tint): BufferGeometry {
  return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), colour, { at: [(x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2] })
}

/** A flat outline pushed through a thickness, drawn in x and y, with an optional hole */
export function extrude(outline: readonly (readonly [number, number])[], depth: number, colour: Tint, place?: Place, hole?: readonly [number, number, number]): BufferGeometry {
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)))
  if (hole) shape.holes.push(new Path().absarc(hole[0], hole[1], hole[2], 0, Math.PI * 2, true))
  const raw = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 }).translate(0, 0, -depth / 2)
  raw.deleteAttribute('uv')
  return put(tint(mergeVertices(raw, 1e-4), colour), place)
}

/** A post or tower standing on its base. Three sides makes a prism */
export function cyl(topRadius: number, bottomRadius: number, height: number, colour: Tint, place?: Place, sides = 10): BufferGeometry {
  return finish(new CylinderGeometry(topRadius, bottomRadius, height, sides, 1).translate(0, height / 2, 0), colour, place)
}

/** A cone standing on its base */
export function cone(radius: number, height: number, colour: Tint, place?: Place, sides = 10): BufferGeometry {
  return cyl(0.001, radius, height, colour, place, sides)
}

/** A ring standing upright and centred, for handles and hoops */
export function ring(radius: number, thickness: number, colour: Tint, place?: Place, sides = 12): BufferGeometry {
  return finish(new TorusGeometry(radius, thickness, 5, sides), colour, place)
}

/** A lumpy ball, centred, for leaves, stones, clouds and smoke */
export function blob(radius: number, colour: Tint, place?: Place, lumpiness = 0.2, seed = 0, detail = 2): BufferGeometry {
  const sphere = new IcosahedronGeometry(1, detail)
  sphere.deleteAttribute('uv')
  sphere.deleteAttribute('normal')
  const geometry = mergeVertices(sphere, 1e-4)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const swell = 1 + (valueNoise(x * 1.6 + seed * 7.3, z * 1.6 + y * 1.9 + seed * 3.1) - 0.5) * 2 * lumpiness
    position.setXYZ(i, x * radius * swell, y * radius * swell, z * radius * swell)
  }
  geometry.computeVertexNormals()
  return put(tint(geometry, colour), place)
}

/** Nudges every corner the same way, so timber looks cut by hand */
export function roughen<G extends BufferGeometry>(geometry: G, amount: number, seed = 0): G {
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const kx = Math.round(x * 50) + seed * 13
    const ky = Math.round(y * 50)
    const kz = Math.round(z * 50)
    position.setXYZ(
      i,
      x + (valueNoise(kx * 0.731 + ky * 0.37, kz * 0.913) - 0.5) * 2 * amount,
      y + (valueNoise(ky * 0.577 + kz * 0.21, kx * 0.811 + 5) - 0.5) * 2 * amount,
      z + (valueNoise(kz * 0.659 + kx * 0.43, ky * 0.727 + 9) - 0.5) * 2 * amount,
    )
  }
  return geometry
}

/** Flips a piece across the line of the railway, keeping its faces out */
export function mirrorZ<G extends BufferGeometry>(geometry: G): G {
  geometry.scale(1, 1, -1)
  const index = geometry.getIndex()
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1)
      index.setX(i + 1, index.getX(i + 2))
      index.setX(i + 2, b)
    }
  }
  return geometry
}

/** Merges pieces into one mesh */
export function join(pieces: readonly BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(pieces as BufferGeometry[], false)
  if (!merged) throw new Error('pieces could not be merged')
  for (const piece of pieces) piece.dispose()
  return merged
}

/** A named part, centred again on the point it will turn or move about */
export function part(name: string, pieces: readonly BufferGeometry[], material: Part['material'] = 'paint', pivot?: readonly [number, number, number]): Part {
  const geometry = join(pieces)
  if (pivot) geometry.translate(-pivot[0], -pivot[1], -pivot[2])
  return { name, geometry, material, pivot }
}

/** A named part whose pieces were built around the point it hangs from */
export function hung(name: string, pieces: readonly BufferGeometry[], pivot: readonly [number, number, number], material: Part['material'] = 'paint'): Part {
  return { name, geometry: join(pieces), material, pivot }
}

const UP = new Vector3(0, 1, 0)
const ONE = new Vector3(1, 1, 1)

/** A tapering limb from one point to another, for roots, branches and braces */
export function limb(from: readonly [number, number, number], to: readonly [number, number, number], fromRadius: number, toRadius: number, colour: Tint, sides = 8): BufferGeometry {
  const direction = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2])
  const length = direction.length()
  const geometry = new CylinderGeometry(toRadius, fromRadius, length, sides, 1).translate(0, length / 2, 0)
  geometry.deleteAttribute('uv')
  tint(geometry, colour)
  scratch.quaternion.setFromUnitVectors(UP, direction.normalize())
  geometry.applyMatrix4(scratch.matrix.compose(scratch.position.set(from[0], from[1], from[2]), scratch.quaternion, ONE))
  return geometry
}
