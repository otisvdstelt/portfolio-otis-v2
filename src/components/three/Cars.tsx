import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useMemo, useRef, type RefObject } from 'react'
import { MathUtils, type Group, type PointLight } from 'three'
import { ABOUT, DIVISIONS, LINKS, OWNER, SOON } from '../../content/site'
import { air } from '../../lib/air'
import type { Hot, PlaceId } from '../../lib/places'
import { BOOK, CAB, CAR, COMPARTMENT, MAIL } from '../../lib/world/spec'
import { Smoke } from './Air'
import { useParts } from './assets'
import { FACES, PAGE, PAGE_INK } from './look'
import { dry, glass, glow, paintedToon } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'
import { Column, Ink, Wash, type Line } from './Writing'

const QUARTER = Math.PI / 2
const FLOOR = CAR.floor
const NORTH = -CAR.halfWidth + 0.08
const { width: W, height: H } = BOOK
/** A press that is only a press on the thing itself, and must not count as a press on nothing. */
const swallow = { onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation() }

// ------------------------------------------------------------ the compartment (about)

// The journal is the modeller's book made smaller, so its pages are measured in the book's own units.
const COLUMN = 0.32
const LEAF = [W - 0.022, H - 0.036] as const
const LEFT = -1.5 * W + 0.058
const RIGHT = -W / 2 + 0.042
const HEAD = -(H - 0.036) / 2 + 0.04
const FOOT = (H - 0.036) / 2 - 0.03

const heading = (text: string, gap = 0.024): Line => ({ text, size: 0.0168, face: 'hand', colour: PAGE_INK.rust, gap })
const body = (text: string, gap = 0.008): Line => ({ text, size: 0.0128, leading: 1.55, gap })

const LEFT_PAGE: readonly Line[] = [
  { text: 'Hello, I’m Otis.', size: 0.023, face: 'script', leading: 1.5 },
  ...ABOUT.story.map((paragraph) => body(paragraph, 0.012)),
  heading('Where I’m learning'),
  body(ABOUT.education.school, 0.004),
  { text: ABOUT.education.line, size: 0.0136, face: 'hand', colour: PAGE_INK.soft, gap: 0.002 },
  heading('Away from the screen'),
  body(ABOUT.away, 0.004),
]

const RIGHT_PAGE: readonly Line[] = [
  heading('The timeline so far', 0),
  ...ABOUT.timeline.map(({ year, text }): Line => ({ text, label: year, inset: 0.054, size: 0.0128, leading: 1.5, gap: 0.01 })),
  heading('How I work'),
  { text: `“${OWNER.motto}”`, size: 0.0176, face: 'hand', leading: 1.3, gap: 0.006 },
  ...ABOUT.philosophy.map((paragraph) => body(paragraph, 0.01)),
]

/** The journal's two pages: who Otis is on the left, the timeline and the way Otis works on the right. */
function JournalPages({ ink, onClose }: { ink: RefObject<number>; onClose: () => void }) {
  return (
    <>
      <Wash ink={ink} at={[-W + 0.009, 0]} size={LEAF} colour={PAGE_INK.paper} lift={PAGE.sheet} />
      <Wash ink={ink} at={[-0.009, 0]} size={LEAF} colour={PAGE_INK.paper} lift={PAGE.sheet} />
      <Column ink={ink} at={[LEFT, HEAD]} width={COLUMN} lines={LEFT_PAGE} />
      <Column ink={ink} at={[RIGHT, HEAD]} width={COLUMN} lines={RIGHT_PAGE} />
      <Ink ink={ink} at={[RIGHT + COLUMN, FOOT]} size={0.0146} face="hand" colour={PAGE_INK.soft} anchor="right" from="bottom" {...pressable(onClose)}>
        close the journal
      </Ink>
    </>
  )
}

interface TicketProps {
  index: number
  year: string
  text: string
  isHot: boolean
  live: boolean
  onHot: (hot: Hot | null) => void
}

