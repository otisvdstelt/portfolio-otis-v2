# Design

The visual system of the portfolio as built. Tokens and component classes live in `src/index.css`; the shapes of the world in `src/lib/world/`; its materials, light and camera in `src/components/three/`.

## Thesis

A railway journey through one painted world. You board a train at a halt on the sea; the train car is the hub, and every section is a scene you reach by taking a window seat and letting the fog roll over. Nothing is a page, and nothing sits in a card that could not be an object in its scene.

## What the reference taught

The train was built from a study of the official stills Studio Ghibli publishes at ghibli.jp. Every model, texture and composition here is original; the film sets the mood, it is not copied. What was taken:

- **A train on a flooded plain.** The horizon sits in the lower third and the sky takes the rest. The train is small, warm, seen side-on from near water level, and sits exactly on the horizon. One bank of cloud on a periwinkle sky. The water is a mirror, a shade darker than what it reflects, dragged sideways in long strokes. The platform is thin and pale.
- **A carriage interior.** Inside is dark and warm; outside is brilliant and flat: bands of sky, cloud and sea, with the horizon at the middle of the windows. A row of strap rings hangs along the top.
- **Across all of it.** Light comes from low and from the side. Shadows have a colour (lavender outdoors, warm brown indoors), never grey. Backgrounds are soft washes without lines; the things that matter carry a thin, dark, warm outline.

## The world

One flat sea at `y = 0`, with nothing on it but the line. The railway runs along `z = 0` near the origin; the three scenes off it stand on the same sea a thousand units apart, so each has the horizon to itself. Only the scene on screen and the one being travelled to are built at any moment.

| Scene | Where | Section | What is there |
| --- | --- | --- | --- |
| Stillwater Halt | `x = 0` | Title card | A bleached plank platform floating on barrels, a name board, a lamp, one tall mast. The train waits here. |
| The train | cruising `x = 80..200` | Home | Three red railcars with cream bands and barrel roofs. The middle car is the hub: its four benches are the four destinations. |
| The library car | the train's middle car | Projects | The same car with its north benches taken out: a walnut bookcase across the two middle windows, card-catalogue drawers, low shelves under the windows either side, a globe, a reading lamp, piles on the floor, a ginger cat asleep in the sun. Four great leather books stand face out on a baize-backed ledge, one per project. The sea goes by outside. |
| The clocktower | `x = 2000`, 34 up | About | An octagonal stone room behind a glass clock face turned to the low sun: amber beams, the clock's wheels, hanging maps, mismatched armchairs, and a cluttered drafting table with an open sketchpad. The hands show the visitor's own time, from behind. |
| The signpost | `x = 3000` | Skills | One weather-beaten post with four plaques on a knoll of dandelion clocks at the edge of a calm sea. Nothing else. |
| The bus stop | `x = 4000` | Contact | A board shelter on the shore of a mirror sea, always at night: a lantern over a bench, a green telephone box lit from inside, a pole with the stop's sign and four planks. |

While someone rides, the train runs round the stretch from 80 to 200 for ever. Telegraph posts stand every 40 along it and the rocks repeat every 120, so the jump at the end of a lap cannot be seen; the sea's surface pattern is measured along the journey, not along the map, for the same reason.

**Mood.** Each scene may replace the sky, the glow at the horizon, the sea's colour, the sun's colour, how much of the sea is mirror, and what drifts in the air (`mood` in `src/lib/places.ts`). The library car keeps the hour the train has. The signpost can ask the whole sky to lean toward another hour (`air.tint`).

## Colour

Five colours from the brief, as CSS variables in `@theme`. Everything else is mixed from them.

| Token | Value | Role |
| --- | --- | --- |
| `--color-canvas-base` | `#f7f4eb` | Paper: the page, the sheets, the ragged border round the painting. |
| `--color-canvas-text` | `#2c2823` | Ink: all text. |
| `--color-ghibli-green` | `#3b533e` | Moss: links, the focus ring, the land. |
| `--color-ghibli-sky` | `#a3c1ad` | Mist: glass, a language in the blend. |
| `--color-ghibli-earth` | `#b8623b` | Terracotta: the squiggle under whatever is chosen, the filled ring on the route map, the head of the notepad. |

