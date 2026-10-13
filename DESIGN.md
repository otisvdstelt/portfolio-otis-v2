# Design

The visual system of the portfolio as built. Tokens and component classes live in `src/index.css`; the shapes of the world in `src/lib/world/`; its materials, light and camera in `src/components/three/`.

## Thesis

One train crossing a painted sea. You board it at a halt on the water; the passenger car is the hub, and every section of the site is the same train fitted out for one thing, reached by taking a window seat and letting the fog roll over. Nothing is a page, and the words are on the things in the scene: on the pages of a book, in a journal, on a destination board, on brass plates.

## What the reference taught

The train was built from a study of the official stills Studio Ghibli publishes at ghibli.jp. Every model, texture and composition here is original; the film sets the mood, it is not copied. What was taken:

- **A train on a flooded plain.** The horizon sits in the lower third and the sky takes the rest. The train is small, warm, seen side-on from near water level, and sits exactly on the horizon. One bank of cloud on a periwinkle sky. The water is a mirror, a shade darker than what it reflects, dragged sideways in long strokes. The platform is thin and pale.
- **A carriage interior.** Inside is dark and warm; outside is brilliant and flat: bands of sky, cloud and sea, with the horizon at the middle of the windows. A row of strap rings hangs along the top.
- **Across all of it.** Light comes from low and from the side. Shadows have a colour (lavender outdoors, warm brown indoors), never grey. Backgrounds are soft washes without lines; the things that matter carry a thin, dark, warm outline. Rooms are lived in: a coat, a cup of tea, a cat asleep.

## The world

One flat sea at `y = 0`, with nothing on it but the line: rails along `z = 0` and a telegraph post every 40. The train is three cars. Its shell is never changed; what a section needs is fitted inside it, and the fitting follows the place the camera has actually reached, so the fog covers every change.

| Place | Where | Section | What is there |
| --- | --- | --- | --- |
| Stillwater Halt | `x = 0` | Title card | A bleached plank platform floating on barrels, a name board, a lamp, one tall mast. The train pulls in here as the picture appears. |
| The train | the middle car | Home | Red railcars with cream bands and barrel roofs. The middle car is the hub: its four north benches are the four destinations. |
| The picture car | the middle car | Projects | A pale screen let down across the east end, a brass-bound lantern projector on a wooden tripod in the aisle, a cabinet of shallow drawers with a rack of film tins on it. Each project is a tin with its name on the label. |
| The compartment | the middle car | About | Two deep velvet seats facing each other across a table under the window post: curtains, a wall lamp, a trunk on the rack, a rug. A journal lies open on the table beside a pot plant and a mug of tea, and five punched tickets are tucked along the window, one for each stop on the way here. |
| The driver's cab | the front of the front car | Skills | A windscreen in three panes with the line running away ahead, a walnut desk with four brass dials and four levers, a name plate under each, a destination board over the glass, a brake wheel, a whistle cord, a mug. |
| The mail car | the middle car | Contact | A sorting frame of pigeonholes over a deep desk: letters, an oil lamp, scales, a stamp and its pad, a brass slot marked POST, parcels on low racks. Four pigeonholes carry a name on a brass plate. A card lies on the desk. |

While someone rides, the train runs round the stretch from 80 to 200 for ever. The posts stand a whole number to a lap and the sea's surface pattern is measured along the journey, not along the map, so the jump at the end of a lap cannot be seen, even looking straight down the line from the cab.

## Colour

Five colours from the brief, as CSS variables in `@theme`. Everything else is mixed from them.

| Token | Value | Role |
| --- | --- | --- |
| `--color-canvas-base` | `#f7f4eb` | Paper: the page, the sheets, the ragged border round the painting. |
| `--color-canvas-text` | `#2c2823` | Ink: all text. |
| `--color-ghibli-green` | `#3b533e` | Moss: links, the focus ring, the land. |
| `--color-ghibli-sky` | `#a3c1ad` | Mist: glass, a language in the blend. |
| `--color-ghibli-earth` | `#b8623b` | Terracotta: the squiggle under whatever is chosen, the filled ring on the route map, curtains, a ticket's stub. |

