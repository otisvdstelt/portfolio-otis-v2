import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef, useState, type ReactNode, type RefObject } from 'react'
import type { MeshBasicMaterial } from 'three'
import { FACES, PAGE, PAGE_INK, type Face } from './look'
import { pressable } from './press'

const QUARTER = Math.PI / 2

interface InkProps {
  /** 0 nothing on the page yet, 1 fully written */
  ink: RefObject<number>
  /** Across and down the page, from the middle of the book */
  at: readonly [x: number, z: number]
  size: number
  face?: Face
  colour?: string
  width?: number
  leading?: number
  anchor?: 'left' | 'right'
  from?: 'top' | 'bottom'
  /** Called when the words have been set, with the block they came to */
  onSet?: (height: number) => void
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
  children: ReactNode
}

/** A line written on a page, coming up out of the paper as ink goes to 1 */
export function Ink({ ink, at, size, face = 'body', colour = PAGE_INK.ink, width, leading = 1.3, anchor = 'left', from = 'top', onSet, children, ...events }: InkProps) {
  const text = useRef<{ fillOpacity: number; visible: boolean } | null>(null)
  useFrame(() => {
    if (!text.current) return
    text.current.fillOpacity = ink.current
    text.current.visible = ink.current > 0.01
  })
  return (
    <Text
      ref={text as never}
      font={FACES[face]}
      fontSize={size}
      color={colour}
      maxWidth={width}
      lineHeight={leading}
      overflowWrap="break-word"
      anchorX={anchor}
      anchorY={from}
      fillOpacity={0}
      renderOrder={3}
      position={[at[0], PAGE.writing, at[1]]}
      rotation={[-QUARTER, 0, 0]}
      onSync={
        onSet &&
        ((set: { textRenderInfo?: { blockBounds: readonly number[] } }) => {
          const bounds = set.textRenderInfo?.blockBounds
          if (bounds) onSet(bounds[3] - bounds[1])
        })
      }
      {...events}
    >
      {children}
    </Text>
  )
}

interface WashProps {
  ink: RefObject<number>
  at: readonly [x: number, z: number]
  size: readonly [number, number]
  colour: string
  strength?: number
  lift?: number
}

/** A flat patch of colour, the sheet itself, a ruled line or a brush stroke */
export function Wash({ ink, at, size, colour, strength = 1, lift = PAGE.writing }: WashProps) {
  const paint = useRef<MeshBasicMaterial>(null)
  useFrame(() => {
    if (paint.current) paint.current.opacity = ink.current * strength
  })
  return (
    <mesh position={[at[0], lift, at[1]]} rotation={[-QUARTER, 0, 0]} renderOrder={lift < PAGE.writing ? 1 : 2}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial ref={paint} color={colour} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** One thing in a column of writing, a heading, a paragraph or an entry */
export interface Line {
  text: string
  size: number
  face?: Face
  colour?: string
  leading?: number
  /** Space left above it */
  gap?: number
  /** A word set in the margin beside it, such as a year */
  label?: string
  inset?: number
  onPress?: () => void
}

/** A column of writing, each piece measured once set and the next placed under it */
export function Column({ ink, at, width, lines }: { ink: RefObject<number>; at: readonly [x: number, z: number]; width: number; lines: readonly Line[] }) {
  const [heights, setHeights] = useState<readonly number[]>([])
  const measure = (index: number, height: number) => setHeights((before) => (Math.abs((before[index] ?? -1) - height) < 1e-5 ? before : Object.assign([...before], { [index]: height })))
  let z = at[1]
  return (
    <>
      {lines.map((line, index) => {
        z += line.gap ?? 0
        const top = z
        z += heights[index] ?? line.size * (line.leading ?? 1.3)
        const inset = line.label ? (line.inset ?? 0.05) : 0
        return (
          <group key={index}>
            {line.label && (
              <Ink ink={ink} at={[at[0], top]} size={line.size} face="hand" colour={PAGE_INK.rust} leading={line.leading}>
                {line.label}
              </Ink>
            )}
            <Ink ink={ink} at={[at[0] + inset, top]} size={line.size} face={line.face} colour={line.colour} width={width - inset} leading={line.leading} onSet={(height) => measure(index, height)} {...(line.onPress ? pressable(line.onPress) : {})}>
              {line.text}
            </Ink>
          </group>
        )
      })}
    </>
  )
}
