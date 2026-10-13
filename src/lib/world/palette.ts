// The paintbox. The page's five named colours (see src/index.css) are in here
// too, so that paper, ink, moss, mist and terracotta are the same on the HTML
// and in the painted world.
export const PAINT = {
  // The five from the brief.
  parchment: '#f7f4eb',
  ink: '#2c2823',
  moss: '#3b533e',
  mist: '#a3c1ad',
  terracotta: '#b8623b',

  // Greens.
  mossLight: '#5f8048',
  clover: '#86ae4a',
  sunlit: '#b9c75c',
  leafDeep: '#3f6a3a',
  leaf: '#6a9a43',
  leafLight: '#a2c256',
  leafGold: '#c8cf68',
  pine: '#2f5540',
  pineLight: '#4f7f58',

  // Earth, stone and timber.
  path: '#d8bd8b',
  pathEdge: '#c1a06f',
  sand: '#dbcb9f',
  cobble: '#b7ab97',
  stone: '#b9ae9c',
  stoneLight: '#d4cab6',
  stoneDark: '#8f8676',
  wood: '#8c5f3e',
  woodLight: '#b3855c',
  woodDark: '#5f4231',
  woodPale: '#cba77c',
  // Sun-bleached planks, and the dark walnut of old shop fittings.
  bleached: '#d8ccb4',
  bleachedLight: '#e9dfc9',
  bleachedDark: '#b9ab90',
  walnut: '#5a3a26',
  walnutDeep: '#3d2618',
  walnutLight: '#7a5236',
  amber: '#c98a42',
  amberDeep: '#9c642c',
  amberLight: '#e2ab5e',
  bark: '#6c4b37',
  barkLight: '#8d6548',
  leather: '#8f4e31',
  leatherDeep: '#6a3722',

  // Plaster, canvas and paper.
  plaster: '#f1e4c8',
  plasterShade: '#dccaa6',
  cream: '#f2e7ce',
  oat: '#e3d4b4',
  canvas: '#f6eedb',
  white: '#fbf8f0',

  // The train and the roofs.
  red: '#b5332c',
  redDeep: '#8a2320',
  redLight: '#cf4c3d',
  terracottaDeep: '#8c452a',
  terracottaLight: '#d98660',
  roofGrey: '#6f6a64',

  // Metal.
  copper: '#c9783e',
  copperLight: '#e4a262',
  verdigris: '#7fb8a3',
  gold: '#e3b659',
  brass: '#cf9f49',
  iron: '#3c3631',
  soot: '#2b2521',
  steel: '#8d949a',

  // The bakery.
  crust: '#d9a047',
  crustDeep: '#a8672a',
  crustLight: '#f0c878',
  flour: '#f3ead6',
  lavender: '#8f84c9',
  lavenderDeep: '#675ba6',
  chalkboard: '#33443c',
  brick: '#a8553a',
  brickLight: '#c6714f',

  // The attic's glass and paper.
  ruby: '#c2465b',
  emerald: '#3f9b6d',
  sapphire: '#4f78c8',
  honey: '#e0a03a',
  violet: '#8a62c2',
  teal: '#3fa7a0',
  rose: '#e08aa0',
  lime: '#a6c84a',
  blueprint: '#4f76ad',
  blueprintLight: '#84a5d2',
  cornflower: '#7c9fd7',
  cornflowerDeep: '#5a7fb9',
  rug: '#9a3f3a',
  dandelion: '#fbfaf2',
  boothGreen: '#3d6b5c',
  boothGreenLight: '#5d8f7c',
  wine: '#5c262b',
  wineLight: '#7b3438',

  // Sky and light.
  // Clouds at the end of the day: violet underneath, peach where the sun still reaches.
  // Clouds are painted white; the hour's light is what colours them.
  cloudShade: '#c7cde6',
  cloud: '#ffffff',
  tealTin: '#3f8f95',
  tealTinDeep: '#2c6a72',
  sunflower: '#f0b82c',
  flame: '#ffb03b',
  flameCore: '#fff0a8',
  lamp: '#ffe2a0',
  window: '#f7e6b4',
} as const

/** The colours potions come in. */
export const JEWELS = [PAINT.ruby, PAINT.emerald, PAINT.sapphire, PAINT.honey, PAINT.violet, PAINT.teal, PAINT.rose, PAINT.lime] as const

/** The leather each project's book in the library is bound in, first to last: the paint on the model and the cover on the page are the same four. */
export const LEATHERS = ['#93333a', '#2f5d48', '#34578f', '#a06c22'] as const
