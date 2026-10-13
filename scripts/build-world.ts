// Bakes the world (src/lib/world) into public/assets/world.glb as named,
// Draco-compressed meshes with their colours painted into the vertices.
//
// Run with `npm run world`. Node runs this TypeScript file directly (type
// stripping), so the bake and the app share one description of the land.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document, NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import type { Part } from '../src/lib/world/kit.ts'
import { buildCampfire, buildPostbox } from '../src/lib/world/camp.ts'
import { buildAttic, buildBakery } from '../src/lib/world/interiors.ts'
import { buildCar, buildHalt, buildLine } from '../src/lib/world/railway.ts'
import { buildTown } from '../src/lib/world/town.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const parts: Part[] = [...buildLine(), ...buildHalt(), ...buildCar(), ...buildTown(), ...buildBakery(), ...buildAttic(), ...buildPostbox(), ...buildCampfire()]

const doc = new Document()
doc.getRoot().getAsset().generator = 'portfolio-otis build-world.ts'
const buffer = doc.createBuffer()
const scene = doc.createScene('World')

// Reference materials so the file reads in any glTF viewer. The app replaces
// them with its own cel-shaded ones, keyed by these names.
const materials = {
  paint: doc.createMaterial('paint').setRoughnessFactor(1).setMetallicFactor(0),
  glass: doc.createMaterial('glass').setRoughnessFactor(0.2).setMetallicFactor(0).setAlphaMode('BLEND').setBaseColorFactor([1, 1, 1, 0.4]),
  glow: doc.createMaterial('glow').setRoughnessFactor(1).setMetallicFactor(0).setEmissiveFactor([0.6, 0.5, 0.3]),
  light: doc.createMaterial('light').setRoughnessFactor(1).setMetallicFactor(0).setAlphaMode('BLEND').setBaseColorFactor([1, 0.9, 0.7, 0.2]),
}

let triangles = 0
const weights: [string, number][] = []
for (const { name, geometry, material, pivot } of parts) {
  const index = geometry.getIndex()
  if (!index) throw new Error(`${name} has no index buffer`)
  triangles += index.count / 3
  weights.push([name, index.count / 3])
  const primitive = doc
    .createPrimitive()
    .setMaterial(materials[material])
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(index.array)).setBuffer(buffer))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('position').array)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('normal').array)).setBuffer(buffer))
    .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.getAttribute('color').array)).setBuffer(buffer))
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive))
  if (pivot) node.setTranslation([pivot[0], pivot[1], pivot[2]])
  scene.addChild(node)
}

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const uncompressed = (await io.writeBinary(doc)).byteLength
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 9, quantizeColor: 8 }))
const glb = await io.writeBinary(doc)

const out = resolve(root, 'public/assets/world.glb')
await mkdir(dirname(out), { recursive: true })
await writeFile(out, glb)
console.log(`world.glb  ${parts.length} meshes, ${Math.round(triangles)} triangles, ${(uncompressed / 1024).toFixed(0)} KB -> ${(glb.byteLength / 1024).toFixed(0)} KB with Draco`)
for (const [name, count] of weights.sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${name} ${Math.round(count)}`)
