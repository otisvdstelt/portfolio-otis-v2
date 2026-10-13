import { Html, Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import { Suspense, useMemo, useRef, type ReactNode } from 'react'
import { Color, MathUtils, type Group, type Material, type PointLight } from 'three'
import { air } from '../../lib/air'
import { PLACES, TRAIL, type Hot, type PlaceId } from '../../lib/places'
import { GREENHOUSE, POSTBOX, SIGN_BOARD, SIGN_BOARDS, STATION, TRAIN, WINDMILL } from '../../lib/world/spec'
import { groundAt, SITES, TRACK_X, TRACK_Y, WINDMILLS } from '../../lib/world/terrain'
import { Smoke } from './Air'
import { useValley } from './assets'
import { flame, glass, glow, paint, paintedToon } from './materials'

/** Lettering painted on wood: dark ink by day, pale paint that still reads by lantern light at night. */
const LETTERING = { day: '#3a2a20', night: '#f6e9c8' }

// ------------------------------------------------------------ small pieces

interface PieceProps {
  name: string
  material?: Material
  /** Parts with a pivot are drawn at it unless they sit inside a group that is already there. */
  hung?: boolean
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
}

/** One named mesh from the baked valley. */
function Piece({ name, material = paint, hung = false, ...events }: PieceProps) {
  const valley = useValley()
  return <mesh geometry={valley.geometry[name]} material={material} position={hung ? undefined : valley.pivot[name]} castShadow={material !== glass} receiveShadow {...events} />
}

/** Pointer handlers for anything that can be clicked: a hand cursor, and a click that ignores the end of a drag. */
function pressable(onPress: () => void, onHover?: (over: boolean) => void) {
  return {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      if (event.delta > 6) return
      event.stopPropagation()
      onPress()
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      document.body.style.cursor = 'pointer'
      onHover?.(true)
    },
    onPointerOut: () => {
      document.body.style.cursor = ''
      onHover?.(false)
    },
  }
}

/** A hand-written paper tag floating over something in the valley. */
function Tag({ position, shown, children }: { position: readonly [number, number, number]; shown: boolean; children: ReactNode }) {
  return (
    <Html position={position as [number, number, number]} center pointerEvents="none" zIndexRange={[30, 10]} wrapperClass="tag-anchor">
      <div className="tag" data-shown={shown}>
        {children}
      </div>
    </Html>
  )
}

// ------------------------------------------------------------ signpost

function Signpost({ ink, onVisit }: { ink: string; onVisit: (place: PlaceId) => void }) {
  const valley = useValley()
  const { length, thickness, inset } = SIGN_BOARD
  const hovered = useRef<string | null>(null)
  const boards = useRef<(Group | null)[]>([])

  // The board under the pointer nods toward its landmark.
  useFrame((_, delta) => {
    SIGN_BOARDS.forEach(({ place }, i) => {
      const board = boards.current[i]
      if (board) board.rotation.x = MathUtils.damp(board.rotation.x, hovered.current === place ? -0.16 : 0, 10, delta)
    })
  })

  return (
    <group position={groundAt(SITES.signpost)} rotation-y={-0.12}>
      <Piece name="Signpost_Post" />
      {SIGN_BOARDS.map(({ place, side, yaw }, i) => {
        const name = `Signpost_${place}`
        return (
          <group
            key={place}
            ref={(group) => {
              boards.current[i] = group
            }}
            position={valley.pivot[name]}
          >
            <Piece name={name} hung {...pressable(() => onVisit(place), (over) => (hovered.current = over ? place : null))} />
            <Suspense fallback={null}>
              <Text font={displayFace} fontSize={0.215} color={ink} anchorX="center" anchorY="middle" rotation={[0, yaw, side * 0.03]} position={[Math.cos(yaw) * side * (inset + length / 2 + 0.02) + Math.sin(yaw) * (thickness / 2 + 0.008), 0.005, -Math.sin(yaw) * side * (inset + length / 2) + Math.cos(yaw) * (thickness / 2 + 0.008)]}>
                {PLACES[place].name}
              </Text>
            </Suspense>
          </group>
        )
      })}
    </group>
  )
}

