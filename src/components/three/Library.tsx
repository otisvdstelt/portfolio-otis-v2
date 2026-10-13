import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import bodyFace from '@fontsource/klee-one/files/klee-one-latin-400-normal.woff?url'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import { Suspense, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { MathUtils, type Group, type MeshBasicMaterial } from 'three'
import type { Leaves } from '../../hooks/useProjects'
import { air } from '../../lib/air'
import type { Hot } from '../../lib/places'
import { LEATHERS } from '../../lib/world/palette'
import { BOOK, CAR, LIBRARY } from '../../lib/world/spec'
import { useParts } from './assets'
import { dry, glow, paintedToon } from './materials'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

const QUARTER = Math.PI / 2
const { width: W, height: H, thickness: T } = BOOK
const FLOOR = CAR.floor

/** A project as it stands on the ledge: what is tooled on its cover, and what its tag says. */
export interface Volume {
  title: string
  kind: string
}

// ------------------------------------------------------------ writing on the page

// Ink on lit paper: the same at any hour, like the paper sheets on the page (see `.lit` in index.css).
const INK = '#2c2823'
const SOFT = '#5e554a'
const RUST = '#8f4526'
const MOSS = '#3b533e'
const RULE = '#cdbd97'
const BLEND = ['#b8623b', '#3b533e', '#e3b659', '#a3c1ad', '#5e554a']
const FACES = { body: bodyFace, display: displayFace, hand: handFace }

/** Both pages lie level with the cut of the book. Everything written on them is laid a hair above that. */
const SHEET = T / 2 + 0.0012
const WRITING = T / 2 + 0.0026

// Where the writing goes on each page: left edge, width, and the top line. (The book's own x runs across the page, its z down it.)
const COLUMN = 0.32
const LEAF = [W - 0.022, H - 0.036] as const
const LEFT = -1.5 * W + 0.058
const RIGHT = -W / 2 + 0.042
const HEAD = -(H - 0.036) / 2 + 0.042
const FOOT = (H - 0.036) / 2 - 0.036

/** A web address as it would be written on a luggage label: no scheme, no trailing slash. */
const asPath = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

interface InkProps {
  /** 0 nothing on the page yet, 1 fully written. */
  ink: RefObject<number>
  /** Across and down the page, from the book's own middle. */
  at: readonly [x: number, z: number]
  size: number
  face?: keyof typeof FACES
  colour?: string
  width?: number
  leading?: number
  anchor?: 'left' | 'right'
  from?: 'top' | 'bottom'
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
  children: ReactNode
}

/** A line or a paragraph written on a page of the open book. It comes up out of the paper as the book finishes opening. */
function Ink({ ink, at, size, face = 'body', colour = INK, width = COLUMN, leading = 1.3, anchor = 'left', from = 'top', children, ...events }: InkProps) {
  const text = useRef<{ fillOpacity: number; visible: boolean } | null>(null)
  useFrame(() => {
    if (!text.current) return
    text.current.fillOpacity = ink.current
    text.current.visible = ink.current > 0.01
  })
  return (
    <Text ref={text as never} font={FACES[face]} fontSize={size} color={colour} maxWidth={width} lineHeight={leading} overflowWrap="break-word" anchorX={anchor} anchorY={from} fillOpacity={0} position={[at[0], WRITING, at[1]]} rotation={[-QUARTER, 0, 0]} {...events}>
      {children}
    </Text>
  )
}

/** A flat patch of colour on the page: a sheet of paper, a ruled line, a brush stroke. */
function Wash({ ink, at, size, colour, strength = 1, lift = WRITING }: { ink: RefObject<number>; at: readonly [x: number, z: number]; size: readonly [number, number]; colour: string; strength?: number; lift?: number }) {
  const paint = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    if (paint.current) paint.current.opacity = ink.current * strength
  })
  return (
    <mesh position={[at[0], lift, at[1]]} rotation={[-QUARTER, 0, 0]}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial ref={paint} color={colour} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

interface PagesProps {
  ink: RefObject<number>
  leaves: Leaves
  onClose: () => void
  onAsk: () => void
}

/** The two pages of an open book: on the left what the project is, on the right what GitHub says about it just now. */
function Pages({ ink, leaves, onClose, onAsk }: PagesProps) {
  const visit = (url: string) => pressable(() => window.open(url, '_blank', 'noopener,noreferrer'))
  // A long title takes two lines, and everything under it moves down to make room.
  const titleLines = leaves.title.length > 13 ? 2 : 1
  const under = HEAD + 0.03 + titleLines * 0.041
  // What it is built with follows the summary, however long that runs.
  const built = under + 0.034 + Math.ceil(leaves.summary.length / 44) * 0.0218 + 0.03
  const figures = leaves.figures
  const rows = 'rows' in figures ? figures.rows : []
  const shares = 'languages' in figures ? figures.languages.filter(({ share }) => share >= 0.01).slice(0, 5) : []
  const total = shares.reduce((sum, { share }) => sum + share, 0) || 1
  const table = HEAD + (shares.length > 0 ? 0.082 : 0.04)
  const where = table + Math.max(rows.length, 2) * 0.03 + 0.02
  let stroke = RIGHT

  return (
    <>
      {/* The paper itself, lit as if a lamp were held over it, so the pages read at night as they do by day. */}
      <Wash ink={ink} at={[-W + 0.009, 0]} size={LEAF} colour="#f6ecd3" lift={SHEET} />
      <Wash ink={ink} at={[-0.009, 0]} size={LEAF} colour="#f6ecd3" lift={SHEET} />

      <Ink ink={ink} at={[LEFT, HEAD]} size={0.014} face="hand" colour={RUST}>
        {leaves.volume}
      </Ink>
      <Ink ink={ink} at={[LEFT, HEAD + 0.024]} size={0.038} face="display" leading={1.06}>
        {leaves.title}
      </Ink>
      <Ink ink={ink} at={[LEFT, under]} size={0.0152} face="hand" colour={SOFT}>
        {leaves.kind}
      </Ink>
      <Ink ink={ink} at={[LEFT, under + 0.034]} size={0.0136} leading={1.6}>
        {leaves.summary}
      </Ink>
      <Ink ink={ink} at={[LEFT, built]} size={0.0156} face="display" colour={RUST}>
        Built with
      </Ink>
      <Ink ink={ink} at={[LEFT, built + 0.025]} size={0.0146} face="hand" leading={1.36}>
        {leaves.stack}
      </Ink>

      <Ink ink={ink} at={[RIGHT, HEAD]} size={0.0156} face="display" colour={RUST}>
        From GitHub, just now
      </Ink>
      {'waiting' in figures && (
        <Ink ink={ink} at={[RIGHT, HEAD + 0.036]} size={0.0146} face="hand" colour={SOFT}>
          Asking GitHub for the figures.
        </Ink>
      )}
      {'trouble' in figures && (
        <>
          <Ink ink={ink} at={[RIGHT, HEAD + 0.036]} size={0.0136} leading={1.5}>
            {figures.trouble}
          </Ink>
          <Ink ink={ink} at={[RIGHT, HEAD + 0.096]} size={0.0146} face="hand" colour={MOSS} {...pressable(onAsk)}>
            ask GitHub again
          </Ink>
        </>
      )}
      {/* What the code is made of: one brush stroke, a length of each colour for each language, largest first. */}
      {shares.map(({ name, share }, i) => {
        const length = (share / total) * COLUMN
        const middle = stroke + length / 2
        stroke += length
        return <Wash key={name} ink={ink} at={[middle, HEAD + 0.04]} size={[length, 0.009]} colour={BLEND[i]} />
      })}
      {shares.length > 0 && (
        <Ink ink={ink} at={[RIGHT, HEAD + 0.052]} size={0.0126} face="hand" colour={SOFT}>
          {shares.map(({ name, share }) => `${name} ${Math.max(1, Math.round(share * 100))}%`).join('   ')}
        </Ink>
      )}
      {rows.map(([label, value], i) => (
        <group key={label}>
          <Wash ink={ink} at={[RIGHT + COLUMN / 2, table + i * 0.03]} size={[COLUMN, 0.0007]} colour={RULE} />
          <Ink ink={ink} at={[RIGHT, table + 0.007 + i * 0.03]} size={0.0132} face="hand" colour={SOFT}>
            {label}
          </Ink>
          <Ink ink={ink} at={[RIGHT + 0.125, table + 0.007 + i * 0.03]} size={0.0132}>
            {value}
          </Ink>
        </group>
      ))}

      <Ink ink={ink} at={[RIGHT, where]} size={0.0156} face="display" colour={RUST}>
        Where to find it
      </Ink>
      <Wash ink={ink} at={[RIGHT + COLUMN / 2, where + 0.028]} size={[COLUMN, 0.0007]} colour={RULE} />
      <Ink ink={ink} at={[RIGHT, where + 0.035]} size={0.0132} face="hand" colour={SOFT}>
        Live
      </Ink>
      {leaves.live ? (
        <Ink ink={ink} at={[RIGHT + 0.062, where + 0.035]} size={0.0128} colour={MOSS} width={COLUMN - 0.062} {...visit(leaves.live)}>
          {asPath(leaves.live)}
        </Ink>
      ) : (
        <Ink ink={ink} at={[RIGHT + 0.062, where + 0.035]} size={0.0132} face="hand" colour={SOFT}>
          {'waiting' in figures ? 'looking it up' : 'no live address given'}
        </Ink>
      )}
      <Wash ink={ink} at={[RIGHT + COLUMN / 2, where + 0.058]} size={[COLUMN, 0.0007]} colour={RULE} />
      <Ink ink={ink} at={[RIGHT, where + 0.065]} size={0.0132} face="hand" colour={SOFT}>
        Source
      </Ink>
      <Ink ink={ink} at={[RIGHT + 0.062, where + 0.065]} size={0.0128} colour={MOSS} width={COLUMN - 0.062} leading={1.35} {...visit(leaves.source)}>
        {asPath(leaves.source)}
      </Ink>

      <Ink ink={ink} at={[RIGHT + COLUMN, FOOT]} size={0.0146} face="hand" colour={SOFT} anchor="right" from="bottom" {...pressable(onClose)}>
        close the book
      </Ink>
    </>
  )
}

// ------------------------------------------------------------ the books

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

interface BookProps {
  index: number
  title: string
  kind: string
  /** Taken down and being read. */
  chosen: boolean
  isHot: boolean
  /** The visitor is in the car and nothing else is open, so the book answers to the pointer. */
  live: boolean
  /** What is written in it; null until its pages are wanted. */
  leaves: Leaves | null
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
  onClose: () => void
  onAsk: () => void
}

/**
 * One project: a great leather-bound book, face out on the ledge. Chosen, it
 * leaves the shelf, floats across the aisle to the reader, tips back and
 * opens itself in the middle; then its pages are written.
 */
function Book({ index, title, kind, chosen, isHot, live, leaves, reducedMotion, onHot, onProject, onClose, onAsk }: BookProps) {
  const parts = useParts()
  const book = useRef<Group>(null)
  const front = useRef<Group>(null)
  const pose = useRef({ out: 0, open: 0, lift: 0 })
  const ink = useRef(0)
  const leather = useMemo(() => paintedToon({ color: LEATHERS[index % LEATHERS.length], shelter: 1e6 }), [index])
  // The pages stay in the book until it is back on its shelf (adjusted during render, not in an effect).
  const [away, setAway] = useState(chosen)
  if (chosen && !away) setAway(true)
  const [written, setWritten] = useState(leaves)
  if (leaves && leaves !== written) setWritten(leaves)

  // On the ledge it leans back against the baize; in the reader's hands it is tipped toward their eye.
  const shelf = useMemo(() => ({ x: LIBRARY.berths[index % LIBRARY.berths.length], y: FLOOR + LIBRARY.ledge + 0.006 + (H / 2) * Math.cos(LIBRARY.lean), z: -1.125, turn: QUARTER - LIBRARY.lean }), [index])
  const hands = { x: LIBRARY.lectern[0] + W / 2, y: FLOOR + LIBRARY.lectern[1], z: LIBRARY.lectern[2], turn: QUARTER - LIBRARY.tip }

  useFrame((_, delta) => {
    if (!book.current || !front.current) return
    const p = pose.current
    const dt = Math.min(delta, 0.1)
    const t = air.time.value
    // It does not start back for the shelf until it has closed, and does not open until it has all but arrived.
    p.out = MathUtils.damp(p.out, chosen || p.open > 0.08 ? 1 : 0, 3.4, dt)
    p.open = MathUtils.damp(p.open, chosen && p.out > 0.93 ? 1 : 0, chosen ? 3.6 : 6, dt)
    p.lift = MathUtils.damp(p.lift, isHot && !chosen ? 1 : 0, 9, dt)
    const e = smoother(Math.min(1, p.out))
    const arc = Math.sin(e * Math.PI)
    const afloat = reducedMotion ? 0 : e
    book.current.position.set(
      MathUtils.lerp(shelf.x, hands.x, e),
      // Pointed at, it rises a little off the ledge and tips forward to be looked at.
      MathUtils.lerp(shelf.y, hands.y, e) + p.lift * 0.03 + arc * 0.06 + Math.sin(t * 1.1 + index) * 0.006 * afloat,
      MathUtils.lerp(shelf.z, hands.z, e) + p.lift * 0.05 + arc * 0.2,
    )
    book.current.rotation.set(MathUtils.lerp(shelf.turn, hands.turn, e) + p.lift * 0.1, Math.sin(e * Math.PI) * -0.5 + Math.sin(t * 0.8 + index * 2) * 0.012 * afloat, Math.sin(t * 0.9 + index) * 0.01 * afloat)
    front.current.rotation.z = Math.PI * smoother(Math.min(1, p.open))
    ink.current = MathUtils.clamp((p.open - 0.8) / 0.19, 0, 1)
    if (!chosen && away && p.out < 0.02) setAway(false)
  })

  // On the ledge it can be picked; open, a press on it is only a press on a page, and must not count as a press on nothing.
  const press = chosen ? { onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation() } : live ? pressable(() => onProject(index), (over) => onHot(over ? { kind: 'tome', index } : null)) : {}

  return (
    <>
      <group ref={book} position={[shelf.x, shelf.y, shelf.z]} rotation-x={shelf.turn}>
        <Piece name="Book_Back" material={leather} line={0.006} {...press} />
        <Piece name="Book_LeavesRight" material={dry} line={0.003} {...press} />
        <group ref={front} position={parts.pivot.Book_Front}>
          <Piece name="Book_Front" material={leather} hung line={0.006} {...press} />
          <Piece name="Book_LeavesLeft" material={dry} hung line={0.003} {...press} />
          <Suspense fallback={null}>
            <Text font={displayFace} fontSize={0.05} maxWidth={W - 0.13} textAlign="center" lineHeight={1.08} color="#f0d48a" anchorX="center" anchorY="middle" position={[W / 2, T / 2 + 0.005, -0.03]} rotation={[-QUARTER, 0, 0]}>
              {title}
            </Text>
          </Suspense>
        </group>
        {away && written && (
          <Suspense fallback={null}>
            <Pages ink={ink} leaves={written} onClose={onClose} onAsk={onAsk} />
          </Suspense>
        )}
      </group>
      <Tag position={[shelf.x, shelf.y + H / 2 + 0.12, shelf.z + 0.12]} shown={isHot && !chosen}>
        {title}
        <span className="tag-note">{kind}</span>
      </Tag>
    </>
  )
}

export interface LibraryCarProps {
  volumes: readonly Volume[]
  /** Which book is being read, or null. */
  chosen: number | null
  /** What is written in the chosen book. */
  leaves: Leaves | null
  hot: Hot | null
  /** The visitor has arrived in the car. */
  here: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onProject: (index: number) => void
  onClose: () => void
  /** Ask GitHub for the chosen book's figures again. */
  onAsk: () => void
}

/**
 * What makes the middle car of the train the library: the bookcase where the
 * north benches were, the low shelves under the windows either side of it,
 * and the four projects standing face out on its ledge. It is drawn inside
 * the car, so it rides with the train and the sea goes by outside.
 */
export function LibraryCar({ volumes, chosen, leaves, hot, here, reducedMotion, onHot, onProject, onClose, onAsk }: LibraryCarProps) {
  return (
    <>
      <Piece name="Library_Case" material={dry} line={0.006} />
      <Piece name="Library_Fittings" material={dry} line={0.007} />
      <Piece name="Library_Glow" material={glow} line={0} castShadow={false} />
      {volumes.slice(0, LIBRARY.berths.length).map(({ title, kind }, index) => (
        <Book
          key={title}
          index={index}
          title={title}
          kind={kind}
          chosen={chosen === index}
          isHot={hot?.kind === 'tome' && hot.index === index}
          live={here && chosen === null}
          leaves={chosen === index ? leaves : null}
          reducedMotion={reducedMotion}
          onHot={onHot}
          onProject={onProject}
          onClose={onClose}
          onAsk={onAsk}
        />
      ))}
    </>
  )
}
