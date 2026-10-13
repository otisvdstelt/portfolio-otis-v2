import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackSide, Color, FogExp2, ShaderMaterial, type DirectionalLight, type Group, type HemisphereLight, type Mesh } from 'three'
import { air, type Phase, type Weather } from '../../lib/air'
import { useValley } from './assets'
import { look, SUN_DIRECTION } from './look'
import { paintedToon, setGlow } from './materials'

const c = (hex: string) => new Color(hex)

const DAY = {
  hemiSky: c('#cfdcf5'),
  hemiGround: c('#ecc98d'),
  hemi: Math.PI * 0.56,
  sun: c('#ffdba6'),
  sunPower: Math.PI * 0.62,
  fog: c('#f4dfb4'),
  density: 0.0042,
  skyTop: c('#7ea5dc'),
  skyHorizon: c('#f8e6b8'),
  skyGlow: c('#ffbf6b'),
  far: c('#a9b5cf'),
  water: c('#8fb0cc'),
  paper: c('#f1e7d3'),
  ink: c('#3a2a20'),
}

const NIGHT: typeof DAY = {
  hemiSky: c('#4a5e9a'),
  hemiGround: c('#232a4a'),
  hemi: Math.PI * 0.52,
  sun: c('#a9bfff'),
  sunPower: Math.PI * 0.3,
  fog: c('#1d2547'),
  density: 0.0048,
  skyTop: c('#0d1230'),
  skyHorizon: c('#33427a'),
  skyGlow: c('#6f86c9'),
  far: c('#1b2248'),
  water: c('#2a3970'),
  paper: c('#171b2e'),
  ink: c('#080a16'),
}

// What a gentle rain does to any hour: the colour drains toward slate.
const SLATE = { sky: c('#8f9ba6'), horizon: c('#c5cbc9'), light: c('#c3c9cf'), fog: c('#b4bdbf') }

const ease = (from: number, to: number, delta: number, rate: number) => from + (to - from) * (1 - Math.exp(-delta * rate))
const scratch = new Color()

interface AtmosphereProps {
  phase: Phase
  weather: Weather
  reducedMotion: boolean
  /** Shadow map edge in texels; smaller on phones. */
  shadowSize: number
}

/** The hour and the weather: lights, fog, and the clock every shader in the valley reads. */
export function Atmosphere({ phase, weather, reducedMotion, shadowSize }: AtmosphereProps) {
  const scene = useThree((s) => s.scene)
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const fog = useMemo(() => new FogExp2('#f4dfb4', 0.0042), [])

  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  // The valley opens already in its hour; only the weather is watched changing.
  useState(() => {
    air.night.value = phase === 'night' ? 1 : 0
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    air.time.value += dt
    air.night.value = ease(air.night.value, phase === 'night' ? 1 : 0, dt, 0.9)
    air.rain.value = ease(air.rain.value, weather === 'rain' ? 1 : 0, dt, 0.8)
    air.wind.value = (reducedMotion ? 0.15 : 1) * (1 + air.rain.value * 0.9)

    const night = air.night.value
    const rain = air.rain.value
    const dim = 1 - 0.75 * night

    look.skyTop.copy(DAY.skyTop).lerp(NIGHT.skyTop, night).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim), rain * 0.7)
    look.skyHorizon.copy(DAY.skyHorizon).lerp(NIGHT.skyHorizon, night).lerp(scratch.copy(SLATE.horizon).multiplyScalar(dim), rain * 0.7)
    look.skyGlow.copy(DAY.skyGlow).lerp(NIGHT.skyGlow, night).multiplyScalar(1 - rain * 0.8)
    look.far.copy(DAY.far).lerp(NIGHT.far, night).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim * 0.9), rain * 0.5)
    look.water.copy(DAY.water).lerp(NIGHT.water, night).lerp(scratch.copy(SLATE.sky).multiplyScalar(dim), rain * 0.4)
    look.paper.copy(DAY.paper).lerp(NIGHT.paper, night)
    look.ink.copy(DAY.ink).lerp(NIGHT.ink, night)
    look.fog.copy(DAY.fog).lerp(NIGHT.fog, night).lerp(scratch.copy(SLATE.fog).multiplyScalar(dim), rain * 0.75)

    fog.color.copy(look.fog)
    fog.density = (DAY.density + (NIGHT.density - DAY.density) * night) * (1 + rain * 1.3)

    if (hemi.current) {
      hemi.current.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, night).lerp(scratch.copy(SLATE.light).multiplyScalar(dim), rain * 0.6)
      hemi.current.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, night).lerp(scratch.copy(SLATE.light).multiplyScalar(dim * 0.8), rain * 0.6)
      hemi.current.intensity = (DAY.hemi + (NIGHT.hemi - DAY.hemi) * night) * (1 + rain * 0.12)
    }
    if (sun.current) {
      sun.current.color.copy(DAY.sun).lerp(NIGHT.sun, night).lerp(scratch.copy(SLATE.light).multiplyScalar(dim), rain * 0.7)
      sun.current.intensity = (DAY.sunPower + (NIGHT.sunPower - DAY.sunPower) * night) * (1 - rain * 0.55)
    }
    setGlow(Math.max(night, rain * 0.55))
  }, -3)

  return (
    <>
      {/*
        Cel lighting, in three's physical units (a lit surface shows
        albedo * light / PI). The cool sky light sets the shadow tone, the warm
        sun adds the lit band, and together they land a little over each
        part's true colour: the glow of the last hour of sun.
      */}
      <hemisphereLight ref={hemi} args={['#cfdcf5', '#ecc98d', Math.PI * 0.56]} />
      <directionalLight
        ref={sun}
        color="#ffdba6"
        intensity={Math.PI * 0.62}
        position={[SUN_DIRECTION.x * 130, SUN_DIRECTION.y * 130, SUN_DIRECTION.z * 130]}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.08}
        shadow-radius={3.5}
      >
        <orthographicCamera attach="shadow-camera" args={[-64, 64, 64, -64, 10, 280]} />
      </directionalLight>
    </>
  )
}

