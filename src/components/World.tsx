import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect, useState } from 'react'
import type { Leaves } from '../hooks/useProjects'
import type { Phase, Weather } from '../lib/air'
import { PLACES, type Hot, type PlaceId } from '../lib/places'
import { Motes, Rain } from './three/Air'
import { lettering, PartsContext, useWorldModel } from './three/assets'
import { Atmosphere, Sky } from './three/Atmosphere'
import { CameraRig } from './three/CameraRig'
import { Cab, Compartment, MailCar } from './three/Cars'
import { InkPaper } from './three/InkPaper'
import { LibraryCar, type Volume } from './three/Library'
import { MEADOW_LAYER } from './three/look'
import { Railway } from './three/Railway'
import { Sea } from './three/Sea'

export type { Volume }

export interface WorldProps {
  place: PlaceId
  /** The place's own words are out: the journal is being read, the card is being written. */
  open: boolean
  /** `roam`: a free, damped camera with pointer parallax. `backdrop`: fixed views, for touch and modest hardware. */
  mode: 'roam' | 'backdrop'
  phase: Phase
  weather: Weather
  reducedMotion: boolean
  hot: Hot | null
  /** The projects on the library's ledge, one per book. */
  volumes: readonly Volume[]
  /** The book that is open, or null. */
  tome: number | null
  /** What is written in it. */
  leaves: Leaves | null
  /** The lever of the cab being pointed at or left pulled, or -1. */
  lever: number
  /** How far to slide the picture aside for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
  onLever: (index: number) => void
  /** Put away whatever is being read: the open book, the journal, the card. */
  onClose: () => void
  /** Ask GitHub for the open book's figures again. */
  onAsk: () => void
  /** The camera has reached a place. */
  onArrive: (place: PlaceId) => void
  /** Called once the world is on screen. */
  onReady: () => void
}

// What each kind of device is asked to draw.
const BUDGET = {
  roam: { dpr: [1, 1.75] as [number, number], motes: 170, rain: 1500, shadow: 2048, mirror: 1024 },
  backdrop: { dpr: [1, 1.5] as [number, number], motes: 90, rain: 700, shadow: 1024, mirror: 512 },
}

/**
 * The world: a sea, a line across it, and one train. Every section of the
 * site is that train fitted out for something; what it is fitted out with
 * follows the place the camera has actually reached, and the fog covers the
 * change.
 *
 * The model is read through Suspense (the file is preloaded the moment this
 * chunk arrives) and the lettering through `use()`, so the loading sprout
 * holds until every mesh is decoded and every sign can be drawn in the right
 * hand; nothing pops in afterwards.
 */
export default function World({ place, open, mode, phase, weather, reducedMotion, hot, volumes, tome, leaves, lever, shift, onHot, onVisit, onProject, onLever, onClose, onAsk, onArrive, onReady }: WorldProps) {
  const parts = useWorldModel()
  use(lettering)
  const budget = BUDGET[mode]
  // The place the camera has actually reached. It trails `place` by the length of the journey.
  const [shown, setShown] = useState(place)
  const here = shown === place
  // Until someone boards, the first view is a title card and the camera is not theirs to move.
  const roaming = mode === 'roam' && place !== 'halt'
  const cuts = mode === 'backdrop' || reducedMotion
  const reading = place === 'library' ? tome !== null : open

  useEffect(() => {
    onReady()
    return () => {
      document.body.style.cursor = ''
    }
    // The world arrives once.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // What stands where the middle car's north benches would be.
  const fitting =
    shown === 'library' ? (
      <LibraryCar volumes={volumes} chosen={tome} leaves={leaves} hot={hot} here={here} reducedMotion={reducedMotion} onHot={onHot} onProject={onProject} onClose={onClose} onAsk={onAsk} />
    ) : shown === 'compartment' ? (
      <Compartment here={here} open={here && open} reading={here && open && mode === 'roam'} hot={hot} onHot={onHot} onVisit={onVisit} onClose={onClose} />
    ) : shown === 'mail' ? (
      <MailCar here={here} open={here && open} hot={hot} onHot={onHot} onVisit={onVisit} />
    ) : null

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
      // A press on nothing in particular puts away whatever is being read.
      onPointerMissed={() => mode === 'roam' && reading && onClose()}
    >
      <PartsContext value={parts}>
        <Atmosphere phase={phase} mood={PLACES[shown].mood} weather={weather} reducedMotion={reducedMotion} shadowSize={budget.shadow} />
        <Sky reducedMotion={reducedMotion} />
        <Sea resolution={budget.mirror} />
        <Railway place={place} still={cuts} hot={hot} onHot={onHot} onVisit={onVisit} fitting={fitting} cab={shown === 'cab' ? <Cab chosen={here ? lever : -1} here={here} onHot={onHot} onLever={onLever} /> : null} />
        <Motes count={budget.motes} />
        <Rain count={budget.rain} />
        <CameraRig place={place} reading={mode === 'roam' && reading} roaming={roaming} cuts={cuts} reducedMotion={reducedMotion} shift={shift} onArrive={(at) => (setShown(at), onArrive(at))} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </PartsContext>
    </Canvas>
  )
}
