import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Matrix4, PlaneGeometry, type Camera, type ShaderMaterial } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { air } from '../../lib/air'
import { train } from '../../lib/train'
import { SEA_Y } from '../../lib/world/terrain'
import { look, SUN_DIRECTION } from './look'
import { RAIN_RINGS_GLSL } from './materials'

const seaShader = {
  name: 'MirrorSea',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: new Matrix4() },
    uTint: { value: look.water },
    uFog: { value: look.fog },
    uGlow: { value: look.skyGlow },
    uSun: { value: SUN_DIRECTION },
    uDensity: { value: 0.0056 },
    uShift: { value: 0 },
    uMirror: { value: 0.78 },
    uShallow: { value: 0 },
    uTime: air.time,
    uRain: air.rain,
    uNight: air.night,
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
    uniform vec3 uGlow;
    uniform vec3 uSun;
    uniform float uDensity;
    uniform float uShift;
    uniform float uMirror;
    uniform float uShallow;
    uniform float uTime;
    uniform float uRain;
    uniform float uNight;
    varying vec4 vMirror;
    varying vec3 vWorld;
    ${RAIN_RINGS_GLSL}

    void main() {
      // The sea's own pattern is measured along the journey, not along the map, so a train going round its lap never sees it jump.
      vec2 w = vec2(vWorld.x + uShift, vWorld.z);
      float reach = length(cameraPosition - vWorld);

      // A mirror, but a painted one: the picture is dragged sideways in long strokes, more the farther it lies.
      float stroke = sin(w.y * 0.55 + uTime * 0.4) * 0.5 + sin(w.y * 1.25 - uTime * 0.6 + w.x * 0.11) * 0.3 + sin(w.y * 0.21 + w.x * 0.05) * 0.4;
      float rings = rainRings(w * 0.8, uTime) * uRain;
      vec4 mirror = vMirror;
      mirror.x += (stroke * (0.0016 + min(reach, 120.0) * 0.00002) * (1.0 + uRain * 4.0) + rings * 0.02) * mirror.w;
      vec3 reflection = texture2DProj(tDiffuse, mirror).rgb;

      // Looking straight down you see water; along the surface you see the sky upside down, a shade deeper.
      vec3 toEye = normalize(cameraPosition - vWorld);
      float glance = pow(1.0 - max(toEye.y, 0.0), 2.4);
      // Where the sea is shallow and clear it keeps its own colour underfoot, and a net of light moves on the bottom.
      float net = 1.0 - smoothstep(0.0, 0.1, abs(sin(w.x * 0.9 + sin(w.y * 0.7 + uTime * 0.6) * 1.4) * sin(w.y * 0.8 + sin(w.x * 0.6 - uTime * 0.5) * 1.4)));
      vec3 body = uTint * (1.0 + 0.22 * uShallow * (1.0 - glance)) + net * 0.2 * uShallow * (1.0 - glance) * (1.0 - smoothstep(20.0, 70.0, reach));
      vec3 colour = mix(body, reflection * 0.93, clamp(uMirror * 0.78 + (1.0 - uMirror * 0.78) * glance * (0.55 + 0.45 * uMirror), 0.0, 0.98));

      // The sun's road across the water: broken dashes of light toward where it stands.
      vec3 bounced = reflect(-toEye, vec3(0.0, 1.0, 0.0));
      float road = pow(max(dot(bounced, uSun), 0.0), 60.0);
      float dashes = smoothstep(0.35, 0.8, sin(w.y * 1.6 + stroke * 2.0) * 0.5 + 0.5 + stroke * 0.3);
      colour += (uGlow * 0.9 + 0.25) * road * dashes * (1.0 - uRain * 0.8) * (1.0 - uNight * 0.6);
      colour += smoothstep(0.82, 0.9, stroke) * smoothstep(0.2, 0.7, glance) * 0.045 + rings * 0.22;

      // Far out, the sea is the colour of the sky it meets.
      float haze = 1.0 - exp(-pow(reach * uDensity, 2.0));
      gl_FragColor = vec4(mix(colour, uFog, haze), 1.0);
    }
  `,
}

/**
 * The sea: endless, perfectly flat, and a real mirror (how much of one is up to the scene: the library stands in shallow water you can see into). The world is drawn a
 * second time from under the surface into a texture, and the water shows that
 * picture with long horizontal strokes dragged through it. The sheet of
 * water follows the camera, so there is always more of it.
 */
export function Sea({ resolution }: { resolution: number }) {
  const mirror = useMemo(() => {
    const water = new Reflector(new PlaneGeometry(4200, 4200), { textureWidth: resolution, textureHeight: resolution, clipBias: 0.01, multisample: 0, shader: seaShader })
    // The reflection camera is a copy of the main one; send it back to the default layer so it skips grass and motes.
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
    uniforms.uNight = air.night
    water.rotation.x = -Math.PI / 2
    water.position.y = SEA_Y
    water.frustumCulled = false
    return water
  }, [resolution])

  useEffect(() => () => mirror.dispose(), [mirror])

  useFrame((state) => {
    const { uniforms } = mirror.material as ShaderMaterial
    uniforms.uTint.value = look.water
    uniforms.uFog.value = look.fog
    uniforms.uGlow.value = look.skyGlow
    uniforms.uSun.value = SUN_DIRECTION
    uniforms.uDensity.value = state.scene.fog && 'density' in state.scene.fog ? state.scene.fog.density : 0.0056
    uniforms.uShift.value = train.travel - train.x
    uniforms.uMirror.value = look.mirror
    uniforms.uShallow.value = look.shallow
    mirror.position.x = state.camera.position.x
    mirror.position.z = state.camera.position.z
  })

  return <primitive object={mirror} />
}
