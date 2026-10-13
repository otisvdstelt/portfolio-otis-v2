import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import { Suspense, useMemo, useRef } from 'react'
import { Color, MathUtils, type Group, type PointLight } from 'three'
import { air } from '../../lib/air'
import type { Hot, PlaceId } from '../../lib/places'
import { ATTIC, BAKERY, QUAY } from '../../lib/world/spec'
import { Smoke } from './Air'
import { useParts } from './assets'
import { Campfire, Postbox, type Charm } from './Camp'
import { LETTERING } from './look'
import { dry, glass, glow, paintedToon, shaft } from './materials'
import { Meadow } from './Meadow'
import { Piece, Tag } from './Piece'
import { pressable } from './press'

const CHALK = '#f3ead6'

/** The tall house's paint: wet on the roof and the walls, dry on the floors inside. */
const housePaint = paintedToon({ shelter: BAKERY.at[1] + ATTIC.floor + ATTIC.knee })

// ------------------------------------------------------------ the bakery

interface BakeryProps {
  /** The guestbook is open in the panel: the camera is over the book. */
  reading: boolean
  /** The visitor is in the shop, so the book is worth pointing out. */
  inside: boolean
  onVisit: (place: PlaceId, open?: boolean) => void
}

function Bakery({ reading, inside, onVisit }: BakeryProps) {
  const parts = useParts()
  const book = useRef<Group>(null)
  const lamp = useRef<PointLight>(null)
  const hover = useRef(false)
  const enter = pressable(() => onVisit('bakery'))
  const open = pressable(
    () => onVisit('bakery', true),
    (over) => (hover.current = over),
  )
  const { chalkboard, sign, mug, lamp: lampAt } = BAKERY

  useFrame((_, delta) => {
    // The book lifts a finger's width off the counter under the pointer: it wants to be opened.
    if (book.current) book.current.position.y = MathUtils.damp(book.current.position.y, parts.pivot.Bakery_Book[1] + (hover.current && !reading ? 0.035 : 0), 10, delta)
    if (lamp.current) lamp.current.intensity = (5 + air.night.value * 20) * (0.96 + Math.sin(air.time.value * 6.3) * 0.03)
  })

  return (
    <group position={BAKERY.at as [number, number, number]}>
      <Piece name="Bakery_Shell" material={housePaint} {...enter} />
      <Piece name="Bakery_Glass" material={glass} line={0} castShadow={false} />
      <Piece name="Bakery_Shell_Glow" material={glow} line={0} castShadow={false} />
      <Piece name="Bakery_Inside" material={dry} line={0.011} />
      <Piece name="Bakery_Case" material={glass} line={0} castShadow={false} />
      <Piece name="Bakery_Glow" material={glow} line={0} castShadow={false} />
      <Piece name="Bakery_Shaft" material={shaft} line={0} castShadow={false} />
      <group ref={book} position={parts.pivot.Bakery_Book}>
        <Piece name="Bakery_Book" material={dry} hung line={0.005} {...open} />
      </group>
      <Tag position={[BAKERY.book[0], BAKERY.book[1] + 0.42, BAKERY.book[2]]} shown={inside && !reading}>
        the guestbook
        <span className="tag-note">open it</span>
      </Tag>

      {/* Steam off the tea, and woodsmoke from the oven's chimney. */}
      <Smoke position={[mug[0], mug[1] + 0.17, mug[2]]} rise={0.42} size={0.03} colour="#ffffff" puffs={4} life={3.6} />
      <Smoke position={[BAKERY.chimney[0], ATTIC.floor + ATTIC.knee + ATTIC.rise + 0.6, BAKERY.chimney[1]]} rise={5} size={0.4} colour="#e9e1d4" puffs={5} life={7} opacity={0.45} />

      <Suspense fallback={null}>
        <Text font={handFace} fontSize={0.17} lineHeight={1.25} textAlign="center" color={CHALK} anchorX="center" anchorY="middle" maxWidth={chalkboard.width - 0.2} position={[chalkboard.at[0], chalkboard.at[1], chalkboard.at[2] + 0.165]}>
          {'fresh today\nsourdough, rye\ncinnamon knots\ntea, always'}
        </Text>
        <Text font={displayFace} fontSize={0.36} letterSpacing={0.04} color={LETTERING.night} anchorX="center" anchorY="middle" position={[sign.at[0], sign.at[1], sign.at[2] + 0.012]}>
          The Warm Crust
        </Text>
      </Suspense>
      <pointLight ref={lamp} position={lampAt as [number, number, number]} color="#ffcf8f" intensity={5} distance={11} decay={1.6} />
    </group>
  )
}

// ------------------------------------------------------------ the attic

/** One kind of skill, and the artefacts that stand for it. */
export interface Cluster {
  name: string
  /** The colour of the cluster's glow. */
  accent: string
  skills: readonly string[]
}

