import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect, useState } from 'react'
import type { Phase, Weather } from '../lib/air'
import { PLACES, plaqueGaze, type Hot, type PlaceId } from '../lib/places'
import { Motes, Rain } from './three/Air'
import { lettering, PartsContext, useWorldModel } from './three/assets'
import { Atmosphere, Sky } from './three/Atmosphere'
import { CameraRig } from './three/CameraRig'
import { InkPaper } from './three/InkPaper'
import { MEADOW_LAYER } from './three/look'
import { Railway } from './three/Railway'
import type { Leaves } from '../hooks/useProjects'
import { LibraryCar, type Volume } from './three/Library'
import { BusStop, Coast, Tower, type Division, type Plank } from './three/Scenes'
import { Sea } from './three/Sea'

export type { Division, Plank, Volume }

export interface WorldProps {
  place: PlaceId
  /** The place's own words are out: the sketchpad is being read, the telephone is off its hook. */
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
  divisions: readonly Division[]
  /** The plaque of the signpost being pointed at or pinned, or -1. */
  plaque: number
  planks: readonly Plank[]
  /** How far to slide the picture aside for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
  onPlaque: (index: number) => void
  /** Put the open book back. */
  onCloseBook: () => void
  /** Ask GitHub for the open book's figures again. */
  onAsk: () => void
  /** The camera has reached a place. */
  onArrive: (place: PlaceId) => void
  /** Called once the world is on screen. */
  onReady: () => void
}

// What each kind of device is asked to draw.
const BUDGET = {
  roam: { dpr: [1, 1.75] as [number, number], seeds: 520, motes: 170, rain: 1500, shadow: 2048, mirror: 1024, lavish: true },
  backdrop: { dpr: [1, 1.5] as [number, number], seeds: 240, motes: 90, rain: 700, shadow: 1024, mirror: 512, lavish: false },
}

const onTheLine = (place: PlaceId) => place === 'halt' || place === 'cabin' || place === 'library'

/**
 * The world. Its model is read through Suspense (the file is preloaded the
 * moment this chunk arrives) and its lettering through `use()`, so the
 * loading sprout holds until every mesh is decoded and every sign can be
 * drawn in the right hand; nothing pops in afterwards.
 *
 * The railway and the three scenes off it stand far apart on one sea, and
 * the library is the train's middle car with its benches taken out. Only
 * what is on screen and what is being travelled to is built at any moment;
 * the fog covers the change.
 */
export default function World({ place, open, mode, phase, weather, reducedMotion, hot, volumes, tome, leaves, divisions, plaque, planks, shift, onHot, onVisit, onProject, onPlaque, onCloseBook, onAsk, onArrive, onReady }: WorldProps) {
  const parts = useWorldModel()
  use(lettering)
  const budget = BUDGET[mode]
  // The place the camera has actually reached. It trails `place` by the length of the journey.
  const [shown, setShown] = useState(place)
  const arrived = shown === place
  // Until someone boards, the first view is a title card and the camera is not theirs to move.
  const roaming = mode === 'roam' && place !== 'halt'
  const cuts = mode === 'backdrop' || reducedMotion
  const night = phase === 'night' || Boolean(PLACES[shown].mood.night)
  const built = (id: PlaceId) => shown === id || place === id

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
      // A click on nothing in particular puts the open book back.
      onPointerMissed={() => tome !== null && onCloseBook()}
    >
      <PartsContext value={parts}>
        <Atmosphere phase={phase} mood={PLACES[shown].mood} weather={weather} reducedMotion={reducedMotion} shadowSize={budget.shadow} />
        <Sky reducedMotion={reducedMotion} />
        <Sea resolution={budget.mirror} />
        {(onTheLine(shown) || onTheLine(place)) && (
          <Railway
            place={place}
            still={mode === 'backdrop' || reducedMotion}
            hot={hot}
            onHot={onHot}
            onVisit={onVisit}
            library={
              shown === 'library' ? (
                <LibraryCar volumes={volumes} chosen={tome} leaves={leaves} hot={hot} here={arrived && place === 'library'} reducedMotion={reducedMotion} onHot={onHot} onProject={onProject} onClose={onCloseBook} onAsk={onAsk} />
              ) : null
            }
          />
        )}
        {built('tower') && <Tower here={arrived && place === 'tower'} reading={open} reducedMotion={reducedMotion} onVisit={onVisit} />}
        {built('signpost') && <Coast divisions={divisions} chosen={shown === 'signpost' && arrived ? plaque : -1} seeds={budget.seeds} night={night} onHot={onHot} onPlaque={onPlaque} />}
        {built('busstop') && <BusStop here={arrived && place === 'busstop'} open={open && shown === 'busstop'} planks={planks} hot={hot} lavish={budget.lavish} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />}
        <Motes count={budget.motes} />
        <Rain count={budget.rain} />
        <CameraRig
          place={place}
          reading={mode === 'roam' && (place === 'tower' ? open : place === 'library' && tome !== null)}
          roaming={roaming}
          cuts={cuts}
          reducedMotion={reducedMotion}
          shift={shift}
          gaze={place === 'signpost' && plaque >= 0 ? plaqueGaze(plaque) : null}
          onArrive={(at) => {
            setShown(at)
            onArrive(at)
          }}
        />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </PartsContext>
    </Canvas>
  )
}
