# Low-poly Walk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sprite-collage road and painted walker with one low-poly scene and figure built by Blender scripts and drawn live by Three.js, scroll-driven, lit as one day from morning to dusk.

**Architecture:** Blender scripts in `tools/blender/lowpoly/` build two GLBs: the landscape (`walk-scene.glb`) and the walker (`walker.glb`, with a `Walk` action). Both read the path from one JSON file shared with the web code. On the page, `LowpolyWalk` (R3F) loads them. Each frame it reads the journey position (`getScreens()`) and from it places the walker, the camera, the sun, the sky and the fog. The walk cycle is driven by distance, so scrolling up plays it backwards.

**Tech Stack:** Blender 4.x (headless, `/Applications/Blender.app/Contents/MacOS/Blender`), three 0.187, @react-three/fiber 9, @react-three/drei 10, Next 16.4.3, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-lowpoly-walk-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/` before writing Next code (AGENTS.md: this Next has breaking changes).
- Low-poly, flat shading, small palette. No landmarks, cities, flags, seasons, weather, snow, or photorealism.
- The camera is pulled back and higher behind the walker, who is small on the path. Keep the sky above and left of him clear for the card.
- One day: BSc (`braga`) = early morning, Deloitte (`porto`) = midday, MSc (`jonkoping`) = afternoon, `stockholm` = golden hour ending on dusk. The light blends continuously with scroll.
- Don't change content, cards, header or stage structure (`timeline.ts`, `stages.ts`, `src/ui/*`).
- Journey: `TOTAL_SCREENS` 7.5, the walk stops at `ENDING_START`. Reuse `getScreens`, `segmentStart`, `segmentAt` and `ENDING_START`; don't copy them.
- Scenes are built only by repo scripts, re-runnable with `npm run gen:lowpoly`. Never hand-edit a .blend.
- Asset budget: `walk-scene.glb` ≤ 3 MB and ≤ 150k triangles. `walker.glb` ≤ 500 KB.
- Restore the dependencies at the versions HEAD had: `three@^0.187.0`, `@react-three/fiber@^9.8.2`, `@react-three/drei@^10.7.9`, and dev `@types/three@^0.187.0`.

## Review Focus

1. **No WebGL, or a GLB that 404s:** the page still works and a CSS sky in the morning colours shows behind the cards (Task 4 test).
2. **Portrait phone (390×844):** no horizontal scroll, and the walker is visible below the card, not under it (Task 6 e2e).
3. **A big jump** (a header click from Braga to Stockholm, or a reload partway down): the scene snaps, the walk cycle doesn't spin through hundreds of steps, and the light jumps straight to the new time of day (Task 4 test on the rig's progress).
4. **Scroll past the end, rubber-band overscroll, or a negative position:** the walker and camera clamp at the ending, the scene stays put and dusk holds (Task 1 tests).
5. **`prefers-reduced-motion`:** no walk animation and no camera drift. The scene holds at each stage's start with that stage's light (Task 4 test).

---

### Task 1: Path, camera and daylight (pure TS)

**Files:**
- Create: `src/journey/lowpoly/path.json`, `src/journey/lowpoly/path.ts`, `src/journey/lowpoly/daylight.ts`
- Test: `src/journey/lowpoly/path.test.ts`, `src/journey/lowpoly/daylight.test.ts`
- Modify: `src/journey/progress.ts` (move `easeProgress` here from `memory/walk.ts`, together with its tests from `walk.test.ts`)

**Interfaces:**
- Produces:
  - `path.json`: `{ "points": [x, z][] }`. Ground-plane polyline with Y up, starting at `[0, 0]` and heading toward −Z, a gentle S-bend, total length ≥ 110 units. Blender (Task 2) reads this same file.
  - `UNITS_PER_SCREEN = 6`
  - `distanceAt(s: number): number`: `clamp(s, 0, ENDING_START) * UNITS_PER_SCREEN`
  - `pointAt(d: number): { x: number; z: number; heading: number }`: interpolates along the polyline by arc length, with `heading` in radians around Y, facing along the path
  - `cameraAt(s: number, aspect: number): { position: [number, number, number]; target: [number, number, number]; fov: number }`: 7 units behind the walker along the heading and 4 up, looking at a point 1 unit up and 3 units ahead. `fov` keeps a horizontal FOV of 60° for landscape and is capped at a vertical 75° for portrait.
  - `type Daylight = { skyTop: string; skyHorizon: string; sunColor: string; sunIntensity: number; sunElevation: number; sunAzimuth: number; ambientColor: string; ambientIntensity: number; fogColor: string; fogNear: number; fogFar: number }`. Colours are hex, angles in degrees.
  - `DAY: Record<StageId, Daylight>`: braga = morning (sun elevation ≈ 10°), porto = midday (≈ 55°), jonkoping = afternoon (≈ 30°), stockholm = dusk (≈ 4°, matching mockup A's purple-to-peach sky `#3b3a63`→`#f2c38f`)
  - `daylightAt(s: number): Daylight`: keys sit at each stage's midpoint, except stockholm's, which sits at `ENDING_START`. Values interpolate linearly between keys (colours in linear RGB) and clamp outside the first and last key.

- [ ] **Step 1: Write the failing tests**

`path.test.ts`:
- `distanceAt(-1) === 0`, `distanceAt(99) === distanceAt(ENDING_START)`, `distanceAt(NaN)` is finite (0)
- `pointAt(0)` is `{ x: 0, z: 0 }` (within 1e-6), and the heading points toward −Z
- across `s` from 0 to `ENDING_START` in steps of 0.01, consecutive `pointAt(distanceAt(s))` stay within 0.1 units of each other (no jumps)
- `cameraAt(s, 16/9).position` is higher than the walker by 4 ± 0.01. Its distance to the walker in the ground plane is 7 ± 0.01.
- `cameraAt(0, 390/844).fov <= 75` and `cameraAt(0, 16/9).fov < cameraAt(0, 1).fov`

`daylight.test.ts`:
- `daylightAt(0)` deep-equals `DAY.braga`, and `daylightAt(ENDING_START)` and `daylightAt(99)` deep-equal `DAY.stockholm`
- sun elevation: braga < porto, porto > jonkoping > stockholm
- continuity: between `s` and `s + 0.01`, `sunElevation` changes by < 1° everywhere
- readability: the relative luminance of `skyTop` is ≤ 0.6 for every key

- [ ] **Step 2: Run them and confirm they fail:** `npx vitest run src/journey/lowpoly` → FAIL (modules missing)
- [ ] **Step 3: Implement `path.json`, `path.ts` and `daylight.ts` as specified, and move `easeProgress` into `progress.ts`, updating its import in `MemoryWalk.tsx`**
- [ ] **Step 4: Run** `npx vitest run src/journey` → PASS
- [ ] **Step 5: Commit** `feat(lowpoly): path, camera and daylight for the low-poly walk`

### Task 2: Blender landscape → `walk-scene.glb`

**Files:**
- Create: `tools/blender/lowpoly/common.py` (setup, flat-colour material from hex, `out_path()`, `read_path()`, join-by-material, `shade_flat`, export helper). The style follows the deleted `tools/blender/landmarks/common.py`, which you can see with `git show HEAD:tools/blender/landmarks/common.py`, but uses flat shading and no bevels.
- Create: `tools/blender/lowpoly/scene.py`
- Test: `src/assets-lowpoly.test.ts` (node environment; reads the GLB JSON chunk the same way `git show HEAD:src/assets-landmarks.test.ts` does)
- Modify: `package.json`, adding the script `"gen:lowpoly": "B=/Applications/Blender.app/Contents/MacOS/Blender; $B -b -P tools/blender/lowpoly/scene.py -- public/models/walk-scene.glb && $B -b -P tools/blender/lowpoly/walker.py -- public/models/walker.glb"` (the walker script lands in Task 3, so run only the scene half until then)

**Interfaces:**
- Consumes: `src/journey/lowpoly/path.json`
- Produces: `public/models/walk-scene.glb` with Y up, the path at y = 0, and top-level nodes named exactly `ground`, `path`, `trees`, `rocks`, `mountains`, `clouds`. Each node is one joined mesh with one primitive per material. Everything casts and receives shadows on the web side, except `mountains` and `clouds`.

Scene content (the spec's scenery kit):
- **Ground:** subdivided plane following the path, ±60 units wide and the path's length plus 60. Gentle random height (≤ 1.5) that rises away from the path and stays flat within 2 units of it. Faces stay faceted.
- **Path:** a 2.4-wide dirt strip along the polyline, 0.02 above the ground.
- **Trees:** 4 variants (cone pine, two-tier pine, round broadleaf as an icosphere at subdivision 1, and a slim poplar), each with a trunk. Scatter them with a fixed seed, at least 3 units from the path, sparser near the camera's side of the path so the sky stays open. Random yaw, scale 0.8–1.3.
- **Rocks:** low-subdivision icospheres with randomly moved vertices, a few dozen.
- **Mountains:** a ring of tall faceted peaks 80–120 units away. They're for silhouettes only, so the fog does the depth.
- **Clouds:** 3 shapes of clustered icospheres, high and far.

- [ ] **Step 1: Write the failing test** `src/assets-lowpoly.test.ts > walk-scene.glb`:
  - the file exists and is ≤ 3 MB
  - the node names include all six listed above
  - the triangle count, summed over the index accessors, is ≤ 150 000
  - the `path` node's bounds span at least 100 units along Z
- [ ] **Step 2: Run** `npx vitest run src/assets-lowpoly.test.ts` → FAIL (no file)
- [ ] **Step 3: Implement `common.py` and `scene.py`, then run the scene half of `gen:lowpoly`** → output includes `wrote public/models/walk-scene.glb`
- [ ] **Step 4: Run the test** → PASS
- [ ] **Step 5: Commit** the scripts, the GLB, the test and package.json: `feat(lowpoly): Blender-built landscape`

### Task 3: Blender walker → `walker.glb`

**Files:**
- Create: `tools/blender/lowpoly/walker.py`
- Modify: `src/assets-lowpoly.test.ts`, adding `walker.glb` checks

**Interfaces:**
- Produces: `public/models/walker.glb`. The figure is 1.8 ± 0.1 units tall, stands at the origin facing −Z, with its feet at y = 0. It's low-poly boxes and prisms: dark jacket `#1f2430`, jeans `#4a6a96`, dark hair, skin tone hands and neck. The armature has a looping animation named exactly `Walk`, 24 frames at 24 fps. `STRIDE_UNITS = 1.4` is the ground covered per cycle and is exported for the web as `export const STRIDE_UNITS = 1.4` in `path.ts`.

- [ ] **Step 1: Write the failing test** `walker.glb`: the file is ≤ 500 KB, `animations` has an entry named `Walk`, and the mesh bounds are 1.7–1.9 high
- [ ] **Step 2: Run it** → FAIL
- [ ] **Step 3: Implement `walker.py`** (hand-keyed walk: legs swing ±25°, arms in opposite phase ±18°, a 0.03 hip bob twice per cycle) **and run the full `npm run gen:lowpoly`**
- [ ] **Step 4: Run** `npx vitest run src/assets-lowpoly.test.ts` → PASS
- [ ] **Step 5: Commit** `feat(lowpoly): walker figure with walk cycle`

### Task 4: `LowpolyWalk` on the page

**Files:**
- Modify: `package.json`, restoring the four dependencies (Global Constraints), then `npm install`
- Create: `src/journey/lowpoly/LowpolyWalk.tsx`, `src/journey/lowpoly/LowpolyWalk.module.css`, `src/journey/lowpoly/Quiet.tsx` (restore it from `git show HEAD:src/journey/scene/Quiet.tsx`)
- Create: `src/journey/lowpoly/rig.ts`
- Test: `src/journey/lowpoly/LowpolyWalk.test.tsx`, `src/journey/lowpoly/rig.test.ts`
- Modify: `src/app/page.tsx` (`<MemoryWalk />` → `<LowpolyWalk />`)

**Interfaces:**
- Consumes: `distanceAt`, `pointAt`, `cameraAt`, `daylightAt`, `STRIDE_UNITS` (Task 1/3); `easeProgress`, `getScreens` (`progress.ts`); `segmentAt`, `segmentStart` (`timeline.ts`)
- Produces:
  - `rig.ts`: `nextPosition(shown: number, target: number, reducedMotion: boolean): number`. With reduced motion it returns `segmentStart(segmentAt(target))`. Otherwise it returns `easeProgress(shown, target)`.
  - `rig.ts`: `walkTime(s: number): number`, which is `(distanceAt(s) / STRIDE_UNITS) % 1` in cycle units, kept non-negative
  - `LowpolyWalk(): JSX.Element`: the fixed full-screen layer, `aria-hidden`, with the canvas wrapped in `Quiet`

Rendering:
- `<Canvas shadows dpr={[1, 2]}>`. The sky is an inverted sphere with a two-colour vertical gradient shader (`skyTop` → `skyHorizon`), and `fog` is linear `fogColor`/`fogNear`/`fogFar`.
- One `directionalLight` with shadows follows `sunElevation`/`sunAzimuth`, and its shadow camera follows the walker. Add a `hemisphereLight` for ambient.
- Low-power fallback: `matchMedia("(max-width: 640px)")` means the sun angle stays at `DAY.porto`, while the colours still follow `daylightAt`.
- The walker uses drei's `useAnimations` with the `Walk` action paused. Each frame sets `action.time = walkTime(p) * clip.duration`. The camera comes from `cameraAt(p, aspect)`.
- The CSS background of the layer is a gradient from `DAY.braga.skyTop` to `DAY.braga.skyHorizon`, so the morning sky shows before WebGL loads or if it fails.

- [ ] **Step 1: Write the failing tests**
  - `rig.test.ts`:
    - `nextPosition(0, 5, false) === 5` (a big jump snaps)
    - `nextPosition(2, 2.1, false)` lies strictly between 2 and 2.1
    - `nextPosition(0, 3.3, true) === segmentStart(segmentAt(3.3))`
    - `walkTime(-1) === 0`
    - `walkTime(s)` is in [0, 1) for s in [0, 10]
  - `LowpolyWalk.test.tsx`: mock `@react-three/fiber` `Canvas` to throw, the same way `git show HEAD:src/journey/scene/JourneyCanvas.test.tsx` does. Render it next to `<p>still here</p>` and assert that it doesn't throw, that "still here" is in the document, and that the root has `aria-hidden="true"`.
- [ ] **Step 2: Run** `npx vitest run src/journey/lowpoly` → FAIL
- [ ] **Step 3: Implement `rig.ts`, `LowpolyWalk.tsx` and the CSS, and swap it into `page.tsx`**
- [ ] **Step 4: Run** `npx vitest run` → PASS. Then run `npm run dev` and check http://localhost:3000 at 1440×900: the walker is on the path, small, and below the card.
- [ ] **Step 5: Commit** `feat(lowpoly): live low-poly walk on the page`

### Task 5: Checkpoint: four stills for Eduardo

**Files:**
- Create: `tools/lowpoly/stills.mjs`. It uses Playwright, which is already a dev dependency, to open `localhost:3000` at 1440×900, scroll to the midpoint of each stage (and to `ENDING_START` for stockholm) with the e2e's `SCROLL_PER_SCREEN` maths, wait for 2 animation frames, and screenshot.
- Output: `docs/superpowers/specs/mockups/lowpoly-{morning,midday,afternoon,dusk}.png`

- [ ] **Step 1: Run** `node tools/lowpoly/stills.mjs` with the dev server up → 4 PNGs written
- [ ] **Step 2: Commit** `chore(lowpoly): stills for the time-of-day review`
- [ ] **Step 3: STOP. Show Eduardo the four stills.** Tune `DAY`, the scenery density and the camera offsets from his feedback by editing Task 1/2 values and re-running `gen:lowpoly` and the stills, until he approves. Don't start Task 6 before he approves.

### Task 6: Mobile, cleanup and e2e

**Files:**
- Delete:
  - `src/journey/memory/` (MemoryWalk, road, walk and their tests and CSS; `easeProgress` already moved in Task 1)
  - `public/road/`, `public/walk/`, `public/walk-cartoon/`, `tools/road/`
  - the `gen:road`, `gen:walk` and `gen:walk-cartoon` scripts in `package.json`. Also delete `tools/walk/` if nothing else references it: check with `grep -r "tools/walk" --exclude-dir=node_modules .`
- Modify: `src/assets.test.ts`, removing the walk-frame and road checks if any reference the deleted files
- Modify: `e2e/journey.spec.ts`

- [ ] **Step 1: Write the failing e2e tests** in `e2e/journey.spec.ts`:
  - `"on a 390×844 phone the page doesn't scroll sideways"`: `page.setViewportSize({ width: 390, height: 844 })`, scroll to 2 screens, and assert `document.documentElement.scrollWidth <= 390`
  - `"the scene draws a canvas behind the intro"`: `page.locator("canvas")` is attached within 5 s, and the heading "Eduardo Pereira" is visible
- [ ] **Step 2: Run** `npx playwright test e2e/journey.spec.ts` → the new tests FAIL, or the overflow test passes already. If it passes already, keep it as a guard.
- [ ] **Step 3: Do the deletions and fix any overflow** (on the layer: `overflow: hidden` and `inset: 0`; never a fixed px width)
- [ ] **Step 4: Run** `npx vitest run && npx playwright test && npm run lint && npm run build` → all PASS. `grep -rn "style=painted\|road/\|walk-cartoon" src` returns nothing.
- [ ] **Step 5: Commit** `refactor(lowpoly): remove the sprite road and painted walker`