Mixed shades: `canvas` `#fcfaf3` (a sheet lying on the paper), `oat` and `rule` (edges and ruled lines), `ink-soft` `#5e554a` (secondary text, 6.7:1 on paper), `rust` `#8f4526` (terracotta deep enough to write with and to carry pale lettering), `gold`, `leather`.

The world's own palette is in `src/lib/world/palette.ts`. Its sky is not a token: periwinkle `#6f8ad6` overhead to peach `#f6d6c6` at the horizon, and haze is always the horizon's colour, which is why the sea has no edge.

**Night.** After 19:00 by the visitor's clock, and always at the bus stop, `data-theme="night"` is set on the root and Tailwind's `dark:` variant follows it. Paper becomes `#171b2e`, ink `#f3ead8`; the sky goes to indigo with stars, windows and lanterns turn up, dust becomes fireflies.

**Lit paper.** Parchment under a lamp stays parchment at any hour. The book's pages, the sketchpad, the blown sheet and the notepad carry `.lit`, which pins their paper and ink to the day values so they read the same at night.

## Type

Four hands, each for one job.

- **Homemade Apple** (script): the name on the title card and the headings on the sketchpad. A fountain-pen hand; it is given loose leading and open word-spacing, never tightened.
- **Zen Antique Soft** (display): words that are printed, carved or painted on a board: panel titles, the stops on the route map, the plaques of the signpost, book titles, buttons.
- **Klee One** (body, 400 and 600): everything that is read, on the page and on the pages of the open book. A pen-written textbook hand, 17 px, 1.65 leading.
- **Yomogi** (hand): labels and notes: tags in the world, the menu on a phone, the planks at the bus stop, margins.

Self-hosted latin subsets via Fontsource. The same faces are used for lettering inside the 3D scene, so a sign in the world and a heading on the page are in one hand.

## Painting the world

- **Cel shading.** One `MeshToonMaterial` recipe (`paintedToon`) with vertex colours and a three-texel gradient map on a nearest filter: shadow, midtone, highlight, with no blur between them.
- **Outlines.** drei's `<Outlines>` on every model: colour `#1c1917`, opacity 0.85, measured in the world. The brief's thickness of 0.04 is used for anything the size of a wall or a train; small things on shelves take a finer pen (0.005 to 0.014), or they would be more line than object. The ground, the sea and the sky are washes and carry no line.
- **Watercolour.** A tileable noise texture is multiplied into every surface in world space, and nudges the surface normal as well, so the edge between two tones runs ragged the way wet paint bleeds.
- **Paper.** A post-processing pass lays the tooth of the sheet and pooled pigment over the whole picture, stops the paint raggedly short of the edge with a darker rim, wanders every edge by a pixel or so, and inks the things too far away to carry their own outline.
- **The sea.** A real mirror: the world is drawn a second time from under the surface. The picture is dragged sideways in long slow strokes, deepened a shade, and faded into the sky's own colour with distance.
- **Light.** The sun stands thirty degrees up in the south-west, warm (`#ffd4a2`); the sky light is lavender, so shadows lean violet. The sun's shadow follows whatever is being looked at. Interiors are painted in darker values and lit by one warm lamp each, so the windows are the brightest thing in the frame. In the clocktower the beams through the clock face are additive washes; at the bus stop the lantern is a flickering point light that throws the shelter's shadow across the shingle.
- **Dandelions.** drei `<Instances>`, written to the buffer once; a rolling wave of wind is worked out per vertex from the clock and where each one stands. They are kept out of the mirror and out of the pointer's way.
- **Tags.** The paper tags pinned to things in the world are page elements. The scene decides their words and moves them every frame (`src/lib/tags.ts`); the page draws them.

## Motion

