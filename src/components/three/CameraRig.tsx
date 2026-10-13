import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { air } from '../../lib/air'
import { PLACES, type PlaceId, type Shot } from '../../lib/places'
import { sendTrain, train } from '../../lib/train'
import { heightAt } from '../../lib/world/terrain'

interface Flight {
  from: Vector3
  fromTarget: Vector3
  fromFov: number
  to: Shot
  toPlace: PlaceId
  /** Wash the picture out to paper for the middle of the journey. */
  veiled: boolean
  /** The veiled journey is past its middle: the camera is now arriving, not leaving. */
  crossed: boolean
  elapsed: number
  duration: number
}

interface CameraRigProps {
  place: PlaceId
  /** The place's panel is open; some places have a closer shot for that. */
  reading: boolean
  /** The camera is the visitor's to turn and zoom. */
  roaming: boolean
  /** Change place by washing out to paper and back with no travelling at all: phones, and people who asked for less motion. */
  cuts: boolean
  reducedMotion: boolean
  /** How far the picture is pushed aside to make room for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const right = new Vector3()
const up = new Vector3()
const a = new Vector3()
const b = new Vector3()

/** A shot's camera position in the world: shots taken aboard the train ride along with it. */
const stand = (shot: Shot, out: Vector3) => out.set(shot.position[0] + (shot.onTrain ? train.x : 0), shot.position[1], shot.position[2])
const aim = (shot: Shot, out: Vector3) => out.set(shot.target[0] + (shot.onTrain ? train.x : 0), shot.target[1], shot.target[2])

/**
 * Moves the camera between the scenes. Boarding the train is one unbroken
 * glide, down from the wide view and in through the window. Every other
 * journey crosses walls or a great deal of open sea, so the picture washes
 * out to paper as the camera pulls away and washes back as it settles into
 * the new place. Once it has landed, the orbit belongs to the visitor, within
 * what the room allows, and the pointer leans the view a little for depth.
 */
export function CameraRig({ place, reading, roaming, cuts, reducedMotion, shift }: CameraRigProps) {
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
    flight: null as Flight | null,
    /** 0 settled, 1 washing out, 2 washing back in. */
    dip: 2,
    /** The shot being held, or headed for. */
    shot,
    place,
    /** The place the camera has actually reached. */
    shown: place,
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
    if (cuts && place !== leaving) {
      r.flight = null
      r.dip = 1
      return
    }
    // Boarding at the halt, and leaning in to read, are the two journeys with nothing in the way.
    const veiled = place !== leaving && !(leaving === 'halt' && place === 'train')
    r.flight = { from: r.base.clone(), fromTarget: controls.current.target.clone(), fromFov: r.fov, to: shot, toPlace: place, veiled, crossed: false, elapsed: 0, duration: veiled ? 2.5 : place !== leaving ? 3.3 : 1.5 }
    if (!veiled && place !== leaving) {
      sendTrain(place, false)
      r.shown = place
    }
  }, [shot, place, cuts])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    // The moment the visitor grabs the view it is theirs, unless the picture is washed out.
    const release = () => {
      const flight = rig.current.flight
      if (flight && !flight.veiled) rig.current.flight = null
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
      r.flight = null
    }
    if (!r.started) {
      arrive(r.shot, r.place)
      r.started = true
    }

    // Aboard, the camera is carried by the train (including round the end of its lap).
    const carried = train.x - r.trainX
    r.trainX = train.x
    if (carried !== 0 && r.shot.onTrain && r.shown === r.place && !r.flight) {
      r.base.x += carried
      camera.position.x += carried
      orbit.target.x += carried
    }

    // The wash, for devices with fixed views: out to paper, change the view while nothing shows, and back in.
    if (r.dip === 1) {
      air.reveal.value = Math.max(0, air.reveal.value - dt / 0.34)
      if (air.reveal.value === 0) {
        arrive(r.shot, r.place)
        r.dip = 2
      }
    } else if (r.dip === 2) {
      air.reveal.value = Math.min(1, air.reveal.value + dt / (state.clock.elapsedTime < 3 ? 1.9 : 0.75))
      if (air.reveal.value === 1) r.dip = 0
    }

    if (r.flight) {
      const f = r.flight
      f.elapsed += dt
      const p = Math.min(1, f.elapsed / f.duration)
      if (f.veiled) {
        if (p < 0.5) {
          // Leaving: draw back and up a little as the paper takes over.
          const u = easeOut(p * 2)
          a.subVectors(f.from, f.fromTarget).normalize().multiplyScalar(0.7).setY(0.25)
          r.base.copy(f.from).addScaledVector(a, u)
          orbit.target.copy(f.fromTarget)
          air.reveal.value = 1 - MathUtils.smoothstep(p * 2, 0, 0.8)
        } else {
          if (!f.crossed) {
            // Nothing can be seen: this is the moment to put the train where the story needs it.
            f.crossed = true
            sendTrain(f.toPlace, true)
            r.shown = f.toPlace
            r.trainX = train.x
            r.fov = f.to.fov
          }
          // Arriving: settle forward into the new place as the paint comes back.
          const v = easeOut((p - 0.5) * 2)
          stand(f.to, b)
          aim(f.to, orbit.target)
          a.subVectors(b, orbit.target).normalize().multiplyScalar(0.7).setY(0.25)
          r.base.copy(b).addScaledVector(a, 1 - v)
          air.reveal.value = MathUtils.smoothstep((p - 0.5) * 2, 0.15, 1)
        }
      } else {
        const e = easeInOut(p)
        r.base.lerpVectors(f.from, stand(f.to, b), e)
        orbit.target.lerpVectors(f.fromTarget, aim(f.to, b), e)
        r.fov = MathUtils.lerp(f.fromFov, f.to.fov, e)
      }
      if (p >= 1) r.flight = null
    } else if (roaming && r.dip !== 1) {
      // The controls have just moved the camera; that is the new resting place. Keep it out of the sea and the hillside.
      r.base.copy(camera.position)
      if (r.shown === 'halt') r.base.y = Math.max(r.base.y, 0.7)
      if (r.shown === 'campfire') r.base.y = Math.max(r.base.y, heightAt(r.base.x, r.base.z) + 1.2)
    }

    // What the visitor may do with the view depends on where they are: a room is not the open sea.
    const held = r.shot
    orbit.minDistance = held.reach[0]
    orbit.maxDistance = held.reach[1]
    orbit.minPolarAngle = held.tilt[0]
    orbit.maxPolarAngle = held.tilt[1]
    if (held.swing === undefined || r.flight) {
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
    a.set(0, 0, 0).addScaledVector(right.setFromMatrixColumn(camera.matrixWorld, 0), leanX * reach * 0.014).addScaledVector(up.setFromMatrixColumn(camera.matrixWorld, 1), leanY * reach * 0.014)
    r.lean.lerp(a, 1 - Math.exp(-dt * 2.6))
    camera.position.add(r.lean)
    camera.lookAt(orbit.target)

    // Slide the whole picture aside when a panel needs the room.
    r.shift[0] = MathUtils.damp(r.shift[0], shift[0], 3.2, dt)
    r.shift[1] = MathUtils.damp(r.shift[1], shift[1], 3.2, dt)
    if (!r.flight) r.fov = MathUtils.damp(r.fov, held.fov, 4, dt)
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
