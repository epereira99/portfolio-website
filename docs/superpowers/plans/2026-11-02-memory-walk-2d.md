# Memory Walk 2D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D Journey world on `/` with a 2D "memory walk" (navy starry sky, a scroll-scrubbed walking video of Eduardo, painted memories fading in on the right) while keeping every existing overlay, the voyage map and the 3D code (unused).

**Architecture:** One client component, `MemoryWalk`, runs a single `requestAnimationFrame` loop that reads `getScreens()`, eases it, and writes styles directly to DOM nodes (stars on a 2D canvas, memory `<div>`s, the walker `<img>`). All placement maths is pure functions in `src/journey/memory/`, unit-tested. Assets are produced by a repeatable ffmpeg script into `public/`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, CSS modules, Vitest + Testing Library, Playwright, ffmpeg (dev-only system tool).

**Spec:** `docs/superpowers/specs/2026-11-02-memory-walk-2d-design.md` (builds on `docs/superpowers/specs/2026-11-01-portfolio-website-design.md`). Mockup spike: `docs/superpowers/specs/mockups/memory-walk.html`.

## Global Constraints

- No new runtime dependencies. ffmpeg is a dev-only system tool (`brew install ffmpeg`).
- Nothing on `/` may import `three`, `@react-three/*`, `src/journey/scene/*`, `src/journey/art/*` or `src/journey/path.ts` (which imports three). The 3D code stays in the repo untouched.
- Walk loop: source frames **61–199** of the source video (139 frames, 24 fps).
- Walk frames total **≤ 4 MB**; each memory image **≤ 300 KB**.
- Walker: centred, **97vh** tall, feet at the bottom edge (phones: **60vh**).
- Memories have **no frame or border**; edges fade with a CSS radial mask in code.
- Welcome banner text comes from `WELCOME_BANNER` in `src/content/voyage.ts` (do not retype it).
- `prefers-reduced-motion: reduce`: static stars, single still walker frame, memories cross-fade only (no slide/scale).
- This Next.js version differs from training data; check `node_modules/next/dist/docs/` before using any Next API.

## Review Focus

1. **Big jumps** (stage-header click, End key, reload mid-page): the walk must not visibly spin through hundreds of frames; eased progress snaps when the gap is more than 1 screen. Test in Task 2.
2. **Frames missing or still loading** (slow network, failed request): the walker shows the still frame `walk-000.webp`, never a broken-image icon, and scrubbing starts only once all frames have loaded. Test in Task 3.
3. **Overscroll/negative or past-the-end progress** (iOS bounce gives s < 0 or s > TOTAL_SCREENS): frame index stays in `[0, 139)`, memories stay hidden or at their final state, no NaN styles. Test in Task 2.
4. **Resize/orientation change:** the star canvas re-sizes to the viewport times `devicePixelRatio` with no stretched stars. Covered in Task 3 (resize listener) and checked manually in Task 5.
5. **No canvas context** (jsdom, locked-down browsers: `getContext` returns null): the component still renders the walker and memories without throwing. Test in Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `art/walk-source.mp4` (new) | Source walk video, copied from `~/Downloads/gemini_generated_video_fd5727de.mp4` |
| `art/memories/` (new, empty with `.gitkeep`) | Eduardo's full-size memory PNGs, named `<memory-id>.png` |
| `tools/walk/make-walk.sh` (new) | Video → keyed, cropped WebP frames in `public/walk/` |
| `tools/walk/make-memories.sh` (new) | `art/memories/*.png` → `public/memories/*.webp` |
| `src/journey/memory/walk.ts` (new) | Pure: frame index from progress, eased progress |
| `src/journey/memory/memories.ts` (new) | Memory list (id, label, screen position, layout) + `memoryPose()` |
| `src/journey/memory/MemoryWalk.tsx` + `.module.css` (new) | The scene component and rAF loop |
| `src/journey/timeline.ts` (modify) | New `banner` overlay kind |
| `src/ui/JourneyOverlay.tsx` (modify) | Render the banner |
| `src/app/page.tsx` (modify) | Swap `JourneyCanvas` for `MemoryWalk` |
| `src/assets.test.ts` (modify) | Weight budget for walk frames and memories |

