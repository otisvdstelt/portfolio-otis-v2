import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { air } from '../../lib/air'
import { isDestination, PLACES, seatShot, type PlaceId, type Shot } from '../../lib/places'
import { sendTrain, train } from '../../lib/train'
import { DECK } from '../../lib/world/terrain'

/** A straight glide from where the camera is to a shot: boarding, or leaning in to read. */
interface Glide {
  kind: 'glide'
  from: Vector3
  fromTarget: Vector3
  fromFov: number
  to: Shot
  /** It began aboard the train, so where it began is travelling too. */
  aboard: boolean
  elapsed: number
  duration: number
}

/** Down the aisle and into a window seat. Everything in it is measured from the train, which is moving. */
interface Walk {
  kind: 'walk'
  from: Vector3
  fromTarget: Vector3
  fromFov: number
  seat: Shot
  elapsed: number
  duration: number
}

interface CameraRigProps {
  place: PlaceId
  /** A closer look is wanted: the open book, the sketchpad. */
  reading: boolean
  /** The camera is the visitor's to turn and zoom. */
  roaming: boolean
  /** Devices shown fixed views, and people who asked for less motion: no walking, only the fog. */
  cuts: boolean
  reducedMotion: boolean
  /** How far the picture is pushed aside to make room for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
  /** The camera has got somewhere: the place now on screen. */
  onArrive: (place: PlaceId) => void
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (edge0: number, edge1: number, x: number) => MathUtils.smoothstep(x, edge0, edge1)
const right = new Vector3()
const up = new Vector3()
const a = new Vector3()
const b = new Vector3()

/** A shot's camera position in the world: shots taken aboard the train ride along with it. */
const stand = (shot: Shot, out: Vector3) => out.set(shot.position[0] + (shot.onTrain ? train.x : 0), shot.position[1], shot.position[2])
const aim = (shot: Shot, out: Vector3) => out.set(shot.target[0] + (shot.onTrain ? train.x : 0), shot.target[1], shot.target[2])

/**
 * A walk to a window seat, in seconds and metres: the time to step out into
 * the aisle, the walking pace, the time to slide across and sit, and how
 * many radians the head rises and falls per metre (one step to each 0.7 m).
 */
const WALK = { out: 0.7, pace: 1.25, sit: 1.2, step: (Math.PI * 2) / 0.7 }

/** When the walking stops and the sitting starts, and how long the whole walk takes, for an aisle this long. */
function walkTimes(distance: number) {
  const walking = Math.max(0.5, distance / WALK.pace)
  const seated = WALK.out / 2 + walking - 0.35
  return { walking, seated, total: seated + WALK.sit }
}

/** Progress along the aisle at an even pace: picking up speed over the first part, slowing over the last, steady between. */
function stride(t: number, ease = 0.2) {
  const k = MathUtils.clamp(t, 0, 1)
  const top = 1 / (1 - ease)
  if (k < ease) return (top * k * k) / (2 * ease)
  if (k > 1 - ease) return 1 - (top * (1 - k) * (1 - k)) / (2 * ease)
  return top * (k - ease / 2)
}

/** How long the fog takes to roll over the picture, and to roll off it again, in seconds. */
const FOG = { over: 1.15, off: 1.5 }

/**
 * Moves the camera through the journey.
 *
 * Boarding at the halt is one glide: down from the wide view, across the
 * platform and in through a window. Leaving the train car for a scene, the
 * camera walks down the aisle, slides into the seat facing that scene's
 * window, and the moment it has settled there a bank of fog rolls across the
 * picture; when the fog rolls off, the scene is the new one. Everywhere else
 * the fog alone does the travelling. Once the camera has landed the orbit
 * belongs to the visitor, within what the place allows.
 */
export function CameraRig({ place, reading, roaming, cuts, reducedMotion, shift, onArrive }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const controls = useRef<OrbitControlsImpl>(null)
  const tall = size.width < size.height * 0.9
  const spot = PLACES[place]
  const shot = reading && spot.reading ? spot.reading : tall ? spot.backdrop : spot.view

  const rig = useRef({
    started: false,
    /** Where the camera is before the pointer leans it. */
    base: new Vector3(),
    lean: new Vector3(),
    pointer: { x: 0, y: 0 },
    move: null as Glide | Walk | null,
    /** 0 clear, 1 fog rolling over, 2 fog rolling off. */
    fog: 2,
    /** The shot being held, or headed for. */
    shot,
    place,
    /** The place the camera has actually reached. */
    shown: place,
    /** The last place the page was told about. */
    told: place,
    trainX: 0,
    fov: shot.fov,
    shift: [0, 0],
  })

  // A new shot: decide how to get there.
  useEffect(() => {
    const r = rig.current
    const leaving = r.shown
    r.shot = shot
    r.place = place
    if (!r.started || !controls.current) return
    const here = { from: r.base.clone(), fromTarget: controls.current.target.clone(), fromFov: r.fov, elapsed: 0 }
    if (place === leaving) {
      // The same place, a different look at it.
      r.move = { kind: 'glide', ...here, to: shot, aboard: Boolean(shot.onTrain), duration: 1.6 }
    } else if (leaving === 'halt' && place === 'cabin' && !cuts) {
      // Boarding: nothing in the way but a window.
      r.move = { kind: 'glide', ...here, to: shot, aboard: false, duration: 3.3 }
      sendTrain(place, false)
      r.shown = place
    } else if (leaving === 'cabin' && isDestination(place) && !cuts) {
      const seat = seatShot(place)
      const from = here.from.setX(here.from.x - train.x)
      r.move = { kind: 'walk', ...here, from, fromTarget: here.fromTarget.setX(here.fromTarget.x - train.x), seat, duration: walkTimes(Math.abs(seat.position[0] - from.x)).total }
    } else {
      r.move = null
      air.wipe.value = 1
      r.fog = 1
    }
  }, [shot, place, cuts])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    // The moment the visitor grabs the view it is theirs, unless they are on their way to a seat.
    const release = () => {
      if (rig.current.move?.kind === 'glide') rig.current.move = null
    }
    orbit.addEventListener('start', release)
    return () => orbit.removeEventListener('start', release)
  }, [])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      rig.current.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      rig.current.pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Before the orbit controls read the camera, take last frame's lean back off it.
  useFrame(() => {
    if (rig.current.started) camera.position.copy(rig.current.base)
  }, -2)

  useFrame((state, delta) => {
    const orbit = controls.current
    if (!orbit) return
    const r = rig.current
    // Wall-clock time, capped only against a tab that has been asleep: a journey ends when it should even at a low frame rate.
    const dt = Math.min(delta, 1.5)

    const arrive = (to: Shot, at: PlaceId) => {
      sendTrain(at, true)
      r.shown = at
      stand(to, r.base)
      // Move the camera itself too, or the free-roam branch below would read its old position straight back.
      camera.position.copy(r.base)
      aim(to, orbit.target)
      r.fov = to.fov
      r.trainX = train.x
      r.move = null
    }
    if (!r.started) {
      arrive(r.shot, r.place)
      r.started = true
    }

    // Aboard, the camera is carried by the train (including round the end of its lap).
    const carried = train.x - r.trainX
    r.trainX = train.x
    // (A walk works in the train's own measure and needs no carrying.)
    if (carried !== 0 && PLACES[r.shown].view.onTrain && r.move?.kind !== 'walk') {
      r.base.x += carried
      camera.position.x += carried
      orbit.target.x += carried
      if (r.move?.kind === 'glide' && r.move.aboard) {
        r.move.from.x += carried
        r.move.fromTarget.x += carried
      }
    }

    // The fog: over the picture, change the scene while nothing shows, and off again.
    if (r.fog === 1) {
      air.reveal.value = Math.max(0, air.reveal.value - dt / FOG.over)
      if (air.reveal.value === 0) {
        arrive(r.shot, r.place)
        air.wipe.value = 2
        r.fog = 2
      }
    } else if (r.fog === 2) {
      air.reveal.value = Math.min(1, air.reveal.value + dt / (air.wipe.value === 0 ? 1.9 : FOG.off))
      if (air.reveal.value === 1) r.fog = 0
    }

    const m = r.move
    if (m?.kind === 'glide') {
      m.elapsed += dt
      const p = Math.min(1, m.elapsed / m.duration)
      const e = easeInOut(p)
      r.base.lerpVectors(m.from, stand(m.to, b), e)
      orbit.target.lerpVectors(m.fromTarget, aim(m.to, b), e)
      r.fov = MathUtils.lerp(m.fromFov, m.to.fov, e)
      if (p >= 1) r.move = null
    } else if (m?.kind === 'walk') {
      m.elapsed += dt
      const t = m.elapsed
      const p = Math.min(1, t / m.duration)
      // Step out into the aisle, walk along it at an even pace, then slide across and sit. Timed in seconds, so a far seat is a longer walk, not a faster one.
      const startX = m.from.x
      const seatX = m.seat.position[0]
      const { walking, seated } = walkTimes(Math.abs(seatX - startX))
      const out = smooth(0, WALK.out, t)
      const along = stride((t - WALK.out / 2) / walking)
      const sitting = smooth(seated, m.duration, t)
      const x = MathUtils.lerp(startX, seatX, along)
      const z = MathUtils.lerp(MathUtils.lerp(m.from.z, 0.04, out), m.seat.position[2], sitting)
      // One gentle rise and fall to each step.
      const standing = DECK + 1.34 + (reducedMotion ? 0 : Math.sin(along * Math.abs(seatX - startX) * WALK.step) * 0.016 * (1 - sitting))
      const y = MathUtils.lerp(MathUtils.lerp(m.from.y, standing, out), m.seat.position[1], sitting)
      r.base.set(train.x + x, y, z)
      // Eyes along the aisle while walking; round to the window as the seat is taken.
      const heading = Math.sign(seatX - startX) || 1
      a.set(train.x + x + heading * 2.4, DECK + 1.2, -0.25)
      b.set(train.x + m.fromTarget.x, m.fromTarget.y, m.fromTarget.z)
      a.lerpVectors(b, a, out)
      orbit.target.lerpVectors(a, aim(m.seat, b), smooth(seated - 0.4, m.duration, t))
      r.fov = MathUtils.lerp(m.fromFov, m.seat.fov, easeInOut(p))
      if (p >= 1) {
        // Seated, facing the window: this is the moment the fog comes.
        r.move = null
        air.wipe.value = 1
        r.fog = 1
      }
    } else if (roaming && r.fog !== 1) {
      // The controls have just moved the camera; that is the new resting place. Keep it out of the sea.
      r.base.copy(camera.position)
      if (r.shown === 'halt') r.base.y = Math.max(r.base.y, 0.7)
    }

    if (r.told !== r.shown) {
      r.told = r.shown
      onArrive(r.shown)
    }

    // What the visitor may do with the view depends on where they are: a room is not the open sea.
    const held = r.shown === r.place ? r.shot : PLACES[r.shown].view
    orbit.minDistance = held.reach[0]
    orbit.maxDistance = held.reach[1]
    orbit.minPolarAngle = held.tilt[0]
    orbit.maxPolarAngle = held.tilt[1]
    if (held.swing === undefined || r.move) {
      orbit.minAzimuthAngle = -Infinity
      orbit.maxAzimuthAngle = Infinity
    } else {
      const bearing = Math.atan2(held.position[0] - held.target[0], held.position[2] - held.target[2])
      orbit.minAzimuthAngle = bearing - held.swing
      orbit.maxAzimuthAngle = bearing + held.swing
    }

    // Lean with the pointer on a desktop; breathe slowly where the camera is fixed.
    const reach = r.base.distanceTo(orbit.target)
    const t = state.clock.elapsedTime
    const leanX = reducedMotion ? 0 : cuts ? Math.sin(t * 0.21) * 0.55 : r.pointer.x * 1.6
    const leanY = reducedMotion ? 0 : cuts ? Math.sin(t * 0.17 + 1) * 0.3 : -r.pointer.y * 0.9
    camera.position.copy(r.base)
    camera.lookAt(orbit.target)
    camera.updateMatrixWorld()
    a.set(0, 0, 0).addScaledVector(right.setFromMatrixColumn(camera.matrixWorld, 0), leanX * Math.min(reach, 30) * 0.014).addScaledVector(up.setFromMatrixColumn(camera.matrixWorld, 1), leanY * Math.min(reach, 30) * 0.014)
    r.lean.lerp(a, 1 - Math.exp(-dt * 2.6))
    camera.position.add(r.lean)
    camera.lookAt(orbit.target)

    // Slide the whole picture aside when a panel needs the room.
    r.shift[0] = MathUtils.damp(r.shift[0], shift[0], 3.2, dt)
    r.shift[1] = MathUtils.damp(r.shift[1], shift[1], 3.2, dt)
    if (!r.move) r.fov = MathUtils.damp(r.fov, held.fov, 4, dt)
    camera.fov = r.fov
    if (Math.abs(r.shift[0]) > 0.001 || Math.abs(r.shift[1]) > 0.001) {
      camera.setViewOffset(state.size.width, state.size.height, -r.shift[0] * state.size.width, r.shift[1] * state.size.height, state.size.width, state.size.height)
    } else {
      camera.clearViewOffset()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={roaming}
      enablePan={false}
      enableDamping
      // Heavy damping: the view glides to rest like a crane shot, it never stops dead.
      dampingFactor={0.045}
      rotateSpeed={0.42}
      zoomSpeed={0.55}
    />
  )
}
