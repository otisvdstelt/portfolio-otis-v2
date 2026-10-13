import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { air } from '../../lib/air'
import { PLACES, type PlaceId, type Shot } from '../../lib/places'
import { heightAt } from '../../lib/world/terrain'
import { FOV } from './look'

interface Flight {
  from: Vector3
  fromTarget: Vector3
  to: Shot
  elapsed: number
  duration: number
  lift: number
}

interface CameraRigProps {
  place: PlaceId
  /** The camera is the visitor's to turn and zoom. */
  roaming: boolean
  /** Change place by washing out to paper and back, instead of flying. */
  cuts: boolean
  reducedMotion: boolean
  /** How far the picture is pushed aside to make room for a panel, as fractions of the view: right, up. */
  shift: readonly [number, number]
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const right = new Vector3()
const up = new Vector3()
const wanted = new Vector3()

/**
 * Moves the camera between places. On a desktop each change is one long
 * eased flight, arcing up and swooping down, after which the orbit belongs to
 * the visitor; the pointer leans the view a little for depth. Where the
 * camera is fixed, a change of place washes out to bare paper and back in.
 */
export function CameraRig({ place, roaming, cuts, reducedMotion, shift }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const controls = useRef<OrbitControlsImpl>(null)
  const tall = size.width < size.height * 0.9
  const shot = tall ? PLACES[place].backdrop : PLACES[place].view

  const rig = useRef({
    started: false,
    /** Where the camera is before the pointer leans it. */
    base: new Vector3(),
    lean: new Vector3(),
    pointer: { x: 0, y: 0 },
    flight: null as Flight | null,
    /** 0 settled, 1 washing out, 2 washing back in. */
    dip: 2,
    pending: shot,
    shift: [0, 0],
  })

  // A new place: either take off for it, or start washing the picture out.
  useEffect(() => {
    const r = rig.current
    r.pending = shot
    if (!r.started || !controls.current) return
    if (cuts) {
      r.flight = null
      r.dip = 1
      return
    }
    const to = wanted.set(...shot.position)
    const distance = r.base.distanceTo(to)
    r.flight = { from: r.base.clone(), fromTarget: controls.current.target.clone(), to: shot, elapsed: 0, duration: MathUtils.clamp(1.3 + distance * 0.03, 1.5, 3.4), lift: Math.min(6, distance * 0.09) }
  }, [shot, cuts])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit) return
    // The moment the visitor grabs the view, it is theirs.
    const release = () => {
      rig.current.flight = null
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
    // Wall-clock time, capped only against a tab that has been asleep: a flight lands when it should even at a low frame rate.
    const dt = Math.min(delta, 1.5)

    const snap = (to: Shot) => {
      r.base.set(...to.position)
      // Move the camera itself too, or the free-roam branch below would read its old position straight back.
      camera.position.copy(r.base)
      orbit.target.set(...to.target)
      r.flight = null
    }
    if (!r.started) {
      snap(r.pending)
      r.started = true
    }

    // The wash: out to paper, change the view while nothing shows, and back in.
    if (r.dip === 1) {
      air.reveal.value = Math.max(0, air.reveal.value - dt / 0.34)
      if (air.reveal.value === 0) {
        snap(r.pending)
        r.dip = 2
      }
    } else if (r.dip === 2) {
      air.reveal.value = Math.min(1, air.reveal.value + dt / (state.clock.elapsedTime < 3 ? 1.9 : 0.75))
      if (air.reveal.value === 1) r.dip = 0
    }

    if (r.flight) {
      const f = r.flight
      f.elapsed += dt
      const e = easeInOut(Math.min(1, f.elapsed / f.duration))
      r.base.lerpVectors(f.from, wanted.set(...f.to.position), e)
      r.base.y += Math.sin(Math.PI * e) * f.lift
      orbit.target.lerpVectors(f.fromTarget, wanted.set(...f.to.target), e)
      if (f.elapsed >= f.duration) r.flight = null
    } else if (roaming) {
      // The controls have just moved the camera; that is the new resting place. Never let it sink into a hillside.
      r.base.copy(camera.position)
      r.base.y = Math.max(r.base.y, heightAt(r.base.x, r.base.z) + 1.3)
    }

    // Lean with the pointer on a desktop; breathe slowly where the camera is fixed.
    const reach = r.base.distanceTo(orbit.target)
    const t = state.clock.elapsedTime
    const leanX = reducedMotion ? 0 : cuts ? Math.sin(t * 0.21) * 0.55 : r.pointer.x * 1.6
    const leanY = reducedMotion ? 0 : cuts ? Math.sin(t * 0.17 + 1) * 0.3 : -r.pointer.y * 0.9
    camera.position.copy(r.base)
    camera.lookAt(orbit.target)
    camera.updateMatrixWorld()
    wanted.set(0, 0, 0).addScaledVector(right.setFromMatrixColumn(camera.matrixWorld, 0), leanX * reach * 0.014).addScaledVector(up.setFromMatrixColumn(camera.matrixWorld, 1), leanY * reach * 0.014)
    r.lean.lerp(wanted, 1 - Math.exp(-dt * 2.6))
    camera.position.add(r.lean)
    camera.lookAt(orbit.target)

    // Slide the whole picture aside when a panel needs the room.
    r.shift[0] = MathUtils.damp(r.shift[0], shift[0], 3.2, dt)
    r.shift[1] = MathUtils.damp(r.shift[1], shift[1], 3.2, dt)
    const fov = tall ? FOV.tall : FOV.wide
    if (Math.abs(r.shift[0]) > 0.001 || Math.abs(r.shift[1]) > 0.001) {
      camera.fov = fov
      camera.setViewOffset(state.size.width, state.size.height, -r.shift[0] * state.size.width, r.shift[1] * state.size.height, state.size.width, state.size.height)
    } else if (camera.view?.enabled || camera.fov !== fov) {
      camera.fov = fov
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
      minDistance={4}
      maxDistance={78}
      minPolarAngle={0.35}
      maxPolarAngle={1.5}
    />
  )
}