/** One year on the way here: a card tucked into the window frame. Pointed at, it says what the year was. */
function Ticket({ index, year, text, isHot, live, onHot }: TicketProps) {
  const ticket = useRef<Group>(null)
  const { at, y, size } = COMPARTMENT.cards
  const x = at[index] ?? at[at.length - 1] + (index - at.length + 1) * 0.24
  useFrame((_, delta) => {
    if (ticket.current) ticket.current.position.y = MathUtils.damp(ticket.current.position.y, FLOOR + y + (isHot ? 0.03 : 0), 10, delta)
  })
  const point = live ? pressable(() => onHot({ kind: 'ticket', index }), (over) => onHot(over ? { kind: 'ticket', index } : null)) : {}
  return (
    <>
      <group ref={ticket} position={[x, FLOOR + y, NORTH + 0.016]} rotation={[-0.12, 0, (index % 2 ? 1 : -1) * 0.05]} scale={size}>
        <Piece name="Ticket" hung material={dry} line={0.003} {...point} />
        <Suspense fallback={null}>
          <Text font={FACES.hand} fontSize={0.036} color={PAGE_INK.ink} anchorX="center" anchorY="middle" position={[0.018, 0.045, 0.004]}>
            {year}
          </Text>
        </Suspense>
      </group>
      <Tag position={[x, FLOOR + y + 0.27, NORTH + 0.05]} shown={isHot}>
        {year}
        <span className="tag-note">{text}</span>
      </Tag>
    </>
  )
}

export interface CompartmentProps {
  /** The visitor has arrived in the car. */
  here: boolean
  /** The journal's words are out. */
  open: boolean
  /** It is being read in the picture, from straight above. */
  reading: boolean
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
  onClose: () => void
}

/**
 * About: somebody's own corner of the middle car. Two seats face each other
 * across a table under the window post; on the table a journal lies open,
 * and what is written in it is who Otis is. The cards along the windows are
 * the stops so far.
 */
export function Compartment({ here, open, reading, hot, onHot, onVisit, onClose }: CompartmentProps) {
  const parts = useParts()
  const ink = useRef(0)
  const lamp = useRef<PointLight>(null)
  const leather = useMemo(() => paintedToon({ color: '#8a5632', shelter: 1e6 }), [])
  const [jx, jy, jz] = COMPARTMENT.journal
  const s = COMPARTMENT.scale
  const [mx, my, mz] = COMPARTMENT.mug

  useFrame((_, delta) => {
    // The writing waits for the camera to come down over the page.
    ink.current = MathUtils.damp(ink.current, reading ? 1 : 0, reading ? 1.7 : 9, delta)
    if (ink.current < 0.02 && !reading) ink.current = 0
    if (lamp.current) lamp.current.intensity = (0.08 + air.night.value * 2.6) * (0.97 + Math.sin(air.time.value * 6.1) * 0.02)
  })

  const take = open ? swallow : here ? pressable(() => onVisit('compartment', true)) : {}

  return (
    <>
      <Piece name="Compartment_Fittings" material={dry} line={0.008} />
      <Piece name="Compartment_Glow" material={glow} line={0} castShadow={false} />

      {/* The journal: the modeller's book made smaller, lying open with its hinge in the middle of the table. */}
      <group position={[jx + (W / 2) * s, FLOOR + jy + 0.002, jz]} scale={s}>
        <Piece name="Book_Back" material={leather} line={0.006} {...take} />
        <Piece name="Book_LeavesRight" material={dry} line={0.003} {...take} />
        <group position={parts.pivot.Book_Front} rotation-z={Math.PI}>
          <Piece name="Book_Front" material={leather} hung line={0.006} {...take} />
          <Piece name="Book_LeavesLeft" material={dry} hung line={0.003} {...take} />
        </group>
        <Suspense fallback={null}>
          <JournalPages ink={ink} onClose={onClose} />
        </Suspense>
      </group>
      <Tag position={[jx, FLOOR + jy + 0.3, jz]} shown={here && !open && hot === null}>
        the journal
        <span className="tag-note">read it</span>
      </Tag>

      {ABOUT.timeline.map(({ year, text }, index) => (
        <Ticket key={text} index={index} year={year} text={text} isHot={hot?.kind === 'ticket' && hot.index === index} live={here && !open} onHot={onHot} />
      ))}

      <Smoke position={[mx, FLOOR + my + 0.08, mz]} rise={0.3} size={0.022} colour="#ffffff" puffs={4} life={3.4} />
      <pointLight ref={lamp} position={[COMPARTMENT.lamp[0], FLOOR + COMPARTMENT.lamp[1], COMPARTMENT.lamp[2]]} color="#ffcf8f" intensity={0.08} distance={3.2} decay={1.6} />
    </>
  )
}

