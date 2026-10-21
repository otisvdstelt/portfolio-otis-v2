# Otis van der Stelt, portfolio

My portfolio is a train. You board it at a floating halt in the middle of a flat sea, the passenger car is the menu, and every section of the site is the same train fitted out for one thing. Take a window seat, let the fog roll over, and you are somewhere else.

## How I made it

- The page is React 19 and TypeScript, built with Vite.
- The look is Tailwind CSS v4. The torn paper, the wobbly pen lines and the ragged edges are all CSS and SVG filters, no images.
- The world is Three.js with React Three Fiber and drei. Nothing in it is hand modelled. Every bench, tin and lever is written as code in `src/lib/world`, and `npm run world` bakes it into one Draco compressed `.glb` with glTF Transform.
- The painting on top is my own postprocessing pass. It inks the edges, gives the picture a paper grain and rolls the fog across between scenes.
- The project pages read a list from `public/data/projects.json` and fetch the live figures from the GitHub API with TanStack Query.
- The handwriting is four Google Fonts, loaded through Fontsource.
- Linting is oxlint, hosting is Vercel.

## Run it

You need Node 22.18 or newer.

```bash
npm install
npm run dev      # start it
npm run build    # typecheck, then build
npm run preview  # look at the build
npm run lint
npm run world    # bake the world again after changing src/lib/world
```

## Small print

The code is mine and there is no licence on it yet, so please ask me before you reuse a piece of it. The mood of the world owes a lot to Studio Ghibli films, which I love, but nothing in here is theirs. The typefaces come from Google Fonts through Fontsource and keep their own licences.

There is no backend, no analytics and no cookies. The only thing the site stores is whether you chose day or night, and that stays in your own browser. The contact card opens your own mail app, so nothing is sent anywhere until you press send yourself.
