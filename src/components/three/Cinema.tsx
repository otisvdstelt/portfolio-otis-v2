import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { MathUtils, SRGBColorSpace, TextureLoader, type Group, type MeshBasicMaterial, type Texture } from 'three'
import type { Leaves } from '../../hooks/useProjects'
import { air } from '../../lib/air'
import type { Hot } from '../../lib/places'
import { LEATHERS } from '../../lib/world/palette'
import { CAR, CINEMA } from '../../lib/world/spec'
import { useParts } from './assets'
import { FACES, PAGE_INK } from './look'
import { dry, glow, paintedToon, shaft } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

const QUARTER = Math.PI / 2
const FLOOR = CAR.floor
const { screen, tins } = CINEMA
const SCREEN = { width: screen.width, height: screen.top - screen.bottom, middle: (screen.top + screen.bottom) / 2 }
/** A press that is only a press on the thing itself, and must not count as a press on nothing. */
const swallow = { onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation() }
const ramp = (from: number, to: number, x: number) => MathUtils.smoothstep(x, from, to)

/** A project as it stands in the rack: what is written on its tin, and what its tag says. */
export interface Volume {
  title: string
  kind: string
}

// ------------------------------------------------------------ what is thrown on the screen

// The screen is laid out from its middle: x to the watcher's right, y up. The picture has the left of it, the words the right.
const EDGE = SCREEN.width / 2 - 0.07
const TOP = SCREEN.height / 2 - 0.07
const PICTURE = { width: 1.16, height: 0.725 }
const FRAME = { x: -EDGE + PICTURE.width / 2, y: TOP - PICTURE.height / 2 }
const WORDS = { x: -EDGE + PICTURE.width + 0.09, width: EDGE * 2 - PICTURE.width - 0.09 }
const UNDER = TOP - PICTURE.height
const BLEND = ['#b8623b', '#3b533e', '#e3b659', '#a3c1ad', '#5e554a']
const { ink: INK, soft: SOFT, rust: RUST, moss: MOSS } = PAGE_INK

/** A web address as it would be written on a luggage label: no scheme, no trailing slash. */
const asPath = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

type Lettering = Omit<ComponentProps<typeof Text>, 'ref'> & { level: RefObject<number>; face?: keyof typeof FACES }

/** Words thrown on the screen. They are as bright as the part of the programme they belong to. */
function Thrown({ level, face = 'body', color = INK, ...text }: Lettering) {
  const words = useRef<{ fillOpacity: number; visible: boolean } | null>(null)
  useFrame(() => {
    if (!words.current) return
    words.current.fillOpacity = level.current
    words.current.visible = level.current > 0.01
  })
  return <Text ref={words as never} font={FACES[face]} color={color} anchorX="left" anchorY="top" fillOpacity={0} position-z={0.004} renderOrder={3} {...text} />
}

/** A patch of flat light on the screen: the lit sheet itself, a length of the language stroke. */
function Patch({ level, at, size, colour, lift = 0.003, order = 2 }: { level: RefObject<number>; at: readonly [number, number]; size: readonly [number, number]; colour: string; lift?: number; order?: number }) {
  const paint = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    if (paint.current) paint.current.opacity = level.current
  })
  return (
    <mesh position={[at[0], at[1], lift]} renderOrder={order}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial ref={paint} color={colour} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** A still of the project, cropped to fill its frame. Null until it has arrived, and for good if there is none. */
function useStill(url: string | null): Texture | null {
  const [still, setStill] = useState<{ url: string; texture: Texture } | null>(null)
  useEffect(() => {
    if (!url) return
    let wanted = true
    new TextureLoader().load(url, (texture) => {
      if (!wanted) return texture.dispose()
      texture.colorSpace = SRGBColorSpace
      // Cover the frame: keep the middle of whichever way the picture runs over.
      const image = texture.image as { width: number; height: number }
      const fit = image.width / image.height / (PICTURE.width / PICTURE.height)
      texture.repeat.set(fit > 1 ? 1 / fit : 1, fit > 1 ? 1 : fit)
      texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2)
      setStill({ url, texture })
    })
    return () => {
      wanted = false
    }
  }, [url])
  return still && still.url === url ? still.texture : null
}