// ------------------------------------------------------------ the mail car (contact)

const CELL = (MAIL.east - MAIL.west) / MAIL.columns
const RISE = (MAIL.top - MAIL.shelf) / MAIL.rows

interface PigeonholeProps {
  index: number
  label: string
  href: string
  isHot: boolean
  live: boolean
  onHot: (hot: Hot | null) => void
}

/** A pigeonhole with a name on its brass plate. The whole hole is the link, not only the lettering. */
function Pigeonhole({ index, label, href, isHot, live, onHot }: PigeonholeProps) {
  const [column, row] = MAIL.named[index]
  const x = MAIL.west + (column + 0.5) * CELL
  const y = FLOOR + MAIL.shelf + row * RISE
  const follow = live ? pressable(() => window.open(href, '_blank', 'noopener,noreferrer'), (over) => onHot(over ? { kind: 'hole', index } : null)) : {}
  return (
    <>
      <mesh position={[x, y + RISE / 2, NORTH + MAIL.depth]} {...follow}>
        <planeGeometry args={[CELL - 0.03, RISE - 0.03]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Suspense fallback={null}>
        <Text font={FACES.display} fontSize={isHot ? 0.037 : 0.034} color="#2b2521" anchorX="center" anchorY="middle" position={[x, y, NORTH + MAIL.depth + 0.019]}>
          {label}
        </Text>
      </Suspense>
    </>
  )
}

export interface MailCarProps {
  here: boolean
  /** The card is being written. */
  open: boolean
  hot: Hot | null
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

/**
 * Contact: the travelling post office. A sorting frame of pigeonholes stands
 * over a desk; four of the holes have a name on them and are the ways to
 * find Otis elsewhere, and the card on the desk is the way to write.
 */
export function MailCar({ here, open, hot, onHot, onVisit }: MailCarProps) {
  const card = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)
  const pointed = useRef(false)
  const [cx, cy, cz] = MAIL.card

  useFrame((_, delta) => {
    if (card.current) card.current.position.y = MathUtils.damp(card.current.position.y, FLOOR + cy + (pointed.current && !open ? 0.035 : 0), 10, delta)
    if (lamp.current) lamp.current.intensity = (0.25 + air.night.value * 3.4) * (0.95 + Math.sin(air.time.value * 7.3) * 0.03 + Math.sin(air.time.value * 17) * 0.015)
  })

  const write = here && !open ? pressable(() => onVisit('mail', true), (over) => (pointed.current = over)) : {}

  return (
    <>
      <Piece name="Mail_Frame" material={dry} line={0.007} />
      <Piece name="Mail_Fittings" material={dry} line={0.006} />
      <Piece name="Mail_Glow" material={glow} line={0} castShadow={false} />
      <group ref={card} position={[cx, FLOOR + cy, cz]}>
        <Piece name="Mail_Card" hung material={dry} line={0.003} {...write} />
      </group>
      <Tag position={[cx, FLOOR + cy + 0.28, cz]} shown={here && !open && hot === null}>
        a postcard
        <span className="tag-note">write to me</span>
      </Tag>
      {LINKS.slice(0, MAIL.named.length).map(({ label, href }, index) => (
        <Pigeonhole key={label} index={index} label={label} href={href} isHot={hot?.kind === 'hole' && hot.index === index} live={here && !open} onHot={onHot} />
      ))}
      <pointLight ref={lamp} position={[MAIL.lamp[0], FLOOR + MAIL.lamp[1], MAIL.lamp[2]]} color="#ffcc78" intensity={0.7} distance={4} decay={1.6} />
    </>
  )
}

// ------------------------------------------------------------ the driver's cab (skills)

/** A cab's paint. Under its own roof it stays dry in the rain. */
const cabPaint = paintedToon({ shelter: CAR.ceiling + 0.2 })

interface ControlProps {
  index: number
  z: number
  name: string
  /** Its lever is pulled. */
  pulled: boolean
  live: boolean
  onHot: (hot: Hot | null) => void
  onLever: (index: number) => void
}

/** One division of the craft: a dial, the lever that works it, and its name on a brass plate. */
function Control({ index, z, name, pulled, live, onHot, onLever }: ControlProps) {
  const lever = useRef<Group>(null)
  const needle = useRef<Group>(null)
  const pull = useRef(0)
  useFrame((_, delta) => {
    pull.current = MathUtils.damp(pull.current, pulled ? 1 : 0, 5, delta)
    const p = pull.current
    // At rest a lever leans back toward the driver; pulled, it goes forward and its needle swings across the dial.
    if (lever.current) lever.current.rotation.z = MathUtils.lerp(0.42, -0.5, p)
    if (needle.current) needle.current.rotation.x = MathUtils.lerp(-1.75, 1.15, p * p * (3 - 2 * p)) + Math.sin(air.time.value * (5 + index)) * 0.025 * (0.3 + p)
  })
  const work = live ? pressable(() => onLever(index), (over) => onHot(over ? { kind: 'lever', index } : null)) : {}
  return (
    <>
      {/* The dial and the lever are small things to point at; this is the space round them. */}
      <mesh position={[(CAB.plate[0] + CAB.dials[0]) / 2, FLOOR + 1.04, z]} {...work}>
        <boxGeometry args={[CAB.dials[0] - CAB.plate[0], 0.42, 0.44]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={needle} position={[CAB.dials[0] - 0.046, FLOOR + CAB.dials[1], z]} rotation-x={-1.75}>
        <Piece name="Cab_Needle" hung material={dry} line={0} castShadow={false} />
      </group>
      <group ref={lever} position={[CAB.levers[0], FLOOR + CAB.levers[1], z]} rotation-z={0.42}>
        <Piece name="Cab_Lever" hung material={dry} line={0.005} />
      </group>
      <Suspense fallback={null}>
        <Text font={FACES.display} fontSize={name.length > 10 ? 0.03 : 0.036} color="#2b2521" anchorX="center" anchorY="middle" position={[CAB.plate[0] - 0.007, FLOOR + CAB.plate[1], z]} rotation={[0, -QUARTER, 0]}>
          {name}
        </Text>
      </Suspense>
    </>
  )
}

export interface CabProps {
  /** The lever being pointed at or left pulled, or -1. */
  chosen: number
  here: boolean
  onHot: (hot: Hot | null) => void
  onLever: (index: number) => void
}

/**
 * Skills: the driver's cab at the head of the train, the line running away
 * ahead over the sea. Four levers, one for each division of the craft; pull
 * one and its needle swings, and the board over the windscreen, where a
 * train says where it is going, says what that division is made of.
 */
export function Cab({ chosen, here, onHot, onLever }: CabProps) {
  const lamp = useRef<PointLight>(null)
  const division = DIVISIONS[chosen]
  const { board, front } = CAB
  useFrame(() => {
    if (lamp.current) lamp.current.intensity = 0.8 + air.night.value * 5
  })
  return (
    <>
      <Piece name="Cab_Shell" material={cabPaint} line={0.014} />
      <Piece name="Cab_Glass" material={glass} line={0} castShadow={false} />
      <Piece name="Cab_Glow" material={glow} line={0} castShadow={false} />
      {CAB.across.slice(0, DIVISIONS.length).map((z, index) => (
        <Control key={z} index={index} z={z} name={DIVISIONS[index].name} pulled={chosen === index} live={here} onHot={onHot} onLever={onLever} />
      ))}
      <Suspense fallback={null}>
        <Text font={FACES.display} fontSize={division ? 0.078 : 0.086} letterSpacing={0.02} color={PAGE_INK.ink} anchorX="center" anchorY="middle" position={[front - 0.118, FLOOR + board.y + (division ? 0.05 : 0), 0]} rotation={[0, -QUARTER, 0]}>
          {division ? division.name : 'Stillwater Line'}
        </Text>
        {division && (
          <Text font={FACES.hand} fontSize={0.052} color={PAGE_INK.rust} maxWidth={board.width - 0.1} textAlign="center" anchorX="center" anchorY="middle" position={[front - 0.118, FLOOR + board.y - 0.058, 0]} rotation={[0, -QUARTER, 0]}>
            {division.skills.length > 0 ? division.skills.join('  ·  ') : SOON}
          </Text>
        )}
      </Suspense>
      <Smoke position={[CAB.mug[0], FLOOR + CAB.mug[1] + 0.07, CAB.mug[2]]} rise={0.26} size={0.02} colour="#ffffff" puffs={3} life={3.2} />
      <pointLight ref={lamp} position={[CAB.back + 1.5, CAR.ceiling - 0.4, 0]} color="#ffe4bd" intensity={0.8} distance={6} decay={1.6} />
    </>
  )
}
