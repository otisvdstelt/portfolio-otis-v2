import { useGLTF } from '@react-three/drei'
import { createContext, use, useMemo } from 'react'
import type { BufferGeometry, Mesh } from 'three'

import worldUrl from '../../assets/world.glb?url'

const base = import.meta.env.BASE_URL

/** The whole world in one Draco-compressed file, baked by `npm run world`. */
// The build names the file after its contents, so a new model always arrives under a new address and an old one is never served from a cache.
export const WORLD_URL = worldUrl
/** The decoder is served from this site (see scripts/copy-draco.mjs), not from a CDN. */
const DRACO_PATH = `${base}draco/`

// Start the download the moment this chunk is evaluated, before any component asks for it.
useGLTF.preload(WORLD_URL, DRACO_PATH)

/** The baked world, taken apart into its named meshes. */
export interface Parts {
  geometry: Record<string, BufferGeometry>
  /** Where each part hangs or turns from, in its own scene's space. */
  pivot: Record<string, [number, number, number]>
}

/** Reads the world's model. Suspends until it is decoded, which is what keeps the loading sprout on screen. */
export function useWorldModel(): Parts {
  const gltf = useGLTF(WORLD_URL, DRACO_PATH)
  return useMemo(() => {
    const parts: Parts = { geometry: {}, pivot: {} }
    gltf.scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      parts.geometry[mesh.name] = mesh.geometry
      parts.pivot[mesh.name] = [mesh.position.x, mesh.position.y, mesh.position.z]
    })
    return parts
  }, [gltf])
}

/**
 * The page's own lettering, for the name boards and tags inside the world.
 * A promise for `use()`: the scene waits for the faces (briefly, and never
 * for longer than a second and a half) so no sign is first drawn in a fallback.
 */
export const lettering: Promise<unknown> = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])

export const PartsContext = createContext<Parts | null>(null)

export function useParts(): Parts {
  const parts = use(PartsContext)
  if (!parts) throw new Error('useParts must be used inside the world')
  return parts
}
