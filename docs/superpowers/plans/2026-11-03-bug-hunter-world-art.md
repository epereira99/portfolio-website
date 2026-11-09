# Bug Hunter World Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the greybox at `/world` with PixelLab pixel art (hunter, terrain, places, props, board close-up, scroll), all on one 16 px grid and one master palette.

**Architecture:** PixelLab generates the raw art into `art/raw/`. A normalizer script (sharp) snaps it to the pixel grid and the master palette and writes the art pack to `public/world/art/`. `tools/world/make-map.mjs` lays out a smaller map: it autotiles the ground from PixelLab's Wang tilesets, adds a `solid` collision layer and places art objects. `WorldScene` draws the tilesets, objects and an animated hunter sprite, sorted by depth.

**Tech Stack:** Next 16, Phaser 4.2.1, Tiled `.tmj`, sharp (already installed by Next; declared as a devDependency here), vitest, Playwright, PixelLab MCP.

**Spec:** `docs/superpowers/specs/2026-11-03-art-design.md` (decision log: `2026-11-03-art-direction-notes.md`; parent: `2026-11-03-bug-hunter-world-design.md`)

## Global Constraints

- 16×16 tiles; view 20×13 tiles (`src/world/config.ts`); integer scaling, `image-rendering: pixelated`.
- One master palette, 32–48 colours: every pixel in `public/world/art/` must be one of them, or fully transparent.
- PixelLab `standard` / `v3` modes only. No `pro` mode. Budget: 40 generations + 5/day bonus; about 30 planned. Check `get_balance` before each generation task.
- Characters use the "low top-down" view.
- Text is never baked into images. Posters, scroll, signs and menus stay HTML/dialogue.
- No Witcher or Pokémon assets, names or characters. No wolf medallion; the hunter's medallion is a beetle.
- Hunter: **white hair**, beard, green hooded cloak, dark leather harness, brown boots, beetle medallion (1–2 gold px), **two swords crossed on the back** in every direction, black outline, about 24×32 px.
- Mood: late afternoon, light overcast; muted earthy colours; red only for seals and pins. Portugal is warm (terracotta, dry golden grass); Sweden is cool (green grass, dark pines, red timber).
- NPC art, sound, the final UI frame and the board's real surroundings are out of scope.
- Every task that changes what you see ends with Eduardo's visual review at `/world`. Don't mark it done before he approves.

## Review Focus

1. **The hunter walks above a building's base** (behind the roof). Expected: the roof hides him, and he appears in front again once he's below its base. Depth is by feet y. Test: Task 5 Step 1.
2. **A PixelLab image with soft, anti-aliased edges or near-miss colours.** Expected: the normalizer outputs only palette colours and alpha of 0 or 255. Test: Task 1 Step 1.
3. **A new art file added without running the normalizer.** Expected: the test suite fails and names the file. Test: Task 1 Step 1 (`art pack is on palette`).
4. **The relayout leaves a door or travel point boxed in by a building's solid footprint.** Expected: every travel point is still reachable from spawn. Test: Task 4 Step 1.
5. **A ground cell whose corners mix three terrains** (path meeting the river at the bridge). Expected: a valid tile, never an empty gap. Test: Task 4 Step 1.

---

### Task 1: Master palette and normalizer

**Files:**
- Create: `art/palette.hex` (one `rrggbb` per line, 32–48 lines)
- Create: `tools/art/normalize.mjs`
- Create: `tools/art/normalize.test.ts`
- Modify: `package.json` (devDependency `sharp`, script `"art:normalize": "node tools/art/normalize.mjs"`)

**Interfaces:**
- Produces: `normalize(input: Buffer, palette: [number,number,number][]): Promise<Buffer>`, which returns a PNG; `readPalette(path?: string): [number,number,number][]` (defaults to `art/palette.hex`). CLI: `npm run art:normalize -- <in.png> <out.png>`.

- [ ] **Step 1: Write the failing tests** in `tools/art/normalize.test.ts` (`// @vitest-environment node`), building inputs with `sharp({create})` / raw buffers:
  - `snaps a 3× upscaled image back to its true pixels`: a 4×4 image of palette colours upscaled 3× by nearest neighbour → output is 4×4 and identical pixel-for-pixel.
  - `maps near-miss colours to the nearest palette colour`: a pixel at palette[0] + (6,−5,4) → exactly palette[0].
  - `makes alpha binary`: alpha 100 → 0; alpha 200 → 255.
  - `leaves a native-size image at its size`: an 8×8 with no repeated blocks stays 8×8.
  - `art pack is on palette`: every `public/world/art/**/*.png` has only palette colours (or alpha 0). The failure message names the file. It passes trivially while the folder is empty.
