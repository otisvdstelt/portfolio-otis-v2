import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import { Suspense, useRef } from 'react'
import { MathUtils, type Group, type PointLight } from 'three'
import { air } from '../../lib/air'
import type { Hot, PlaceId } from '../../lib/places'
import { runTrain, train } from '../../lib/train'
import { CAR, HALT } from '../../lib/world/spec'
import { CRUISE } from '../../lib/world/terrain'
import { LETTERING } from './look'
import { dry, glass, glow, paintedToon } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

// Telegraph posts stand along the north side of the line; the two kinds of rock repeat a lap apart.
const POSTS = Array.from({ length: 12 }, (_, i) => (i - 5) * CRUISE.postEvery).filter((x) => x <= 240)
const LAP = CRUISE.to - CRUISE.from
type Rock = readonly [x: number, z: number, size: number, turn: number]
const ROCKS: readonly Rock[] = [...[-170, -50, 70, 190].map((x): Rock => [x, -58, 1.15, 0.4]), ...[-70, 50, 170, 290].map((x): Rock => [x, 19, 0.62, 2.6])]
if (LAP % CRUISE.postEvery !== 0) throw new Error('the posts must stand a whole number of laps apart')

/** A railcar's paint. Under its own roof (the floor, the benches, the inside of the walls) it stays dry in the rain. */
const carPaint = paintedToon({ shelter: CAR.ceiling + 0.2 })

interface CarProps {
  offset: number
  /** The middle car is the one the visitor rides in: its benches are the projects. */
  slots?: { names: readonly string[]; hot: Hot | null; labelled: boolean; onHot: (hot: Hot | null) => void; onProject: (index: number) => void }
  onBoard: () => void
}

function Bench({ index, x, slot }: { index: number; x: number; slot: NonNullable<CarProps['slots']> }) {
  const lift = useRef<Group>(null)
  const isHot = slot.hot?.kind === 'bench' && slot.hot.index === index
  // A chosen bench rises a hand's breadth off the floor, as if the car had gone over a join in the rails.
  useFrame((_, delta) => {
    if (lift.current) lift.current.position.y = MathUtils.damp(lift.current.position.y, isHot ? 0.07 : 0, 10, delta)
  })
  const press = pressable(
    () => slot.onProject(index),
    (over) => slot.onHot(over ? { kind: 'bench', index } : null),
  )
  return (
    <group position={[x, 0, CAR.benchZ]}>
      <group ref={lift}>
        <Piece name="Car_Bench" material={dry} hung line={0.014} {...press} />
      </group>
      <Tag position={CAR.tag} shown={slot.labelled || isHot}>
        <span className="tag-note">seat {index + 1}</span>
        {slot.names[index]}
      </Tag>
    </group>
  )
}

function Car({ offset, slots, onBoard }: CarProps) {
  const board = pressable(onBoard)
  return (
    <group position={[offset, 0, 0]}>
      {/* From outside, any car is the way aboard; inside the middle one, the benches take the clicks. */}
      <Piece name="Car_Body" material={carPaint} line={0.03} {...board} />
      <Piece name="Car_Glass" material={glass} line={0} castShadow={false} />
      <Piece name="Car_Glow" material={glow} line={0} castShadow={false} />
      {CAR.benches.map((x, index) => (slots && index < slots.names.length ? <Bench key={x} index={index} x={x} slot={slots} /> : <Piece key={x} name="Car_Bench" material={dry} hung line={0.014} position={[x, 0, CAR.benchZ]} />))}
    </group>
  )
}

export interface RailwayProps {
  place: PlaceId
  /** Devices shown fixed views do not move the train at all. */
  still: boolean
  /** Pin a ticket over each bench while the visitor is aboard. Left off where a sheet covers them anyway. */
  labels: boolean
  hot: Hot | null
  /** The projects, one per bench, in order. */
  seats: readonly string[]
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
  onVisit: (place: PlaceId) => void
}

/** The line across the sea: the floating halt, the rails, the posts, and the red train that runs between halt and town. */
export function Railway({ place, still, labels, hot, seats, onHot, onProject, onVisit }: RailwayProps) {
  const cars = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)

  // The train moves first, before the camera asks where it is.
  useFrame((_, delta) => {
    runTrain(Math.min(delta, 0.25), still)
    if (cars.current) {
      cars.current.position.x = train.x
      // A little life in the springs while it is under way.
      cars.current.position.y = still ? 0 : Math.sin(air.time.value * 7.3) * 0.004 * Math.min(1, train.speed / 4)
    }
    if (lamp.current) lamp.current.intensity = 0.9 + air.night.value * 6
  }, -4)

  const board = () => onVisit('train')

  return (
    <>
      <Piece name="Line_Rails" line={0} castShadow={false} />
      {POSTS.map((x) => (
        <Piece key={x} name="Line_Post" position={[x, 0, -2.5]} line={0.03} />
      ))}
      {ROCKS.map(([x, z, size, turn]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]} rotation-y={turn} scale={size}>
          <Piece name="Sea_Rock" line={0} />
        </group>
      ))}

      <Piece name="Halt_Deck" line={0.03} {...pressable(board)} />
      <Piece name="Halt_Glow" material={glow} line={0} castShadow={false} />
      <Suspense fallback={null}>
        <Text font={displayFace} fontSize={0.34} letterSpacing={0.03} color={LETTERING.day} anchorX="center" anchorY="middle" position={HALT.signFace as [number, number, number]}>
          Stillwater Halt
        </Text>
      </Suspense>

      <group ref={cars}>
        <Car offset={-CAR.pitch} onBoard={board} />
        <Car offset={0} onBoard={board} slots={{ names: seats, hot, labelled: labels && place === 'train', onHot, onProject }} />
        <Car offset={CAR.pitch} onBoard={board} />
        <Piece name="Car_Lamps" material={glow} line={0} castShadow={false} position={[CAR.pitch, 0, 0]} />
        <Piece name="Car_Lamps" material={glow} line={0} castShadow={false} position={[-CAR.pitch, 0, 0]} rotation={[0, Math.PI, 0]} />
        <pointLight ref={lamp} position={[0, CAR.ceiling - 0.4, 0]} color="#ffe4bd" intensity={0.9} distance={9} decay={1.6} />
        {/* The destination, lettered over the middle door. */}
        <Suspense fallback={null}>
          <Text font={displayFace} fontSize={0.2} letterSpacing={0.05} color={LETTERING.day} anchorX="center" anchorY="middle" position={[0, CAR.ceiling + 0.14, CAR.halfWidth + 0.006]}>
            Crumb Harbour
          </Text>
        </Suspense>
      </group>
    </>
  )
}
