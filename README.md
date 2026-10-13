# Otis van der Stelt: portfolio

A portfolio you travel through. One hand-painted 3D world on a flat sea: you board a red train at a floating halt, the train car is the main menu, and each section of the site is a scene you reach by taking a window seat and letting the fog roll over.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and TanStack Query.

## The journey

| Scene | Section | What happens there |
| --- | --- | --- |
| **Stillwater Halt** | Title card | The train waits at a platform floating on a mirror sea. The name, the title and one button: "Board the Train". |
| **The train** | Main menu | The camera glides in through a window and the train pulls out. Look around the car, then pick a bench or a stop on the route map: the camera walks down the aisle, sits at that window, and fog rolls across the picture. |
| **The library car** | Projects | The same car fitted out with a great bookcase, the sea still going by outside. Each project is a leather book standing face out on its ledge; choosing one floats it across the aisle and opens it, and its words are set on its own pages, with that repository's figures fetched live from GitHub. |
| **The clocktower** | About | A stone room behind a great glass clock face, amber light coming through it. Choosing the sketchpad on the drafting table drops the camera to a top-down view of who Otis is, where Otis studies and the timeline so far. |
| **The signpost** | Skills | One post in a field of dandelion clocks at the edge of the sea. Each of its four plaques turns the camera its way, turns the sky to its own hour, and blows in a sheet of parchment with what lies that way. |
| **The bus stop** | Contact | A shelter by the sea at night, a lantern, a telephone box lit from inside. Picking up the telephone brings out a notepad that is the contact form; the planks on the pole are links. |

Also: it is night after 19:00 by your clock (stars, fireflies, lit windows, a dark page), and the switch in the header changes sun for rain.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint
```

Node 22.18 or newer is needed (Vite 8, and `npm run world` runs a TypeScript file directly).

Useful addresses while working:

- `/#/cabin`, `/#/library`, `/#/tower`, `/#/signpost`, `/#/busstop`, `/#/library/book-2`: open straight at a scene, or at one project's book.
- `?time=night` or `?time=day`: override the clock.
- `?mode=backdrop` or `?mode=roam`: force the phone or the desktop behaviour.

## Change what it says

- **About, skills, social links, e-mail address:** `src/content/site.ts`.
- **Projects:** `public/data/projects.json`. One entry per book on the library's ledge (there are four), each naming a GitHub repository as `owner/name` plus a title, a few words on what it is, a summary and a stack. Stars, forks, issues, languages, dates and the live address are not written here: they are fetched from GitHub when the book is opened.
- The LinkedIn plank in `src/content/site.ts` points at LinkedIn's front page until the real profile URL is filled in.

## Deploy

A static site: no server, no environment variables, no keys. On Vercel, import the repository and deploy; `vercel.json` names the framework, the build command and the output folder, and sets cache headers for the model and the data file. Any other static host works the same way: build, then serve `dist/`.

The generated model and the Draco decoder are committed, so the asset scripts do not run during a deploy.

## How it is put together

### The world is generated, then baked

There are no hand-modelled files. Everything that stands in the world is described in TypeScript in `src/lib/world/` as stacked, painted primitives, and `npm run world` bakes it into one Draco-compressed file:

```
public/assets/world.glb   47 named meshes, about 58,000 triangles, 3.1 MB -> 240 KB
```

- `kit.ts`: the modelling kit (blocks, posts, lumpy balls, extrusions, rings), each piece coloured per vertex.
- `terrain.ts`: the map. Where the line runs, where each scene stands on the sea, how high the signpost's shore is anywhere. The bake and the app both ask it.
- `railway.ts`: the halt, the line, the train and its interior.
- `scenes.ts`: the library car's bookcase and its books, the clocktower's room, the coast and its signpost, the bus stop.
- `spec.ts`: measurements the bake and the app share, such as where lettering goes on a sign.

`npm run draco` copies the glTF Draco decoder from three.js into `public/draco`, so decoding uses files served from this site and not a CDN. `npm run assets` does both.

### Loading

- The 3D code (three.js, R3F, drei, post-processing) is its own lazily loaded chunk. The title card paints from the small main chunk before it arrives.
- The model is preloaded with `useGLTF.preload` the moment that chunk is evaluated and read through Suspense; the lettering used inside the scene is awaited with React 19's `use()`. Project data is read with `useSuspenseQuery`.
- The loading state is a small watercolour sprout in the corner of the page (`src/components/ui/Sprout.tsx`). It grows while the Suspense fallback is mounted or while TanStack Query is fetching anything, and nothing else on the page moves or blanks.

### Painting

Described in full in [DESIGN.md](DESIGN.md). In short: `MeshToonMaterial` with a three-band, nearest-filtered gradient map; drei `<Outlines>` on every model; a watercolour wash and paint-bleed in the material's shader; a mirror sea; and a post-processing pass that adds paper grain, a ragged painted edge and the fog that rolls across to carry one scene into the next.

### Devices

`useMode` in `src/hooks/useLayout.ts` is the capability check.

- **Roam** (a wide window with a pointer): a free camera on heavily damped `OrbitControls`, pointer parallax, the train travelling, the walk down the aisle to a window seat, shadows from the lantern.
- **Backdrop** (touch, a window under 1024 px, or modest hardware): fixed compositions with framings made for a tall screen that breathe slowly, the fog alone between scenes, fewer lights and fewer dandelions. The route map becomes a text menu pinned to the bottom, and each scene's words come up on a sheet above it.

If WebGL is not available at all, every word on the site is still reachable from the route map.

## Project layout

```
scripts/                 build-world.ts (bakes world.glb), copy-draco.mjs
public/
  assets/world.glb       the baked world
  data/projects.json     which repositories stand on the library's ledge
  draco/                 the Draco decoder
src/
  App.tsx                where the visitor is, what is open, the address, the theme
  content/site.ts        everything the site says about its owner
  hooks/                 the capability check; the project and GitHub queries
  lib/
    places.ts            the scenes, their camera shots and their moods
    train.ts             where the train is and how it moves
    air.ts               the clock, wind, rain, night and fog every shader reads
    tags.ts              the hand-over of paper tags from the scene to the page
    world/               the generated world (see above)
  components/
    World.tsx            the canvas: reads the model, composes the scene
    three/               atmosphere and sky, sea, railway, the library car and its books, the three scenes off the line, particles, camera rig, materials, the paper pass
    ui/                  title card, route map, prompts, panels, catalogue and open book (phone), bookmark, sketchpad, signpost sheet, notepad, tags, sprout
```

## Notes

- GitHub's API is used without a key, which allows about sixty requests an hour per visitor. Each book costs two and is cached for half an hour. When GitHub refuses, the page says so and offers to ask again.
- This is the third world the site has had. The first, a valley, is kept under the git tag `valley-v1`; the second, a railway to a coastal town, under `sea-railway-v2`.
- In development the scene is exposed as `window.__world`, so it can be stepped by hand (`__world.setFrameloop('never')`, then `__world.advance(seconds)`) when the browser has paused animation in a background tab.

## Credits

The world's mood draws on Studio Ghibli's films; the stills published at ghibli.jp were studied for composition, palette and light. Every model, texture and line of the world itself was made for this project. Fonts: Homemade Apple, Zen Antique Soft, Klee One and Yomogi, via Fontsource.
