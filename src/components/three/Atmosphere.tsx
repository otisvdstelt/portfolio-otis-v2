import { Float } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackSide, Color, FogExp2, ShaderMaterial, Vector3, type DirectionalLight, type Group, type HemisphereLight, type Mesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { air, type Phase, type Weather } from '../../lib/air'
import type { Mood } from '../../lib/places'
import { useParts } from './assets'
import { look, SUN_DIRECTION } from './look'
import { paintedToon, setGlow } from './materials'

const c = (hex: string) => new Color(hex)

// Golden hour over the sea. A scene mood may replace any of the first five
const DAY = {
  skyTop: c('#6f8ad6'),
  skyHorizon: c('#f6d6c6'),
  skyGlow: c('#ffb07e'),
  water: c('#8fa2d6'),
  sun: c('#ffd4a2'),
  hemiSky: c('#bcc6f0'),
  hemiGround: c('#f3cfa6'),
  hemi: Math.PI * 0.6,
  sunPower: Math.PI * 0.62,
  density: 0.0056,
  far: c('#9d9fcd'),
  paper: c('#f7f4eb'),
  ink: c('#1c1917'),
}

const NIGHT: typeof DAY = {
  skyTop: c('#0b1030'),
  skyHorizon: c('#2f3d78'),
  skyGlow: c('#6f86c9'),
  water: c('#263468'),
  sun: c('#a9bfff'),
  hemiSky: c('#48599a'),
  hemiGround: c('#232a4a'),
  hemi: Math.PI * 0.36,
  sunPower: Math.PI * 0.2,
  density: 0.0062,
  far: c('#1b2248'),
  paper: c('#171b2e'),
  ink: c('#070914'),
}

// What rain does to any hour, draining the colour toward slate
const SLATE = { sky: c('#8f9ba6'), horizon: c('#c5cbc9'), light: c('#c3c9cf') }
const DUST = c('#ffd98a')

const ease = (from: number, to: number, delta: number, rate: number) => from + (to - from) * (1 - Math.exp(-delta * rate))
const scratch = new Color()
const wanted = new Color()
const focus = new Vector3()

interface AtmosphereProps {
  phase: Phase
  /** What the scene being visited does to the hour */
  mood: Mood
  weather: Weather
  reducedMotion: boolean
  /** Shadow map edge in texels, smaller on phones */
  shadowSize: number
}