// ------------------------------------------------------------ oak and greenhouse

function Greenhouse({ open, onVisit }: { open: boolean; onVisit: (place: PlaceId, open?: boolean) => void }) {
  const valley = useValley()
  const door = useRef<Group>(null)
  const canopy = useRef<Group>(null)
  const lantern = useRef<PointLight>(null)
  const hover = useRef(false)
  const press = pressable(
    () => onVisit('greenhouse', true),
    (over) => (hover.current = over),
  )

  useFrame((_, delta) => {
    const t = air.time.value
    // Hovering leaves the door ajar; opening the journal swings it wide.
    if (door.current) door.current.rotation.y = MathUtils.damp(door.current.rotation.y, open ? GREENHOUSE.swing : hover.current ? -0.32 : 0, open ? 2.4 : 5, delta)
    if (canopy.current) canopy.current.rotation.set(Math.sin(t * 0.31) * 0.007 * air.wind.value, 0, Math.sin(t * 0.43 + 1) * 0.009 * air.wind.value)
    if (lantern.current) lantern.current.intensity = (air.night.value * 26 + (hover.current || open ? 9 : 0)) * (0.92 + Math.sin(t * 7.1) * 0.04)
  })

  return (
    <>
      <group position={groundAt(SITES.oak, -0.25)}>
        <Piece name="Oak_Trunk" {...press} />
        <group ref={canopy} position={valley.pivot.Oak_Canopy}>
          <Piece name="Oak_Canopy" hung />
        </group>
      </group>
      <group position={groundAt(SITES.greenhouse, 0.04)} rotation-y={GREENHOUSE.yaw}>
        <Piece name="Greenhouse_Stone" {...press} />
        <Piece name="Greenhouse_Glow" material={glow} />
        <Piece name="Greenhouse_Glass" material={glass} {...press} />
        <group ref={door} position={valley.pivot.Greenhouse_Door}>
          <Piece name="Greenhouse_Door" hung {...press} />
          <Piece name="Greenhouse_DoorGlass" material={glass} hung />
        </group>
        <pointLight ref={lantern} position={GREENHOUSE.lantern as [number, number, number]} color="#ffd596" intensity={0} distance={16} decay={1.5} />
      </group>
    </>
  )
}

// ------------------------------------------------------------ station and train

interface TrainProps {
  /** One name per car, in order from the engine. */
  cars: readonly string[]
  hot: Hot | null
  /** Show every car's tag, not only the hovered one: the camera is at the station. */
  labelled: boolean
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
}

function Car({ index, name, isHot, labelled, onHot, onProject }: { index: number; name: string; isHot: boolean; labelled: boolean; onHot: TrainProps['onHot']; onProject: TrainProps['onProject'] }) {
  const valley = useValley()
  const body = useRef<Group>(null)
  const part = `Train_Car${index + 1}`
  const press = pressable(
    () => onProject(index),
    (over) => onHot(over ? { kind: 'car', index } : null),
  )

  // A hovered car lifts on its springs and rattles, as if someone had just stepped aboard.
  useFrame((_, delta) => {
    if (!body.current) return
    body.current.position.y = MathUtils.damp(body.current.position.y, isHot ? 0.13 : 0, 9, delta)
    body.current.rotation.z = isHot ? Math.sin(air.time.value * 11) * 0.012 : MathUtils.damp(body.current.rotation.z, 0, 9, delta)
  })

  return (
    <group position={valley.pivot[part]}>
      <group ref={body}>
        <Piece name={part} hung {...press} />
        <Piece name={`${part}_Glow`} material={glow} hung {...press} />
      </group>
      <Tag position={TRAIN.tag} shown={isHot || labelled}>
        <span className="tag-note">car {index + 1}</span>
        {name}
      </Tag>
    </group>
  )
}

