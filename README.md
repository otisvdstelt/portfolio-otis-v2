# Otis van der Stelt: portfolio

A portfolio you travel through. One hand-painted 3D world along a railway laid across a flat sea: you board a red train at a floating halt, and each section of the site is a scene the line reaches.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and TanStack Query.

## The five scenes

| Scene | Section | What happens there |
| --- | --- | --- |
| **Stillwater Halt** | Home | The train waits at a platform floating on a mirror sea. The name, the title and one button: "Board the Train". |
| **The train** | Projects | The camera glides in through a window and the train pulls out. Each bench is a project; choosing one drops a parchment sheet from the ceiling with that repository's figures, fetched live from GitHub. |
| **The bakery** | About | A shop on the quay of a coastal town. The guestbook on the counter opens to who Otis is, where Otis studies and how Otis works. |
| **The attic** | Skills | The roof space of the same house, crammed with potions, books and brass. Five clusters of artefacts stand for five kinds of skill; point at one and it rises and glows. |
| **The campfire** | Contact | A clearing at night. A winged copper postbox gives up a letter that is a contact form; the wooden tags hanging under it are links. |

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

- `/#/train`, `/#/bakery`, `/#/attic`, `/#/campfire`, `/#/train/seat-2`: open straight at a scene, or at one project's sheet.
- `?time=night` or `?time=day`: override the clock.
- `?mode=backdrop` or `?mode=roam`: force the phone or the desktop behaviour.

## Change what it says

- **About, skills, social links, e-mail address:** `src/content/site.ts`.
- **Projects:** `public/data/projects.json`. One entry per bench (there are four), each naming a GitHub repository as `owner/name` plus a title, a few words on what it is, a summary and a stack. Stars, forks, issues, languages, dates and the live address are not written here: they are fetched from GitHub when the seat is chosen.
- The LinkedIn tag in `src/content/site.ts` points at LinkedIn's front page until the real profile URL is filled in.

## Deploy

A static site: no server, no environment variables, no keys. On Vercel, import the repository and deploy; `vercel.json` names the framework, the build command and the output folder, and sets cache headers for the model and the data file. Any other static host works the same way: build, then serve `dist/`.

The generated model and the Draco decoder are committed, so the asset scripts do not run during a deploy.

## How it is put together

### The world is generated, then baked

There are no hand-modelled files. Everything that stands in the world is described in TypeScript in `src/lib/world/` as stacked, painted primitives, and `npm run world` bakes it into one Draco-compressed file:

```
public/assets/world.glb   55 named meshes, about 141,000 triangles, 6.7 MB -> 544 KB
```

- `kit.ts`: the modelling kit (blocks, posts, lumpy balls, extrusions, rings), each piece coloured per vertex.
- `terrain.ts`: the map. Where the line runs, where the town and the clearing are, how high the ground is anywhere. The bake and the app both ask it.
- `railway.ts`, `town.ts`, `interiors.ts`, `camp.ts`: the halt, the train and its interior; the coast, the quay, the houses; the bakery and the attic; the postbox and the fire.
- `spec.ts`: measurements the bake and the app share, such as where lettering goes on a sign.

`npm run draco` copies the glTF Draco decoder from three.js into `public/draco`, so decoding uses files served from this site and not a CDN. `npm run assets` does both.

### Loading

- The 3D code (three.js, R3F, drei, post-processing) is its own lazily loaded chunk. The title card paints from the small main chunk before it arrives.
- The model is preloaded with `useGLTF.preload` the moment that chunk is evaluated and read through Suspense; the lettering used inside the scene is awaited with React 19's `use()`. Project data is read with `useSuspenseQuery`.
- The loading state is a small watercolour sprout in the corner of the page (`src/components/ui/Sprout.tsx`). It grows while the Suspense fallback is mounted or while TanStack Query is fetching anything, and nothing else on the page moves or blanks.

### Painting

Described in full in [DESIGN.md](DESIGN.md). In short: `MeshToonMaterial` with a three-band, nearest-filtered gradient map; drei `<Outlines>` on every model; a watercolour wash and paint-bleed in the material's shader; a mirror sea; and a post-processing pass that adds paper grain, a ragged painted edge and the wash that carries one scene into the next.

### Devices

`useMode` in `src/hooks/useLayout.ts` is the capability check.

- **Roam** (a wide window with a pointer): a free camera on heavily damped `OrbitControls`, pointer parallax, the train travelling, a coloured light per attic cluster, shadows from the campfire.
- **Backdrop** (touch, a window under 1024 px, or modest hardware): fixed compositions with framings made for a tall screen, a wash to paper between scenes instead of a camera move, nothing repositioned at run time, fewer lights. The trail becomes a menu pinned to the bottom and panels become sheets that slide up.

If WebGL is not available at all, every word on the site is still reachable from the trail.

## Project layout

```
scripts/                 build-world.ts (bakes world.glb), copy-draco.mjs
public/
  assets/world.glb       the baked world
  data/projects.json     which repositories ride in the train
  draco/                 the Draco decoder
src/
  App.tsx                where the visitor is, what is open, the address, the theme
  content/site.ts        everything the site says about its owner
  hooks/                 the capability check; the project and GitHub queries
  lib/
    places.ts            the five scenes and their camera shots
    train.ts             where the train is and how it moves
    air.ts               the clock, wind, rain and night every shader reads
    world/               the generated world (see above)
  components/
    World.tsx            the canvas: reads the model, composes the scene
    three/               atmosphere and sky, sea, railway, town, camp, meadow, particles, camera rig, materials, the paper pass
    ui/                  title card, trail, panels, tickets and sheet, guestbook, inventory, letter, sprout
```

## Notes

- GitHub's API is used without a key, which allows about sixty requests an hour per visitor. Each sheet costs two and is cached for half an hour. When GitHub refuses, the sheet says so and offers to ask again.
- The first build of this site was a valley. It is kept under the git tag `valley-v1`.
- In development the scene is exposed as `window.__world`, so it can be stepped by hand (`__world.setFrameloop('never')`, then `__world.advance(seconds)`) when the browser has paused animation in a background tab.

## Credits

The world's mood draws on Studio Ghibli's films; the stills published at ghibli.jp were studied for composition, palette and light. Every model, texture and line of the world itself was made for this project. Fonts: Homemade Apple, Zen Antique Soft, Klee One and Yomogi, via Fontsource.
