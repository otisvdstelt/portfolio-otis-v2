// The clearing on the hill: a winged copper postbox, the charms hanging from
// it, and a campfire with a log to sit on while the letter gets written.
import type { BufferGeometry } from 'three'
import { blob, box, cone, cyl, hung, limb, part, put, roughen, type Part } from './kit.ts'
import { PAINT } from './palette.ts'
import { POSTBOX } from './spec.ts'

const QUARTER = Math.PI / 2

// ------------------------------------------------------------ postbox and campfire

/** One wing, built for the right-hand side; `side` -1 builds its mirror. */
function wing(side: 1 | -1): BufferGeometry[] {
  const pieces: BufferGeometry[] = [blob(0.13, [PAINT.copper, PAINT.copperLight], undefined, 0.1, 1, 1)]
  // Five feathers, longest on top, fanned out to the side and swept back like a bird's.
  for (let i = 0; i < 5; i++) {
    const rise = -0.32 + i * 0.2
    const length = 0.62 + i * 0.16
    const feather = limb([0, 0, 0], [Math.cos(rise) * length * side, Math.sin(rise) * length, -0.16 - i * 0.1], 0.13, 0.03, [PAINT.brass, PAINT.canvas], 5)
    pieces.push(put(feather, { scale: [1, 1, 0.35] }))
  }
  // A second, shorter row over the shoulder.
  for (let i = 0; i < 3; i++) {
    const rise = -0.1 + i * 0.24
    const feather = limb([0, 0.02, 0.03], [Math.cos(rise) * 0.5 * side, Math.sin(rise) * 0.5 + 0.02, -0.02 - i * 0.05], 0.11, 0.04, [PAINT.copperLight, PAINT.gold], 5)
    pieces.push(put(feather, { scale: [1, 1, 0.35] }))
  }
  return pieces
}

/** The winged copper postbox, its letter, and the wooden charms hanging beneath it. */
export function buildPostbox(): Part[] {
  const copper = [PAINT.copper, PAINT.copperLight] as const
  const body: BufferGeometry[] = [
    roughen(cyl(0.1, 0.14, 1.5, [PAINT.woodDark, PAINT.wood], { at: [0, -0.1, 0] }, 7), 0.012),
    limb([0, 0.75, 0], [0, 1.36, -0.34], 0.05, 0.045, PAINT.wood, 5),
    blob(0.2, [PAINT.stoneDark, PAINT.stoneLight], { at: [0.2, 0.04, 0.1], scale: [1.2, 0.6, 1] }, 0.3, 7, 1),
    blob(0.16, [PAINT.stoneDark, PAINT.stone], { at: [-0.18, 0.03, -0.12], scale: [1, 0.6, 1.2] }, 0.3, 8, 1),
    roughen(box(2.7, 0.09, 0.09, [PAINT.wood, PAINT.woodLight], { at: [0, POSTBOX.crossbar, 0.1] }), 0.012, 3),
    box(0.5, 0.07, 0.74, PAINT.woodDark, { at: [0, 1.42, 0] }),
    box(0.72, 0.46, 1.0, copper, { at: [0, 1.49, 0] }),
    cyl(0.36, 0.36, 1.0, [PAINT.copperLight, PAINT.copper], { at: [0, 1.94, -0.5], rot: [QUARTER, 0, 0] }, 14),
    box(0.62, 0.5, 0.03, PAINT.copper, { at: [0, 1.56, 0.5] }),
    box(0.44, 0.06, 0.03, PAINT.soot, { at: [0, 1.95, 0.515] }),
    cyl(0.04, 0.04, 0.05, PAINT.brass, { at: [0, 1.7, 0.52], rot: [QUARTER, 0, 0] }, 7),
    // A little flag on the side, raised.
    box(0.03, 0.42, 0.03, PAINT.iron, { at: [0.375, 1.75, 0.3] }),
    box(0.03, 0.18, 0.26, PAINT.terracotta, { at: [0.375, 1.99, 0.17] }),
  ]
  for (const z of [-0.36, 0.36]) body.push(cyl(0.372, 0.372, 0.05, PAINT.brass, { at: [0, 1.94, z], rot: [QUARTER, 0, 0] }, 14), box(0.74, 0.46, 0.05, PAINT.brass, { at: [0, 1.49, z] }))
  // Verdigris where the rain sits.
  for (const [x, y, z, r] of [
    [0.12, 2.28, 0.14, 0.13],
    [-0.16, 2.25, -0.24, 0.11],
    [0.3, 2.12, -0.1, 0.09],
    [-0.33, 1.72, 0.2, 0.1],
  ] as const) {
    body.push(blob(r, PAINT.verdigris, { at: [x, y, z], scale: [1, 0.3, 1] }, 0.3, Math.round(r * 100), 1))
  }

  const [sx, sy, sz] = POSTBOX.slot
  const letter = [
    box(0.4, 0.022, 0.56, [PAINT.oat, PAINT.canvas], { at: [sx, sy - 0.011, sz - 0.2] }),
    cyl(0.05, 0.05, 0.012, PAINT.terracotta, { at: [sx, sy + 0.011, sz - 0.2] }, 8),
    box(0.09, 0.006, 0.11, PAINT.cornflower, { at: [sx + 0.13, sy + 0.011, sz - 0.02] }),
  ]

  const [wx, wy, wz] = POSTBOX.wing
  const { width, height } = POSTBOX.charm
  const charms = POSTBOX.charms.map(({ x, drop }, i) =>
    hung(
      `Postbox_Charm${i + 1}`,
      [
        box(0.014, drop + 0.04, 0.014, PAINT.canvas, { at: [0, -drop - 0.04, 0] }),
        roughen(box(width, height, 0.045, i % 2 ? [PAINT.wood, PAINT.woodLight] : [PAINT.woodLight, PAINT.woodPale], { at: [0, -drop - height, 0], rot: [0, 0, (i % 2 ? 1 : -1) * 0.03] }), 0.012, i),
        cyl(0.03, 0.03, 0.02, PAINT.brass, { at: [0, -drop - 0.06, 0.03], rot: [QUARTER, 0, 0] }, 6),
      ],
      [x, POSTBOX.crossbar, 0.12],
    ),
  )

  return [part('Postbox_Body', body), hung('Postbox_WingR', wing(1), [wx, wy, wz]), hung('Postbox_WingL', wing(-1), [-wx, wy, wz]), part('Postbox_Letter', letter, 'paint', POSTBOX.slot), ...charms]
}

