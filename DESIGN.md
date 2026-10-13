# Design

The visual system of the portfolio as built. Tokens and component classes live in `src/index.css`; the shapes of the world in `src/lib/world/`; its materials, light and camera in `src/components/three/`.

## Thesis

A railway journey through one painted world. The site is a single watercolour you travel through: you board a train at a halt on the sea, and every section is a scene the line reaches. Nothing is a page, and nothing sits in a card that could not be an object in its scene.

## What the references taught

The owner's brief names three touchstones. Before building, the official stills Studio Ghibli publishes at ghibli.jp for the three films were studied, and these are the observations the world is built on. Every model, texture and composition here is original; the films set the mood, they are not copied.

- **A train on a flooded plain.** The horizon sits in the lower third and the sky takes the rest. The train is small, warm, seen side-on from near water level, and sits exactly on the horizon. One bank of cloud, peach where the low sun reaches it and violet underneath, on a periwinkle sky. The water is a mirror, a shade darker than what it reflects, dragged sideways in long strokes. The platform is thin and pale.
- **A carriage interior.** The view faces the window wall. Inside is dark and warm; outside is brilliant and flat: bands of sky, cloud and sea, with the horizon at the middle of the windows. A row of strap rings hangs along the top.
- **A bakery counter.** Dark walnut shelving wall to wall, packed with bread in ordered rows, one kind to a shelf. A glass-fronted counter in the foreground. One cool accent among the browns. A pale shaft of daylight from the shop window.
- **A wizard's room.** A very dark ground with no empty surface. Olive, brass and gold, with jewel colours wherever there is glass. Things hang from the ceiling on threads. Leaning stacks of books close to the eye give the room its depth.
- **Across all of them.** Light comes from low and from the side. Shadows have a colour (lavender outdoors, warm brown indoors), never grey. Backgrounds are soft washes without lines; the things that matter carry a thin, dark, warm outline.

## The world

One straight railway along `z = 0`. The sea is perfectly flat at `y = 0`; every platform, quay and carriage floor is at `y = 1`.

| Scene | Where | Section | What is there |
| --- | --- | --- | --- |
| Stillwater Halt | `x = 0` | Home | A bleached plank platform floating on barrels, a name board, a lamp, one tall mast. The train waits here. |
| The train | cruising `x = 80..200` | Projects | Three red railcars with cream bands and barrel roofs. The middle car's four benches are the four projects. |
| The bakery | `x = 300`, on the quay | About | The ground floor of a tall plastered house: shelves, counter, chalkboard, lavender, a guestbook and a mug of tea. |
| The attic | the same house's roof space | Skills | Timber-lined, crammed with potions, books, brass and blueprints. Five clusters of artefacts, one per kind of skill. |
| The campfire | the hill behind the town | Contact | A clearing ringed with pines: a fire, a log bench, a winged copper postbox with four wooden tags. |

While someone rides, the train runs round the stretch from 80 to 200 for ever. Telegraph posts stand every 40 along it and the rocks repeat every 120, so the jump at the end of a lap cannot be seen; the sea's surface pattern is measured along the journey, not along the map, for the same reason.

## Colour

Five colours from the brief, as CSS variables in `@theme`. Everything else is mixed from them.

| Token | Value | Role |
| --- | --- | --- |
| `--color-canvas-base` | `#f7f4eb` | Paper: the page, the sheets, the ragged border round the painting. |
| `--color-canvas-text` | `#2c2823` | Ink: all text. |
| `--color-ghibli-green` | `#3b533e` | Moss: links, the focus ring, the land. |
| `--color-ghibli-sky` | `#a3c1ad` | Mist: glass, a ticket stub, a language in the blend. |
| `--color-ghibli-earth` | `#b8623b` | Terracotta: the squiggle under whatever is chosen, roofs, the ribbon. |

Mixed shades: `canvas` `#fcfaf3` (a sheet lying on the paper), `oat` and `rule` (edges and ruled lines), `ink-soft` `#5e554a` (secondary text, 6.7:1 on paper), `rust` `#8f4526` (terracotta deep enough to write with and to carry pale lettering), `gold`, `leather`.

The world's own palette is in `src/lib/world/palette.ts`. Its sky is not a token: periwinkle `#6f8ad6` overhead to peach `#f6d6c6` at the horizon, and haze is always the horizon's colour, which is why the sea has no edge.

**Night.** After 19:00 by the visitor's clock, and always at the campfire, `data-theme="night"` is set on the root and Tailwind's `dark:` variant follows it. Paper becomes `#171b2e`, ink `#f3ead8`; the sky goes to indigo with stars, windows and lanterns turn up, dust becomes fireflies.

## Type

Four hands, each for one job.

- **Homemade Apple** (script): the name on the title card. A fountain-pen hand; it is given loose leading and open word-spacing, never tightened.
- **Zen Antique Soft** (display): words that are printed, carved or painted on a board: panel titles, the train's destination, station names, the bakery's sign, buttons.
- **Klee One** (body, 400 and 600): everything that is read. A pen-written textbook hand, 17 px, 1.65 leading.
- **Yomogi** (hand): labels and notes: tags in the world, the menu on a phone, the chalkboard, the wooden tags, margins.

