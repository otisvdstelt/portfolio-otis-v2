import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect, useState } from 'react'
import type { Leaves } from '../hooks/useProjects'
import type { Phase, Weather } from '../lib/air'
import { PLACES, type Hot, type Mood, type PlaceId } from '../lib/places'
import { Motes, Rain } from './three/Air'
import { lettering, PartsContext, useWorldModel } from './three/assets'
import { Atmosphere, Sky } from './three/Atmosphere'
import { CameraRig } from './three/CameraRig'
import { Cab, Compartment, MailCar } from './three/Cars'
import { Cinema, type Volume } from './three/Cinema'
import { InkPaper } from './three/InkPaper'
import { MEADOW_LAYER } from './three/look'
import { Railway } from './three/Railway'
import { Sea } from './three/Sea'

export type { Volume }

export interface WorldProps {
  place: PlaceId
  /** The words of the place are out, the journal read or the card written */
  open: boolean
  /** roam is a free camera with parallax, backdrop is fixed views for touch */
  mode: 'roam' | 'backdrop'
  phase: Phase
  weather: Weather
  reducedMotion: boolean
  hot: Hot | null
  /** The projects in the rack of the picture car, one per tin */
  volumes: readonly Volume[]
  /** The project in the lantern, or null */
  tome: number | null
  /** What there is to say about it */
  leaves: Leaves | null
  /** The cab lever being pointed at or left pulled, or none */
  lever: number
  /** How far to slide the picture aside for a panel, as fractions of the view */
  shift: readonly [number, number]
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
  onLever: (index: number) => void
  /** Put away whatever is out, the picture, the journal or the card */
  onClose: () => void
  /** Ask GitHub for the figures again */
  onAsk: () => void
  onArrive: (place: PlaceId) => void
  /** Once the world is on screen */
  onReady: () => void
}

/** While the lantern is running it is evening outside, whatever the hour */
const SHOWING: Mood = { night: true }

// What each kind of device is asked to draw
const BUDGET = {
  roam: { dpr: [1, 1.75] as [number, number], motes: 170, rain: 1500, shadow: 2048, mirror: 1024 },
  backdrop: { dpr: [1, 1.5] as [number, number], motes: 90, rain: 700, shadow: 1024, mirror: 512 },
}

/** A sea, a line across it, and one train fitted out for whichever place the camera has reached */
export default function World({ place, open, mode, phase, weather, reducedMotion, hot, volumes, tome, leaves, lever, shift, onHot, onVisit, onProject, onLever, onClose, onAsk, onArrive, onReady }: WorldProps) {
  const parts = useWorldModel()
  use(lettering)
  const budget = BUDGET[mode]
  // The place the camera has actually reached, one journey behind place
  const [shown, setShown] = useState(place)
  const here = shown === place
  // Until someone boards, the first view is a title card and the camera is fixed
  const roaming = mode === 'roam' && place !== 'halt'
  const cuts = mode === 'backdrop' || reducedMotion
  const reading = place === 'cinema' ? tome !== null : open

  useEffect(() => {
    onReady()
    return () => {
      document.body.style.cursor = ''
    }
    // The world arrives once
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // What stands where the north benches of the middle car would be
  const fitting =
    shown === 'cinema' ? (
      <Cinema volumes={volumes} chosen={tome} leaves={leaves} hot={hot} here={here} reducedMotion={reducedMotion} onHot={onHot} onProject={onProject} onClose={onClose} onAsk={onAsk} />
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
        // In development the scene is handed to the console, for poking at by hand
        if (import.meta.env.DEV) (window as unknown as { __world?: unknown }).__world = state
      }}
      // One finger pans the sheets, the canvas takes the gesture only when the camera is free
      style={{ touchAction: roaming ? 'none' : 'pan-y' }}
      // A press on nothing in particular puts away whatever is being read
      onPointerMissed={() => mode === 'roam' && reading && onClose()}
    >
      <PartsContext value={parts}>
        <Atmosphere phase={phase} mood={shown === 'cinema' && here && tome !== null ? SHOWING : PLACES[shown].mood} weather={weather} reducedMotion={reducedMotion} shadowSize={budget.shadow} />
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