---

### Task 1: Asset pipeline (walk frames + memory images)

**Files:**
- Create: `art/walk-source.mp4`, `art/memories/.gitkeep`, `tools/walk/make-walk.sh`, `tools/walk/make-memories.sh`
- Modify: `package.json` (scripts), `src/assets.test.ts`
- Generated (committed): `public/walk/walk-000.webp` … `walk-138.webp`

**Interfaces:**
- Produces: `public/walk/walk-NNN.webp` (3-digit, 0-based, 139 files, transparent background, same size); `public/memories/<id>.webp` when sources exist; npm scripts `gen:walk`, `gen:memories`.

- [ ] **Step 1: Write the failing weight tests** in `src/assets.test.ts` (keep the existing avatar tests; they still guard the parked 3D assets):

```ts
describe("memory walk assets stay within budget", () => {
  const walk = readdirSync("public/walk").filter((f) => f.endsWith(".webp")).sort();

  test("139 walk frames named walk-000..walk-138", () => {
    expect(walk).toHaveLength(139);
    expect(walk[0]).toBe("walk-000.webp");
    expect(walk[138]).toBe("walk-138.webp");
  });

  test("walk frames total ≤ 4 MB", () => {
    const total = walk.reduce((sum, f) => sum + statSync(`public/walk/${f}`).size, 0);
    expect(total).toBeLessThanOrEqual(4 * 1024 * 1024);
  });

  test("each memory image ≤ 300 KB", () => {
    const dir = "public/memories";
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".webp")) : [];
    for (const f of files) expect(statSync(`${dir}/${f}`).size, f).toBeLessThanOrEqual(300 * 1024);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/assets.test.ts`. Expected: FAIL (`ENOENT … public/walk`).

- [ ] **Step 3: Copy the source video** into the repo:
`cp ~/Downloads/gemini_generated_video_fd5727de.mp4 art/walk-source.mp4`. If ffmpeg is missing: `brew install ffmpeg`.

- [ ] **Step 4: Write `tools/walk/make-walk.sh`** (`set -e`, run from repo root, clears `public/walk/` first). One ffmpeg call with these filters, in order:
  - `select='between(n\,61\,199)'`, `setpts=N/24/TB`: the seamless loop (frame 200 ≈ frame 61).
  - `colorkey=0x00FF00:0.30:0.10` then `despill=type=green`: transparent background, no green fringe.
  - `crop=366:1114:172:129`: the union bounding box of the figure across the loop, measured in the spike.
  - `scale=-2:900`.
  - Output: `-c:v libwebp -pix_fmt yuva420p -quality 70 -start_number 0 public/walk/walk-%03d.webp`.

  If the budget test fails, lower `-quality` or the scale height (not below 720) and re-run.

- [ ] **Step 5: Write `tools/walk/make-memories.sh`.** For each `art/memories/*.png`: scale so the long side is 1400 px, encode to `public/memories/<same-name>.webp` with `-quality 72`, and exit 0 when there are no PNGs. Add `"gen:walk": "sh tools/walk/make-walk.sh"` and `"gen:memories": "sh tools/walk/make-memories.sh"` to `package.json`.

- [ ] **Step 6: Run** `npm run gen:walk && npm run gen:memories && npx vitest run src/assets.test.ts`. Expected: PASS. Open `public/walk/walk-050.webp`: the figure is on transparency with no green edge.

- [ ] **Step 7: Commit**

```bash
git add art tools/walk package.json src/assets.test.ts public/walk
git commit -m "feat: walk frames from the source video, with weight budget"
```

---

### Task 2: Pure walk and memory maths