- [ ] **Step 2: Run** `npx vitest run tools/art/normalize.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Write `art/palette.hex`** (mood above: mud browns, mossy and cool greens, dry golds, grey stone, weathered timber, terracotta, river blues, skin tones, near-white for hair, black outline, the seal red) and **implement `normalize`**: detect the largest integer block size `k` where every k×k block is a single colour (allowing ±8 per channel for JPEG noise); downscale by `k` with nearest neighbour; binarize alpha at 128; map each opaque pixel to the nearest palette colour by weighted RGB distance (2,4,3).
- [ ] **Step 4: Run** `npx vitest run tools/art/normalize.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(art): master palette and normalizer`.

### Task 2: Terrain tilesets (generation)

Generated before the hunter so his grass check uses the real grass. This swaps spec §7 steps 2 and 3 for that reason only.

**Files:**
- Create: `art/raw/tilesets/*.png|json` (PixelLab downloads), `public/world/art/terrain.png` (one sheet of every normalized set, 16 px tiles, one set per row of 16), `art/tilesets.json`

**Interfaces:**
- Produces: `art/tilesets.json` = `{ "sets": [{ "name": "water-grass", "lower": "water", "upper": "grass", "row": 0, "tiles": [{ "index": 0..15, "corners": ["lower"|"upper", x4 in NW,NE,SW,SE order] }] }] }`. `firstgid` of the terrain tileset in the map is 1; gid = `row*16 + index + 1`.

- [ ] **Step 1:** `get_balance`, then `create_topdown_tileset` (standard, 16 px, `transition_size: 0`), chained through base tile IDs, in this order: `water`→`grass` (cool green Swedish grass), `grass`→`dirt path`, `grass`→`dry golden grass`, `dry golden grass`→`dirt path`, `grass`→`crop field rows`. That's 5 generations. Terrain descriptions should say "muted, earthy, overcast late afternoon".
- [ ] **Step 2:** Download each via `get_topdown_tileset`, save it to `art/raw/tilesets/`, and write its corner metadata into `art/tilesets.json` in the shape above. If PixelLab's metadata uses other names, convert them here.
- [ ] **Step 3:** Normalize each set and stack them into `public/world/art/terrain.png`. Run `npx vitest run tools/art`. Expected: PASS (on palette).
- [ ] **Step 4:** Show Eduardo the five sets side by side (a scratch HTML page at 4× scale) for approval. Re-roll at most one set without asking him.
- [ ] **Step 5: Commit** `feat(art): terrain tilesets`.

### Task 3: The hunter (generation)

**Files:**
- Create: `art/raw/hunter/*`, `public/world/art/hunter.png`
- Modify: `src/world/config.ts` (art pack constants)

**Interfaces:**
- Produces in `config.ts`: `ART_DIR = "/world/art"`, `HUNTER_FRAME = { w: number, h: number }` (the final canvas), `WALK_FRAMES: number`. Sheet layout: rows `down, left, right, up` (the `Dir` order used by `buttons.ts`); column 0 = standing, columns 1..WALK_FRAMES = walk.

- [ ] **Step 1:** Crop the front figure (left third) of `art/references/eduardo-witcher.jpeg` to a PNG in the scratchpad. `image_to_pixelart` it with `faithful: true`, `init_image_strength: 200`, output about 24×32 (1 generation).
- [ ] **Step 2:** In `pixelart_workbench` (free): recolour the hair and beard to near-white palette greys, remove the hip sword, make sure two crossed hilts show over the shoulders, add a black outline and a 1–2 px gold beetle medallion. Normalize.
- [ ] **Step 3: Grass gate.** Composite the south sprite on a 5×3 patch of the grass tile from `terrain.png` at 4×. Show Eduardo. If he doesn't read clearly, adjust the colours in the workbench and repeat. **Don't continue without his OK.**
- [ ] **Step 4:** `create_character` with `mode: "v3"`, `reference_image_url` (upload via `get_upload_url`), `n_directions: 4`, `view: "low top-down"`, with the description from Global Constraints (about 2 generations). Check that east, west and north keep the white hair, cloak and crossed swords. Fix small slips in the workbench.
- [ ] **Step 5:** `animate_character` with `template_animation_id: "walking-6-frames"` for 4 directions (about 4 generations). Set `WALK_FRAMES = 6`.
- [ ] **Step 6:** Normalize every frame, assemble `public/world/art/hunter.png` in the sheet layout, and set the `config.ts` constants. Run `npx vitest run tools/art`. Expected: PASS.
- [ ] **Step 7: Commit** `feat(art): the hunter, 4 directions and walk cycle`.

### Task 4: Smaller map, autotiled ground and a collision layer

**Files:**
- Create: `tools/world/wang.mjs`, `tools/world/wang.test.ts`
- Modify: `tools/world/make-map.mjs`, `src/world/map.test.ts`, `public/world/world.tmj` (regenerated)

**Interfaces:**
- Consumes: `art/tilesets.json` (Task 2).
- Produces: `pickTile(corners: [Terrain,Terrain,Terrain,Terrain], sets): number` (a gid), where `Terrain = "water"|"grass"|"dry"|"path"|"crops"`. The `.tmj` gains a tile layer `solid` (1 = blocked, 0 = open) next to `ground` and `objects`. The `terrain` tileset is `firstgid: 1`, image `art/terrain.png`. Objects gain an `art` property (the file name in `public/world/art/objects/`, without `.png`) and, for art objects, `width`/`height` in px. Each object's solid footprint is its bottom row(s) only, as listed in `make-map.mjs`.

- [ ] **Step 1: Write the failing tests.**
  - `wang.test.ts`: `picks the full upper tile when all corners are upper`; `picks the tile whose corners match a mixed cell`; `a cell mixing three terrains still gets a tile` (water/path/grass → a water-grass tile, with path counted as grass).
  - `map.test.ts`: switch blocking from tile ids `[3,5,6,7]` to the `solid` layer. Add `every travel point is within 45 steps of spawn` (BFS distance; about 7 s of walking). Add `a place-name sign reads Sweden on the spawn bank and Portugal across the river`. Add `direction signs and place-name signs use different art`. Keep the three existing tests.
- [ ] **Step 2: Run** `npx vitest run tools/world src/world/map.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `pickTile`**: map any terrain outside a chosen set's pair to that set's `upper` grass-type terrain, then look up the exact corner match. **Rework `make-map.mjs`**:
  - Corner-terrain grid (W+1 × H+1), autotiled via `pickTile`. Map about 48×32 *(Claude's call, inside "smaller")*. River near the middle with the bridge.
  - A 2-tile green grass strip on both banks, so dry grass never meets water. Portugal west of the river is dry grass, Sweden east is grass, and Jordbruksverket gets a crops patch.
  - Places pulled closer together. Spawn/board/sign layout around the bridge as today.
  - Signs get `look: "place"` (texts `Sweden`, `Portugal`) or `look: "direction"`. Direction texts list Deloitte, BSc Computer Science, Saab, MSc AI, plus the remaining places.
  - The `solid` layer covers water, trees and object footprints.
  - Objects use the 1×1 greybox `art` names until Task 6 supplies the art.
- [ ] **Step 4: Run** `npm run gen:world && npx vitest run`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat(world): smaller autotiled map with a collision layer`.

### Task 5: Scene draws the art pack

**Files:**
- Create: `src/world/depth.ts`, `src/world/depth.test.ts`
- Modify: `src/world/WorldScene.ts`, `e2e/world.spec.ts` (only if selectors change)

**Interfaces:**
- Consumes: `ART_DIR`, `HUNTER_FRAME`, `WALK_FRAMES` (Task 3); the `solid` layer, `art`/`width`/`height` object props and `terrain.png` (Task 4).
- Produces: `depthOf(feetY: number): number` in `depth.ts` (the hunter and every art object use the bottom edge of their footprint).

- [ ] **Step 1: Write the failing test** `depth.test.ts`: `a hunter standing above a building's base draws behind it` (`depthOf(hunterFeet) < depthOf(buildingBase)` when the hunter's tile is above the base row); `below it, he draws in front`.
- [ ] **Step 2: Run** `npx vitest run src/world/depth.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `depthOf` is the feet y in pixels. In `WorldScene`:
  - Delete the greybox colours and `drawHunter`.
  - Preload `terrain.png` and `hunter.png` (spritesheet, `HUNTER_FRAME`) and each object's `art`.
  - Collision reads the `solid` layer instead of `BLOCKING_TILES`; objects no longer block by their tile. The interaction lookup is unchanged.
  - The hunter is a sprite, origin (0.5, 1), at tile centre-x and tile bottom. One walk animation per `Dir`, cycling once per 2 steps (`frameRate = WALK_FRAMES * 1000 / (2 * STEP_MS)`). It plays while moving and shows the standing frame when stopped or turning in place. Depth is updated each step.
  - Objects missing art keep the greybox rectangle, so the world works mid-task.
- [ ] **Step 4: Run** `npx vitest run && npm run lint && npm run e2e`. Expected: PASS.
- [ ] **Step 5: Visual review:** walk spawn → bridge → both banks at desktop and phone-portrait sizes. Eduardo approves the hunter's walk and the ground.
- [ ] **Step 6: Commit** `feat(world): draw the art pack, animated hunter, depth sorting`.

### Task 6: Places and props, area by area

One loop per area, in this order: **(a)** spawn area: main board, place-name and direction signs, bridge, pines; **(b)** Sweden: current house (red timber), JU fortress (bigger and grander than UMinho), Saab military compound, Jordbruksverket farm (fields + animals), Effektify guild hall; **(c)** Portugal: childhood house (cosy, terracotta), UMinho fortress, Deloitte corporate building, a warm Portuguese tree. Small boards for each place with contracts, plus rocks and bushes as filler.

**Files:**
- Create: `art/raw/objects/*`, `public/world/art/objects/*.png`
- Modify: `tools/world/make-map.mjs` (art names, sizes, footprints), `public/world/world.tmj`

**Interfaces:**
- Consumes: the object `art` prop and footprint convention (Task 4), the depth sorting (Task 5).

For each area:
- [ ] **Step 1:** `get_balance`. Generate the area's landmarks with `create_map_object` (`view: "low top-down"`, sizes in multiples of 16, mood and bank colours in the description). **Check the first call's cost.** If it's above 1, stop and re-plan the remaining budget with Eduardo. A village's 3–4 houses reuse one generated house, varied in the workbench. Draw signs, small props, crops and animals in the workbench when that's good enough. Place-name signs must look clearly different from direction signs.
- [ ] **Step 2:** Normalize into `public/world/art/objects/`, wire names, sizes and footprints in `make-map.mjs`, then run `npm run gen:world && npx vitest run`. Expected: PASS.
- [ ] **Step 3: Visual review** of the area at `/world` with Eduardo. Re-do anything he rejects before moving on.
- [ ] **Step 4: Commit** `feat(art): <area> places and props`.

### Task 7: Board close-up, wanted posters, scroll frame

**Files:**
- Create: `public/world/art/board.png`, `public/world/art/scroll.png`
- Modify: `src/world/ui/BoardView.tsx`, `src/world/ui/Scroll.tsx`, `src/world/ui/ui.module.css`, `src/world/ui/Overlay.test.tsx`

**Interfaces:**
- Consumes: `contractsFor`, `villageLabel` (existing, unchanged).

- [ ] **Step 1: Write the failing test** in `Overlay.test.tsx`: `each pinned contract is a wanted poster`. Each paper button shows the heading `HUNTER WANTED` *(Claude's call for the heading copy)*, the title and the village; finished contracts show the seal; the accessible name is unchanged (`village · title`).
- [ ] **Step 2: Run** `npx vitest run src/world/ui`. Expected: FAIL.
- [ ] **Step 3: Generate** `board.png`: a weathered timber notice board with a small shingle roof on two posts, with plain pines and grass behind, at the board view's aspect (1–2 generations, normalized). Draw `scroll.png` in the workbench (parchment with a curled top-left corner and a rolled bottom; 0 generations; nine-slice friendly).
- [ ] **Step 4: Implement:** `BoardView` backdrop = `board.png` (pixelated, integer-scaled) replacing the dusk/cork CSS. Papers become posters: heading, then the logo in the portrait spot (the existing `logoSlot`), then title and village, with a red wax seal for `done`. Keep the lift + outline on the selected poster. `Scroll` uses `scroll.png` via `border-image` instead of the CSS parchment. All text stays HTML.
- [ ] **Step 5: Run** `npx vitest run && npm run e2e`. Expected: PASS. **Visual review** of the board and a scroll on desktop and phone with Eduardo.
- [ ] **Step 6: Commit** `feat(art): board close-up, wanted posters, scroll frame`.

### Task 8: Whole-world review

- [ ] **Step 1:** `npx vitest run && npm run lint && npm run build && npm run e2e`. Expected: all pass.
- [ ] **Step 2:** Walk the whole world with Eduardo (desktop + phone portrait). Fix anything that looks off. Record the generations spent and the remaining balance in `2026-11-03-art-direction-notes.md`.
- [ ] **Step 3: Commit** `chore(art): world art pass complete`.
