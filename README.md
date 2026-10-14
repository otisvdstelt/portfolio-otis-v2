# Otis van der Stelt: portfolio

A portfolio you travel through. One hand-painted (from studio ghibli) train crossing a flat sea: you board it at a floating halt, the passenger car is the main menu, and each section of the site is the same train fitted out for one thing, reached by taking a window seat and letting the fog roll over.

Built with Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, React Three Fiber, drei and TanStack Query.

## Run it

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

Node 22.18 or newer is needed (Vite 8, and `npm run world` runs a TypeScript file directly).

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

## Credits

The world's mood draws on Studio Ghibli's films