interface ProgrammeProps {
  /** How bright the lantern is, how bright the title card is, and how bright the picture and its words are: each 0..1. */
  light: RefObject<number>
  card: RefObject<number>
  show: RefObject<number>
  leaves: Leaves
  onClose: () => void
  onAsk: () => void
}

/** One project, as the lantern shows it: a title card first, then a still of it with what there is to say beside it. */
function Programme({ light, card, show, leaves, onClose, onAsk }: ProgrammeProps) {
  const still = useStill(leaves.image)
  const picture = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    if (picture.current) picture.current.opacity = show.current
  })
  const visit = (url: string) => pressable(() => window.open(url, '_blank', 'noopener,noreferrer'))
  const figures = leaves.figures
  const shares = 'languages' in figures ? figures.languages.filter(({ share }) => share >= 0.01).slice(0, 5) : []
  const total = shares.reduce((sum, { share }) => sum + share, 0) || 1
  const worked = 'rows' in figures ? figures.rows.find(([label]) => label === 'Last worked on')?.[1] : undefined
  const titleLines = leaves.title.length > 14 ? 2 : 1
  const below = TOP - 0.05 - titleLines * 0.084
  let stroke = -EDGE

  return (
    <>
      <Patch level={light} at={[0, 0]} size={[SCREEN.width, SCREEN.height]} colour="#f7efdc" lift={0.002} order={1} />

      {/* The title card. */}
      <Thrown level={card} face="hand" color={RUST} fontSize={0.05} anchorX="center" position={[0, 0.27, 0]}>
        {leaves.volume}
      </Thrown>
      <Thrown level={card} face="display" fontSize={0.15} anchorX="center" anchorY="middle" textAlign="center" maxWidth={SCREEN.width - 0.3} lineHeight={1.05} position={[0, 0.04, 0]}>
        {leaves.title}
      </Thrown>
      <Thrown level={card} face="hand" color={SOFT} fontSize={0.056} anchorX="center" position={[0, -0.2, 0]}>
        {leaves.kind}
      </Thrown>

      {/* The picture. */}
      {still ? (
        <mesh position={[FRAME.x, FRAME.y, 0.003]} renderOrder={2}>
          <planeGeometry args={[PICTURE.width, PICTURE.height]} />
          <meshBasicMaterial ref={picture} map={still} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : (
        <Thrown level={show} face="hand" color={SOFT} fontSize={0.034} anchorX="center" anchorY="middle" position={[FRAME.x, FRAME.y, 0]}>
          {leaves.image ? 'The picture is on its way.' : 'No picture of this one yet.'}
        </Thrown>
      )}

      {/* Under it: what the code is made of, when it was last worked on, where to find it. */}
      {shares.map(({ name, share }, i) => {
        const length = (share / total) * PICTURE.width
        const middle = stroke + length / 2
        stroke += length
        return <Patch key={name} level={show} at={[middle, UNDER - 0.04]} size={[length, 0.014]} colour={BLEND[i]} />
      })}
      <Thrown level={show} face="hand" color={SOFT} fontSize={0.026} position={[-EDGE, UNDER - 0.058, 0]}>
        {'waiting' in figures ? 'Asking GitHub for the figures.' : 'trouble' in figures ? figures.trouble : `${shares.map(({ name, share }) => `${name} ${Math.max(1, Math.round(share * 100))}%`).join('   ')}${worked ? `      last worked on ${worked}` : ''}`}
      </Thrown>
      {'trouble' in figures && (
        <Thrown level={show} face="hand" color={MOSS} fontSize={0.026} anchorX="right" position={[-EDGE + PICTURE.width, UNDER - 0.058, 0]} {...pressable(onAsk)}>
          ask GitHub again
        </Thrown>
      )}
      {leaves.live && (
        <Thrown level={show} color={MOSS} fontSize={0.028} position={[-EDGE, UNDER - 0.118, 0]} {...visit(leaves.live)}>
          {asPath(leaves.live)}
        </Thrown>
      )}
      <Thrown level={show} color={MOSS} fontSize={0.028} position={[-EDGE, UNDER - 0.168, 0]} {...visit(leaves.source)}>
        {asPath(leaves.source)}
      </Thrown>

      {/* Beside it: what it is. */}
      <Thrown level={show} face="hand" color={RUST} fontSize={0.03} position={[WORDS.x, TOP, 0]}>
        {leaves.volume}
      </Thrown>
      <Thrown level={show} face="display" fontSize={0.078} maxWidth={WORDS.width} lineHeight={1.06} position={[WORDS.x, TOP - 0.044, 0]}>
        {leaves.title}
      </Thrown>
      <Thrown level={show} face="hand" color={SOFT} fontSize={0.032} position={[WORDS.x, below, 0]}>
        {leaves.kind}
      </Thrown>
      <Thrown level={show} fontSize={0.029} maxWidth={WORDS.width} lineHeight={1.55} position={[WORDS.x, below - 0.062, 0]}>
        {leaves.summary}
      </Thrown>
      <Thrown level={show} face="display" color={RUST} fontSize={0.032} anchorY="bottom" position={[WORDS.x, -TOP + 0.2, 0]}>
        Built with
      </Thrown>
      <Thrown level={show} face="hand" fontSize={0.03} maxWidth={WORDS.width} lineHeight={1.36} position={[WORDS.x, -TOP + 0.19, 0]}>
        {leaves.stack}
      </Thrown>
      <Thrown level={show} face="hand" color={SOFT} fontSize={0.03} anchorX="right" anchorY="bottom" position={[EDGE, -TOP - 0.02, 0]} {...pressable(onClose)}>
        stop the projector
      </Thrown>
    </>
  )
}