function Station({ cars, hot, labelled, onHot, onProject, onVisit }: TrainProps & { onVisit: (place: PlaceId) => void }) {
  const lamp = useRef<PointLight>(null)
  const press = pressable(() => onVisit('station'))
  useFrame(() => {
    if (lamp.current) lamp.current.intensity = air.night.value * 30
  })
  const { sign } = STATION
  const [lampX, lampY, lampZ] = STATION.lamps[0]

  return (
    <>
      <group position={[SITES.platform[0], TRACK_Y, SITES.platform[1]]}>
        <Piece name="Station_Platform" {...press} />
        <Piece name="Station_Glow" material={glow} />
        <Suspense fallback={null}>
          {[1, -1].map((face) => (
            <Text key={face} font={displayFace} fontSize={0.3} letterSpacing={0.04} color={LETTERING.day} anchorX="center" anchorY="middle" position={[sign.at[0] - 0.05 + face * 0.043, sign.at[1], sign.at[2]]} rotation-y={(face * Math.PI) / 2}>
              Clover Halt
            </Text>
          ))}
        </Suspense>
        <pointLight ref={lamp} position={[lampX + 0.4, lampY - 0.2, lampZ]} color="#ffd596" intensity={0} distance={18} decay={1.5} />
      </group>
      <group position={[TRACK_X, TRACK_Y, SITES.train[1]]}>
        <Piece name="Train_Loco" {...press} />
        <Piece name="Train_Loco_Glow" material={glow} />
        <Smoke position={[TRAIN.chimney[0], TRAIN.chimney[1], TRAIN.loco + TRAIN.chimney[2]]} rise={4.6} size={0.4} />
        {cars.map((name, index) => (
          <Car key={index} index={index} name={name} isHot={hot?.kind === 'car' && hot.index === index} labelled={labelled} onHot={onHot} onProject={onProject} />
        ))}
      </group>
    </>
  )
}

// ------------------------------------------------------------ windmills

export interface Mill {
  name: string
  /** The colour of this mill's cap. */
  accent: string
  skills: readonly string[]
}

function Windmill({ index, mill, isHot, reducedMotion, onHot, onVisit }: { index: number; mill: Mill; isHot: boolean; reducedMotion: boolean; onHot: (hot: Hot | null) => void; onVisit: (place: PlaceId, open?: boolean) => void }) {
  const valley = useValley()
  const sails = useRef<Group>(null)
  const speed = useRef(0.5)
  const warmth = useRef(0)
  const [x, z, size, turn] = WINDMILLS[index]
  const cap = useMemo(() => paintedToon({ color: mill.accent }), [mill.accent])
  const ember = useMemo(() => new Color(mill.accent), [mill.accent])
  const press = pressable(
    () => onVisit('windmills', true),
    (over) => onHot(over ? { kind: 'mill', index } : null),
  )

  useFrame((_, delta) => {
    // Every mill turns at its own lazy pace; the one being looked at spins up, and rain brings wind for all of them.
    const idle = (0.42 + index * 0.09) * (1 + air.rain.value * 1.4) * (reducedMotion ? 0.25 : 1)
    speed.current = MathUtils.damp(speed.current, isHot ? (reducedMotion ? 1.2 : 5.4) : idle, 2.6, delta)
    if (sails.current) sails.current.rotation.z -= speed.current * delta
    warmth.current = MathUtils.damp(warmth.current, isHot ? 0.42 : 0, 6, delta)
    cap.emissive.copy(ember).multiplyScalar(warmth.current)
  })

  return (
    <group position={groundAt([x, z], -0.05)} rotation-y={turn} scale={size}>
      <Piece name="Windmill_Body" {...press} />
      <Piece name="Windmill_Cap" material={cap} {...press} />
      <Piece name="Windmill_Glow" material={glow} />
      <group ref={sails} position={valley.pivot.Windmill_Sails} rotation-z={index * 0.5}>
        <Piece name="Windmill_Sails" hung {...press} />
      </group>
      <Tag position={[0, WINDMILL.top + 1.5, 0]} shown={isHot}>
        {mill.name}
        <span className="tag-list">{mill.skills.join(' · ')}</span>
      </Tag>
    </group>
  )
}