Self-hosted latin subsets via Fontsource. The same faces are used for lettering inside the 3D scene, so a sign in the world and a heading on the page are in one hand.

## Painting the world

- **Cel shading.** One `MeshToonMaterial` recipe (`paintedToon`) with vertex colours and a three-texel gradient map on a nearest filter: shadow, midtone, highlight, with no blur between them.
- **Outlines.** drei's `<Outlines>` on every model: colour `#1c1917`, opacity 0.85, measured in the world. The brief's thickness of 0.04 is used for anything the size of a wall or a train; small things on shelves take a finer pen (0.005 to 0.014), or they would be more line than object. The ground, the sea and the sky are washes and carry no line.
- **Watercolour.** A tileable noise texture is multiplied into every surface in world space, and nudges the surface normal as well, so the edge between two tones runs ragged the way wet paint bleeds.
- **Paper.** A post-processing pass lays the tooth of the sheet and pooled pigment over the whole picture, stops the paint raggedly short of the edge with a darker rim, wanders every edge by a pixel or so, and inks the things too far away to carry their own outline.
- **The sea.** A real mirror: the world is drawn a second time from under the surface. The picture is dragged sideways in long slow strokes, deepened a shade, and faded into the sky's own colour with distance.
- **Light.** The sun stands thirty degrees up in the south-west, warm (`#ffd4a2`); the sky light is lavender, so shadows lean violet. The sun's shadow follows whatever is being looked at. Interiors are painted in darker values and lit by one warm lamp each, so the windows are the brightest thing in the frame. At the campfire a low, flickering point light throws long shadows outward across the moss.
- **Grass.** drei `<Instances>`, written to the buffer once; a rolling wave of wind is worked out per vertex from the clock and where each tuft stands. Grass is kept out of the depth buffer, so nothing ever draws a line round a blade.

## Motion

- **Boarding.** The one unbroken camera move: down from the wide view, across the platform, in through a window and into the aisle. The train waits two and a half seconds, then pulls out.
- **Every other journey** crosses walls or a great deal of open sea, so the picture washes out to bare paper as the camera draws back, and washes in again as it settles into the new scene. The wash spreads from the middle of the sheet with a noisy edge, like wet paint.
- **Arrivals.** When a town scene washes in, the train is still gliding the last few lengths up to the quay.
- **In the scenes.** Clouds float (drei `<Float>`), dust rises, steam comes off the tea, lavender and charms sway, the fire flickers and its light moves with it. A chosen bench lifts a hand's breadth; a chosen cluster of artefacts rises out of step, turns and glows in its own colour.
- **On the page.** Panels are laid down from the right with a slight turn. The project sheet drops from the top of the window on its cords. Easing is exponential ease-out throughout.
- **Reduced motion.** Camera moves become the wash alone, the train stands still, sway and float stop, and interface transitions are removed.

## Surfaces

Each panel is an object from its scene. Paper edges are torn with an SVG displacement filter applied to a pseudo-element, so the edge is ragged and the words stay sharp.

- **Slip** (`.slip.paper`): a scrap of paper for the name, the weather switch and each panel's close button. Slightly crooked.
- **Title card** (`.landing`): name, title and one button, set on the sky with a patch of bare paper behind them.
- **Ticket** (`.ticket`): a coloured stub, a row of punched holes, the project's name. One per bench.
- **Sheet** (`.docket`, `.scroll`, `.parchment`): parchment between two wooden rods with brass knobs, hung from two cords. Holds a rubber stamp with the seat number, the summary, the stack, the language blend as one brush stroke, the figures from GitHub and the addresses as written paths.
- **Guestbook** (`.guestbook`): a stitched leather cover with a ribbon; inside, a two-page spread when there is room for one.
- **Inventory** (`.shelf`): ruled rows, each with a dab of the colour its cluster glows in.
- **Letter** (`.letter`): a postage stamp, fields written straight onto ruled lines with no boxes, a terracotta "Seal and send".
- **Tag** (`.tag`): a paper label pinned to something in the world.
- **Inked button** (`.inked`): a pen outline with uneven corners that fills when pressed toward.
- **Sprout** (`.sprout`): a small watercolour plant in the corner that grows while anything is being fetched. It is the whole of the loading state.

There are no icons anywhere. Controls are words.

## Layout

- The canvas fills the window. Name top-left, weather top-right, the trail along the bottom, panels on the right; the camera slides the picture left so the scene stays in view beside its panel.
- Under 1024 px, or on touch, or on modest hardware: the trail becomes a full-width menu pinned to the bottom with one plain word per stop, panels become sheets that slide up from it, and the camera slides the picture up instead. The scenes are fixed compositions with their own framings for a tall screen.
- If WebGL is unavailable the page is paper, the trail and every panel still work, and a line of text says so.

## Voice

Labels name the thing or the action in the scene's own terms: "Board the Train", "put the tickets away", "roll the sheet back up", "close the guestbook", "Seal and send". Errors say what happened and what to do: "GitHub is rationing its answers for the moment. Try again in a little while."
