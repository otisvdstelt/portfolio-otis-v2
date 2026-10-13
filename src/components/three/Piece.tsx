import { Outlines } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Vector3, type Material, type Object3D } from 'three'
import { tags } from '../../lib/tags'
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

const pin = new Vector3()

/**
 * A hand-written paper tag pinned to something in the world. The paper itself
 * is a page element (see ui/Tags.tsx); this holds its place in the scene and
 * moves it there every frame.
 */
export function Tag({ position, shown, children }: { position: readonly [number, number, number]; shown: boolean; children: ReactNode }) {
  const id = useId()
  const anchor = useRef<Object3D>(null)

  useEffect(() => tags.write(id, shown, children), [id, shown, children])
  useEffect(() => () => tags.remove(id), [id])

  useFrame(({ camera, size }) => {
    const paper = tags.element(id)
    if (!paper || !anchor.current) return
    anchor.current.getWorldPosition(pin).project(camera)
    // Behind the camera a point still projects on to the screen, mirrored: keep the tag off it.
    paper.style.visibility = pin.z > 1 ? 'hidden' : ''
    paper.style.transform = `translate3d(${((pin.x + 1) / 2) * size.width}px, ${((1 - pin.y) / 2) * size.height}px, 0) translate(-50%, -50%)`
  })

  return <object3D ref={anchor} position={position as [number, number, number]} />
}
