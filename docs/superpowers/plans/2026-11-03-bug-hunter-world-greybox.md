# Bug Hunter World: Phase 1 (Greybox World) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable greybox version of the bug-hunter world at `/world`: walk a tile map with a river and bridge, read contracts from boards (close-up → scroll), talk to NPCs and signs, use the Start menu (Contracts / Map / Hunter / Send a raven), on keyboard and touch. All of it runs on placeholder art and real content data.

**Architecture:** Phaser draws only the tile world and the hunter. Every screen with text (dialogue, board close-up, scroll, menu, panels) is a React overlay driven by one pure state machine, `reduce(view, button)`, held in a tiny external store, the same pattern as `src/ui/useOpenProject.ts`. Keyboard and touch both feed one `buttons` module. Phaser moves the hunter only while the view is `world`, and it reports interactions to the store. Content lives in `src/content/` data files. The map is a Tiled `.tmj` generated from an ASCII layout and validated by a test.

**Tech Stack:** Next.js 16.4 (App Router), React 19, Phaser 4.2.1, Vitest + Testing Library, Playwright, CSS Modules, `next/font/google` (Pixelify Sans).

**Spec:** `docs/superpowers/specs/2026-11-03-bug-hunter-world-design.md`

**Scope:** spec §9 phase 1 only. The art pipeline (phase 3) and the swap to `/`, the `/about` redirect and deleting the 3D code (phase 4) get their own plans. Phase 2 is Eduardo writing content.

## Global Constraints