/** Lights, fog and the clock every shader reads, from the hour, weather and mood */
export function Atmosphere({ phase, mood, weather, reducedMotion, shadowSize }: AtmosphereProps) {
  const scene = useThree((s) => s.scene)
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const fog = useMemo(() => new FogExp2('#f6d6c6', DAY.density), [])
  const night = phase === 'night' || Boolean(mood.night)
  // The colours as they stand this frame, on their way to where the mood wants them
  const now = useRef({ skyTop: c('#6f8ad6'), skyHorizon: c('#f6d6c6'), skyGlow: c('#ffb07e'), water: c('#8fa2d6'), sun: c('#ffd4a2'), dust: c('#ffd98a'), mirror: 0.78, shallow: 0, tint: 0, tintColour: c('#7d6ad6') })

  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  // The world opens already in its hour, after that night falls gradually
  useState(() => {
    air.night.value = night ? 1 : 0
  })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    air.time.value += dt
    air.rain.value = ease(air.rain.value, weather === 'rain' ? 1 : 0, dt, 0.8)
    air.wind.value = (reducedMotion ? 0.15 : 1) * (1 + air.rain.value * 0.9)

    // Behind full fog a new mood is put on at once, otherwise it eases in
    const hidden = air.reveal.value < 0.06
    const rate = hidden ? 60 : 2.4
    const long = Math.min(delta, 1)
    air.night.value = ease(air.night.value, night ? 1 : 0, long, hidden ? 60 : 1.6)
    const m = now.current
    m.skyTop.lerp(wanted.set(mood.skyTop ?? '#6f8ad6'), 1 - Math.exp(-long * rate))
    m.skyHorizon.lerp(wanted.set(mood.skyHorizon ?? '#f6d6c6'), 1 - Math.exp(-long * rate))
    m.skyGlow.lerp(wanted.set(mood.skyGlow ?? '#ffb07e'), 1 - Math.exp(-long * rate))
    m.water.lerp(wanted.set(mood.water ?? '#8fa2d6'), 1 - Math.exp(-long * rate))
    m.sun.lerp(wanted.set(mood.sun ?? '#ffd4a2'), 1 - Math.exp(-long * rate))
    m.dust.lerp(mood.dust ? wanted.set(mood.dust) : DUST, 1 - Math.exp(-long * rate))
    m.mirror = ease(m.mirror, mood.mirror ?? 0.78, long, rate)
    m.shallow = ease(m.shallow, mood.shallow ?? 0, long, rate)
    // A scene can ask to lean the whole sky toward another time of day
    m.tint = ease(m.tint, air.tint.amount, long, 2.2)
    if (air.tint.amount > 0) m.tintColour.lerp(wanted.setRGB(air.tint.r, air.tint.g, air.tint.b), 1 - Math.exp(-long * 3))

    const dusk = air.night.value
    const rain = air.rain.value
    const dim = 1 - 0.75 * dusk

    look.skyTop.copy(m.skyTop).lerp(NIGHT.skyTop, dusk).lerp(m.tintColour, m.tint * 0.85).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim), rain * 0.7)
    look.skyHorizon.copy(m.skyHorizon).lerp(NIGHT.skyHorizon, dusk).lerp(scratch.copy(m.tintColour).lerp(wanted.set('#ffe9d6'), 0.62), m.tint * 0.8).lerp(scratch.copy(SLATE.horizon).multiplyScalar(dim), rain * 0.7)
    look.skyGlow.copy(m.skyGlow).lerp(NIGHT.skyGlow, dusk).multiplyScalar(1 - rain * 0.8)
    look.far.copy(DAY.far).lerp(NIGHT.far, dusk).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim * 0.9), rain * 0.5)
    look.water.copy(m.water).lerp(NIGHT.water, dusk).lerp(m.tintColour, m.tint * 0.4).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim), rain * 0.4)
    look.paper.copy(DAY.paper).lerp(NIGHT.paper, dusk)
    look.ink.copy(DAY.ink).lerp(NIGHT.ink, dusk)
    look.dust.copy(m.dust)
    look.mirror = m.mirror + (0.78 - m.mirror) * dusk * 0.6
    look.shallow = m.shallow * (1 - dusk * 0.6)
    // Haze takes the sky colour at the sea, which is why there is no horizon line
    look.fog.copy(look.skyHorizon)

    fog.color.copy(look.fog)
    fog.density = (DAY.density + (NIGHT.density - DAY.density) * dusk) * (1 + rain * 1.2)

    if (hemi.current) {
      hemi.current.color.copy(DAY.hemiSky).lerp(m.skyTop, 0.25).lerp(NIGHT.hemiSky, dusk).lerp(m.tintColour, m.tint * 0.35).lerp(scratch.copy(SLATE.light).multiplyScalar(dim), rain * 0.6)
      hemi.current.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, dusk).lerp(scratch.copy(SLATE.light).multiplyScalar(dim * 0.8), rain * 0.6)
      hemi.current.intensity = (DAY.hemi + (NIGHT.hemi - DAY.hemi) * dusk) * (1 + rain * 0.12)
    }
    if (sun.current) {
      sun.current.color.copy(m.sun).lerp(NIGHT.sun, dusk).lerp(scratch.copy(SLATE.light).multiplyScalar(dim), rain * 0.7)
      sun.current.intensity = (DAY.sunPower + (NIGHT.sunPower - DAY.sunPower) * dusk) * (1 - rain * 0.55) * (1 - m.tint * 0.25)
      // The world is too wide for one shadow map, so the shadow follows the view
      const controls = state.controls as OrbitControlsImpl | null
      focus.copy(controls ? controls.target : state.camera.position)
      sun.current.position.copy(focus).addScaledVector(SUN_DIRECTION, 120)
      sun.current.target.position.copy(focus)
      sun.current.target.updateMatrixWorld()
    }
    setGlow(Math.max(dusk, rain * 0.55, m.tint * 0.5))
  }, -3)

  return (
    <>
      {/* Cel lighting in physical units, sky light for the shadow tone and sun for the lit band */}
      <hemisphereLight ref={hemi} args={['#bcc6f0', '#f3cfa6', DAY.hemi]} />
      <directionalLight ref={sun} color="#ffd4a2" intensity={DAY.sunPower} castShadow shadow-mapSize={[shadowSize, shadowSize]} shadow-bias={-0.0004} shadow-normalBias={0.05} shadow-radius={3}>
        <orthographicCamera attach="shadow-camera" args={[-46, 46, 46, -46, 10, 260]} />
      </directionalLight>
    </>
  )
}