- **Boarding.** One unbroken camera move: down from the wide view, across the platform, in through a window and into the aisle. The train waits two and a half seconds, then pulls out.
- **Taking a seat.** Choosing a destination from the train car walks the camera down the aisle (eyes ahead, a slight step in the height), then slides it across into the seat facing that destination's window. The whole walk is measured from the moving train.
- **The fog.** The moment the camera settles at the window, a bank of fog rolls across the picture from the left with a soft, noisy front; behind it the scene, its sky and its sea are changed at once, and the fog rolls on off the right. Every other change of scene is this fog alone. (The very first arrival still spreads from the middle of the sheet like wet paint.)
- **In the scenes.** A book that is pointed at rises off its ledge and tips forward. Chosen, it floats out across the aisle, tips back toward the reader's eye and, once it has all but arrived, opens itself in the middle; its words come up out of the paper as it finishes opening. It closes before it starts back. The clock's wheels turn against one another, the pendulum swings, tea steams; choosing the sketchpad drops the camera to a strict top-down view. A chosen plaque tips forward, the camera turns to look along it, the sky leans toward that plaque's hour, and a sheet of parchment blows in from the upper right, overshoots once and settles; it is carried on to the left when the visitor looks away. At the bus stop the lifted receiver drifts up off its hook and hangs turning in the air.
- **On the page.** Panels are laid down from the right with a slight turn. The sketchpad waits for the camera to finish coming down. Easing is exponential ease-out throughout.
- **Reduced motion.** Camera moves become the fog alone, the train stands still, sway and float stop, and interface transitions are removed.

## Surfaces

Each panel is an object from its scene. Paper edges are torn with an SVG displacement filter applied to a pseudo-element, so the edge is ragged and the words stay sharp.

- **Slip** (`.slip.paper`): a scrap of paper for the name, the weather switch, a hint and each panel's close button. Slightly crooked.
- **Title card** (`.landing`): name, title and one button, set on the sky with a patch of bare paper behind them.
- **Route map** (`.trail`): the train and its four stops by name along one wobbling pen line, a ring at each stop, filled in terracotta where the visitor is. On a phone it is the menu: no line, one plain word per stop, pinned to the bottom.
- **Prompts** (`.prompts`): what a scene offers, as words on a scrap beside it. The things themselves can be pressed in the picture; this gives the keyboard the same reach.
- **The open book** (in the scene, `three/Library.tsx`): on a wide screen a project's words are set on the two pages of the book itself, as live text in the page's own faces: volume, title, what it is, a summary and what it is built with on the left; the language blend as one brush stroke, GitHub's figures and the two addresses on the right. The addresses and "close the book" can be pressed. The paper is lit, so it reads at night as by day.
- **Bookmark** (`.bookmark`): the open book's links and the way to close it, for the keyboard. It stays out of sight until the keyboard reaches it.
- **Open book, on a phone** (`.tome`): there the book in the picture is too small to read, so its two pages are laid over it: boards in the book's own leather with stitching, parchment inside.
- **Catalogue** (`.volume`): the same four books as a list, each with its spine in its leather, for a phone.
- **Sketchpad** (`.sketchpad`): a card back, a wire along the head with its punched holes, and two pages with the fold between them.
- **Blown sheet** (`.gust`): one sheet of parchment with a division's name and its skills, ruled between. It cannot be pressed.
- **Ways** (`.way`): the four plaques as ruled rows, each with a dab of the colour its sky turns, for a phone.
- **Notepad** (`.notepad`): warm paper with a terracotta card strip across its head and lamplight pooled round it; fields written straight onto ruled lines with no boxes; a terracotta "Tear it off and send"; four wooden planks.
- **Tag** (`.tag`): a paper label pinned to something in the world.
- **Inked button** (`.inked`): a pen outline with uneven corners that fills when pressed toward.
- **Sprout** (`.sprout`): a small watercolour plant in the corner that grows while anything is being fetched. It is the whole of the loading state.

There are no icons anywhere. Controls are words.

## Layout

- The canvas fills the window. Name top-left, weather top-right, the route map along the bottom, prompts lower left. The sketchpad is laid over the middle of the picture, where the camera is looking straight down; the notepad is laid beside the bus stop and the camera slides the picture left to keep it in view; the blown sheet lands on whichever side the camera has turned toward.
- Under 1024 px, or on touch, or on modest hardware: the route map becomes a full-width menu pinned to the bottom with one plain word per stop, every scene's words come up on a sheet as soon as the visitor is there, and the camera slides the picture up instead. The scenes are fixed compositions with their own framings for a tall screen.
- If WebGL is unavailable the page is paper, the route map and every panel still work, and a line of text says so.

## Voice

Labels name the thing or the action in the scene's own terms: "Board the Train", "Open the sketchpad", "close the book", "Pick up the telephone", "hang up", "Tear it off and send". Errors say what happened and what to do: "GitHub is rationing its answers for the moment. Try again in a little while."