**Files:**
- Create: `src/journey/memory/walk.ts`, `src/journey/memory/memories.ts`
- Test: `src/journey/memory/walk.test.ts`, `src/journey/memory/memories.test.ts`

**Interfaces:**
- Consumes: `ENDING_START`, `TOTAL_SCREENS`, `segmentAt` from `src/journey/timeline.ts`.
- Produces:
  - `WALK_FRAMES = 139`, `FRAMES_PER_SCREEN = 90`, `walkFrame(s: number): number`, `easeProgress(current: number, target: number): number`, `walkFrameUrl(i: number): string` (`/walk/walk-${3-digit}.webp`)
  - `type MemoryId = "arcada" | "bom-jesus" | "uminho" | "clerigos" | "dom-luis" | "nau" | "jonkoping-university" | "stadshuset"`
  - `type Memory = { id: MemoryId; label: string; at: number; layout: "side" | "centre"; src?: string }`
  - `MEMORIES: Memory[]`
  - `type MemoryPose = { opacity: number; x: number; scale: number }` (x in vw, relative to the memory's base position)
  - `memoryPose(m: Memory, s: number, reducedMotion: boolean): MemoryPose`

- [ ] **Step 1: Write the failing tests.**

`walk.test.ts`:
```ts
test("frame advances with distance and wraps inside [0, 139)", () => {
  expect(walkFrame(0)).toBe(0);
  expect(walkFrame(1 / FRAMES_PER_SCREEN)).toBe(1);
  expect(walkFrame(WALK_FRAMES / FRAMES_PER_SCREEN)).toBe(0);
});
test("walking back plays frames in reverse; negative progress still valid", () => {
  expect(walkFrame(-1 / FRAMES_PER_SCREEN)).toBe(WALK_FRAMES - 1);
  for (const s of [-3.7, -0.001, 2.5, 99]) {
    const f = walkFrame(s);
    expect(Number.isInteger(f) && f >= 0 && f < WALK_FRAMES).toBe(true);
  }
});
test("he stops at the ending", () => {
  expect(walkFrame(ENDING_START + 0.3)).toBe(walkFrame(ENDING_START));
  expect(walkFrame(TOTAL_SCREENS + 1)).toBe(walkFrame(ENDING_START));
});
test("easing follows the scroll, and snaps on big jumps", () => {
  expect(easeProgress(0, 0.1)).toBeGreaterThan(0);
  expect(easeProgress(0, 0.1)).toBeLessThan(0.1);
  expect(easeProgress(0, 3)).toBe(3);
  expect(easeProgress(5, 3.5)).toBe(3.5);
  expect(easeProgress(1, 1.00001)).toBe(1.00001);
});
test("frame urls are 3-digit", () => expect(walkFrameUrl(7)).toBe("/walk/walk-007.webp"));
```

`memories.test.ts`:
```ts
test("the agreed set, in path order", () => {
  expect(MEMORIES.map((m) => m.id)).toEqual(["arcada", "bom-jesus", "uminho", "clerigos", "dom-luis", "nau", "jonkoping-university", "stadshuset"]);
  const ats = MEMORIES.map((m) => m.at);
  expect([...ats].sort((a, b) => a - b)).toEqual(ats);
});
test("each memory sits in its stage, the nau at the start of the voyage", () => {
  const where = Object.fromEntries(MEMORIES.map((m) => [m.id, segmentAt(m.at)]));
  expect(where).toEqual({ arcada: "braga", "bom-jesus": "braga", uminho: "braga", clerigos: "porto", "dom-luis": "porto", nau: "voyage", "jonkoping-university": "jonkoping", stadshuset: "stockholm" });
  expect(MEMORIES.find((m) => m.id === "nau")!.layout).toBe("centre");
});
test("hidden far ahead, full alongside, gone once passed", () => {
  const m = MEMORIES[1];
  expect(memoryPose(m, m.at - 1.5, false).opacity).toBe(0);
  expect(memoryPose(m, m.at, false).opacity).toBe(1);
  expect(memoryPose(m, m.at + 0.6, false).opacity).toBe(0);
});
test("grows and slides right while approaching; reduced motion only fades", () => {
  const m = MEMORIES[1];
  const far = memoryPose(m, m.at - 0.7, false), near = memoryPose(m, m.at, false);
  expect(near.scale).toBeGreaterThan(far.scale);
  expect(near.x).toBeGreaterThan(far.x);
  const rm = memoryPose(m, m.at - 0.7, true);
  expect([rm.x, rm.scale]).toEqual([memoryPose(m, m.at, true).x, memoryPose(m, m.at, true).scale]);
});
test("centre memories don't slide sideways", () => {
  const nau = MEMORIES.find((m) => m.id === "nau")!;
  expect(memoryPose(nau, nau.at - 0.5, false).x).toBe(0);
});
test("no NaN for out-of-range progress", () => {
  for (const s of [-5, 0, 9, 50]) for (const m of MEMORIES) {
    const p = memoryPose(m, s, false);
    expect([p.opacity, p.x, p.scale].every(Number.isFinite)).toBe(true);
  }
});
```

- [ ] **Step 2: Run** `npx vitest run src/journey/memory`. Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `walk.ts`.**
  - `walkFrame`: clamp `s` to `ENDING_START` from above (not below), then `((Math.floor(s * FRAMES_PER_SCREEN) % WALK_FRAMES) + WALK_FRAMES) % WALK_FRAMES`.
  - `easeProgress`: return `target` when `|target − current| > 1` or `< 0.0005`, otherwise `current + (target − current) * 0.12`.

- [ ] **Step 4: Implement `memories.ts`.** Starting positions in screens, from the 3D landmark distances ÷ 40, adjusted so the nau and Stadshuset fall where the spec wants them:

| id | label | at | layout |
|---|---|---|---|
| arcada | Arcada | 0.3 | side |
| bom-jesus | Bom Jesus do Monte | 0.75 | side |
| uminho | Universidade do Minho | 1.2 | side |
| clerigos | Clérigos | 2.2 | side |
| dom-luis | Ponte Dom Luís I | 2.95 | side |
| nau | A nau | 3.7 | centre |
| jonkoping-university | Jönköping University | 5.4 | side |
| stadshuset | Stadshuset | 8.6 | side |

  `src` is left unset for now. Task 3's placeholder handles a missing `src`, and when Eduardo's images land, each entry gets `src: "/memories/<id>.webp"`.

  `memoryPose`, with `d = m.at − s` (screens still ahead). This is the spike's curve rescaled to screens:
  ```ts
  const vis = smooth(1.0, 0.5, d) * (1 - smooth(0, -0.4, d)); // smoothstep(edge0, edge1, x); exactly 1 at d = 0
  const near = clamp(1 - d / 1.0, -0.5, 1.3);                     // 0 far → 1 alongside
  const k = reducedMotion ? 1 : near;
  // side:   x = k * 30, scale = 0.35 + k * 0.75
  // centre: x = 0,      scale = 0.5 + k * 0.9
  ```
  Clamp `vis` to `[0, 1]`.

- [ ] **Step 5: Run** `npx vitest run src/journey/memory`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/journey/memory
git commit -m "feat: scroll maths for the memory walk"
```

---

### Task 3: `MemoryWalk` component

**Files:**
- Create: `src/journey/memory/MemoryWalk.tsx`, `src/journey/memory/MemoryWalk.module.css`
- Test: `src/journey/memory/MemoryWalk.test.tsx`

**Interfaces:**
- Consumes: `getScreens()` from `src/journey/progress.ts`; `voyageState(s).mapOpacity` from `src/journey/voyage/phase.ts`; everything Task 2 produces.
- Produces: `export function MemoryWalk(): JSX.Element`. It is a fixed, `aria-hidden` layer at `z-index: 0` that takes the place of `JourneyCanvas`.

- [ ] **Step 1: Write the failing tests** (jsdom; `HTMLCanvasElement.getContext` returns null there, which also covers Review Focus 5):

```tsx
test("renders the walker on the still frame, one node per memory, aria-hidden", () => {
  const { container } = render(<MemoryWalk />);
  const root = container.firstElementChild!;
  expect(root.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector("img")!.getAttribute("src")).toBe("/walk/walk-000.webp");
  expect(container.querySelectorAll("[data-memory]")).toHaveLength(MEMORIES.length);
});
test("a memory without an image shows its name as a placeholder", () => {
  const { container } = render(<MemoryWalk />);
  expect(container.querySelector('[data-memory="arcada"]')!.textContent).toContain("Arcada");
});
test("keeps the still frame when frames fail to load", async () => {
  vi.stubGlobal("Image", class { onload?: () => void; onerror?: () => void; set src(_: string) { queueMicrotask(() => this.onerror?.()); } });
  setScreens(1.234); // a position whose walkFrame isn't 0
  const { container } = render(<MemoryWalk />);
  await act(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(container.querySelector("img")!.getAttribute("src")).toBe("/walk/walk-000.webp");
  vi.unstubAllGlobals();
  setScreens(0);
});
test("does not pull in three.js", async () => {
  const src = readFileSync("src/journey/memory/MemoryWalk.tsx", "utf8");
  expect(src).not.toMatch(/three|@react-three|\/scene\/|\/art\/|\.\.\/path/);
});
```

- [ ] **Step 2: Run** `npx vitest run src/journey/memory/MemoryWalk.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement the markup and CSS.** A fixed root (`inset: 0`) containing:
  - the sky: a CSS radial gradient using the spike's colours `#1d2c5e → #0b1433 → #050a1c`, lighter at the bottom centre;
  - a `<canvas>` for the stars;
  - one `<div data-memory={id}>` per memory: a `background-image` when `src` is set, otherwise a placeholder with a blurred navy-to-indigo wash and the `label` in `var(--font)`;
  - the walker `<img>`.

  Memory base box, as in the spike: side memories at `right: 5vw; top: 12vh; width: 28vw; height: 62vh`, centre memories centred at `width: 40vw; height: 70vh`. Edge mask on every memory: `mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, transparent 100%)` (plus the `-webkit-` prefix). Walker: `height: 97vh; bottom: -3vh`, centred, `filter: drop-shadow(0 0 18px rgba(120,150,255,.25))`.

  Phones (`max-width: 640px`), starting values to tune in Task 5: walker `height: 60vh; bottom: 0`; side memories `left: 50%; right: auto; top: 10vh; width: 70vw; height: 30vh`, centred, and they don't slide (zero out `x` for phones in the loop).

- [ ] **Step 4: Implement the loop in a `useEffect`.**
  - Preload all `WALK_FRAMES` images with `new Image()`. Once every one has loaded, set `ready`; if any fails, never set it.
  - Read `matchMedia("(prefers-reduced-motion: reduce)")` once.
  - Keep `p = getScreens()` and run one rAF loop. Each tick:
    - `p = easeProgress(p, getScreens())`;
    - draw 420 stars, with depth `z = ((star.z − p·0.4) mod 1) + 0.02`, projected from the centre as in the spike; in reduced motion, `p` is not used for depth, so the stars are static;
    - for each memory node, apply `memoryPose` → `opacity` and `transform: translateX(x vw) scale(scale)`;
    - set the walker's `opacity` to `1 − voyageState(p).mapOpacity`;
    - if `ready` and not reduced motion, swap `img.src` to `walkFrameUrl(walkFrame(p))`, only when the frame changed.
  - Size the canvas to `innerWidth·dpr × innerHeight·dpr` on mount and on `resize`.
  - If `getContext("2d")` is null, skip the stars.
  - Cancel the rAF and remove the listener on unmount.

- [ ] **Step 5: Run** `npx vitest run src/journey/memory`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/journey/memory
git commit -m "feat: MemoryWalk scene with scroll-scrubbed walk"
```

---

### Task 4: Wire into the homepage + welcome banner

**Files:**
- Modify: `src/app/page.tsx`, `src/journey/timeline.ts`, `src/ui/JourneyOverlay.tsx`
- Test: `src/journey/timeline.test.ts`, `src/ui/JourneyOverlay.test.tsx`, `e2e/journey.spec.ts`

**Interfaces:**
- Consumes: `MemoryWalk` (Task 3); `WELCOME_BANNER` from `src/content/voyage.ts`.
- Produces: the `Overlay` union gains `{ kind: "banner"; t: number }`.

- [ ] **Step 1: Write the failing tests.**
  - `timeline.test.ts`: `overlayAt(segmentStart("jonkoping") + 0.15)` equals `{ kind: "banner", t: 0.5 }`, and `overlayAt(segmentStart("jonkoping") + chapterDelay("jonkoping"))` has `kind: "chapter"`.
  - `JourneyOverlay.test.tsx`: at that position, the screen shows the text `WELCOME_BANNER`.
  - `e2e/journey.spec.ts`: the walker `img[src^="/walk/"]` is visible on `/`, and scrolling to `segmentStart("jonkoping") + 0.15` screens shows `WELCOME_BANNER`. Update any existing e2e assertion that depends on the 3D canvas.

- [ ] **Step 2: Run** `npx vitest run src/journey/timeline.test.ts src/ui/JourneyOverlay.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - In `overlayAt`: when `id === "jonkoping"` and `x < chapterFrom`, return `{ kind: "banner", t: (x − segmentStart(id)) / chapterDelay(id) }` instead of `none`.
  - `JourneyOverlay` renders the banner with the existing `block` and `chapterTitle` classes, opacity `Math.min(t / 0.3, 1)`.
  - In `page.tsx`, replace the `JourneyCanvas` dynamic import and its element with `<MemoryWalk />`. Leave `JourneyCanvas.tsx` and its test untouched.

- [ ] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: all pass. Then confirm that three is out of the homepage bundle: `grep -l WebGLRenderer .next/static/chunks/*.js` should match no chunk referenced by `/` (check the route's chunk list in `.next/app-build-manifest.json` or this Next version's equivalent).

- [ ] **Step 5: Run** `npm run e2e`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/journey/timeline.ts src/journey/timeline.test.ts src/ui/JourneyOverlay.tsx src/ui/JourneyOverlay.test.tsx e2e/journey.spec.ts
git commit -m "feat: memory walk replaces the 3D world on the homepage"
```

---

### Task 5: Tune in the browser

**Files:**
- Modify (values only): `src/journey/memory/walk.ts` (`FRAMES_PER_SCREEN`), `memories.ts` (`at` values, pose constants), `MemoryWalk.module.css` (phone layout)

- [ ] **Step 1: Run** `npm run dev` and walk the whole journey on desktop: forward, back, and a stage-header jump. Check four things:
  - the walk speed matches the scroll, with no foot sliding against the stars;
  - every memory is readable and doesn't collide with the text block;
  - the nau → map → Jönköping hand-off has no gap where the screen is empty for more than a moment;
  - at the Stockholm ending, he is standing still.
- [ ] **Step 2: Check** reduced motion (DevTools → Rendering → emulate `prefers-reduced-motion`) and a 390×844 phone viewport. Rotate it to landscape to check resizing. On the phone, check that the text, the memory and the walker don't overlap the bottom bar.
- [ ] **Step 3: Adjust** only constants and CSS values. Re-run `npm test`, since the tests pin behaviour, not exact values (update the test if a pinned position such as the nau's segment moves).
- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: tune memory walk speeds and phone layout"
```
