import bodyFace from '@fontsource/klee-one/files/klee-one-latin-400-normal.woff?url'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import scriptFace from '@fontsource/homemade-apple/files/homemade-apple-latin-400-normal.woff?url'
import { BOOK } from '../../lib/world/spec'
import { Color, Vector3 } from 'three'

/** An eternal golden hour, low in the south west for long shadows through the windows */
export const SUN_DIRECTION = new Vector3(-0.52, 0.5, 0.693).normalize()

/** The colours of the hour, blended every frame and read by sky, sea and paper */
export const look = {
  skyTop: new Color(),
  skyHorizon: new Color(),
  skyGlow: new Color(),
  far: new Color(),
  water: new Color(),
  paper: new Color(),
  ink: new Color(),
  /** The sky colour at the horizon, so the sea runs into it without a seam */
  fog: new Color(),
  /** What drifts in the air, gold dust or white down */
  dust: new Color('#ffd98a'),
  /** How much of the sea is mirror, 0 to 1 */
  mirror: 0.78,
  /** 1 where the sea is shallow and clear */
  shallow: 0,
}

/** Air and meadow are drawn by the main camera alone, so the sea keeps no reflection of them */
export const MEADOW_LAYER = 2

/** The ink line round everything that stands in the world */
export const OUTLINE = { color: '#1c1917', opacity: 0.85, thickness: 0.04 }

/** Lettering on wood, dark ink by day and pale paint at night */
export const LETTERING = { day: '#2c2823', night: '#f6e9c8' }


/** The four hands, for anything written inside the world */
export const FACES = { body: bodyFace, display: displayFace, hand: handFace, script: scriptFace }
export type Face = keyof typeof FACES

/** Ink on lit paper, the same at any hour, as the lit class is in index.css */
export const PAGE_INK = { paper: '#f6ecd3', ink: '#2c2823', soft: '#5e554a', rust: '#8f4526', moss: '#3b533e', rule: '#cdbd97' }

/** The sheet lies a hair above the cut of the book, and the writing above the sheet */
export const PAGE = { sheet: BOOK.thickness / 2 + 0.0012, writing: BOOK.thickness / 2 + 0.0026 }