Mixed shades: `canvas` `#fcfaf3` (a sheet lying on the paper), `oat` and `rule` (edges and ruled lines), `ink-soft` `#5e554a` (secondary text, 6.7:1 on paper), `rust` `#8f4526` (terracotta deep enough to write with and to carry pale lettering), `gold`, `leather`.

The world's own palette is in `src/lib/world/palette.ts`. Its sky is not a token: periwinkle `#6f8ad6` overhead to peach `#f6d6c6` at the horizon, and haze is always the horizon's colour, which is why the sea has no edge.

**Night.** After 19:00 by the visitor's clock `data-theme="night"` is set on the root and Tailwind's `dark:` variant follows it. Paper becomes `#171b2e`, ink `#f3ead8`; the sky goes to indigo with stars, lamps turn up, dust becomes fireflies.

**Lit paper.** Paper under a lamp stays paper at any hour. The lit screen and the pages of the journal (in the scene), and the postcard and the phone's sheets (on the page, `.lit`), keep their day paper and ink, so they read the same at night.

## Type

Four hands, each for one job.

- **Homemade Apple** (script): the name on the title card and the first line of the journal. A fountain-pen hand; it is given loose leading and open word-spacing, never tightened.
- **Zen Antique Soft** (display): words that are printed, engraved or painted: panel titles, the stops on the route map, the title card on the screen, the labels on the tins, the brass plates in the cab and the mail car, the destination board, buttons.
- **Klee One** (body, 400 and 600): everything that is read, on the page, on the screen and in the journal. A pen-written textbook hand, 17 px, 1.65 leading.
- **Yomogi** (hand): labels and notes: tags in the world, the years on the tickets, the menu on a phone, margins.

Self-hosted latin subsets via Fontsource. The same faces are used for lettering inside the 3D scene, so a sign in the world and a heading on the page are in one hand.

## Painting the world

- **Cel shading.** One `MeshToonMaterial` recipe (`paintedToon`) with vertex colours and a three-texel gradient map on a nearest filter: shadow, midtone, highlight, with no blur between them.
- **Outlines.** drei's `<Outlines>` on every model: colour `#1c1917`, opacity 0.85, measured in the world. The brief's thickness of 0.04 is used for anything the size of a wall or a train; small things on shelves take a finer pen (0.005 to 0.014), or they would be more line than object. The ground, the sea and the sky are washes and carry no line.
- **Watercolour.** A tileable noise texture is multiplied into every surface in world space, and nudges the surface normal as well, so the edge between two tones runs ragged the way wet paint bleeds.
- **Paper.** A post-processing pass lays the tooth of the sheet and pooled pigment over the whole picture, stops the paint raggedly short of the edge with a darker rim, wanders every edge by a pixel or so, and inks the things too far away to carry their own outline.
- **The sea.** A real mirror: the world is drawn a second time from under the surface. The picture is dragged sideways in long slow strokes, deepened a shade, and faded into the sky's own colour with distance.
- **Light.** The sun stands thirty degrees up in the south-west, warm (`#ffd4a2`); the sky light is lavender, so shadows lean violet. The sun's shadow follows whatever is being looked at, so it comes in through the south windows and lies across whatever the car is fitted with. Each fitting has one small warm lamp that is barely there by day and carries the scene at night.
- **Tags.** The paper tags pinned to things in the world are page elements. The scene decides their words and moves them every frame (`src/lib/tags.ts`); the page draws them.

## Motion

