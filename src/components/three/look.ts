import bodyFace from '@fontsource/klee-one/files/klee-one-latin-400-normal.woff?url'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import scriptFace from '@fontsource/homemade-apple/files/homemade-apple-latin-400-normal.woff?url'
import { BOOK } from '../../lib/world/spec'
import { Color, Vector3 } from 'three'

/**
 * Eternal golden hour: the sun stands thirty degrees up in the south-west.
 * Low enough for long shadows, and to come in through the south windows
 * of the train and lie across whatever the car is fitted with.
 */
export const SUN_DIRECTION = new Vector3(-0.52, 0.5, 0.693).normalize()

/** The colours of the hour and of the scene, blended every frame by the atmosphere and read by the sky, the sea and the paper. */
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
  /** What drifts in the air: gold dust, white dandelion down. */
  dust: new Color('#ffd98a'),
  /** How much of the sea is mirror, 0..1. */
  mirror: 0.78,
  /** 1 where the sea is shallow and clear. */
  shallow: 0,
}

/** Things in the air and the meadow are drawn only by the main camera: the sea does not reflect them and the pointer passes through. */
export const MEADOW_LAYER = 2

/** The ink line round everything that stands in the world, as the brief gives it. */
export const OUTLINE = { color: '#1c1917', opacity: 0.85, thickness: 0.04 }

/** Lettering painted on wood: dark ink by day, pale paint that still reads by lantern light at night. */
export const LETTERING = { day: '#2c2823', night: '#f6e9c8' }


/** The page's four hands, for anything written inside the world. */
export const FACES = { body: bodyFace, display: displayFace, hand: handFace, script: scriptFace }
export type Face = keyof typeof FACES

/** Ink on lit paper: the same at any hour, like the paper sheets on the page (see `.lit` in index.css). */
export const PAGE_INK = { paper: '#f6ecd3', ink: '#2c2823', soft: '#5e554a', rust: '#8f4526', moss: '#3b533e', rule: '#cdbd97' }

/** The pages of an open book lie level with its cut. The sheet of lit paper is laid a hair above that, and the writing a hair above the sheet. */
export const PAGE = { sheet: BOOK.thickness / 2 + 0.0012, writing: BOOK.thickness / 2 + 0.0026 }