- Work on branch `feat/bug-hunter-world`, created from `feat/memories`. The 3D journey at `/` stays untouched and live in this phase. Its tests must keep passing.
- Read `node_modules/next/dist/docs/` before writing Next code (AGENTS.md). Dynamic route `params` is a `Promise`. `next/dynamic` with `ssr: false` only works inside a Client Component.
- The game lives at `/world` in this phase. Each contract has the route `/contracts/[slug]`. Both paths come from `src/world/config.ts` (`WORLD_PATH`, `contractPath()`), so the later swap to `/` changes one line.
- GBA screen: 240×160 px, 16×16 px tiles, whole-number zoom only, `pixelArt: true`, `image-rendering: pixelated`. No blurry pixels.
- Movement: one tile per step, `STEP_MS = 160` per tile, constant speed, linear, no easing. *(Value is Claude's call from "snappy".)*
- Controls: arrows/WASD = D-pad, Z/Enter/Space = A, X/Escape/Backspace = B, Shift/M = Start. On touch: on-screen D-pad + A/B + Start.
- One contract = one project. A contract belongs to one or more places. The main board holds all contracts, and local boards hold their place's contracts.
- Scroll header: title, Village, Date, Duration, logo slot. Body: Reason, Goal, Work. Finished contracts show a red wax seal.
- An NPC with `approved: false` never appears.
- Start menu items, in order and with this exact wording: `Contracts`, `Map`, `Hunter`, `Send a raven`.
- No Pokémon or Witcher assets or names. Greybox art is generated in code (coloured tiles), not image files.
- New dependency: `phaser@4.2.1` only.

## Review Focus

1. **Deep link to an unknown slug** (`/contracts/nope`): expect a 404, not a crash or an empty scroll. Tests in Tasks 4, 9 and 11.
2. **Keys held or pressed while an overlay is open** must not move the hunter, and the same A press that opens the board must not also select a paper. Tests in Task 3 (`reduce` only reacts to presses, one view change per press) and Task 6 (the scene gates on `view.kind === "world"`).
3. **Browser Back after opening a scroll** closes the scroll and returns to its board, on the same paper. Tests in Tasks 4 and 11.
4. **Portrait phone (390×844) and very small windows**: zoom stays ≥ 1, and the touch controls stay on screen below the game. Tests in Task 5 (`integerZoom`), with a device check in Task 10.
5. **Walking into walls, water, objects or the map edge**: the hunter turns to face that way but doesn't move or jitter, and every place stays reachable from spawn across the bridge. Tests in Task 5 (`step`) and Task 7 (reachability).

---

### Task 1: Places, contracts and NPC data

**Files:**
- Create: `src/content/places.ts`, `src/content/contracts.ts`, `src/content/npcs.ts`
- Test: `src/content/world-content.test.ts`

**Interfaces:**
- Produces:
  - `type PlaceId = "childhood-house" | "uminho" | "deloitte" | "current-house" | "ju" | "saab" | "jordbruksverket" | "effektify"`
  - `type Place = { id: PlaceId; name: string; city?: string; side: "portugal" | "sweden"; degree?: string }`, `PLACES: Place[]`, `placeById(id: PlaceId): Place`
  - `type Contract = Project & { places: PlaceId[]; date: string; duration: string; reason: string; goal: string; work: string; done: boolean }`, `CONTRACTS: Contract[]`, `contractBySlug(slug: string): Contract | undefined`, `contractsFor(place: PlaceId | "all"): Contract[]`, `villageLabel(c: Contract): string` (the name of `c.places[0]`, plus ` · city` when it has a city)
  - `type Npc = { id: string; name: string; place: PlaceId; line: string; approved: boolean }`, `NPCS: Npc[]`, `visibleNpcs(list: Npc[] = NPCS): Npc[]`

- [ ] **Step 1: Write the failing tests**

```ts
import { PLACES, placeById } from "./places";
import { CONTRACTS, contractBySlug, contractsFor, villageLabel } from "./contracts";
import { PROJECTS } from "./projects";
import { visibleNpcs } from "./npcs";

test("the world has two houses, two academies and four villages split by the river", () => {
  const side = (s: string) => PLACES.filter((p) => p.side === s).map((p) => p.id);
  expect(side("portugal")).toEqual(["childhood-house", "uminho", "deloitte"]);
  expect(side("sweden")).toEqual(["current-house", "ju", "saab", "jordbruksverket", "effektify"]);
  expect(placeById("uminho").degree).toBe("bsc-computer-science");
  expect(placeById("ju").degree).toBe("msc-ai-engineering");
});

test("every project is exactly one contract", () => {
  expect(CONTRACTS.map((c) => c.slug)).toEqual(PROJECTS.map((p) => p.slug));
});

test("contracts belong to their places, and the academy shares Saab and Jordbruksverket work", () => {
  const slugs = (p: Parameters<typeof contractsFor>[0]) => contractsFor(p).map((c) => c.slug);
  expect(slugs("deloitte")).toEqual(["mambu-migration", "azure-ml-integrations"]);
  expect(slugs("ju")).toEqual(["unet-segmentation", "saab-thesis"]);
  expect(slugs("saab")).toEqual(["saab-thesis"]);
  expect(slugs("jordbruksverket")).toEqual(["unet-segmentation"]);
  expect(slugs("current-house")).toEqual(["financial-hub"]);
  expect(slugs("effektify")).toEqual(["effektify-reconciliation"]);
  expect(slugs("childhood-house")).toEqual([]);
  expect(slugs("all")).toHaveLength(6);
});

test("the Saab contract carries Eduardo's wording", () => {
  const saab = contractBySlug("saab-thesis")!;
  expect(villageLabel(saab)).toBe("Saab · Jönköping");
  expect(saab.goal).toBe("Find the smallest sensor setup that still predicts performance.");
  expect(saab.done).toBe(true);
  expect(contractBySlug("effektify-reconciliation")!.done).toBe(false);
});

test("only approved NPC lines appear", () => {
  const npc = (approved: boolean) => ({ id: "x", name: "X", place: "saab" as const, line: "hi", approved });
  expect(visibleNpcs([npc(true), npc(false)])).toHaveLength(1);
});
```

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run src/content/world-content.test.ts`. Expected: FAIL, cannot resolve `./places`.
- [ ] **Step 3: Implement the three files.**
  - Places, in order:
    - Childhood house (Portugal)
    - UMinho academy (Braga, Portugal, degree `bsc-computer-science`)
    - Deloitte (Porto, Portugal)
    - Current house (Sweden)
    - Jönköping University academy (Jönköping, Sweden, degree `msc-ai-engineering`)
    - Saab (Jönköping)
    - Jordbruksverket (Jönköping)
    - Effektify (Stockholm)
  - `CONTRACTS` spreads each `PROJECTS` entry in order, adding fields keyed by slug, with `places` as in the test.
  - `done` is false for `financial-hub` and `effektify-reconciliation`.
  - Saab's `reason`, `goal` and `work` copy the spec §5 example exactly. Every other `reason`/`goal`/`work` and every `duration` is `"Coming soon."`.
  - `date` comes from the stage range: Deloitte `2022–2024`, JU-era `2024–2026`, Effektify and Financial Hub `2026–now`.
  - `NPCS = []` (Eduardo fills it in phase 2).
  - Don't change `projects.ts`, `stages.ts` or `degrees.ts`, since the 3D site still reads them.
- [ ] **Step 4: Run the tests.** Run `npx vitest run src/content`. Expected: all PASS, including the existing `content.test.ts`.
- [ ] **Step 5: Commit.** `git add src/content && git commit -m "feat(world): places, contracts and NPC data for the bug-hunter world"`

---

### Task 2: Config and buttons (one input source for keyboard and touch)

**Files:**
- Create: `src/world/config.ts`, `src/world/buttons.ts`
- Test: `src/world/buttons.test.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `TILE = 16`, `SCREEN_W = 240`, `SCREEN_H = 160`, `STEP_MS = 160`, `WORLD_PATH = "/world"`, `contractPath(slug: string): string` (returns `/contracts/${slug}`)
  - `buttons.ts`: `type Dir = "up" | "down" | "left" | "right"`, `type Button = Dir | "a" | "b" | "start"`, `press(b: Button): void`, `release(b: Button): void`, `heldDir(): Dir | null` (the most recently pressed direction still held), `onPress(fn: (b: Button) => void): () => void`, `bindKeyboard(target: Window): () => void`, `resetButtons(): void` (clears held directions and listeners, for tests)

- [ ] **Step 1: Write the failing tests**

```ts
import { bindKeyboard, heldDir, onPress, press, release, resetButtons } from "./buttons";
beforeEach(resetButtons);

test("the latest held direction wins, and releasing it falls back to the earlier one", () => {
  press("left"); press("up");
  expect(heldDir()).toBe("up");
  release("up");
  expect(heldDir()).toBe("left");
});

test("presses notify listeners once, and auto-repeat does not re-fire", () => {
  const seen: string[] = [];
  const off = onPress((b) => seen.push(b));
  const unbind = bindKeyboard(window);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", repeat: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
  expect(seen).toEqual(["a", "b", "start"]);
  off(); unbind();
});

test("losing window focus releases every held direction", () => {
  const unbind = bindKeyboard(window);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  window.dispatchEvent(new Event("blur"));
  expect(heldDir()).toBeNull();
  unbind();
});
```

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run src/world/buttons.test.ts`. Expected: FAIL, the module is missing.
- [ ] **Step 3: Implement it.** Keep held directions in an ordered array. Key map (case-insensitive): ArrowUp/w, ArrowDown/s, ArrowLeft/a, ArrowRight/d, z/Enter/" " → a, x/Escape/Backspace → b, Shift/m → start. Call `preventDefault` on mapped keys so arrows and Space don't scroll the page.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/world && git commit -m "feat(world): one button source for keyboard and touch"`

---

### Task 3: The view state machine

**Files:**
- Create: `src/world/view.ts`
- Test: `src/world/view.test.ts`

**Interfaces:**
- Consumes: `Button` (Task 2); `contractsFor`, `PLACES`, `PlaceId` (Task 1)
- Produces:
  - ```ts
    type Board = PlaceId | "all";
    type View =
      | { kind: "world"; travelTo?: PlaceId }
      | { kind: "dialogue"; lines: string[]; page: number; then?: View }
      | { kind: "board"; place: Board; index: number }
      | { kind: "scroll"; place: Board; slug: string }
      | { kind: "menu"; index: number }
      | { kind: "map"; index: number }
      | { kind: "hunter" } | { kind: "raven" }
      | { kind: "degree"; slug: string };
    ```
  - `WORLD: View` (`{ kind: "world" }`), `MENU_ITEMS = ["Contracts", "Map", "Hunter", "Send a raven"] as const`, `BOARD_COLUMNS = 3`
  - `reduce(view: View, b: Button): View`. It's pure. In `world` it handles only `start`, since movement and A-interaction belong to the scene.

- [ ] **Step 1: Write the failing tests**

```ts
import { reduce, WORLD, type View } from "./view";
const run = (v: View, ...bs: Parameters<typeof reduce>[1][]) => bs.reduce(reduce, v);

test("in the world only Start does something: it opens the menu", () => {
  expect(run(WORLD, "a", "up", "b")).toEqual(WORLD);
  expect(run(WORLD, "start")).toEqual({ kind: "menu", index: 0 });
});

test("dialogue pages forward on A and then hands over to its follow-up view", () => {
  const prompt: View = { kind: "dialogue", lines: ["Contracts are pinned to the board.", "Read one?"], page: 0, then: { kind: "board", place: "all", index: 0 } };
  expect(run(prompt, "a")).toMatchObject({ page: 1 });
  expect(run(prompt, "a", "a")).toEqual({ kind: "board", place: "all", index: 0 });
  expect(run(prompt, "b")).toEqual(WORLD);
  expect(run({ kind: "dialogue", lines: ["Hi"], page: 0 }, "a")).toEqual(WORLD);
});

test("the board moves on a 3-column grid, ignores moves off its edges, opens on A and leaves on B", () => {
  const all: View = { kind: "board", place: "all", index: 0 };
  expect(run(all, "right", "right", "right")).toMatchObject({ index: 2 });
  expect(run(all, "down")).toMatchObject({ index: 3 });
  expect(run(all, "up", "left")).toMatchObject({ index: 0 });
  expect(run({ kind: "board", place: "deloitte", index: 0 }, "down")).toMatchObject({ index: 0 }); // only 2 papers
  expect(run(all, "a")).toEqual({ kind: "scroll", place: "all", slug: "mambu-migration" });
  expect(run(all, "b")).toEqual(WORLD);
});

test("a scroll rolls back to the board it came from, on the same paper", () => {
  expect(run({ kind: "scroll", place: "ju", slug: "saab-thesis" }, "b")).toEqual({ kind: "board", place: "ju", index: 1 });
  expect(run({ kind: "scroll", place: "ju", slug: "saab-thesis" }, "a", "up")).toEqual({ kind: "scroll", place: "ju", slug: "saab-thesis" });
});

test("menu items lead to the board, map, hunter and raven, and B or Start closes it", () => {
  const menu = (i: number): View => ({ kind: "menu", index: i });
  expect(run(menu(0), "a")).toEqual({ kind: "board", place: "all", index: 0 });
  expect(run(menu(0), "down", "a")).toEqual({ kind: "map", index: 0 });
  expect(run(menu(0), "down", "down", "a")).toEqual({ kind: "hunter" });
  expect(run(menu(0), "up", "a")).toEqual({ kind: "raven" }); // wraps
  expect(run(menu(2), "b")).toEqual(WORLD);
  expect(run(menu(2), "start")).toEqual(WORLD);
  expect(run({ kind: "hunter" }, "b")).toEqual(menu(2));
});

test("the map fast-travels to the chosen place", () => {
  expect(run({ kind: "map", index: 0 }, "down", "a")).toEqual({ kind: "world", travelTo: "uminho" });
  expect(run({ kind: "map", index: 0 }, "b")).toEqual({ kind: "menu", index: 1 });
});
```

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run src/world/view.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `reduce`.**
  - The board's size is `contractsFor(place).length`, and moves that would leave the grid are ignored.
  - A scroll's B goes back to the index of its slug in `contractsFor(place)`.
  - The menu and the map wrap. The map's list is `PLACES` in order.
  - B closes `hunter` and `raven` back to the menu on their own item, and closes `degree` to `WORLD`.
  - Any other button in those views returns the same view.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/world/view* && git commit -m "feat(world): the view state machine for dialogue, boards, scrolls and menu"`

---

### Task 4: The store, with contract URLs

**Files:**
- Create: `src/world/store.ts`
- Test: `src/world/store.test.ts`

**Interfaces:**
- Consumes: `reduce`, `View`, `WORLD` (Task 3); `onPress` (Task 2); `WORLD_PATH`, `contractPath` (Task 2); `contractBySlug` (Task 1)
- Produces:
  - `getView(): View`, `setView(v: View): void`
  - `useView(initial: View): View`: a `useSyncExternalStore` whose server snapshot is `initial`. This keeps the server stateless per request, so one visitor's open scroll never leaks into another's page.
  - `startStore(initial: View): () => void`: sets the view without touching history, subscribes to `onPress` → `setView(reduce(getView(), b))` and to `popstate`, and returns a cleanup function.
  - `initialViewFor(slug?: string): View`: `{ kind: "scroll", place: "all", slug }` when the slug exists, else `WORLD`.

- [ ] **Step 1: Write the failing tests**

```ts
import { press, resetButtons } from "./buttons";
import { getView, initialViewFor, setView, startStore } from "./store";
import { WORLD } from "./view";
let stop: () => void;
beforeEach(() => { resetButtons(); window.history.replaceState(null, "", "/world"); stop = startStore(WORLD); });
afterEach(() => stop());

test("opening a scroll pushes its contract URL, and closing it returns to the world path", () => {
  setView({ kind: "board", place: "all", index: 3 });
  press("a");
  expect(window.location.pathname).toBe("/contracts/saab-thesis");
  press("b");
  expect(getView()).toMatchObject({ kind: "board", index: 3 });
  expect(window.location.pathname).toBe("/world");
});

test("browser Back from an open scroll goes back to its board", async () => {
  setView({ kind: "board", place: "all", index: 3 });
  press("a");
  const popped = new Promise((r) => window.addEventListener("popstate", r, { once: true }));
  window.history.back();
  await popped;
  expect(getView()).toMatchObject({ kind: "board", index: 3 });
});

test("closing a deep-linked scroll replaces the URL instead of leaving the site", () => {
  stop(); window.history.replaceState(null, "", "/contracts/saab-thesis");
  stop = startStore(initialViewFor("saab-thesis"));
  press("b");
  expect(window.location.pathname).toBe("/world");
  expect(getView()).toMatchObject({ kind: "board", place: "all", index: 3 });
});

test("a deep link opens straight on its scroll; an unknown slug opens the world", () => {
  expect(initialViewFor("saab-thesis")).toEqual({ kind: "scroll", place: "all", slug: "saab-thesis" });
  expect(initialViewFor("nope")).toEqual(WORLD);
});
```

- [ ] **Step 2: Run them to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Implement it** following the module pattern in `src/ui/useOpenProject.ts`.
  - When `setView` enters a scroll with a new slug, call `pushState({ contract: slug }, "", contractPath(slug))`.
  - When a scroll is left by anything other than popstate:
    - If `history.state?.contract` is set (this store pushed it), call `history.back()` and let popstate apply the board view.
    - Otherwise (deep link), call `replaceState(null, "", WORLD_PATH)`.
  - On popstate, if the path is a contract path, enter that scroll. If a scroll is open, leave it to its board (same rule as B). Otherwise do nothing.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/world/store* && git commit -m "feat(world): view store with shareable contract URLs and Back support"`

---

### Task 5: Grid rules and screen zoom

**Files:**
- Create: `src/world/grid.ts`
- Test: `src/world/grid.test.ts`

**Interfaces:**
- Consumes: `Dir` (Task 2), `SCREEN_W`, `SCREEN_H` (Task 2)
- Produces: `type Tile = { x: number; y: number }`, `ahead(t: Tile, d: Dir): Tile`, `step(t: Tile, d: Dir, blocked: (t: Tile) => boolean): Tile` (returns `t` when the target is blocked), `integerZoom(w: number, h: number): number` (the largest whole `z ≥ 1` with `240z ≤ w` and `160z ≤ h`)

- [ ] **Step 1: Write the failing tests**

```ts
import { ahead, integerZoom, step } from "./grid";
const wallAt = (x: number) => (t: { x: number; y: number }) => t.x === x;

test("a step moves one tile, and a blocked step stays put", () => {
  expect(ahead({ x: 2, y: 2 }, "up")).toEqual({ x: 2, y: 1 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(9))).toEqual({ x: 3, y: 2 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(3))).toEqual({ x: 2, y: 2 });
});

test("zoom is the largest whole number that fits, never below 1", () => {
  expect(integerZoom(1440, 900)).toBe(5);
  expect(integerZoom(480, 320)).toBe(2);
  expect(integerZoom(390, 520)).toBe(1); // portrait phone: the area above the controls
  expect(integerZoom(100, 80)).toBe(1);
});
```

- [ ] **Step 2: Run them to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Implement them.** The caller's `blocked` function covers map edges, along with collision tiles and object tiles.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/world/grid* && git commit -m "feat(world): tile steps and whole-number zoom"`

---

### Task 6: The Phaser world scene

**Files:**
- Create: `src/world/WorldScene.ts`, `src/world/WorldCanvas.tsx`, `src/world/WorldCanvas.module.css`
- Modify: `package.json` (add `"phaser": "4.2.1"`)

**Interfaces:**
- Consumes: `heldDir`, `onPress` (Task 2); `getView`, `setView` (Task 4); `WORLD` (Task 3); `step`, `ahead`, `integerZoom` (Task 5); `TILE`, `SCREEN_W`, `SCREEN_H`, `STEP_MS` (Task 2); `placeById`, `visibleNpcs` (Task 1); the map file and its object schema (Task 7)
- Produces: `<WorldCanvas />`, a client component that mounts Phaser into a div via `useEffect` + `import("phaser")`, so Phaser never runs on the server. It destroys the game on unmount.

The scene:
- **Loading and drawing:**
  - Load `/world/world.tmj`.
  - Build the greybox tileset texture at runtime on a canvas (`textures.addCanvas`), one flat colour per Task 7 tile id.
  - Draw the `ground` layer.
  - Draw objects as coloured 16×16 blocks: board brown, sign tan, npc blue, academy purple.
  - The hunter is a dark block with a white top and a 4 px notch on its facing side.
- **Spawn:** the hunter starts on the `spawn` object, facing `up`, so it's facing the main board.
- **Movement** (in `update`, only while `getView().kind === "world"`): if no step is in progress and `heldDir()` is set, face that direction, then, if `step` moves, tween one tile over `STEP_MS` with linear easing. The camera follows with `roundPixels`, bounded to the map.
- **Interacting** (`onPress("a")`, only while the view is `world` at the time of the press): look up the object on `ahead(hunter, facing)`:
  - board → `setView({ kind: "dialogue", lines: ["Contracts are pinned to the board.", "Read one?"], page: 0, then: { kind: "board", place, index: 0 } })`
  - sign → a one-page dialogue with its `text`
  - npc → `["<name>:", line]`
  - academy → `{ kind: "degree", slug: placeById(place).degree! }`
- **Fast travel:** on a view of `{ kind: "world", travelTo }`, move the hunter to that place's `travel` object, facing `down`, then call `setView(WORLD)`.
- **NPCs:** objects whose id isn't in `visibleNpcs()` aren't drawn and don't block.
- **Sizing:** the canvas is 240×160 internally. On resize, set its CSS size to `240z × 160z` with `z = integerZoom(...)` of the area available to it (Task 10 gives that area). Apply `image-rendering: pixelated`.

- [ ] **Step 1: Install Phaser.** Run `npm install phaser@4.2.1`. Expected: `package.json` lists `"phaser": "4.2.1"`.
- [ ] **Step 2: Implement the scene and `WorldCanvas`** as described above. Check the Phaser 4 tilemap, texture and tween APIs against `node_modules/phaser/types/phaser.d.ts`, not Phaser 3 memory.
- [ ] **Step 3: Type-check and lint.** Run `npx tsc --noEmit && npm run lint`. Expected: no errors.
- [ ] **Step 4: Commit.** `git add package.json package-lock.json src/world && git commit -m "feat(world): Phaser scene with tile walking, camera and interactions"`

(Phaser can't be tested in jsdom. This task is checked in the browser in Task 9 and end-to-end in Task 11.)

---

### Task 7: The greybox map

**Files:**
- Create: `tools/world/make-map.mjs`, `public/world/world.tmj` (generated, committed)
- Modify: `package.json` (script `"gen:world": "node tools/world/make-map.mjs"`)
- Test: `src/world/map.test.ts`

**Interfaces:**
- Produces: a Tiled JSON file (orthogonal, 16×16, `infinite: false`) with a tile layer `ground` and an object layer `objects`.
  - **Tile ids:** `1` grass, `2` path, `3` water, `4` bridge, `5` tree, `6` wall, `7` roof. Ids `3`, `5`, `6` and `7` block movement.
  - **Objects:** each has a `type` and properties:
    - `spawn`
    - `board` {`place`: PlaceId | "all"}
    - `sign` {`text`}
    - `npc` {`npc`: Npc id}
    - `academy` {`place`}
    - `travel` {`place`}
  - Objects sit on the tile grid (`x`, `y` in px = tile × 16). Every non-`spawn`/`travel` object also blocks movement.
- **Layout** *(Claude's call, within the spec's "small")*:
  - 64×40 tiles.
  - A river 3 tiles wide runs north to south, with Portugal to the west and Sweden to the east. One bridge, 2 tiles wide, crosses it near the middle.
  - Spawn is on the east bank next to the bridge, with the `all` board directly north of spawn.
  - Each place is a cluster of 3–4 wall+roof blocks with a `travel` tile at its entrance. Its board stands at the entrance when it has contracts, and academies have an `academy` object at their door.
  - At least three signs name directions, e.g. `"← Portugal · UMinho · Deloitte"`.
  - The ASCII layout lives in the script. Later edits can happen in Tiled directly.

- [ ] **Step 1: Write the failing tests**

```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import { PLACES } from "@/content/places";
import { contractsFor } from "@/content/contracts";
type Obj = { type: string; x: number; y: number; properties?: { name: string; value: string }[] };
const map = JSON.parse(readFileSync("public/world/world.tmj", "utf8"));
const objects: Obj[] = map.layers.find((l: { name: string }) => l.name === "objects").objects;
const prop = (o: Obj, k: string) => o.properties?.find((p) => p.name === k)?.value;
const tileOf = (o: Obj) => ({ x: o.x / 16, y: o.y / 16 });

test("spawn stands right below the main board, on the Swedish bank", () => {
  const spawn = tileOf(objects.find((o) => o.type === "spawn")!);
  const board = tileOf(objects.find((o) => o.type === "board" && prop(o, "place") === "all")!);
  expect(board).toEqual({ x: spawn.x, y: spawn.y - 1 });
  expect(spawn.x).toBeGreaterThan(map.width / 2);
});

test("every place has a travel point, and every place with contracts has a board", () => {
  for (const p of PLACES) {
    expect(objects.some((o) => o.type === "travel" && prop(o, "place") === p.id)).toBe(true);
    expect(objects.some((o) => o.type === "board" && prop(o, "place") === p.id)).toBe(contractsFor(p.id).length > 0);
  }
});

test("every travel point is walkable from spawn, so the bridge joins the banks", () => {
  // BFS from spawn over in-bounds tiles whose ground id is not 3/5/6/7 and that hold no blocking object;
  // assert every travel tile is in the visited set.
});
```

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run src/world/map.test.ts`. Expected: FAIL, file not found.
- [ ] **Step 3: Write `make-map.mjs` and generate the map.** Run `npm run gen:world`. Expected: it writes `public/world/world.tmj`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add tools/world public/world package.json src/world/map.test.ts && git commit -m "feat(world): greybox map with the river, bridge, places, boards and signs"`

---

### Task 8: Overlays (dialogue, board close-up, scroll, menu, panels)

**Files:**
- Create in `src/world/ui/`: `Overlay.tsx`, `DialogueBox.tsx`, `BoardView.tsx`, `Scroll.tsx`, `StartMenu.tsx`, `MapPanel.tsx`, `HunterPanel.tsx`, `RavenPanel.tsx`, `DegreePanel.tsx`, `ui.module.css`
- Test: `src/world/ui/Overlay.test.tsx`

**Interfaces:**
- Consumes: `useView`, `setView` (Task 4); `View`, `WORLD`, `MENU_ITEMS`, `BOARD_COLUMNS` (Task 3); `contractsFor`, `contractBySlug`, `villageLabel`, `PLACES` (Task 1); `DEGREES` (`src/content/degrees.ts`); `EMAIL`, `LINKEDIN`, `CV_URL` (`src/content/contact.ts`)
- Produces: `<Overlay initial={View} />`, which switches on `useView(initial).kind` and renders nothing in `world`.

What each overlay shows:
- **DialogueBox:** the current page's text in a framed box at the bottom with a `▼` cursor.
- **BoardView:** the hunter's-view close-up (greybox CSS following `.superpowers/brainstorm/43984-1793704152/content/board-pov.html`).
  - A `CONTRACTS` header.
  - Papers as `<button>`s in a `BOARD_COLUMNS` grid. Each is named `"<villageLabel> · <title>"` and shows the village, title, an empty logo slot, and the seal when `done`.
  - The selected paper is lifted, outlined, has `aria-current="true"` and gets focus.
  - A chalk sign shows `◀▶ pick`, `A open`, `B leave`, and an info box shows `villageLabel · date`.
  - Clicking a paper sets `{ kind: "scroll", place, slug }`.
- **Scroll:** the parchment (greybox CSS following `contract-popup.html`) as an `<article>`.
  - Header: an `<h2>` title, Village / Date / Duration as `<dt>`/`<dd>`, and the logo (`project.logo`) or an empty slot.
  - Body: Reason / Goal / Work, continuing the same `<dl>`.
  - The red seal shows when `done`.
  - The text renders without effects, so it ships in the server HTML.
- **StartMenu:** `MENU_ITEMS` as `<li>`s, with the selected one marked by `▶` and `aria-current`.
- **MapPanel:** `PLACES` names under "Portugal" and "Sweden" headings, with the selected one marked.
- **HunterPanel:** the name "Eduardo Pereira", the bio "Coming soon.", and a CV link when `CV_URL` is set.
- **RavenPanel:** an email (`mailto:`) link and a LinkedIn link.
- **DegreePanel:** the degree's title, sections and subject lists from `DEGREES`.
- Every overlay has a visible close button with the same effect as B (`setView(reduce(view, "b"))`).

- [ ] **Step 1: Write the failing tests** (use `fireEvent`, and don't add `@testing-library/user-event`)

```tsx
import { render, screen } from "@testing-library/react";
import { Overlay } from "./Overlay";
import type { View } from "../view";
const show = (v: View) => render(<Overlay initial={v} />);

test("the world shows no overlay", () => {
  expect(show({ kind: "world" }).container).toBeEmptyDOMElement();
});

test("the main board pins all six contracts with the selected one marked", () => {
  show({ kind: "board", place: "all", index: 3 });
  const papers = screen.getAllByRole("button", { name: / · / });
  expect(papers).toHaveLength(6);
  expect(papers[3]).toHaveAttribute("aria-current", "true");
  expect(papers[3]).toHaveAccessibleName(/^Saab · Jönköping · /);
});

test("a scroll shows the header fields and body in order", () => {
  show({ kind: "scroll", place: "all", slug: "saab-thesis" });
  expect(screen.getByRole("heading", { name: "Predicting shooting performance from motion" })).toBeVisible();
  expect(screen.getByText("Saab · Jönköping")).toBeVisible();
  expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual(["Village", "Date", "Duration", "Reason", "Goal", "Work"]);
  expect(screen.getByLabelText("Contract completed")).toBeVisible();
});

test("the Start menu lists its four items in order", () => {
  show({ kind: "menu", index: 0 });
  expect(screen.getAllByRole("listitem").map((li) => li.textContent?.replace("▶", "").trim())).toEqual(["Contracts", "Map", "Hunter", "Send a raven"]);
});

test("the raven panel links to email and LinkedIn", () => {
  show({ kind: "raven" });
  expect(screen.getByRole("link", { name: /eduardoluisvp99@gmail.com/ })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
  expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/eduardopereira-/");
});
```

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run src/world/ui`. Expected: FAIL.
- [ ] **Step 3: Implement the overlays.** Style them as pixel game UI: Pixelify Sans (`var(--font-pixel)` from Task 9's layout), framed boxes with 4 px borders, square corners, hard 0-blur shadows only. The text is HTML. The seal is `<span aria-label="Contract completed">✓</span>`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add src/world/ui && git commit -m "feat(world): dialogue, board close-up, contract scroll, Start menu and panels"`

---

### Task 9: Routes `/world` and `/contracts/[slug]`

**Files:**
- Create:
  - `src/app/(world)/layout.tsx`: Pixelify Sans via `next/font/google` as `--font-pixel`, a full-viewport dark background, no page scroll.
  - `src/app/(world)/world/page.tsx`
  - `src/app/(world)/contracts/[slug]/page.tsx`
  - `src/world/World.tsx` (client): `useEffect(() => startStore(initial), [])`, `<WorldCanvas />`, `<Overlay initial={initial} />`, `<TouchControls />` (Task 10), plus `bindKeyboard(window)` in the same effect.
- Test: `src/app/(world)/contracts/contract-page.test.ts`

**Interfaces:**
- Consumes: `initialViewFor`, `startStore` (Task 4); `bindKeyboard` (Task 2); `CONTRACTS`, `contractBySlug` (Task 1)
- Produces:
  - `World({ initial }: { initial: View })`
  - The world page renders `<World initial={WORLD} />`.
  - The contract page exports:
    - `generateStaticParams()` → `CONTRACTS.map(({ slug }) => ({ slug }))`
    - `dynamicParams = false`
    - `generateMetadata({ params })` → title `"<title> · Contracts · Eduardo Pereira"`, description = the contract's `subtitle`
  - The default page awaits `params`, calls `notFound()` for unknown slugs, and renders `<World initial={initialViewFor(slug)} />`.

- [ ] **Step 1: Write the failing tests**

```ts
// @vitest-environment node
import { generateMetadata, generateStaticParams } from "./[slug]/page";

test("every contract is pre-rendered at its own URL", async () => {
  const params = await generateStaticParams();
  expect(params).toHaveLength(6);
  expect(params.map((p) => p.slug)).toContain("saab-thesis");
});

test("contract pages are titled for sharing", async () => {
  const meta = await generateMetadata({ params: Promise.resolve({ slug: "saab-thesis" }) });
  expect(meta.title).toBe("Predicting shooting performance from motion · Contracts · Eduardo Pereira");
});
```

- [ ] **Step 2: Run them to verify they fail.** Expected: FAIL.
- [ ] **Step 3: Implement the layout, both pages and `World.tsx`.**
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Build and check the server HTML.** Run `npm run build`, then `npx next start -p 3100` in the background, then run `curl -s localhost:3100/contracts/saab-thesis | grep -c "Find the smallest sensor setup"` and `curl -s -o /dev/null -w "%{http_code}" localhost:3100/contracts/nope`. Expected: `1` or more, then `404`. Stop the server.
- [ ] **Step 6: Check it in the browser.** Run `npm run dev` and open `/world`. Check that:
  - the hunter walks
  - A at spawn reads the board: dialogue → board → scroll, and B steps back each time
  - the bridge crosses the river
  - signs, both academies and fast travel all work
  - `/contracts/saab-thesis` opens on the scroll

  Fix what's off before committing.
- [ ] **Step 7: Commit.** `git add 'src/app/(world)' src/world/World.tsx && git commit -m "feat(world): /world and shareable /contracts/[slug] pages"`

---

### Task 10: Touch controls and phone layout

**Files:**
- Create: `src/world/ui/TouchControls.tsx`, `src/world/ui/TouchControls.module.css`
- Modify: `src/world/WorldCanvas.module.css`, `src/world/World.tsx`
- Test: `src/world/ui/TouchControls.test.tsx`

**Interfaces:**
- Consumes: `press`, `release` (Task 2); `integerZoom` (Task 5)
- Produces: `<TouchControls />`, rendered only when `matchMedia("(pointer: coarse)")` matches.
  - Buttons named "Up", "Down", "Left", "Right", "A", "B", "Start".
  - `pointerdown` presses. `pointerup`, `pointercancel` and `pointerleave` release.
  - `touch-action: none`.
- **Layout:**
  - Portrait: the screen at the top, sized by `integerZoom(width, height − controlsHeight)`, with the controls filling the space below, Game Boy style.
  - Landscape: the D-pad to the left of the screen, A/B/Start to the right.
  - Everything stays on screen down to 320×480.

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { heldDir, resetButtons } from "../buttons";
import { TouchControls } from "./TouchControls";

test("holding the D-pad holds a direction until the finger lifts", () => {
  resetButtons();
  const original = window.matchMedia;
  window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes("coarse") })) as typeof window.matchMedia;
  render(<TouchControls />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Left" }));
  expect(heldDir()).toBe("left");
  fireEvent.pointerUp(screen.getByRole("button", { name: "Left" }));
  expect(heldDir()).toBeNull();
  window.matchMedia = original;
});
```

- [ ] **Step 2: Run it to verify it fails.** Expected: FAIL.
- [ ] **Step 3: Implement the controls and the layout CSS.**
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Check it in the browser** with device emulation at 390×844 and 844×390. The screen should be crisp at a whole-number scale, the controls fully visible, the page not scrolling, and the D-pad and A should work.
- [ ] **Step 6: Commit.** `git add src/world && git commit -m "feat(world): Game Boy touch controls and phone layout"`

---

### Task 11: End-to-end check and visual review

**Files:**
- Create: `e2e/world.spec.ts`

- [ ] **Step 1: Write the e2e tests**

```ts
import { expect, test } from "@playwright/test";

test("from spawn, A reads the main board and a contract opens at its own URL", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.keyboard.press("z");
  await expect(page.getByText("Contracts are pinned to the board.")).toBeVisible();
  await page.keyboard.press("z");
  await page.keyboard.press("z");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /^Saab/ })).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("z");
  await expect(page).toHaveURL(/\/contracts\/saab-thesis$/);
  await expect(page.getByRole("heading", { name: "Predicting shooting performance from motion" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: /^Saab/ })).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/\/world$/);
});

test("the Start menu opens the raven from anywhere", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.keyboard.press("Shift");
  await expect(page.getByText("Send a raven")).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("z");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toBeVisible();
});

test("an unknown contract is a 404", async ({ page }) => {
  expect((await page.goto("/contracts/nope"))!.status()).toBe(404);
});
```

- [ ] **Step 2: Run the whole suite.** Run `npm test && npm run e2e`. Expected: all PASS, including the existing journey tests.
- [ ] **Step 3: Visual review against the spec's quality bar.** Check at 1440×900 and 390×844:
  - the pixels are crisp at every zoom
  - the walk is steady with no jitter at tile ends
  - holding into a wall only turns the hunter
  - the overlays look like one game UI
  - text is readable on the phone

  Take screenshots of the world, board, scroll and menu, and show them to Eduardo before calling the phase done.
- [ ] **Step 4: Commit.** `git add e2e/world.spec.ts && git commit -m "test(world): end-to-end board, contract URL, menu and 404"`