// ------------------------------------------------------------ postbox and campfire

export interface Charm {
  label: string
  href: string
}

interface PostboxProps {
  open: boolean
  charms: readonly Charm[]
  hot: Hot | null
  ink: string
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

function Postbox({ open, charms, hot, ink, reducedMotion, onHot, onVisit }: PostboxProps) {
  const valley = useValley()
  const wings = useRef<(Group | null)[]>([])
  const hanging = useRef<(Group | null)[]>([])
  const letter = useRef<Group>(null)
  const out = useRef(0)
  const hover = useRef(false)
  const press = pressable(
    () => onVisit('postbox', true),
    (over) => (hover.current = over),
  )
  const { width, height } = POSTBOX.charm

  useFrame((_, delta) => {
    const t = air.time.value
    const calm = reducedMotion ? 0.3 : 1
    // The wings idle like a resting bird's and beat when there is post to deliver.
    const eager = hover.current || open
    const beat = 0.06 + (Math.sin(t * (eager ? 9 : 1.7)) * 0.5 + 0.5) * (eager ? 0.55 : 0.14) * calm
    if (wings.current[0]) wings.current[0].rotation.z = beat
    if (wings.current[1]) wings.current[1].rotation.z = -beat

    // The letter slides out of the slot, then stands up to be read.
    out.current = MathUtils.damp(out.current, open ? 1 : 0, 3.2, delta)
    if (letter.current) {
      const slide = Math.min(1, out.current * 2)
      const lift = Math.max(0, out.current * 2 - 1)
      const [sx, sy, sz] = POSTBOX.slot
      letter.current.position.set(sx, sy + lift * 0.5, sz + slide * 0.72)
      letter.current.rotation.x = lift * 1.1 + Math.sin(t * 2.3) * 0.03 * lift
    }

    hanging.current.forEach((charm, i) => {
      if (!charm) return
      const swing = hot?.kind === 'charm' && hot.index === i ? 0.2 : 0.055 * calm * air.wind.value
      charm.rotation.z = Math.sin(t * (1.2 + i * 0.17) + i * 1.9) * swing
    })
  })

  return (
    <group position={groundAt(SITES.postbox)} rotation-y={POSTBOX.yaw} scale={POSTBOX.scale}>
      <Piece name="Postbox_Body" {...press} />
      {(['Postbox_WingR', 'Postbox_WingL'] as const).map((name, i) => (
        <group
          key={name}
          ref={(group) => {
            wings.current[i] = group
          }}
          position={valley.pivot[name]}
        >
          <Piece name={name} hung {...press} />
        </group>
      ))}
      <group ref={letter} position={valley.pivot.Postbox_Letter}>
        <Piece name="Postbox_Letter" hung {...press} />
      </group>
      {charms.slice(0, POSTBOX.charms.length).map(({ label, href }, i) => {
        const name = `Postbox_Charm${i + 1}`
        const { drop } = POSTBOX.charms[i]
        return (
          <group
            key={label}
            ref={(group) => {
              hanging.current[i] = group
            }}
            position={valley.pivot[name]}
          >
            <Piece
              name={name}
              hung
              {...pressable(
                () => window.open(href, '_blank', 'noopener,noreferrer'),
                (over) => onHot(over ? { kind: 'charm', index: i } : null),
              )}
            />
            <Suspense fallback={null}>
              <Text font={handFace} fontSize={0.098} maxWidth={width - 0.04} textAlign="center" lineHeight={1} color={ink} anchorX="center" anchorY="middle" position={[0, -drop - height / 2 - 0.01, 0.03]} rotation-z={(i % 2 ? 1 : -1) * 0.03}>
                {label}
              </Text>
            </Suspense>
          </group>
        )
      })}
    </group>
  )
}

function Campfire() {
  const valley = useValley()
  const flames = useRef<(Group | null)[]>([])
  const light = useRef<PointLight>(null)

  useFrame(() => {
    const t = air.time.value
    const damp = 1 - air.rain.value * 0.45
    flames.current.forEach((tongue, i) => {
      if (!tongue) return
      const flicker = 0.8 + Math.sin(t * (9 + i * 3.1) + i) * 0.14 + Math.sin(t * (17 + i * 2.3)) * 0.08
      tongue.scale.set(damp * (1.05 - flicker * 0.15), damp * flicker, damp * (1.05 - flicker * 0.15))
      tongue.rotation.z = Math.sin(t * 5 + i * 2) * 0.09
    })
    if (light.current) light.current.intensity = (5 + air.night.value * 34) * damp * (0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 23.7) * 0.05)
  })

