import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import { Suspense, useRef } from 'react'
import { MathUtils, type Group, type PointLight } from 'three'
import { air } from '../../lib/air'
import type { Hot, PlaceId } from '../../lib/places'
import { CAMPFIRE, POSTBOX } from '../../lib/world/spec'
import { groundAt } from '../../lib/world/terrain'
import { Smoke } from './Air'
import { useParts } from './assets'
import { flame } from './materials'
import { Piece } from './Piece'
import { pressable } from './press'

// The clearing on the hill behind the town: a winged copper postbox, the
// wooden charms hanging from it, and the campfire it stands beside.

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

export function Postbox({ open, charms, hot, ink, reducedMotion, onHot, onVisit }: PostboxProps) {
  const parts = useParts()
  const wings = useRef<(Group | null)[]>([])
  const hanging = useRef<(Group | null)[]>([])
  const letter = useRef<Group>(null)
  const out = useRef(0)
  const hover = useRef(false)
  const press = pressable(
    () => onVisit('campfire', true),
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
    <group position={groundAt(POSTBOX.at[0], POSTBOX.at[1])} rotation-y={POSTBOX.yaw} scale={POSTBOX.scale}>
      <Piece name="Postbox_Body" line={0.018} {...press} />
      {(['Postbox_WingR', 'Postbox_WingL'] as const).map((name, i) => (
        <group
          key={name}
          ref={(group) => {
            wings.current[i] = group
          }}
          position={parts.pivot[name]}
        >
          <Piece name={name} hung line={0.012} {...press} />
        </group>
      ))}
      <group ref={letter} position={parts.pivot.Postbox_Letter}>
        <Piece name="Postbox_Letter" hung line={0.006} {...press} />
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
            position={parts.pivot[name]}
          >
            <Piece
              name={name}
              hung
              line={0.01}
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

/** The fire itself: three tongues of flame, the light they throw, and a thread of smoke. `shadows` lets that light cast them. */
export function Campfire({ shadows }: { shadows: boolean }) {
  const parts = useParts()
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
    if (light.current) {
      // The light moves as the flames do: that is what makes the shadows dance.
      light.current.intensity = (3 + air.night.value * 11) * damp * (0.85 + Math.sin(t * 11) * 0.08 + Math.sin(t * 23.7) * 0.05)
      light.current.position.x = Math.sin(t * 7.1) * 0.05
      light.current.position.z = Math.cos(t * 5.3) * 0.05
    }
  })

  return (
    <group position={groundAt(CAMPFIRE.at[0], CAMPFIRE.at[1], 0.02)}>
      <Piece name="Camp_Static" line={0.018} />
      {[1, 2, 3].map((n, i) => (
        <group
          key={n}
          ref={(group) => {
            flames.current[i] = group
          }}
          position={parts.pivot[`Camp_Flame${n}`]}
        >
          <Piece name={`Camp_Flame${n}`} material={flame} hung line={0} castShadow={false} />
        </group>
      ))}
      {/* Low and close to the ground, so everything round it throws a long shadow outward across the moss. */}
      <pointLight ref={light} position={[0, 0.7, 0]} color="#ffa24f" intensity={3} distance={26} decay={1.2} castShadow={shadows} shadow-mapSize={[512, 512]} shadow-camera-near={0.3} shadow-camera-far={22} shadow-bias={-0.004} />
      <Smoke position={[0, 1.0, 0]} rise={3.2} size={0.1} colour="#cfc6b8" puffs={5} life={6} opacity={0.32} />
    </group>
  )
}
