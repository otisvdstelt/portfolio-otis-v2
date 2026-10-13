import { heightAt, SITES } from './world/terrain'

/** Everywhere the camera can stand. `valley` is the wide view you get after stepping inside. */
export type PlaceId = 'hill' | 'valley' | 'greenhouse' | 'station' | 'windmills' | 'postbox'

/** The thing under the pointer, or picked from a list: a train car, a windmill or a charm. */
export interface Hot {
  kind: 'car' | 'mill' | 'charm'
  index: number
}

/** A camera position and the point it looks at. */
export interface Shot {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

export interface Place {
  /** The landmark's name, as lettered on the signpost. */
  name: string
  /** What a visitor finds there, in plain words. */
  role: string
  /** One word for the phone menu. */
  short: string
  /** The framing on a wide screen, where the camera is also free to roam. */
  view: Shot
  /** The fixed framing on a tall screen. */
  backdrop: Shot
}

const hillTop = heightAt(SITES.hill[0], SITES.hill[1])
const on = (x: number, z: number, lift: number): [number, number, number] => [x, heightAt(x, z) + lift, z]

export const PLACES: Record<PlaceId, Place> = {
  hill: {
    name: 'Home hill',
    role: 'the start',
    short: 'Home',
    view: { position: [-4.8, hillTop + 3.3, 54.8], target: [4.6, hillTop + 1.7, 12] },
    backdrop: { position: [2.2, hillTop + 3.4, 56.5], target: [3, hillTop + 0.6, 22] },
  },
  valley: {
    name: 'The valley',
    role: 'the whole map',
    short: 'Map',
    view: { position: [0.5, 9.5, 27], target: [0, 1.5, -6] },
    backdrop: { position: [0, 30, 46], target: [0, 0, -10] },
  },
  greenhouse: {
    name: 'Greenhouse',
    role: 'about me',
    short: 'About',
    view: { position: on(-14.6, 6.9, 3.4), target: on(SITES.greenhouse[0] - 0.4, SITES.greenhouse[1] - 0.4, 2.3) },
    backdrop: { position: on(-12.2, 9.4, 4.6), target: on(SITES.greenhouse[0] - 1.4, SITES.greenhouse[1] - 1.4, 4.4) },
  },
  station: {
    name: 'Station',
    role: 'projects',
    short: 'Work',
    view: { position: on(35.5, 19.5, 4.8), target: [14, 2.2, 1.5] },
    backdrop: { position: on(28.5, 23.5, 5.4), target: [14.6, 2.6, 0.5] },
  },
  windmills: {
    name: 'Windmills',
    role: 'skills',
    short: 'Skills',
    view: { position: on(0.4, -5.6, 6.2), target: on(-1.6, -30, 3.3) },
    backdrop: { position: on(-0.6, 3.5, 9.5), target: on(-1.6, -30, 3.6) },
  },
  postbox: {
    name: 'Postbox',
    role: 'contact',
    short: 'Write',
    view: { position: on(-7.1, 28.5, 3.4), target: on(SITES.postbox[0] + 0.8, SITES.postbox[1] + 1, 1.05) },
    backdrop: { position: on(-8.2, 29.4, 3.4), target: on(SITES.postbox[0] + 0.6, SITES.postbox[1] + 0.4, 2.2) },
  },
}

/** The places a visitor can ask for by name, in the order of the trail. */
export const TRAIL: readonly PlaceId[] = ['hill', 'greenhouse', 'station', 'windmills', 'postbox']

export const isPlaceId = (value: string): value is PlaceId => value in PLACES