  return (
    <group position={groundAt(SITES.campfire, 0.02)}>
      <Piece name="Camp_Static" />
      {[1, 2, 3].map((n, i) => (
        <group
          key={n}
          ref={(group) => {
            flames.current[i] = group
          }}
          position={valley.pivot[`Camp_Flame${n}`]}
        >
          <Piece name={`Camp_Flame${n}`} material={flame} hung />
        </group>
      ))}
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ffae5c" intensity={5} distance={15} decay={1.6} />
      <Smoke position={[0, 0.9, 0]} rise={3} size={0.16} colour="#e6dfd2" puffs={5} life={6} />
    </group>
  )
}

// ------------------------------------------------------------ waymarks

const WAYMARKS: Partial<Record<PlaceId, readonly [number, number, number]>> = {
  hill: groundAt(SITES.signpost, 5),
  greenhouse: groundAt(SITES.greenhouse, 6.2),
  station: [SITES.platform[0], 7, SITES.platform[1]],
  windmills: groundAt(SITES.meadow, 8.2),
  postbox: groundAt(SITES.postbox, 4),
}

/** Paper labels pinned over the landmarks, each a real button: the map's own way of getting about. */
function Waymarks({ place, shown, onVisit }: { place: PlaceId; shown: boolean; onVisit: (place: PlaceId, open?: boolean) => void }) {
  return (
    <>
      {/* All five stay mounted; the one for the place you are standing at is only hidden. */}
      {TRAIL.map((id) => (
        <Html key={id} position={WAYMARKS[id] as [number, number, number]} center zIndexRange={[30, 10]} wrapperClass="tag-anchor">
          <button type="button" className="tag waymark" data-shown={shown && id !== place} tabIndex={shown && id !== place ? 0 : -1} onClick={() => onVisit(id, true)}>
            {PLACES[id].name}
            <span className="tag-note">{PLACES[id].role}</span>
          </button>
        </Html>
      ))}
    </>
  )
}

// ------------------------------------------------------------ everything

export interface LandmarksProps {
  place: PlaceId
  /** The place's own panel is open: the greenhouse door swings, the letter slides out. */
  open: boolean
  /** The camera is free, so the waymark labels are worth showing. */
  roaming: boolean
  night: boolean
  hot: Hot | null
  cars: readonly string[]
  mills: readonly Mill[]
  charms: readonly Charm[]
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onProject: (index: number) => void
}

/** The five landmarks, standing where the map says they stand. */
export function Landmarks({ place, open, roaming, night, hot, cars, mills, charms, reducedMotion, onHot, onVisit, onProject }: LandmarksProps) {
  const ink = night ? LETTERING.night : LETTERING.day
  return (
    <>
      <Signpost ink={ink} onVisit={(to) => onVisit(to, true)} />
      <Greenhouse open={open && place === 'greenhouse'} onVisit={onVisit} />
      <Station cars={cars} hot={hot} labelled={place === 'station' && roaming} onHot={onHot} onProject={onProject} onVisit={onVisit} />
      {mills.slice(0, WINDMILLS.length).map((mill, index) => (
        <Windmill key={mill.name} index={index} mill={mill} isHot={hot?.kind === 'mill' && hot.index === index} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
      ))}
      <Postbox open={open && place === 'postbox'} charms={charms} hot={hot} ink={ink} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
      <Campfire />
      <Waymarks place={place} shown={roaming && !open} onVisit={onVisit} />
    </>
  )
}
