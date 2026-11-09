# Eduardo Pereira · portfolio

**Live:** https://eduardo-pereira-dev.vercel.app

My portfolio as a walk. Scroll, and a low-poly me walks a road from Braga to Stockholm, telling the story in speech
bubbles, with signs for each chapter and project cards along the way. "About me" takes you to a campfire by the road
near the end, where you can click my things to hear about them.

Built with Next.js, React Three Fiber and three.js. The landscape and the walker are generated in Blender from Python
(`tools/blender/lowpoly`), with trees and rocks from the KayKit Forest Nature Pack.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit tests (Vitest)
npm run e2e     # browser tests (Playwright)
```

`npm run gen:lowpoly` rebuilds the 3D models in `public/models` (needs Blender at `/Applications/Blender.app`).

## Where things are

- `src/content/`: the words: the story (`stories.ts`), projects, stages, and the campfire's things (`about.ts`)
- `src/journey/`: the scroll-driven walk, its camera shots and time of day
- `src/about/`: the campfire
- `src/ui/`: the speech bubbles, menus and project cards
