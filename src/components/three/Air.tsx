import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, Object3D, ShaderMaterial, Vector3, type InstancedMesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { air } from '../../lib/air'
import { seeded } from '../../lib/world/terrain'
import { MEADOW_LAYER } from './look'
import { paintedToon } from './materials'

// ------------------------------------------------------------ motes and fireflies

const moteVertex = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform float uScale;
  uniform vec3 uCentre;
  attribute vec4 aSeed;
  varying float vLight;
  const vec3 BOX = vec3(64.0, 13.0, 64.0);

  void main() {
    // Dust rides the air sideways; fireflies wander in small loops close to the grass.
    vec3 drift = vec3(uTime * (0.25 + aSeed.x * 0.3), sin(uTime * 0.3 + aSeed.w * 6.28) * 0.6, uTime * (0.1 + aSeed.y * 0.15));
    vec3 loop = vec3(sin(uTime * (0.4 + aSeed.x) + aSeed.w * 6.28), sin(uTime * (0.7 + aSeed.y) + aSeed.z * 6.28) * 0.5, cos(uTime * (0.5 + aSeed.z) + aSeed.w * 3.0)) * 1.6;
    vec3 p = position + mix(drift, loop, uNight);
    p.y = mix(p.y, p.y * 0.34, uNight);
    // Keep the swarm wrapped round wherever the camera is looking.
    p.xz = mod(p.xz - uCentre.xz + BOX.xz * 0.5, BOX.xz) - BOX.xz * 0.5 + uCentre.xz;
    p.y += 0.8;

    float blink = smoothstep(0.35, 0.9, sin(uTime * (1.1 + aSeed.z * 1.6) + aSeed.w * 6.28) * 0.5 + 0.5);
    float shimmer = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed.y) + aSeed.x * 6.28);
    vLight = mix(shimmer, blink, uNight);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uScale * mix(0.05 + aSeed.z * 0.06, 0.13 + aSeed.z * 0.09, uNight) / -mv.z;
  }
`

const moteFragment = /* glsl */ `
  uniform vec3 uDust;
  uniform vec3 uFirefly;
  uniform float uNight;
  uniform float uRain;
  varying float vLight;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float alpha = core * core * vLight * mix(0.5, 1.0, uNight) * (1.0 - uRain * 0.9);
    gl_FragColor = vec4(mix(uDust, uFirefly, uNight) * alpha, alpha);
  }
`

/** Golden dust in the last sunlight; after dark the same points slow down, sink toward the grass and blink as fireflies. */
export function Motes({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const random = seeded(31)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      positions.set([random() * 64, random() * 13, random() * 64], i * 3)
      seeds.set([random(), random(), random(), random()], i * 4)
    }
    const points = new BufferGeometry()
    points.setAttribute('position', new BufferAttribute(positions, 3))
    points.setAttribute('aSeed', new BufferAttribute(seeds, 4))
    return points
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        name: 'Motes',
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: air.time,
          uNight: air.night,
          uRain: air.rain,
          uScale: { value: 600 },
          uCentre: { value: new Vector3() },
          uDust: { value: new Color('#ffd98a') },
          uFirefly: { value: new Color('#e8ff8a').multiplyScalar(1.4) },
        },
        vertexShader: moteVertex,
        fragmentShader: moteFragment,
      }),
    [],
  )

  useFrame((state) => {
    material.uniforms.uScale.value = state.size.height * state.viewport.dpr
    const controls = state.controls as OrbitControlsImpl | null
    material.uniforms.uCentre.value.copy(controls ? controls.target : state.camera.position)
  })

  return <points geometry={geometry} material={material} layers={MEADOW_LAYER} frustumCulled={false} renderOrder={8} />
}

// ------------------------------------------------------------ rain

const rainVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCentre;
  attribute vec3 aSeed;
  attribute float aEnd;
  varying float vAlpha;
  const vec3 BOX = vec3(46.0, 26.0, 46.0);

  void main() {
    float speed = 15.0 + aSeed.x * 7.0;
    vec3 p = position;
    p.y -= uTime * speed;
    // A light wind: every drop falls a little to the east.
    p.x += (BOX.y - mod(p.y, BOX.y)) * 0.12;
    p = mod(p - uCentre + BOX * 0.5, BOX) - BOX * 0.5 + uCentre;
    p.y += aEnd * (0.55 + aSeed.y * 0.5);
    p.x -= aEnd * 0.07;
    vAlpha = (1.0 - aEnd * 0.8) * (0.35 + aSeed.z * 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const rainFragment = /* glsl */ `
  uniform float uRain;
  uniform vec3 uColour;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColour, vAlpha * uRain * 0.55);
  }
