import { Color, Vector3 } from 'three'

/**
 * Eternal golden hour: the sun stands thirty degrees up in the south-west.
 * Low enough for long shadows and peach-lit clouds, and from the south so
 * that it comes in through the bakery's shop window.
 */
export const SUN_DIRECTION = new Vector3(-0.52, 0.5, 0.693).normalize()

/** The colours of the hour, blended every frame by the atmosphere and read by the sky, the sea and the paper. */
export const look = {
  skyTop: new Color(),
  skyHorizon: new Color(),
  skyGlow: new Color(),
  far: new Color(),
  water: new Color(),
  paper: new Color(),
  ink: new Color(),
  /** The same colour as the sky at the horizon, so that the sea runs into it without a seam. */
  fog: new Color(),
}

/** Grass and things in the air are drawn only by the main camera: the sea does not reflect them and the pointer passes through. */
export const MEADOW_LAYER = 2

/** The ink line round everything that stands in the world, as the brief gives it. */
export const OUTLINE = { color: '#1c1917', opacity: 0.85, thickness: 0.04 }

/** Lettering painted on wood: dark ink by day, pale paint that still reads by lantern light at night. */
export const LETTERING = { day: '#2c2823', night: '#f6e9c8' }