- **Arriving.** On a first visit the train is still pulling in to the halt as the picture spreads from the middle of the sheet.
- **Boarding.** One unbroken camera move: down from the wide view, across the platform, in through a window and into the aisle. The train waits two and a half seconds, then pulls out.
- **Taking a seat.** Choosing a destination from the passenger car walks the camera down the aisle (eyes ahead, a slight step in the height), then slides it across into the seat facing that destination's window. The whole walk is measured from the moving train.
- **The fog.** The moment the camera settles at the window, a bank of fog rolls across the picture from the left with a soft, noisy front; behind it the car is refitted, and the fog rolls on off the right. Every other change of place is this fog alone.
- **The lantern.** Pointed at, a tin lifts out of the rack. Chosen, the camera takes a seat in front of the screen; the train's lamps go down, evening falls outside and the stars come out; the reels turn, a short beam shows in the dust, and the screen lights with a slight flicker. A title card holds for two seconds, then gives way to a still of the project with its words beside it. Stopping it brings the day and the lamps back.
- **The journal and the card.** Choosing either drops the camera to a strict top-down view. The journal's words come up out of its pages as the camera arrives; the postcard is laid over the card.
- **The cab.** A lever at rest leans back toward the driver. Pulled, it goes forward, its needle swings across its dial, and the board over the windscreen changes from the name of the line to the name of the division and what it is made of. Needles tremble a little all the time.
- **Small life.** Tea steams, lamps flicker slightly, a pointed-at ticket lifts out of the window frame and says where it was for, dust rises in the sun and turns to fireflies at night.
- **Reduced motion.** Camera moves become the fog alone, the train stands still, sway and float stop, and interface transitions are removed.

## Surfaces

Words in the scene are live text in the same four faces as the page (`three/Writing.tsx`): they are measured as they are set, so a paragraph on a page can run to as many lines as it needs. Everything said in the scene is also in the page, for the keyboard, for screen readers and for phones.

- **The screen** (in the scene, `three/Cinema.tsx`): a title card (reel, title, what it is), then a still of the project on the left with the language blend as one brush stroke, when it was last worked on and its two addresses under it, and on the right its title, what it is, a summary and what it is built with. The addresses and "stop the projector" can be pressed.
- **The journal** (in the scene): who Otis is, where Otis studies and what Otis does away from the screen on the left page; the timeline and how Otis works on the right.
- **The destination board, the plates, the tickets** (in the scene): a division and its skills; the names of the divisions and of the four links; the years.
- **Slip** (`.slip.paper`): a scrap of paper for the name, the weather switch, a hint and each panel's close button. Slightly crooked.
- **Title card** (`.landing`): name, title and one button, set on the sky with a patch of bare paper behind them.
- **Route map** (`.trail`): the train and its four cars by name along one wobbling pen line, a ring at each stop, filled in terracotta where the visitor is. On a phone it is the menu: no line, one plain word per stop, pinned to the bottom.
- **Prompts** (`.prompts`): what a car offers, as words on a scrap beside it. The things themselves can be pressed in the picture; this gives the keyboard the same reach.
- **Bookmark** (`.bookmark`): the links of whatever lies open and the way to close it, for the keyboard. It stays out of sight until the keyboard reaches it.
- **Postcard** (`.postcard`): the one thing that must be typed into, so it is laid over the card on the desk: the message on one half, the address on the other with the line's frank in the corner, fields written straight onto ruled lines, a terracotta "Drop it in the slot".
- **On a phone** the picture is too small to read, so the same words come up on sheets: the programme and a project's pages with its still pasted in (`.volume`, `.tome`), the journal (`.sketchpad`), the levers (`.way`), the postcard.
- **Tag** (`.tag`): a paper label pinned to something in the world.
- **Inked button** (`.inked`): a pen outline with uneven corners that fills when pressed toward.
- **Sprout** (`.sprout`): a small watercolour plant in the corner that grows while anything is being fetched. It is the whole of the loading state.

There are no icons anywhere. Controls are words.

## Layout

- The canvas fills the window. Name top-left, weather top-right, the route map along the bottom, prompts lower left. The postcard is laid over the middle of the picture, where the camera is looking straight down.
- Under 1024 px, or on touch, or on modest hardware: the route map becomes a full-width menu pinned to the bottom with one plain word per stop, every car's words come up on a sheet as soon as the visitor is there, and the camera slides the picture up to stay in view above it. The cars are fixed compositions with their own framings for a tall screen.
- If WebGL is unavailable the page is paper, the route map and every sheet still work, and a line of text says so.

## Voice

Labels name the thing or the action in the scene's own terms: "Board the Train", "stop the projector", "Read the journal", "Write a postcard", "Drop it in the slot", "put the card down". Errors say what happened and what to do: "GitHub is rationing its answers for the moment. Try again in a little while."
