import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect } from 'react'
import type { Phase, Weather } from '../lib/air'
import { PLACES, type Hot, type PlaceId } from '../lib/places'
import { Motes, Rain } from './three/Air'
import { lettering, PartsContext, useWorldModel } from './three/assets'
import { Atmosphere, Sky } from './three/Atmosphere'
import type { Charm } from './three/Camp'
import { CameraRig } from './three/CameraRig'
import { InkPaper } from './three/InkPaper'
import { MEADOW_LAYER } from './three/look'
import { Railway } from './three/Railway'
import { Sea } from './three/Sea'
import { Town, type Cluster } from './three/Town'

export type { Charm, Cluster }

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
  /** The projects riding in the train, one per bench. */
  seats: readonly string[]
  clusters: readonly Cluster[]
  charms: readonly Charm[]
  /** How far to slide the picture aside for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
  /** Called once the world is on screen. */
  onReady: () => void
}

// What each kind of device is asked to draw.
const BUDGET = {
  roam: { dpr: [1, 1.75] as [number, number], tufts: 2600, motes: 170, rain: 1500, shadow: 2048, mirror: 1024, lavish: true },
  backdrop: { dpr: [1, 1.5] as [number, number], tufts: 1100, motes: 90, rain: 700, shadow: 1024, mirror: 512, lavish: false },
}

/**
 * The world. Its model is read through Suspense (the file is preloaded the
 * moment this chunk arrives) and its lettering through `use()`, so the
 * loading sprout holds until every mesh is decoded and every sign can be
 * drawn in the right hand; nothing pops in afterwards.
 */
export default function World({ place, open, mode, phase, weather, reducedMotion, hot, seats, clusters, charms, shift, onHot, onVisit, onProject, onReady }: WorldProps) {
  const parts = useWorldModel()
  use(lettering)
  const budget = BUDGET[mode]
  // Until someone boards, the first view is a title card and the camera is not theirs to move.
  const roaming = mode === 'roam' && place !== 'halt'
  const night = phase === 'night' || Boolean(PLACES[place].night)

  useEffect(() => {
    onReady()
    return () => {
      document.body.style.cursor = ''
    }
    // The world arrives once.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Canvas
      shadows="percentage"
      flat
      dpr={budget.dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: PLACES.halt.view.fov, near: 0.2, far: 1600, position: PLACES.halt.view.position as [number, number, number] }}
      onCreated={(state) => {
        state.camera.layers.enable(MEADOW_LAYER)
        // In development the scene is handed to the console, so it can be stepped by hand while the tab is in the background.
        if (import.meta.env.DEV) (window as unknown as { __world?: unknown }).__world = state
      }}
      // One finger pans the page's sheets; the canvas keeps pinch and drag for the camera only when it is free.
      style={{ touchAction: roaming ? 'none' : 'pan-y' }}
    >
      <PartsContext value={parts}>
        <Atmosphere phase={phase} alwaysNight={Boolean(PLACES[place].night)} weather={weather} reducedMotion={reducedMotion} shadowSize={budget.shadow} />
        <Sky reducedMotion={reducedMotion} />
        <Sea resolution={budget.mirror} />
        <Railway place={place} still={mode === 'backdrop' || reducedMotion} labels={false} hot={hot} seats={seats} onHot={onHot} onProject={onProject} onVisit={onVisit} />
        <Town place={place} open={open} night={night} hot={hot} clusters={clusters} charms={charms} tufts={budget.tufts} lavish={budget.lavish} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
        <Motes count={budget.motes} />
        <Rain count={budget.rain} />
        <CameraRig place={place} reading={open} roaming={roaming} cuts={mode === 'backdrop' || reducedMotion} reducedMotion={reducedMotion} shift={shift} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </PartsContext>
    </Canvas>
  )
}
