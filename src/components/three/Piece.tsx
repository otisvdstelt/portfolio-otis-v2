import { Html, Outlines } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ReactNode } from 'react'
import type { Material } from 'three'
import { useParts } from './assets'
import { OUTLINE } from './look'
import { paint } from './materials'

interface PieceProps {
  name: string
  material?: Material
  /** Parts with a pivot are drawn at it unless they sit inside a group that is already there. */
  hung?: boolean
  /**
   * The weight of the inked outline, in world units. The brief's 0.04 suits
   * anything the size of a wall or a train; small things on shelves take a
   * finer pen, or they would be more line than object. 0 leaves it off.
   */
  line?: number
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  castShadow?: boolean
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
}

/** One named mesh from the baked world, cel-shaded, with its hand-drawn outline. */
export function Piece({ name, material = paint, hung = false, line = OUTLINE.thickness, position, rotation, castShadow = true, ...events }: PieceProps) {
  const parts = useParts()
  return (
    <mesh geometry={parts.geometry[name]} material={material} position={(position ?? (hung ? undefined : parts.pivot[name])) as [number, number, number] | undefined} rotation={rotation as [number, number, number] | undefined} castShadow={castShadow} receiveShadow {...events}>
      {line > 0 && <Outlines thickness={line} color={OUTLINE.color} screenspace={false} opacity={OUTLINE.opacity} transparent />}
    </mesh>
  )
}

/** A hand-written paper tag pinned to something in the world. */
export function Tag({ position, shown, children }: { position: readonly [number, number, number]; shown: boolean; children: ReactNode }) {
  return (
    <Html position={position as [number, number, number]} center pointerEvents="none" zIndexRange={[30, 10]} wrapperClass="tag-anchor">
      <div className="tag" data-shown={shown}>
        {children}
      </div>
    </Html>
  )
}
