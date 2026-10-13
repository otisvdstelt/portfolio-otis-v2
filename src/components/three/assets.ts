import { createContext, use } from 'react'
import type { BufferGeometry, Mesh } from 'three'
import { DRACO_GLTF_CONFIG, DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { progress } from '../../lib/progress'

const base = import.meta.env.BASE_URL

/** The baked valley, taken apart into its named meshes. */
export interface Valley {
  geometry: Record<string, BufferGeometry>
  /** Where each part hangs or turns from, in its landmark's own space. */
  pivot: Record<string, [number, number, number]>
}

async function fetchValley(): Promise<Valley> {
  // The small glTF-only Draco decoder that ships with three.js; the bundler serves it from this site, not a CDN.
  const draco = new DRACOLoader().setDecoderPath(DRACO_GLTF_CONFIG)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  try {
    const gltf = await loader.loadAsync(`${base}assets/valley.glb`, (event) => {
      if (event.lengthComputable) progress.set(0.1 + 0.75 * (event.loaded / event.total))
    })
    const valley: Valley = { geometry: {}, pivot: {} }
    gltf.scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      valley.geometry[mesh.name] = mesh.geometry
      valley.pivot[mesh.name] = [mesh.position.x, mesh.position.y, mesh.position.z]
    })
    // The lettering on the signpost and the charms should be in the page's own hand when the scene opens.
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])
    progress.set(1)
    return valley
  } finally {
    draco.dispose()
  }
}

let pending: Promise<Valley> | undefined

/** The one request for the valley. Hand the promise to `use()`; Suspense shows the sprout until it settles. */
export const loadValley = (): Promise<Valley> => (pending ??= fetchValley())

export const ValleyContext = createContext<Valley | null>(null)

export function useValley(): Valley {
  const valley = use(ValleyContext)
  if (!valley) throw new Error('useValley must be used inside the world')
  return valley
}
