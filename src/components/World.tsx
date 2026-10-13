import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect } from 'react'
import type { Phase, Weather } from '../lib/air'
import { PLACES, type Hot, type PlaceId } from '../lib/places'
import { Motes, Rain } from './three/Air'
import { loadValley, ValleyContext } from './three/assets'
import { Atmosphere, Sky } from './three/Atmosphere'
import { CameraRig } from './three/CameraRig'
import { Ground } from './three/Ground'
import { InkPaper } from './three/InkPaper'
import { Lake } from './three/Lake'
import { Landmarks, type Charm, type Mill } from './three/Landmarks'
import { FOV, MEADOW_LAYER } from './three/look'

export type { Charm, Mill }

export interface WorldProps {
  place: PlaceId
  /** The place's panel is open. */
  open: boolean
  /** `roam`: a free, damped camera with pointer parallax. `backdrop`: fixed views, for touch and modest hardware. */
  mode: 'roam' | 'backdrop'
  phase: Phase
  weather: Weather
  reducedMotion: boolean
  hot: Hot | null
  cars: readonly string[]
  mills: readonly Mill[]
  charms: readonly Charm[]
  /** How far to slide the picture aside for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
  /** Called once the valley is on screen. */
  onReady: () => void
}

// What each kind of device is asked to draw.
const BUDGET = {
  roam: { dpr: [1, 1.75] as [number, number], tufts: 42000, motes: 260, rain: 1500, shadow: 2048, mirror: 1024 },
  backdrop: { dpr: [1, 1.5] as [number, number], tufts: 14000, motes: 140, rain: 700, shadow: 1024, mirror: 512 },
}

/**
 * The valley. The baked model is read with `use()`, so the nearest Suspense
 * boundary (the sprout on the loading paper) holds the screen until every
 * mesh is decoded; nothing pops in afterwards.
 */
export default function World({ place, open, mode, phase, weather, reducedMotion, hot, cars, mills, charms, shift, onHot, onVisit, onProject, onReady }: WorldProps) {
  const valley = use(loadValley())
  const budget = BUDGET[mode]
  const roaming = mode === 'roam' && place !== 'hill'

  useEffect(() => {
    onReady()
    return () => {
      document.body.style.cursor = ''
    }
    // The valley arrives once.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={budget.dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: FOV.wide, near: 0.5, far: 1200, position: PLACES.hill.view.position as [number, number, number] }}
      onCreated={(state) => {
        state.camera.layers.enable(MEADOW_LAYER)
        // In development the scene is handed to the console, so it can be stepped by hand while the tab is in the background.
        if (import.meta.env.DEV) (window as unknown as { __valley?: unknown }).__valley = state
      }}
      // One finger pans the page's sheets; the canvas keeps pinch and drag for the camera only when it is free.
      style={{ touchAction: roaming ? 'none' : 'pan-y' }}
    >
      <ValleyContext value={valley}>
        <Atmosphere phase={phase} weather={weather} reducedMotion={reducedMotion} shadowSize={budget.shadow} />
        <Sky reducedMotion={reducedMotion} />
        <Ground tufts={budget.tufts} />
        <Lake resolution={budget.mirror} />
        <Landmarks place={place} open={open} roaming={roaming} night={phase === 'night'} hot={hot} cars={cars} mills={mills} charms={charms} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} onProject={onProject} />
        <Motes count={budget.motes} />
        <Rain count={budget.rain} />
        <CameraRig place={place} roaming={roaming} cuts={mode === 'backdrop' || reducedMotion} reducedMotion={reducedMotion} shift={shift} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </ValleyContext>
    </Canvas>
  )
}
