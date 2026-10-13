import { Color, Vector3 } from 'three'

/** Golden hour: the sun sits low in the south-west, so shadows run long toward the north-east. */
export const SUN_DIRECTION = new Vector3(-0.72, 0.4, 0.56).normalize()

/** The colours of the hour, blended every frame by the atmosphere and read by the sky, the lake and the paper. */
export const look = {
  skyTop: new Color(),
  skyHorizon: new Color(),
  skyGlow: new Color(),
  far: new Color(),
  water: new Color(),
  paper: new Color(),
  ink: new Color(),
  fog: new Color(),
}

/** The lens: a long one on a wide screen, a wider one where the screen is tall. */
export const FOV = { wide: 40, tall: 58 }

/** Grass, flowers and things in the air are drawn only by the main camera: the lake does not reflect them and the pointer passes through. */
export const MEADOW_LAYER = 2