/** The campfire beside the postbox, with a log to sit on while the letter gets written. */
export function buildCampfire(): Part[] {
  const pieces: BufferGeometry[] = [cyl(0.62, 0.66, 0.04, [PAINT.soot, PAINT.stoneDark], undefined, 10)]
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2
    pieces.push(blob(0.2 + (i % 3) * 0.035, [PAINT.stoneDark, PAINT.stoneLight], { at: [Math.cos(angle) * 0.72, 0.08, Math.sin(angle) * 0.72], scale: [1.1, 0.75, 1], rot: [0, angle, 0] }, 0.3, i, 1))
  }
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.5
    pieces.push(limb([Math.cos(angle) * 0.5, 0.03, Math.sin(angle) * 0.5], [-Math.cos(angle) * 0.08, 0.62, -Math.sin(angle) * 0.08], 0.085, 0.07, [PAINT.woodDark, PAINT.wood], 6))
  }
  // The bench: a long log on two stumps, and a stump for a second sitter.
  pieces.push(limb([-1.15, 0.46, 1.95], [1.15, 0.46, 2.15], 0.3, 0.27, [PAINT.wood, PAINT.woodLight], 9))
  pieces.push(cyl(0.2, 0.24, 0.3, PAINT.woodDark, { at: [-0.75, 0, 1.98] }, 7), cyl(0.2, 0.24, 0.3, PAINT.woodDark, { at: [0.75, 0, 2.12] }, 7))
  pieces.push(cyl(0.32, 0.36, 0.42, [PAINT.wood, PAINT.woodPale], { at: [-1.75, 0, 0.2] }, 8))
  // A copper kettle keeping warm on a flat stone.
  pieces.push(cyl(0.3, 0.32, 0.1, PAINT.stoneLight, { at: [0.95, 0, -0.35] }, 7), blob(0.17, [PAINT.copper, PAINT.copperLight], { at: [0.95, 0.24, -0.35], scale: [1, 0.85, 1] }, 0.04, 3, 1))
  pieces.push(limb([1.08, 0.26, -0.35], [1.3, 0.36, -0.35], 0.035, 0.02, PAINT.copper, 5))

  return [
    part('Camp_Static', pieces),
    hung('Camp_Flame1', [cone(0.26, 0.74, [PAINT.terracotta, PAINT.flame], undefined, 6)], [0, 0.1, 0], 'glow'),
    hung('Camp_Flame2', [cone(0.17, 0.5, [PAINT.flame, PAINT.flameCore], undefined, 6)], [0.08, 0.1, 0.06], 'glow'),
    hung('Camp_Flame3', [cone(0.14, 0.44, [PAINT.terracotta, PAINT.flame], undefined, 6)], [-0.13, 0.1, -0.05], 'glow'),
  ]
}
