import type { ThreeEvent } from '@react-three/fiber'

/** A hand cursor, and a click that ignores the end of a drag */
export function pressable(onPress: () => void, onHover?: (over: boolean) => void) {
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