interface ArtefactsProps {
  index: number
  cluster: Cluster
  isHot: boolean
  /** Give the cluster its own coloured light. Left off on modest hardware. */
  lit: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

const SUBS = ['a', 'b', 'c'] as const

/** One cluster of artefacts. Chosen, its pieces rise a little out of step, turn slowly, and glow. */
function Artefacts({ index, cluster, isHot, lit, reducedMotion, onHot, onVisit }: ArtefactsProps) {
  const parts = useParts()
  const pieces = useRef<(Group | null)[]>([])
  const aura = useRef<PointLight>(null)
  const heat = useRef(0)
  const paint = useMemo(() => paintedToon({ shelter: 1e6 }), [])
  const accent = useMemo(() => new Color(cluster.accent), [cluster.accent])
  const press = pressable(
    () => onVisit('attic', true),
    (over) => onHot(over ? { kind: 'cluster', index } : null),
  )
  const rest = ATTIC.clusters[index]

  useFrame((_, delta) => {
    const t = air.time.value
    heat.current = MathUtils.damp(heat.current, isHot ? 1 : 0, 5, delta)
    const h = heat.current
    pieces.current.forEach((piece, k) => {
      if (!piece) return
      const bob = reducedMotion ? 0 : Math.sin(t * 1.7 + k * 2.1 + index) * 0.03
      piece.position.y = rest.at[1] + h * (0.16 + k * 0.05 + bob)
      piece.rotation.y = reducedMotion ? 0 : Math.sin(t * 0.8 + k * 1.9) * 0.1 * h
    })
    paint.emissive.copy(accent).multiplyScalar(h * 0.42)
    if (aura.current) aura.current.intensity = h * 9 * (0.9 + Math.sin(t * 5) * 0.06)
  })

  return (
    <>
      {SUBS.map((sub, k) => {
        const name = `Attic_C${index + 1}${sub}`
        return (
          <group
            key={sub}
            ref={(group) => {
              pieces.current[k] = group
            }}
            position={parts.pivot[name]}
          >
            <Piece name={name} material={paint} hung line={0.009} {...press} />
          </group>
        )
      })}
      {lit && <pointLight ref={aura} position={[rest.tag[0], rest.tag[1] - 0.45, rest.tag[2] + 0.5]} color={cluster.accent} intensity={0} distance={5.5} decay={1.5} />}
      <Tag position={rest.tag} shown={isHot}>
        {cluster.name}
        <span className="tag-list">{cluster.skills.join(' · ')}</span>
      </Tag>
    </>
  )
}

interface AtticProps {
  hot: Hot | null
  clusters: readonly Cluster[]
  lit: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

function Attic({ hot, clusters, lit, reducedMotion, onHot, onVisit }: AtticProps) {
  const lantern = useRef<PointLight>(null)
  useFrame(() => {
    if (lantern.current) lantern.current.intensity = (6 + air.night.value * 5) * (0.94 + Math.sin(air.time.value * 7.1) * 0.04)
  })
  return (
    <group position={[BAKERY.at[0], BAKERY.at[1] + ATTIC.floor, BAKERY.at[2]]}>
      <Piece name="Attic_Room" material={dry} line={0.009} />
      <Piece name="Attic_Glow" material={glow} line={0} castShadow={false} />
      <pointLight ref={lantern} position={ATTIC.lantern as [number, number, number]} color="#ffc47a" intensity={6} distance={10} decay={1.4} />
      {clusters.slice(0, ATTIC.clusters.length).map((cluster, index) => (
        <Artefacts key={cluster.name} index={index} cluster={cluster} isHot={hot?.kind === 'cluster' && hot.index === index} lit={lit} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
      ))}
    </group>
  )
}

// ------------------------------------------------------------ the town

export interface TownProps {
  place: PlaceId
  /** The place's own panel is open. */
  open: boolean
  night: boolean
  hot: Hot | null
  clusters: readonly Cluster[]
  charms: readonly Charm[]
  /** How many tufts of grass to plant. */
  tufts: number
  /** Spend light on the extras: a coloured glow per cluster, shadows from the campfire. */
  lavish: boolean
  reducedMotion: boolean
  onHot: (hot: Hot | null) => void
  onVisit: (place: PlaceId, open?: boolean) => void
}

/** The coast at the end of the line: the quay, the houses, the bakery with the attic over it, and the campfire on the hill. */
export function Town({ place, open, night, hot, clusters, charms, tufts, lavish, reducedMotion, onHot, onVisit }: TownProps) {
  const { sign } = QUAY
  const ink = night ? LETTERING.night : LETTERING.day
  return (
    <>
      <Piece name="Land" line={0} castShadow={false} />
      <Piece name="Town_Quay" line={0.03} />
      <Piece name="Town_Houses" />
      <Piece name="Town_Glow" material={glow} line={0} castShadow={false} />
      <Piece name="Town_Trees" />
      <Suspense fallback={null}>
        <Text font={displayFace} fontSize={0.36} letterSpacing={0.04} color={LETTERING.day} anchorX="center" anchorY="middle" position={[sign.at[0], sign.at[1], sign.at[2] + 0.012]}>
          Crumb Harbour
        </Text>
      </Suspense>
      <Meadow tufts={tufts} />

      <Bakery reading={open && place === 'bakery'} inside={place === 'bakery'} onVisit={onVisit} />
      <Attic hot={hot} clusters={clusters} lit={lavish} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
      <Postbox open={open && place === 'campfire'} charms={charms} hot={hot} ink={ink} reducedMotion={reducedMotion} onHot={onHot} onVisit={onVisit} />
      <Campfire shadows={lavish} />
    </>
  )
}