// ------------------------------------------------------------ the tins

interface TinProps {
  index: number
  /** The project in this tin, or null for a spare with nothing on its label. */
  volume: Volume | null
  chosen: boolean
  isHot: boolean
  live: boolean
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
}

/** A film tin in the rack. One with a name on its label is a project; chosen, it is the one in the lantern. */
function Tin({ index, volume, chosen, isHot, live, onHot, onProject }: TinProps) {
  const tin = useRef<Group>(null)
  const lift = useRef(0)
  const label = useMemo(() => paintedToon({ color: volume ? LEATHERS[index % LEATHERS.length] : '#b9ab90', shelter: 1e6 }), [index, volume])
  const x = tins.xs[index]
  const y = FLOOR + tins.shelf + tins.radius + 0.004
  useFrame((_, delta) => {
    lift.current = MathUtils.damp(lift.current, chosen ? 1 : isHot ? 0.45 : 0, 7, delta)
    if (!tin.current) return
    tin.current.position.y = y + lift.current * 0.11
    tin.current.rotation.x = -0.14 - lift.current * 0.1
  })
  const press = volume && live ? pressable(() => onProject(index), (over) => onHot(over ? { kind: 'tome', index } : null)) : {}
  return (
    <>
      <group ref={tin} position={[x, y, tins.z]} rotation={[-0.14, tins.turn, 0]}>
        <Piece name="Cinema_Tin" hung material={dry} line={0.005} {...press} />
        <Piece name="Cinema_Label" hung material={label} line={0} castShadow={false} {...press} />
        {volume && (
          <Suspense fallback={null}>
            <Text font={FACES.display} fontSize={0.036} maxWidth={tins.radius * 1.3} textAlign="center" lineHeight={1.05} color="#f0d48a" anchorX="center" anchorY="middle" position={[0, 0, 0.031]}>
              {volume.title}
            </Text>
          </Suspense>
        )}
      </group>
      {volume && (
        <Tag position={[x, y + tins.radius + 0.2, tins.z + 0.05]} shown={isHot && !chosen}>
          {volume.title}
          <span className="tag-note">{volume.kind}</span>
        </Tag>
      )}
    </>
  )
}

