import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Matrix4, PlaneGeometry, type Camera, type ShaderMaterial } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { air } from '../../lib/air'
import { SITES, WATER_Y } from '../../lib/world/terrain'
import { look } from './look'
import { RAIN_RINGS_GLSL } from './materials'

const waterShader = {
  name: 'MirrorLake',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: new Matrix4() },
    uTint: { value: look.water },
    uFog: { value: look.fog },
    uTime: air.time,
    uRain: air.rain,
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vMirror;
    varying vec3 vWorld;
    void main() {
      vMirror = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;
    uniform vec3 uFog;
    uniform float uTime;
    uniform float uRain;
    varying vec4 vMirror;
    varying vec3 vWorld;
    ${RAIN_RINGS_GLSL}

    void main() {
      vec2 w = vWorld.xz;
      // The mirror is never quite still: a slow swell slides the picture sideways, a line at a time.
      float swell = sin(w.y * 1.9 + uTime * 0.6) * 0.5 + sin(w.y * 4.7 - uTime * 0.9 + w.x * 0.6) * 0.3;
      float rings = rainRings(w * 0.8, uTime) * uRain;
      vec4 mirror = vMirror;
      mirror.x += (swell * 0.0035 * (1.0 + uRain * 2.5) + rings * 0.02) * mirror.w;
      vec3 reflection = texture2DProj(tDiffuse, mirror).rgb;

      // Looking straight down you see water; along the surface you see the valley upside down.
      vec3 toEye = normalize(cameraPosition - vWorld);
      float glance = pow(1.0 - max(toEye.y, 0.0), 2.2);
      vec3 colour = mix(uTint, reflection, 0.62 + 0.34 * glance);

      // Brush-dry glints where the swell crests, and the rings of the rain.
      float crest = smoothstep(0.72, 0.8, swell) * smoothstep(0.15, 0.6, glance);
      colour += crest * 0.07 + rings * 0.22;

      float haze = 1.0 - exp(-pow(length(cameraPosition - vWorld) * 0.0052, 2.0));
      gl_FragColor = vec4(mix(colour, uFog, haze * 0.6), 1.0);
    }
  `,
}

/**
 * The lake: a real mirror. The valley is drawn a second time from under the
 * surface into a small texture, and the water shows that picture with a swell
 * running through it. The meadow is left out of the reflection.
 */
export function Lake({ resolution }: { resolution: number }) {
  const mirror = useMemo(() => {
    const water = new Reflector(new PlaneGeometry(36, 44), { textureWidth: resolution, textureHeight: resolution, clipBias: 0.02, multisample: 0, shader: waterShader })
    // The reflection camera is a copy of the main one; send it back to the default layer so it skips the grass.
    const reflectionCamera = water.getReflectionCamera.bind(water)
    water.getReflectionCamera = (camera: Camera) => {
      const copy = reflectionCamera(camera)
      copy.layers.set(0)
      return copy
    }
    // The mirror clones its uniforms when it is made; tie the clock and the weather back to the shared ones.
    const { uniforms } = water.material as ShaderMaterial
    uniforms.uTime = air.time
    uniforms.uRain = air.rain
    water.rotation.x = -Math.PI / 2
    water.position.set(SITES.lake[0], WATER_Y, SITES.lake[1])
    return water
  }, [resolution])

  useEffect(() => () => mirror.dispose(), [mirror])

  useFrame(() => {
    const { uniforms } = mirror.material as ShaderMaterial
    uniforms.uTint.value = look.water
    uniforms.uFog.value = look.fog
  })

  return <primitive object={mirror} />
}
