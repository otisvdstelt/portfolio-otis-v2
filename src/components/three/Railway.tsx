import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import { Suspense, useRef, type ReactNode } from 'react'
import { MathUtils, type Group, type PointLight } from 'three'
import { air } from '../../lib/air'
import { DESTINATIONS, PLACES, type Hot, type PlaceId } from '../../lib/places'
import { runTrain, train } from '../../lib/train'
import { CAR, HALT } from '../../lib/world/spec'
import { CRUISE, TRACK } from '../../lib/world/terrain'
import { LETTERING } from './look'
import { dry, glass, glow, paintedToon } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

// Telegraph posts along the line, a whole number to a lap, on ahead into the haze
const POSTS = Array.from({ length: 22 }, (_, i) => (i - 5) * CRUISE.postEvery)
const LAP = CRUISE.to - CRUISE.from
if (LAP % CRUISE.postEvery !== 0) throw new Error('the posts must stand a whole number of laps apart')

/** Railcar paint, which stays dry under its own roof */
const carPaint = paintedToon({ shelter: CAR.ceiling + 0.2 })

interface Seats {
  hot: Hot | null
  /** The visitor is in the car, so its benches answer to the pointer */
  live: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId) => void
}

/** One bench of the middle car, each the way to a destination */
function Bench({ index, x, seats }: { index: number; x: number; seats: Seats }) {
  const lift = useRef<Group>(null)
  const destination = DESTINATIONS[index]
  const isHot = seats.hot?.kind === 'seat' && seats.hot.index === index
  // A chosen bench rises a little, as if the car had gone over a join in the rails
  useFrame((_, delta) => {
    if (lift.current) lift.current.position.y = MathUtils.damp(lift.current.position.y, isHot ? 0.07 : 0, 10, delta)
  })
  const press = pressable(
    () => seats.onVisit(destination),
    (over) => seats.onHot(over ? { kind: 'seat', index } : null),
  )
  return (
    <group position={[x, 0, CAR.benchZ]}>
      <group ref={lift}>
        <Piece name="Car_Bench" material={dry} hung line={0.014} {...(seats.live ? press : {})} />
      </group>
      <Tag position={CAR.tag} shown={seats.live && isHot}>
        {PLACES[destination].name}
        <span className="tag-note">{PLACES[destination].role}</span>
      </Tag>
    </group>
  )
}

/** One car. A fitting, when given, stands where the north benches would be */
function Car({ offset, seats, onBoard, fitting }: { offset: number; seats?: Seats; onBoard?: () => void; fitting?: ReactNode }) {
  return (
    <group position={[offset, 0, 0]}>
      {/* From the platform, any car is the way aboard */}
      <Piece name="Car_Body" material={carPaint} line={0.03} {...(onBoard ? pressable(onBoard) : {})} />
      <Piece name="Car_Glass" material={glass} line={0} castShadow={false} />
      <Piece name="Car_Glow" material={glow} line={0} castShadow={false} />
      {fitting ?? CAR.benches.map((x, index) => (seats ? <Bench key={x} index={index} x={x} seats={seats} /> : <Piece key={x} name="Car_Bench" material={dry} hung line={0.014} position={[x, 0, CAR.benchZ]} />))}
    </group>
  )
}

export interface RailwayProps {
  place: PlaceId
  /** Devices shown fixed views do not move the train at all */
  still: boolean
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId) => void
  /** What stands in place of the north benches, or null in the passenger car */
  fitting: ReactNode
  /** The cab, which stands in for the front car while the visitor is there */
  cab: ReactNode
}

/** The line across the sea, the floating halt, the rails, the posts and the red train */
export function Railway({ place, still, hot, onHot, onVisit, fitting, cab }: RailwayProps) {
  const cars = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)

  // The train moves first, before the camera asks where it is
  useFrame((_, delta) => {
    runTrain(Math.min(delta, 0.25), still)
    if (cars.current) {
      cars.current.position.x = train.x
      // A little life in the springs while it is under way
      cars.current.position.y = still ? 0 : Math.sin(air.time.value * 7.3) * 0.004 * Math.min(1, train.speed / 4)
    }
    if (lamp.current) lamp.current.intensity = (0.9 + air.night.value * 6) * air.house.value
  }, -4)

  const board = place === 'halt' ? () => onVisit('cabin') : undefined

  return (
    <>
      <Piece name="Line_Rails" line={0} castShadow={false} />
      {/* The same rails again from the end of the first, so the line never stops short */}
      <Piece name="Line_Rails" line={0} castShadow={false} position={[TRACK.east - TRACK.west, 0, 0]} />
      {POSTS.map((x) => (
        <Piece key={x} name="Line_Post" position={[x, 0, -2.5]} line={0.03} />
      ))}
      <Piece name="Halt_Deck" line={0.03} {...(board ? pressable(board) : {})} />
      <Piece name="Halt_Glow" material={glow} line={0} castShadow={false} />
      <Suspense fallback={null}>
        <Text font={displayFace} fontSize={0.34} letterSpacing={0.03} color={LETTERING.day} anchorX="center" anchorY="middle" position={HALT.signFace as [number, number, number]}>
          Stillwater Halt
        </Text>
      </Suspense>

      <group ref={cars}>
        <Car offset={-CAR.pitch} onBoard={board} />
        <Car offset={0} onBoard={board} seats={{ hot, live: place === 'cabin', onHot, onVisit }} fitting={fitting ?? undefined} />
        {cab ? <group position={[CAR.pitch, 0, 0]}>{cab}</group> : <Car offset={CAR.pitch} onBoard={board} />}
        <Piece name="Car_Lamps" material={glow} line={0} castShadow={false} position={[CAR.pitch, 0, 0]} />
        <Piece name="Car_Lamps" material={glow} line={0} castShadow={false} position={[-CAR.pitch, 0, 0]} rotation={[0, Math.PI, 0]} />
        <pointLight ref={lamp} position={[0, CAR.ceiling - 0.4, 0]} color="#ffe4bd" intensity={0.9} distance={9} decay={1.6} />
      </group>
    </>
  )
}