export interface CinemaProps {
  volumes: readonly Volume[]
  /** Which project is in the lantern, or null. */
  chosen: number | null
  /** What there is to say about it. */
  leaves: Leaves | null
  hot: Hot | null
  /** The visitor has arrived in the car. */
  here: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
  onClose: () => void
  /** Ask GitHub for the project's figures again. */
  onAsk: () => void
}

/**
 * Projects: the picture car. A screen hangs across the far end, a lantern
 * projector stands in the aisle, and each project is a tin of film in the
 * rack. Choose one and the house lights go down, evening falls outside, the
 * reels turn, and the project is thrown on the screen: a title card, then a
 * still of it with what there is to say beside it.
 */
export function Cinema({ volumes, chosen, leaves, hot, here, reducedMotion, onHot, onProject, onClose, onAsk }: CinemaProps) {
  const running = chosen !== null && here
  const parts = useParts()
  const reels = useRef<(Group | null)[]>([])
  // The beam has its own paint, so that it can come up and die down with the lamp.
  const beam = useMemo(() => shaft.clone(), [])
  const clock = useRef(0)
  const lamp = useRef(0)
  const light = useRef(0)
  const card = useRef(0)
  const show = useRef(0)
  // The last programme stays on the screen while the lantern dims (adjusted during render, not in an effect).
  const [shown, setShown] = useState(leaves)
  if (leaves && leaves !== shown) setShown(leaves)

  // Whoever leaves the car puts the lights back up behind them.
  useEffect(
    () => () => {
      air.house.value = 1
    },
    [],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    clock.current = running ? clock.current + dt : 0
    const t = clock.current
    // The lamp is never quite steady.
    const flicker = reducedMotion ? 1 : 0.955 + 0.045 * Math.sin(air.time.value * 31) * Math.sin(air.time.value * 7.3)
    lamp.current = MathUtils.damp(lamp.current, running ? 1 : 0, running ? 2.2 : 5, dt)
    light.current = lamp.current * flicker
    card.current = running ? ramp(0.9, 1.4, t) * (1 - ramp(3.0, 3.5, t)) : 0
    show.current = running ? ramp(3.5, 4.3, t) * flicker : MathUtils.damp(show.current, 0, 8, dt)
    air.house.value = MathUtils.damp(air.house.value, running ? 0.08 : 1, 2.4, dt)
    beam.opacity = light.current * 0.55
    beam.visible = light.current > 0.02
    if (running && !reducedMotion) {
      for (const [i, reel] of reels.current.entries()) if (reel) reel.rotation.z -= dt * (i ? 2.6 : 3.4)
    }
  })

  const lz = CINEMA.lens[2]

  return (
    <>
      <Piece name="Cinema_Fittings" material={dry} line={0.008} {...(running ? swallow : {})} />
      <Piece name="Cinema_Glow" material={glow} line={0} castShadow={false} />
      {CINEMA.reels.map(([x, y], i) => (
        <group
          key={x}
          ref={(group) => {
            reels.current[i] = group
          }}
          position={[x, FLOOR + y, lz + 0.11]}
        >
          <Piece name="Cinema_Reel" hung material={dry} line={0.004} />
        </group>
      ))}
      <mesh geometry={parts.geometry.Cinema_Beam} material={beam} />

      {tins.xs.map((x, index) => (
        <Tin key={x} index={index} volume={volumes[index] ?? null} chosen={chosen === index} isHot={hot?.kind === 'tome' && hot.index === index} live={here && chosen === null} onHot={onHot} onProject={onProject} />
      ))}

      {/* The screen's own space: its middle, facing back down the car. */}
      <group position={[screen.x - 0.008, FLOOR + SCREEN.middle, screen.z]} rotation-y={-QUARTER}>
        {shown && (
          <Suspense fallback={null}>
            <Programme light={light} card={card} show={show} leaves={shown} onClose={onClose} onAsk={onAsk} />
          </Suspense>
        )}
      </group>
    </>
  )
}