`

/** A gentle rain: short pale strokes falling round the camera. Present all the time, visible only when it rains. */
export function Rain({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const random = seeded(59)
    const positions = new Float32Array(count * 6)
    const seeds = new Float32Array(count * 6)
    const ends = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const p = [random() * 46, random() * 26, random() * 46]
      const s = [random(), random(), random()]
      positions.set([...p, ...p], i * 6)
      seeds.set([...s, ...s], i * 6)
      ends.set([0, 1], i * 2)
    }
    const lines = new BufferGeometry()
    lines.setAttribute('position', new BufferAttribute(positions, 3))
    lines.setAttribute('aSeed', new BufferAttribute(seeds, 3))
    lines.setAttribute('aEnd', new BufferAttribute(ends, 1))
    return lines
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        name: 'Rain',
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: air.time, uRain: air.rain, uCentre: { value: new Vector3() }, uColour: { value: new Color('#e6eef6') } },
        vertexShader: rainVertex,
        fragmentShader: rainFragment,
      }),
    [],
  )
  const centre = useMemo(() => new Vector3(), [])

  useFrame((state) => {
    // Rain falls where the visitor is looking: a little in front of the camera.
    state.camera.getWorldDirection(centre).multiplyScalar(14).add(state.camera.position)
    material.uniforms.uCentre.value.copy(centre)
    material.visible = air.rain.value > 0.01
  })

  return <lineSegments geometry={geometry} material={material} layers={MEADOW_LAYER} frustumCulled={false} renderOrder={9} />
}

// ------------------------------------------------------------ smoke

const puffGeometry = new IcosahedronGeometry(1, 1)
const puffColours = new Float32Array(puffGeometry.getAttribute('position').count * 3).fill(1)
puffGeometry.setAttribute('color', new BufferAttribute(puffColours, 3))
const dummy = new Object3D()

interface SmokeProps {
  position: readonly [number, number, number]
  /** How high a puff climbs before it thins away. */
  rise: number
  size: number
  colour?: string
  puffs?: number
  /** Seconds a puff lives. */
  life?: number
}

/**
 * A column of cel-shaded puffs: each swells as it climbs, leans with the wind and shrinks to nothing.
 * They are thin washes, see-through and kept out of the depth buffer, so the ink pass leaves them unlined.
 */
export function Smoke({ position, rise, size, colour = '#f4ecdc', puffs = 6, life = 5 }: SmokeProps) {
  const mesh = useRef<InstancedMesh>(null)
  const material = useMemo(() => {
    const wash = paintedToon({ color: colour })
    wash.transparent = true
    wash.opacity = 0.62
    wash.depthWrite = false
    return wash
  }, [colour])

  useFrame(() => {
    if (!mesh.current) return
    const t = air.time.value
    for (let i = 0; i < puffs; i++) {
      const age = (t / life + i / puffs) % 1
      const swell = Math.sin(Math.min(1, age * 1.15) * Math.PI) ** 0.7
      dummy.position.set(age * age * rise * 0.45 * air.wind.value + Math.sin(t * 0.6 + i * 2.1) * 0.12, age * rise, Math.cos(t * 0.5 + i * 1.3) * 0.12 * age)
      dummy.scale.setScalar(Math.max(0.001, size * (0.35 + age * 0.9) * swell))
      dummy.rotation.set(i, t * 0.2 + i, 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[puffGeometry, material, puffs]} position={position as [number, number, number]} frustumCulled={false} renderOrder={7} />
}
