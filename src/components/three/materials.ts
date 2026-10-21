import { AdditiveBlending, Color, DataTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat, RepeatWrapping, RGBAFormat, type ColorRepresentation } from 'three'
import { air } from '../../lib/air'
import { fbm } from '../../lib/world/terrain'

/** Exactly three tones, read with a nearest filter so one never blurs into the next */
export const toonGradient = (() => {
  const texture = new DataTexture(new Uint8Array([62, 166, 255]), 3, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
})()

/** A tile of soft blotches that multiplies every painted surface and bends its normal */
export const washTexture = (() => {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  // Blend the tile with shifted copies of itself so it repeats without a seam
  const tile = (x: number, y: number, scale: number, seed: number) => {
    const u = x / size
    const v = y / size
    const at = (dx: number, dy: number) => fbm((x + dx * size) * scale + seed, (y + dy * size) * scale + seed * 1.7, 4)
    return at(0, 0) * (1 - u) * (1 - v) + at(-1, 0) * u * (1 - v) + at(0, -1) * (1 - u) * v + at(-1, -1) * u * v
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4
      data[o] = Math.round(tile(x, y, 0.045, 3) * 255)
      data[o + 1] = Math.round(tile(x, y, 0.13, 41) * 255)
      data[o + 2] = Math.round(tile(x, y, 0.3, 77) * 255)
      data[o + 3] = 255
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
})()

/** Rings spreading where raindrops land, shared by the painted surfaces and the sea */
export const RAIN_RINGS_GLSL = /* glsl */ `
  float rainHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float rainRings(vec2 p, float t) {
    float rings = 0.0;
    for (int k = 0; k < 2; k++) {
      vec2 q = p * (k == 0 ? 0.85 : 1.31) + float(k) * 13.7;
      vec2 cell = floor(q);
      vec2 f = fract(q);
      float h = rainHash(cell);
      // Each cell holds one drop that lands, spreads and fades, then lands somewhere new
      float beat = t * (0.5 + h * 0.35) + h * 7.0;
      float life = fract(beat);
      vec2 centre = 0.25 + 0.5 * vec2(rainHash(cell + floor(beat) * 1.7 + 3.1), rainHash(cell + floor(beat) * 2.3 + 7.7));
      float d = length(f - centre);
      rings += smoothstep(0.04, 0.0, abs(d - life * 0.4)) * (1.0 - life) * (1.0 - life);
    }
    return rings;
  }
`

interface PaintOptions {
  color?: ColorRepresentation
  /** See through, for window panes */
  glass?: boolean
  /** Leans with the wind, for instanced grass only */
  sway?: boolean
  /** Everything of this material below this height is under a roof and stays dry */
  shelter?: number
}

/** The one way of painting, cel shaded from the vertices with a wash laid over it */
export function paintedToon({ color = '#ffffff', glass = false, sway = false, shelter = -1e6 }: PaintOptions = {}): MeshToonMaterial {
  const material = new MeshToonMaterial({ color, vertexColors: true, gradientMap: toonGradient })
  if (glass) {
    material.transparent = true
    material.opacity = 0.26
    material.depthWrite = false
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = air.time
    shader.uniforms.uWind = air.wind
    shader.uniforms.uRain = air.rain
    shader.uniforms.uWash = { value: washTexture }
    shader.uniforms.uShelter = { value: shelter }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;\nvarying vec3 vPaintPos;\nvarying float vPaintUp;')
      .replace(
        '#include <begin_vertex>',
        sway
          ? /* glsl */ `#include <begin_vertex>
            // Wind rolling across the meadow, each tuft leaning by the square of its height
            vec4 swayRoot = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float swayBeat = uTime * 1.25 + swayRoot.x * 0.33 + swayRoot.z * 0.21;
            float gust = sin(swayBeat) * 0.55 + sin(swayBeat * 2.3 + 1.7) * 0.2 + sin(uTime * 0.37 + swayRoot.x * 0.05) * 0.45;
            float bend = transformed.y * transformed.y * uWind;
            transformed.x += gust * bend * 0.85;
            transformed.z += cos(swayBeat * 0.8) * bend * 0.4;`
          : '#include <begin_vertex>',
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `#include <project_vertex>
          vec4 paintWorld = vec4(transformed, 1.0);
          vec3 paintNormal = objectNormal;
          #ifdef USE_INSTANCING
            paintWorld = instanceMatrix * paintWorld;
            paintNormal = mat3(instanceMatrix) * paintNormal;
          #endif
          vPaintPos = (modelMatrix * paintWorld).xyz;
          vPaintUp = normalize(mat3(modelMatrix) * paintNormal).y;`,
      )
    // Blades are seen from both sides, so never flip the normal for the back face
    if (sway) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0;\nvec3 normal = normalize(vNormal);\nvec3 nonPerturbedNormal = normal;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uRain;\nuniform float uShelter;\nuniform sampler2D uWash;\nvarying vec3 vPaintPos;\nvarying float vPaintUp;\n${RAIN_RINGS_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
          vec2 washUv = vPaintPos.xz * 0.05 + vPaintPos.y * 0.035;
          vec3 washed = texture2D(uWash, washUv).rgb;
          vec3 bleed = texture2D(uWash, washUv * 3.3 + 0.37).rgb;
          float wash = washed.r * 0.55 + bleed.g * 0.3 + washed.b * 0.15;
          diffuseColor.rgb *= 0.86 + wash * 0.28;
          if (uRain > 0.001 && vPaintPos.y > uShelter) {
            float skyward = smoothstep(0.45, 0.9, vPaintUp);
            float rings = rainRings(vPaintPos.xz, uTime) * skyward * uRain;
            // Wet things go a shade deeper, and the rings catch what light there is
            diffuseColor.rgb *= 1.0 - 0.2 * uRain;
            diffuseColor.rgb += rings * 0.3;
          }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
          // The canvas has a grain, so nudge the normal and the line between tones runs ragged
          normal = normalize(normal + (vec3(bleed.r, washed.g, bleed.b) - 0.5) * 0.34);`,
      )
  }
  material.customProgramCacheKey = () => `painted-${sway ? 'sway' : 'still'}`
  return material
}

/** Most of the world shares these */
export const paint = paintedToon()
export const glass = paintedToon({ glass: true })
/** For everything that lives indoors and is never rained on */
export const dry = paintedToon({ shelter: 1e6 })

/** Windows, lanterns and flames, unlit because a light is its own light */
export const glow = new MeshBasicMaterial({ color: '#ffffff', vertexColors: true })
export const flame = new MeshBasicMaterial({ color: '#ffffff', vertexColors: true })

/** A shaft of sunlight in dusty air, added onto whatever is behind it */
export const shaft = new MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, side: DoubleSide })

const glowDay = new Color('#f0dfae')
const glowNight = new Color('#fff1c4').multiplyScalar(1.5)
const shaftDay = new Color('#ffffff')
const shaftNight = new Color('#000000')

export function setGlow(night: number) {
  glow.color.copy(glowDay).lerp(glowNight, night)
  shaft.color.copy(shaftDay).lerp(shaftNight, night)
}