// ------------------------------------------------------------ sky

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
    float h = dir.y;
    vec2 compass = normalize(dir.xz + 1e-5);

    vec3 colour = mix(uHorizon, uTop, pow(smoothstep(-0.05, 0.7, h), 0.55));

    // The warmth of the low sun spreads along the horizon on its side of the sky.
    float toward = max(dot(normalize(vec3(dir.x, max(h, 0.0) * 0.6, dir.z)), uSun), 0.0);
    colour += uGlow * (pow(toward, 5.0) * 0.36 + pow(toward, 40.0) * 0.45);
    float disc = smoothstep(0.9988, 0.9993, dot(dir, uSun)) * (1.0 - uRain);
    colour = mix(colour, mix(vec3(1.0, 0.96, 0.84), vec3(0.93, 0.95, 1.0), uNight), disc);

    // High cloud, dragged across with a dry brush.
    float streak = fbm(vec2(compass.x * 2.4 + uTime * 0.006, h * 12.0 + compass.y * 1.7));
    float cirrus = smoothstep(0.5, 0.74, streak) * smoothstep(0.04, 0.22, h) * (1.0 - smoothstep(0.5, 0.85, h));
    colour = mix(colour, mix(uHorizon, vec3(1.0), 0.55), cirrus * (0.5 - 0.36 * uNight));
    colour = mix(colour, uHorizon * 0.92, uRain * 0.45 * smoothstep(0.3, 0.7, streak));

    // Stars, once it is dark and dry.
    vec2 starCell = dir.xz / (abs(h) + 0.4) * 46.0;
    float star = step(0.985, hash(floor(starCell))) * smoothstep(0.35, 0.0, length(fract(starCell) - 0.5));
    float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(starCell) + 3.0) * 40.0);
    colour += star * twinkle * uNight * (1.0 - uRain) * smoothstep(0.06, 0.3, h);

    // Two far ranges, each a single wash, paler with distance.
    float back = 0.085 + 0.075 * fbm(compass * 2.3 + 4.0);
    float front = 0.03 + 0.06 * fbm(compass * 3.9 + 11.0);
    colour = mix(colour, mix(uFar, uHorizon, 0.5), smoothstep(back + 0.006, back - 0.004, h));
    colour = mix(colour, mix(uFar, uHorizon, 0.18), smoothstep(front + 0.005, front - 0.003, h));

    gl_FragColor = vec4(colour, 1.0);
  }
`

// Where the clouds hang: x, height, z, size, turn.
const CLOUDS: readonly (readonly [number, number, number, number, number])[] = [
  [-150, 62, -210, 9, 0.2],
  [-40, 78, -260, 12, -0.1],
  [90, 58, -230, 8.5, 0.4],
  [190, 70, -160, 10, 1.1],
  [-230, 66, -60, 9.5, -1.2],
  [240, 84, 20, 11, 1.5],
  [-180, 74, 150, 10, 2.4],
  [60, 90, 240, 12, 3.2],
  [150, 52, -300, 7, 0.1],
]
const CLOUD_RANGE = 330

/** The painted sky: a dome that follows the camera, and cel-shaded clouds drifting east. */
export function Sky({ reducedMotion }: { reducedMotion: boolean }) {
  const valley = useValley()
  const dome = useRef<Mesh>(null)
  const clouds = useRef<Group>(null)
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
  // Clouds are lit like everything else but never fade into the valley's haze.
  const cloudPaint = useMemo(() => {
    const paint = paintedToon()
    paint.fog = false
    return paint
  }, [])

  useFrame((state, delta) => {
    dome.current?.position.copy(state.camera.position)
    if (!clouds.current || reducedMotion) return
    for (const cloud of clouds.current.children) {
      cloud.position.x += delta * (0.5 + cloud.scale.x * 0.03)
      if (cloud.position.x > CLOUD_RANGE) cloud.position.x = -CLOUD_RANGE
    }
  })

  return (
    <>
      <mesh ref={dome} material={material} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[520, 32, 20]} />
      </mesh>
      <group ref={clouds}>
        {CLOUDS.map(([x, y, z, size, turn], i) => (
          <mesh key={i} geometry={valley.geometry[`Cloud_${(i % 3) + 1}`]} material={cloudPaint} position={[x, y, z]} rotation-y={turn} scale={[size, size * 0.8, size]} />
        ))}
      </group>
    </>
  )
}
