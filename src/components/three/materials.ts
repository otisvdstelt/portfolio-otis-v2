import { Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat, RepeatWrapping, RGBAFormat, type ColorRepresentation } from 'three'
import { air } from '../../lib/air'
import { fbm } from '../../lib/world/terrain'

/**
 * Three flat tones instead of a smooth falloff: shade, half-light, light.
 * MeshToonMaterial looks up `dot(normal, light)` remapped to 0..1 in this
 * strip, so the texels are: facing away, grazing away, grazing toward, facing.
 */
export const toonGradient = (() => {
  const texture = new DataTexture(new Uint8Array([58, 58, 168, 255]), 4, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
})()

/**
 * A tile of soft blotches, like pigment settling into wet paper. Every painted
 * surface is multiplied by it in world space, so no colour lies perfectly flat.
 */
export const washTexture = (() => {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  // Blend the tile with shifted copies of itself so it repeats without a seam.
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

/** Rings spreading where raindrops land. Shared by the painted surfaces and the lake. */
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
      // Each cell holds one drop that lands, spreads and fades, then lands somewhere new.
      float beat = t * (0.5 + h * 0.35) + h * 7.0;
      float life = fract(beat);
      vec2 centre = 0.25 + 0.5 * vec2(rainHash(cell + floor(beat) * 1.7 + 3.1), rainHash(cell + floor(beat) * 2.3 + 7.7));
      float d = length(f - centre);
      rings += smoothstep(0.04, 0.0, abs(d - life * 0.4)) * (1.0 - life) * (1.0 - life);
    }
    return rings;
  }
`

/**
 * The same three tones with the steps blended into one another. The land is
 * painted with this one: hills in a background are soft washes, and only the
 * things standing on them get hard cel bands.
 */
export const softGradient = (() => {
  const texture = toonGradient.clone()
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
})()

interface PaintOptions {
  color?: ColorRepresentation
  /** See-through, for the greenhouse panes. */
  glass?: boolean
  /** Leans with the wind; for instanced grass and flowers only. */
  sway?: boolean
  /** Shade in soft washes instead of hard bands; for the ground and what grows flat on it. */
  soft?: boolean
}

/**
 * The valley's one way of painting: a cel-shaded material taking its colours
 * from the vertices, with a watercolour wash laid over it and, in the rain,
 * a wet sheen and ripples on anything that faces the sky.
 */
export function paintedToon({ color = '#ffffff', glass = false, sway = false, soft = false }: PaintOptions = {}): MeshToonMaterial {
  const material = new MeshToonMaterial({ color, vertexColors: true, gradientMap: soft ? softGradient : toonGradient })
  if (glass) {
    material.transparent = true
    material.opacity = 0.34
    material.depthWrite = false
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = air.time
    shader.uniforms.uWind = air.wind
    shader.uniforms.uRain = air.rain
    shader.uniforms.uWash = { value: washTexture }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;\nvarying vec3 vPaintPos;\nvarying float vPaintUp;')
      .replace(
        '#include <begin_vertex>',
        sway
          ? /* glsl */ `#include <begin_vertex>
            // Each tuft leans by the square of its height, on a gust that crosses the meadow.
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
    // Blades are seen from both sides and must be lit the same from both: never flip their normal for the back face.
    if (sway) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0;\nvec3 normal = normalize(vNormal);\nvec3 nonPerturbedNormal = normal;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uRain;\nuniform sampler2D uWash;\nvarying vec3 vPaintPos;\nvarying float vPaintUp;\n${RAIN_RINGS_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
          vec2 washUv = vPaintPos.xz * 0.05 + vPaintPos.y * 0.035;
          vec3 washed = texture2D(uWash, washUv).rgb;
          float wash = washed.r * 0.55 + texture2D(uWash, washUv * 3.3 + 0.37).g * 0.3 + washed.b * 0.15;
          diffuseColor.rgb *= 0.86 + wash * 0.28;
          if (uRain > 0.001) {
            float skyward = smoothstep(0.45, 0.9, vPaintUp);
            float rings = rainRings(vPaintPos.xz, uTime) * skyward * uRain;
            // Wet things go a shade deeper; the rings catch what light there is.
            diffuseColor.rgb *= 1.0 - 0.2 * uRain;
            diffuseColor.rgb += rings * 0.3;
          }`,
      )
  }
  material.customProgramCacheKey = () => `painted-${sway ? 'sway' : 'still'}`
  return material
}

/** Most of the valley shares these three. */
export const paint = paintedToon()
export const land = paintedToon({ soft: true })
export const glass = paintedToon({ glass: true })

/**
 * Windows, lanterns and flames. Unlit, because a light is its own light: by
 * day they are cream panes, after dark `setGlow` turns them up.
 */
export const glow = new MeshBasicMaterial({ color: '#ffffff', vertexColors: true })
export const flame = new MeshBasicMaterial({ color: '#ffffff', vertexColors: true })

const glowDay = new Color('#cfc4a8')
const glowNight = new Color('#fff1c4').multiplyScalar(1.5)

export function setGlow(night: number) {
  glow.color.copy(glowDay).lerp(glowNight, night)
}