// ============================================================ sky

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uFar;
  uniform vec3 uSun;
  uniform float uNight;
  uniform float uRain;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amplitude * noise(p);
      p = p * 2.03 + 7.1;
      amplitude *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 dir = normalize(vDir);
    // Below the horizon the dome shows what the sea would mirror, so both match
    float h = abs(dir.y);
    vec2 compass = normalize(dir.xz + 1e-5);

    // One long wash from peach at the horizon up to periwinkle
    vec3 colour = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.72, h), 0.62));

    // The warmth of the low sun spreads along its side of the horizon
    float toward = max(dot(normalize(vec3(dir.x, h * 0.6, dir.z)), uSun), 0.0);
    colour += uGlow * (pow(toward, 5.0) * 0.3 + pow(toward, 40.0) * 0.4);
    float disc = smoothstep(0.9988, 0.9993, dot(dir, uSun)) * (1.0 - uRain);
    colour = mix(colour, mix(vec3(1.0, 0.95, 0.84), vec3(0.93, 0.95, 1.0), uNight), disc);

    // A far bank of cloud, violet in the body and peach along the top
    float bank = fbm(vec2(compass.x * 3.1 + uTime * 0.004, compass.y * 3.1 + 2.0));
    float crest = 0.05 + bank * 0.2;
    float body = smoothstep(crest, crest - 0.055, h) * smoothstep(0.012, 0.05, h);
    vec3 cloud = mix(mix(uTop, uHorizon, 0.55) * 0.9, uHorizon + uGlow * 0.3, smoothstep(crest - 0.07, crest, h));
    colour = mix(colour, cloud, body * (0.82 - 0.4 * uNight));

    // High cloud, dragged across with a dry brush
    float streak = fbm(vec2(compass.x * 2.4 + uTime * 0.006, h * 12.0 + compass.y * 1.7));
    float cirrus = smoothstep(0.52, 0.76, streak) * smoothstep(0.24, 0.42, h) * (1.0 - smoothstep(0.6, 0.9, h));
    colour = mix(colour, mix(uHorizon, vec3(1.0), 0.4) + uGlow * 0.12, cirrus * (0.42 - 0.3 * uNight));
    colour = mix(colour, uHorizon * 0.92, uRain * 0.45 * smoothstep(0.3, 0.7, streak));

    // Stars, once it is dark and dry
    vec2 starCell = dir.xz / (h + 0.4) * 46.0;
    float star = step(0.982, hash(floor(starCell))) * smoothstep(0.17, 0.0, length(fract(starCell) - 0.5));
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(starCell) + 3.0) * 40.0);
    colour += star * twinkle * uNight * (1.0 - uRain) * smoothstep(0.08, 0.3, h) * step(0.0, dir.y);

    // Far islands, each a single flat wash on the horizon
    float isle = 0.004 + 0.03 * smoothstep(0.52, 0.8, fbm(compass * 2.6 + 4.0));
    colour = mix(colour, mix(uFar, uHorizon, 0.45), smoothstep(isle + 0.003, isle - 0.002, h) * step(0.0, dir.y) * step(0.0045, isle));

    gl_FragColor = vec4(colour, 1.0);
  }
`

// The cloud bank, as bearing in radians from north, distance, height and size
const CLOUDS: readonly (readonly [number, number, number, number])[] = [
  [-0.62, 300, 30, 13],
  [-0.3, 350, 46, 17],
  [0.02, 320, 34, 12],
  [0.3, 380, 58, 19],
  [0.6, 300, 28, 11],
  [0.95, 360, 44, 15],
  [1.5, 330, 36, 13],
  [2.2, 350, 50, 16],
  [2.9, 320, 34, 12],
  [-2.5, 360, 48, 16],
  [-1.7, 310, 32, 12],
  [-1.1, 340, 42, 14],
  [0.16, 420, 96, 14],
  [-0.9, 430, 110, 15],
]

/** A dome and a bank of clouds, both travelling with the camera to stay at the horizon */
export function Sky({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useParts()
  const dome = useRef<Mesh>(null)
  const bank = useRef<Group>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        name: 'PaintedSky',
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: look.skyTop },
          uHorizon: { value: look.skyHorizon },
          uGlow: { value: look.skyGlow },
          uFar: { value: look.far },
          uSun: { value: SUN_DIRECTION },
          uNight: air.night,
          uRain: air.rain,
          uTime: air.time,
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
      }),
    [],
  )
  // Clouds are lit like everything else but never fade into the haze
  const cloudPaint = useMemo(() => {
    const paint = paintedToon()
    paint.fog = false
    return paint
  }, [])

  useFrame((state, delta) => {
    dome.current?.position.copy(state.camera.position)
    if (!bank.current) return
    bank.current.position.set(state.camera.position.x, 0, state.camera.position.z)
    if (!reducedMotion) bank.current.rotation.y += delta * 0.0018
  })

  return (
    <>
      <mesh ref={dome} material={material} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[900, 32, 24]} />
      </mesh>
      <group ref={bank}>
        {CLOUDS.map(([bearing, distance, height, size], i) => (
          <group key={i} position={[Math.sin(bearing) * distance, height, -Math.cos(bearing) * distance]} rotation-y={-bearing}>
            <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-2, 2]}>
              <mesh geometry={parts.geometry[`Cloud_${(i % 3) + 1}`]} material={cloudPaint} scale={[size, size * 0.8, size]} />
            </Float>
          </group>
        ))}
      </group>
    </>
  )
}
