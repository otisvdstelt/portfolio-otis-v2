import { Instance, Instances, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, type Group, type PointLight } from 'three'
import { air } from '../../lib/air'
import type { Hot, PlaceId } from '../../lib/places'
import { PLAQUE, PLAQUES, SIGNPOST, STOP, TOWER } from '../../lib/world/spec'
import { seeded, shoreHeight, SITES, TOWER_FLOOR } from '../../lib/world/terrain'
import { Smoke } from './Air'
import { useParts } from './assets'
import { LETTERING, MEADOW_LAYER } from './look'
import { dry, glass, glow, paintedToon, shaft } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

// ------------------------------------------------------------ the clocktower archive

interface TowerProps {
  /** The visitor is in the room, so the sketchpad is worth pointing out. */
  here: boolean
  /** The sketchpad is being read. */
  reading: boolean
  reducedMotion: boolean
  onVisit: (place: PlaceId, open?: boolean) => void
}

/** The archive behind the clock face. The hands keep the visitor's own time; from in here they are seen from behind. */
export function Tower({ here, reading, reducedMotion, onVisit }: TowerProps) {
  const parts = useParts()
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const pendulum = useRef<Group>(null)
  const gears = useRef<(Group | null)[]>([])
  const pad = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)
  const hover = useRef(false)
  const open = pressable(
    () => onVisit('tower', true),
    (over) => (hover.current = over),
  )
  const [tx, ty, tz] = TOWER.table

  useFrame((_, delta) => {
    const t = air.time.value
    const now = new Date()
    const minutes = now.getMinutes() + now.getSeconds() / 60
    if (minute.current) minute.current.rotation.z = -(minutes / 60) * Math.PI * 2
    if (hour.current) hour.current.rotation.z = -(((now.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2
    if (pendulum.current) pendulum.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 1.9) * 0.2
    gears.current.forEach((wheel, i) => {
      // Meshed wheels turn against one another, the small ones faster.
      if (wheel && !reducedMotion) wheel.rotation.z += (delta * 0.35 * (i % 2 ? -1 : 1)) / TOWER.gears[i][3]
    })
    if (pad.current) pad.current.position.y = MathUtils.damp(pad.current.position.y, parts.pivot.Tower_Pad[1] + (hover.current && !reading ? 0.04 : 0), 10, delta)
    if (lamp.current) lamp.current.intensity = (4 + air.night.value * 16) * (0.96 + Math.sin(t * 6.3) * 0.03)
  })

  return (
    <group position={[SITES.tower[0], TOWER_FLOOR, SITES.tower[1]]} rotation-y={TOWER.yaw}>
      <Piece name="Tower_Room" material={dry} line={0.018} />
      <Piece name="Tower_Glass" material={glass} line={0} castShadow={false} />
      <Piece name="Tower_Glow" material={glow} line={0} castShadow={false} />
      <Piece name="Tower_Beams" material={shaft} line={0} castShadow={false} />
      <group ref={hour} position={parts.pivot.Tower_Hour}>
        <Piece name="Tower_Hour" hung line={0.02} />
      </group>
      <group ref={minute} position={parts.pivot.Tower_Minute}>
        <Piece name="Tower_Minute" hung line={0.02} />
      </group>
      <group ref={pendulum} position={parts.pivot.Tower_Pendulum}>
        <Piece name="Tower_Pendulum" material={dry} hung line={0.02} />
      </group>
      {TOWER.gears.map(([x, y, z, size], i) => (
        <group
          key={i}
          ref={(group) => {
            gears.current[i] = group
          }}
          position={[x, y, z]}
          scale={size}
        >
          <Piece name="Tower_Gear" material={dry} hung line={0.03} />
        </group>
      ))}
      <group ref={pad} position={parts.pivot.Tower_Pad} rotation-y={Math.PI + 0.12}>
        <Piece name="Tower_Pad" material={dry} hung line={0.006} {...open} />
      </group>
      <Tag position={[TOWER.pad[0], TOWER.pad[1] + 0.55, TOWER.pad[2]]} shown={here && !reading}>
        the sketchpad
        <span className="tag-note">open it</span>
      </Tag>
      {/* Tea going cold on the corner of the table. */}
      <Smoke position={[tx + 1.45, ty + 0.17, tz - 0.6]} rise={0.42} size={0.03} colour="#ffffff" puffs={4} life={3.6} />
      <pointLight ref={lamp} position={[TOWER.lamp[0], TOWER.lamp[1] - 0.6, TOWER.lamp[2]]} color="#ffcf8f" intensity={4} distance={11} decay={1.6} />
    </group>
  )
}

// ------------------------------------------------------------ the coastal signpost

/** One of the signpost's plaques: a core division of the craft, and the time of day its direction belongs to. */
export interface Division {
  /** The few words painted on the plaque itself. */
  plaque: string
  /** The colour the sky leans toward while this plaque is chosen. */
  sky: string
}

interface CoastProps {
  divisions: readonly Division[]
  /** The plaque being pointed at or pinned, or -1. */
  chosen: number
  /** How many dandelion clocks to sow. */
  seeds: number
  night: boolean
  onHot: (hot: Hot | null) => void
  /** A plaque was pressed: keep its sheet out. */
  onPlaque: (index: number) => void
}

/** The quietest scene: a signpost, a field of dandelion clocks, the sea. Each plaque turns the visitor's head and the hour with it. */
export function Coast({ divisions, chosen, seeds, night, onHot, onPlaque }: CoastProps) {
  const parts = useParts()
  const plaques = useRef<(Group | null)[]>([])
  const knoll = shoreHeight(SIGNPOST.at[0], SIGNPOST.at[1])
  const skyColour = useMemo(() => new Color(), [])
  const { length, thickness, inset } = PLAQUE

  // Nobody is left to ask the sky for anything once the visitor has gone.
  useEffect(
    () => () => {
      air.tint.amount = 0
    },
    [],
  )

  // Dandelion clocks, sown thickest where the visitor stands and thinning toward the water.
  const field = useMemo(() => {
    const random = seeded(77)
    const sown: { position: [number, number, number]; turn: number; size: number }[] = []
    for (let tries = 0; tries < seeds * 6 && sown.length < seeds; tries++) {
      const x = (random() * 2 - 1) * 26
      const z = -2.5 + random() * random() * 12
      const y = shoreHeight(x, z)
      // None on the post's own foot, and none right under the visitor's nose.
      if (y < 0.4 || Math.hypot(x - SIGNPOST.at[0], z) < 0.7 || z > 8.2) continue
      sown.push({ position: [x, y - 0.02, z], turn: random() * 6, size: 0.7 + random() * 0.7 })
    }
    return sown
  }, [seeds])
  const down = useMemo(() => paintedToon({ sway: true }), [])

  useFrame((_, delta) => {
    // Ask the sky to lean toward the chosen plaque's hour; with none chosen, let it come back.
    const division = divisions[chosen]
    if (division) {
      skyColour.set(division.sky)
      air.tint.r = skyColour.r
      air.tint.g = skyColour.g
      air.tint.b = skyColour.b
    }
    air.tint.amount = division ? 1 : 0
    plaques.current.forEach((plaque, i) => {
      if (plaque) plaque.rotation.x = MathUtils.damp(plaque.rotation.x, chosen === i ? -0.14 : 0, 9, delta)
    })
  })

  return (
    <group position={[SITES.signpost[0], 0, SITES.signpost[1]]}>
      <Piece name="Coast_Land" line={0} castShadow={false} />
      <Piece name="Coast_Rocks" line={0.02} />
      <Instances key={field.length} limit={field.length} range={field.length} frames={1} geometry={parts.geometry.Dandelion} material={down} layers={MEADOW_LAYER} frustumCulled={false} receiveShadow>
        {field.map(({ position, turn, size }, i) => (
          <Instance key={i} position={position} rotation={[0, turn, 0]} scale={size} />
        ))}
      </Instances>
      <group position={[SIGNPOST.at[0], knoll, SIGNPOST.at[1]]} rotation-y={-0.08}>
        <Piece name="Signpost_Post" line={0.025} />
        {PLAQUES.slice(0, divisions.length).map(({ side, yaw }, i) => {
          const name = `Signpost_Plaque${i + 1}`
          // The middle of the board's face, turned the way the modeller turned the board: tipped, then swung.
          const tip = side * (0.02 + i * 0.012)
          const out = side * (inset + length / 2 + 0.1)
          const along = out * Math.cos(tip)
          const face = thickness / 2 + 0.02
          return (
            <group
              key={name}
              ref={(group) => {
                plaques.current[i] = group
              }}
              position={parts.pivot[name]}
            >
              <Piece name={name} hung line={0.02} {...pressable(() => onPlaque(i), (over) => onHot(over ? { kind: 'plaque', index: i } : null))} />
              <Suspense fallback={null}>
                <Text
                  font={displayFace}
                  fontSize={0.19}
                  color={night ? LETTERING.night : LETTERING.day}
                  anchorX="center"
                  anchorY="middle"
                  rotation={[0, yaw, tip]}
                  position={[along * Math.cos(yaw) + face * Math.sin(yaw), out * Math.sin(tip), -along * Math.sin(yaw) + face * Math.cos(yaw)]}
                >
                  {divisions[i].plaque}
                </Text>
              </Suspense>
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ------------------------------------------------------------ the bus stop shelter

/** A plank on the stop's pole: a name, and where it leads. */
export interface Plank {
  label: string
  href: string
}

interface BusStopProps {
  /** The visitor is at the stop. */
  here: boolean
  /** The notepad is out: the receiver is off its hook. */
  open: boolean
  planks: readonly Plank[]
  hot: Hot | null
  /** Let the lantern cast shadows. Left off on modest hardware. */
  lavish: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

/** The bus stop at the edge of the sea, always at night: a lantern over a bench, and a telephone box lit from inside. */
export function BusStop({ here, open, planks, hot, lavish, reducedMotion, onHot, onVisit }: BusStopProps) {
  const parts = useParts()
  const receiver = useRef<Group>(null)
  const boards = useRef<(Group | null)[]>([])
  const lantern = useRef<PointLight>(null)
  const booth = useRef<PointLight>(null)
  const lifted = useRef(0)
  const hover = useRef(false)
  const ring = pressable(
    () => onVisit('busstop', true),
    (over) => (hover.current = over),
  )
  const G = STOP.ground
  const [bx, bz] = STOP.booth
  const [px, pz] = STOP.pole
  const hook = parts.pivot.Stop_Receiver

  useFrame((_, delta) => {
    const t = air.time.value
    // Lifted, the receiver drifts up off its hook and hangs in the air, turning a little, as if someone were holding it.
    lifted.current = MathUtils.damp(lifted.current, open ? 1 : hover.current ? 0.2 : 0, 3, delta)
    if (receiver.current) {
      const l = lifted.current
      const drift = reducedMotion ? 0 : Math.sin(t * 1.4) * 0.03 * l
      receiver.current.position.set(hook[0] - l * 0.05, hook[1] + l * 0.34 + drift, hook[2] + l * 0.3)
      receiver.current.rotation.set(l * 0.5, l * 0.6, l * 0.9 + drift)
    }
    const dark = 0.25 + air.night.value * 0.75
    if (lantern.current) lantern.current.intensity = 11 * dark * (0.93 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 17) * 0.02)
    if (booth.current) booth.current.intensity = 5 * dark * (0.97 + Math.sin(t * 31) * Math.sin(t * 2.3) * 0.05)
    boards.current.forEach((board, i) => {
      if (board) board.rotation.z = MathUtils.damp(board.rotation.z, hot?.kind === 'plank' && hot.index === i ? 0.07 : 0, 8, delta)
    })
  })

  return (
    <group position={[SITES.busstop[0], 0, SITES.busstop[1]]}>
      <Piece name="Stop_Ground" line={0} castShadow={false} />
      <Piece name="Stop_Shelter" line={0.022} />
      <Piece name="Stop_Glow" material={glow} line={0} castShadow={false} />
      <Piece name="Stop_Booth" line={0.022} {...ring} />
      <Piece name="Stop_Panes" material={glow} line={0} castShadow={false} {...ring} />
      <group ref={receiver} position={hook}>
        <Piece name="Stop_Receiver" hung line={0.008} {...ring} />
      </group>
      <Piece name="Stop_Pole" line={0.02} />
      {planks.slice(0, STOP.planks.length).map(({ label, href }, i) => {
        const name = `Stop_Plank${i + 1}`
        return (
          <group
            key={label}
            ref={(group) => {
              boards.current[i] = group
            }}
            position={parts.pivot[name]}
          >
            <Piece
              name={name}
              hung
              line={0.012}
              {...pressable(
                () => window.open(href, '_blank', 'noopener,noreferrer'),
                (over) => onHot(over ? { kind: 'plank', index: i } : null),
              )}
            />
            <Suspense fallback={null}>
              <Text font={handFace} fontSize={0.18} color={LETTERING.night} anchorX="center" anchorY="middle" position={[0.52, 0, 0.044]} rotation-z={(i % 2 ? 1 : -1) * 0.035}>
                {label}
              </Text>
            </Suspense>
          </group>
        )
      })}
      <Suspense fallback={null}>
        <Text font={displayFace} fontSize={0.15} letterSpacing={0.12} color={LETTERING.day} anchorX="center" anchorY="middle" position={[bx + STOP.boothSign[0], G + STOP.boothSign[1], bz + STOP.boothSign[2] + 0.115]}>
          TELEPHONE
        </Text>
        <Text font={displayFace} fontSize={0.19} letterSpacing={0.06} color={LETTERING.day} anchorX="center" anchorY="middle" position={[px + 0.05, G + 2.78, pz + 0.118]}>
          BUS
        </Text>
        <Text font={handFace} fontSize={0.1} lineHeight={1.3} textAlign="center" color={LETTERING.day} anchorX="center" anchorY="middle" maxWidth={1} position={[STOP.notice[0], G + STOP.notice[1], STOP.notice[2] + 0.012]}>
          {'No. 7\nthe last one\nleft at dusk'}
        </Text>
      </Suspense>
      <Tag position={[bx, G + 3.4, bz]} shown={here && !open}>
        the telephone
        <span className="tag-note">pick it up</span>
      </Tag>
      {/* The lantern's pool of light on the bench, and the box's own glow on the gravel. */}
      <pointLight ref={lantern} position={[STOP.lantern[0], G + STOP.lantern[1] - 0.16, STOP.lantern[2]]} color="#ffcc78" intensity={8} distance={15} decay={1.5} castShadow={lavish} shadow-mapSize={[512, 512]} shadow-camera-near={0.2} shadow-camera-far={15} shadow-bias={-0.004} />
      <pointLight ref={booth} position={[bx, G + 1.9, bz + 0.1]} color="#ffdc9a" intensity={4} distance={9} decay={1.6} />
    </group>
  )
}
