# Otis van der Stelt: portfolio

A portfolio you travel through. One hand-painted train crossing a flat sea: you board it at a floating halt, the passenger car is the main menu, and each section of the site is the same train fitted out for one thing, reached by taking a window seat and letting the fog roll over.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and TanStack Query.

## The journey

| Scene | Section | What happens there |
| --- | --- | --- |
| **Stillwater Halt** | Title card | The train waits at a platform floating on a mirror sea. The name, the title and one button: "Board the Train". |
| **The train** | Main menu | The camera glides in through a window and the train pulls out. Look around the car, then pick a bench or a stop on the route map: the camera walks down the aisle, sits at that window, and fog rolls across the picture. |
| **The picture car** | Projects | The same car with a screen let down across its far end and a lantern projector in the aisle. Each project is a tin of film in the rack; choosing one turns the lights down, brings evening on outside, and throws the project on the screen: a title card, then a still of it with what it is, what it is built with and where to find it, and figures fetched live from GitHub. |
| **The compartment** | About | Two velvet seats, a table under the window, somebody's luggage. Choosing the journal on the table drops the camera to a top-down view, and who Otis is, where Otis studies and the timeline so far are written on its pages. The tickets along the window are the stops on the way here. |
| **The driver's cab** | Skills | The front of the train, the line running away ahead over the sea. Four levers, one per kind of work; pull one and its needle swings, and the destination board over the windscreen says what that kind of work is made of. |
| **The mail car** | Contact | A travelling post office: a sorting frame of pigeonholes over a desk. The card on the desk is the contact form; the four pigeonholes with a name on a brass plate are links. |

Also: the switches in the header choose day or night (stars, fireflies, lit windows, a dark page) and sun or rain. The hour chosen is remembered on that device.

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

- `/#/cabin`, `/#/cinema`, `/#/compartment`, `/#/cab`, `/#/mail`, `/#/cinema/reel-1`: open straight at a car, or at one project on the screen.
- `?time=night` or `?time=day`: open in that hour, whatever was chosen before.
- `?mode=backdrop` or `?mode=roam`: force the phone or the desktop behaviour.

## Change what it says

- **About, skills, social links, e-mail address:** `src/content/site.ts`. The four levers in the cab are named there; each has an empty `skills` list to fill in, and until it is filled the board says "Text soon to come".
- **Projects:** `public/data/projects.json`. One entry per tin in the rack (there is room for four; one is filled in so far), each naming a GitHub repository as `owner/name` plus a title, a few words on what it is, a summary, a stack and an `image`: a still of the project, saved under `public/assets/projects/` at about 16:10. Languages, the date it was last worked on and the live address are not written here: they are fetched from GitHub when the project is chosen.
- The LinkedIn pigeonhole in `src/content/site.ts` points at LinkedIn's front page until the real profile URL is filled in.

## Deploy

A static site: no server, no environment variables, no keys. On Vercel, import the repository and deploy; `vercel.json` names the framework, the build command and the output folder, and sets cache headers for the model and the data file. Any other static host works the same way: build, then serve `dist/`.

The generated model and the Draco decoder are committed, so the asset scripts do not run during a deploy.

## How it is put together

### The world is generated, then baked

There are no hand-modelled files. Everything that stands in the world is described in TypeScript in `src/lib/world/` as stacked, painted primitives, and `npm run world` bakes it into one Draco-compressed file:

```
src/assets/world.glb      34 named meshes, about 23,000 triangles, 1.3 MB -> 118 KB
```

- `kit.ts`: the modelling kit (blocks, posts, lumpy balls, extrusions, rings), each piece coloured per vertex.
- `terrain.ts`: the map (where the line runs, the stretch the train cruises) and the noise the kit roughens things with.
- `railway.ts`: the halt, the line, the train and its interior.
- `scenes.ts`: what the train is fitted out with: the picture car's screen, projector and tins, the compartment, the journal, the mail car's sorting frame, the driver's cab.
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

- **Roam** (a wide window with a pointer): a free camera on heavily damped `OrbitControls`, pointer parallax, the train travelling, the walk down the aisle to a window seat, and the words set on the things in the picture.
- **Backdrop** (touch, a window under 1024 px, or modest hardware): fixed compositions with framings made for a tall screen that breathe slowly, the fog alone between cars, the train standing still. The route map becomes a text menu pinned to the bottom, and each car's words come up on a sheet above it.

If WebGL is not available at all, every word on the site is still reachable from the route map.

## Project layout

```
scripts/                 build-world.ts (bakes world.glb), copy-draco.mjs
public/
  assets/projects/       a still of each project, for the screen
  data/projects.json     which repositories are in the picture car's rack
  draco/                 the Draco decoder
src/
  assets/world.glb       the baked world (imported, so the build names it after its contents)
  App.tsx                where the visitor is, what is open, the address, the theme
  content/site.ts        everything the site says about its owner
  hooks/                 the capability check; the project and GitHub queries
  lib/
    places.ts            the cars, their camera shots and their moods
    train.ts             where the train is and how it moves
    air.ts               the clock, wind, rain, night and fog every shader reads
    tags.ts              the hand-over of paper tags from the scene to the page
    world/               the generated world (see above)
  components/
    World.tsx            the canvas: reads the model, composes the scene
    three/               atmosphere and sky, sea, railway, the picture car, the compartment, cab and mail car, writing in the scene, particles, camera rig, materials, the paper pass
    ui/                  title card, route map, prompts, panels, bookmark, tags, sprout; and for a phone the programme and a project's pages, the journal, the levers, the postcard
```

## Notes

- GitHub's API is used without a key, which allows about sixty requests an hour per visitor. Each project costs two and is cached for half an hour. When GitHub refuses, the screen says so and offers to ask again.
- The site has been through four worlds. The first two are kept under the git tags `valley-v1` and `sea-railway-v2`; the third (the train with a clocktower, a signpost and a bus stop) is in the history at commit `5966374`.
- In development the scene is exposed as `window.__world`, so it can be stepped by hand (`__world.setFrameloop('never')`, then `__world.advance(seconds)`) when the browser has paused animation in a background tab.

## Credits

The world's mood draws on Studio Ghibli's films; the stills published at ghibli.jp were studied for composition, palette and light. Every model, texture and line of the world itself was made for this project. Fonts: Homemade Apple, Zen Antique Soft, Klee One and Yomogi, via Fontsource.
