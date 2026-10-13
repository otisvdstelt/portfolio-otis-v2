// Copies the small glTF-only Draco decoder that ships with three.js into
// public/draco, so the world's model is decoded with files served from this
// site and not from a third-party CDN.
import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const from = resolve(root, 'node_modules/three/examples/jsm/libs/draco/gltf')
const to = resolve(root, 'public/draco')

await mkdir(to, { recursive: true })
await cp(from, to, { recursive: true })
console.log('draco decoder -> public/draco')
