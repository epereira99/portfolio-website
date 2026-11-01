# Foundation & Journey Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running site where scrolling walks a placeholder avatar forward through four stand-in cities. It includes the stage header and chapter bar, project overlays with "Read more", the project detail dialog, the home intro, the Projects fan and an About placeholder.

**Architecture:** A fixed full-screen R3F canvas sits behind a tall scroll spacer. Scroll position, measured in *screens* (`scrollY / innerHeight`), is the single input. Pure modules map screens to segment, overlay, path position, camera pose and walk-clip time. React UI reads the same value from a tiny store. Project and stage content lives in typed data files, and the fan, the Journey overlay and the dialog all render from them.

**Tech Stack:** Next.js 16.4.3 (App Router, TypeScript, CSS Modules), React 19.3.1, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, gsap 3.15.0 + @gsap/react 2.1.2, Vitest 5.0.5 + jsdom 30.1.3 + @testing-library/react 16.3.3, @playwright/test 1.64.1, Blender 5.2.2 (`/Applications/Blender.app/Contents/MacOS/Blender`), Node 24.

**Spec:** `docs/superpowers/specs/2026-11-01-portfolio-website-design.md`

**Scope:** This is plan 1 of 5. It covers spec §14 build steps 1–2. Later plans cover (2) the voyage, (3) the ending, (4) Townscaper art per city and landmarks, and (5) fallbacks, phones and performance. Placeholder cities never ship publicly (spec §13).

## Global Constraints

- Stage ids, exactly: `braga`, `porto`, `voyage`, `jonkoping`, `stockholm`. `voyage` is a segment, not a stage, and has no projects.
- Length budget in screens (spec §6): braga 1.5, porto 2, voyage 1.5, jonkoping 2, stockholm 1.5. Total 8.5.
- No GitHub links anywhere in content or UI (spec §2).
- Water only in porto, voyage, jonkoping and stockholm. Never in braga (spec §7).
- Navigation (stage header, Projects, About) stays visible at every scroll position (spec §3).
- All motion respects `prefers-reduced-motion: reduce` (spec §5).
- The only expand motion is on the opened element; nothing else on screen moves (spec §5).
- Shareable link format: `/?project=<slug>` opens that project's dialog without moving the Journey (spec §5).
- Avatar contract (spec §8): `/models/avatar.glb`, Mixamo bone names (`mixamorig:Hips` …), Y-up, facing +Z, ~1.8 units tall, clips named `idle`, `walk`, `turn`.
- Contact: `eduardoluisvp99@gmail.com`, `https://www.linkedin.com/in/eduardopereira-/`.

## Review Focus

1. **Window resize mid-Journey:** the walker should stay at the same place in the story, not jump to another city. The test lives in Task 5.
2. **Unknown or garbage `?project=` value:** the page loads normally with no dialog and no crash. The test lives in Task 9.
3. **Opening a project mid-walk, then closing it:** the walk resumes from exactly the same scroll position. The test lives in Task 9.
4. **Boundary and out-of-range scroll values** (exact segment edges, overscroll below 0, beyond the end): header and overlay are always defined and consistent. The tests live in Task 3.
5. **WebGL unavailable, or the avatar file failing to load:** intro text, header, fan and dialog all still work. The canvas fails quietly. The test lives in Task 7.

---

### Task 1: Scaffold the app and test tooling

**Files:**
- Create: Next.js app at repo root (`package.json`, `src/app/*`, `tsconfig.json`, …), `vitest.config.ts`, `vitest.setup.ts`, `src/smoke.test.ts`
- Modify: `.gitignore` (add `.superpowers/`)

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run dev`, path alias `@/*` → `src/*`.

- [ ] **Step 1: Init git and commit the spec**

```bash
git init -b main && printf ".superpowers/\n" > .gitignore
git add .gitignore docs && git commit -m "docs: portfolio website design and plan 1"
```

- [ ] **Step 2: Scaffold into a temp dir, then move it up** (create-next-app refuses a non-empty folder)

```bash
npx create-next-app@16.4.3 web-tmp --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude .gitignore web-tmp/ ./ && cat web-tmp/.gitignore >> .gitignore && rm -rf web-tmp
npm i three@0.187.0 @react-three/fiber@9.8.2 @react-three/drei@10.7.9 gsap@3.15.0 @gsap/react@2.1.2
npm i -D vitest@5.0.5 jsdom@30.1.3 @testing-library/react@16.3.3 @testing-library/jest-dom @types/three@0.187.0 @vitejs/plugin-react @playwright/test@1.64.1
```

- [ ] **Step 3: Add `vitest.config.ts`** (jsdom environment, `@` alias to `src`, setup file importing `@testing-library/jest-dom/vitest`) and the scripts `"test": "vitest run"` and `"e2e": "playwright test"`. Delete the create-next-app demo content from `src/app/page.tsx` (render `null` for now) and `page.module.css`.

- [ ] **Step 4: Write `src/smoke.test.ts`** with `expect(1 + 1).toBe(2)`, then run `npm test`. Expected: 1 passed.

- [ ] **Step 5: Run `npm run build`.** Expected: build succeeds.

- [ ] **Step 6: Commit** with `chore: scaffold Next.js app with R3F, GSAP and Vitest`.

---

### Task 2: Stage and project content

**Files:**
- Create: `src/content/stages.ts`, `src/content/projects.ts`, `src/content/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type StageId = 'braga' | 'porto' | 'jonkoping' | 'stockholm';
  export type Stage = { id: StageId; city: string; header: string };
  export const STAGES: Stage[];            // in journey order
  export type Project = {
    slug: string; title: string; stage: StageId; order: number; // order within stage, 0-based
    stageLabel: string;  // e.g. "Porto · Deloitte"
    subtitle: string;    // one line, shown in the Journey overlay
    tags: string[]; color: string;          // card graphic background
    sections: { heading: string; body: string }[];
  };
  export const PROJECTS: Project[];
  export function projectsForStage(id: StageId): Project[]; // sorted by order
  export function projectBySlug(slug: string): Project | undefined;
  ```

- [ ] **Step 1: Write the failing tests** in `content.test.ts`:
  - `STAGES.map(s => s.id)` equals `['braga','porto','jonkoping','stockholm']`.
  - The headers are exactly `'BSc Computer Science · Universidade do Minho · 2017–2022'`, `'Deloitte · Cloud & DevOps → Integration Software · 2022–2024'`, `'MSc AI Engineering · Jönköping University · 2024–2026'` and `'Effektify & personal projects · 2026–now'`.
  - `PROJECTS` slugs are unique and equal (as a set) `['mambu-migration','azure-ml-integrations','unet-segmentation','saab-thesis','financial-hub','effektify-reconciliation']`.
  - `projectsForStage('porto').map(p=>p.slug)` equals `['mambu-migration','azure-ml-integrations']`, jonkoping equals `['unet-segmentation','saab-thesis']`, stockholm equals `['financial-hub','effektify-reconciliation']`, and braga equals `[]`.
  - `JSON.stringify(PROJECTS)` does not match `/github\.com/i`.
  - `projectBySlug('nope')` is `undefined`.

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, module not found.

- [ ] **Step 3: Implement both files.** Take titles, stage labels and tags from spec §5 and the mockup `docs/superpowers/specs/mockups/home-and-project-fan.html`. Each project gets three sections, headed `The problem`, `What I built` and `Result`, with body `'Coming soon.'`. The real copy comes later (spec §11).

- [ ] **Step 4: Run `npm test`.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: stage and project content data`.

---

### Task 3: Journey timeline (screens → segment, overlay)

**Files:**
- Create: `src/journey/timeline.ts`, `src/journey/timeline.test.ts`

**Interfaces:**
- Consumes: `StageId`, `projectsForStage` (Task 2).
- Produces:
  ```ts
  export type SegmentId = StageId | 'voyage';
  export const SEGMENTS: { id: SegmentId; screens: number }[]; // braga 1.5, porto 2, voyage 1.5, jonkoping 2, stockholm 1.5
  export const TOTAL_SCREENS: number;            // 8.5
  export const INTRO_END = 0.5;                  // intro visible while s < 0.5
  export function segmentAt(s: number): SegmentId;      // clamps s to [0, TOTAL_SCREENS]; start-inclusive
  export function segmentStart(id: SegmentId): number;  // in screens
  export type Overlay = { kind: 'intro' } | { kind: 'project'; slug: string } | { kind: 'none' };
  export function overlayAt(s: number): Overlay;
  ```
- Overlay rule: if `s < INTRO_END`, return intro. Voyage returns none. Otherwise, take a stage with n > 0 projects, starting at `start + lead` (`lead` = 0.5 for braga, 0.25 otherwise) and ending at `end`. Split it into n equal slots of length L. Project k is visible on `[slotStart + 0.15L, slotEnd − 0.15L)`, and the rest is none.

- [ ] **Step 1: Write the failing tests:**
  - `TOTAL_SCREENS` is `8.5`. `segmentStart('porto')` is `1.5`, `segmentStart('voyage')` is `3.5`, `segmentStart('jonkoping')` is `5` and `segmentStart('stockholm')` is `7`.
  - `segmentAt(-1)` is `'braga'`, `segmentAt(1.5)` is `'porto'`, `segmentAt(3.49)` is `'porto'`, `segmentAt(3.5)` is `'voyage'`, `segmentAt(8.5)` is `'stockholm'` and `segmentAt(99)` is `'stockholm'`.
  - `overlayAt(0)` and `overlayAt(0.49)` are `{kind:'intro'}`. `overlayAt(0.5)` is `{kind:'none'}` (braga has no projects).
  - `overlayAt(2.0)` is `{kind:'project', slug:'mambu-migration'}`, `overlayAt(2.6)` is `{kind:'none'}` and `overlayAt(3.0)` is `{kind:'project', slug:'azure-ml-integrations'}`.
  - `overlayAt(4.0)` is `{kind:'none'}` (voyage). `overlayAt(-5)` is intro and `overlayAt(50)` is `{kind:'none'}`.

- [ ] **Step 2: Run `npm test -- timeline`.** Expected: FAIL.
- [ ] **Step 3: Implement `timeline.ts`.**
- [ ] **Step 4: Run `npm test -- timeline`.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: journey timeline mapping scroll to segments and overlays`.

---

### Task 4: Path, camera and walk math

**Files:**
- Create: `src/journey/path.ts`, `src/journey/path.test.ts`

**Interfaces:**
- Consumes: `TOTAL_SCREENS` (Task 3).
- Produces:
  ```ts
  export const UNITS_PER_SCREEN = 40;
  export const PATH_LENGTH: number;                     // TOTAL_SCREENS * UNITS_PER_SCREEN = 340
  export function distanceAt(s: number): number;        // clamp(s,0,TOTAL)*UNITS_PER_SCREEN
  export function pathPoint(d: number): [number, number, number];   // y = 0, walks toward -Z
  export function pathTangent(d: number): [number, number, number]; // unit vector
  export function cameraPose(d: number): { position: [number,number,number]; target: [number,number,number] };
  export function walkClipTime(d: number, stride: number, duration: number): number;
  ```
- The path is a three `CatmullRomCurve3` through control points at z = 0, −60, −120, … −PATH_LENGTH, with x alternating 0, 6, −6, 4, 0, … for gentle S-bends, sampled with `getPointAt(d / PATH_LENGTH)`. The camera sits at `point − tangent·6 + (0,3,0)` and looks at `pathPoint(d+5) + (0,1.2,0)`. `walkClipTime` returns `(((d / stride) % 1) + 1) % 1 * duration`.

- [ ] **Step 1: Write the failing tests:**
  - `pathPoint(0)` deep-equals `[0,0,0]` (to 5 decimal places).
  - For d = 0, 10, …, 340: y is 0, z is non-increasing and |x| ≤ 7.
  - `distanceAt(-1)` is `0` and `distanceAt(100)` is `340`.
  - `cameraPose(0).position[1]` is `3` and `cameraPose(0).position[2]` is greater than 0 (behind the walker, who faces −Z).
  - `walkClipTime(0.8, 1.6, 1)` is `0.5`, `walkClipTime(-0.8, 1.6, 1)` is `0.5`, and `walkClipTime(3.2, 1.6, 2)` is `0`.
- [ ] **Step 2: Run** `npm test -- path`. Expected: FAIL.
- [ ] **Step 3: Implement `path.ts`.**
- [ ] **Step 4: Run** `npm test -- path`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: journey path, camera pose and walk cycle math`.

---

### Task 5: Scroll progress store and driver

**Files:**
- Create: `src/journey/progress.ts`, `src/journey/ScrollDriver.tsx`, `src/journey/progress.test.ts`

**Interfaces:**
- Consumes: `TOTAL_SCREENS`, `segmentStart` (Task 3).
- Produces:
  ```ts
  // progress.ts — module-level store, value in screens
  export function getScreens(): number;
  export function setScreens(s: number): void;
  export function subscribe(fn: () => void): () => void;
  export function useScreens(): number;                    // useSyncExternalStore
  export function scrollToScreens(s: number, behavior?: ScrollBehavior): void; // window.scrollTo({top: s*innerHeight})
  export function readScreensFromWindow(): number;         // scrollY / innerHeight
  // ScrollDriver.tsx
  export function ScrollDriver(): JSX.Element;             // renders the spacer: height (TOTAL_SCREENS+1)*100svh
  ```
- `ScrollDriver` registers a GSAP `ScrollTrigger` on its spacer (`start: 'top top'`, `end: 'bottom bottom'`, `onUpdate`) that calls `setScreens(readScreensFromWindow())`. On `resize` it keeps the walker in place: it reads `getScreens()` from before the resize, then calls `scrollToScreens(prev, 'instant')` and `ScrollTrigger.refresh()`.

- [ ] **Step 1: Write the failing tests:**
  - `setScreens(2)`, then `getScreens()` returns 2, and a subscriber was called once.
  - `scrollToScreens(3)` with `innerHeight` = 800 calls `window.scrollTo` with `top: 2400` (spy on it).
  - **Review Focus 1:** render `<ScrollDriver/>`, then `setScreens(5)`. Change `innerHeight` from 800 to 400 and dispatch `resize`. `window.scrollTo` was last called with `top: 2000`.
- [ ] **Step 2: Run** `npm test -- progress`. Expected: FAIL.
- [ ] **Step 3: Implement both files.**
- [ ] **Step 4: Run** `npm test -- progress`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: scroll-driven progress store`.

---

### Task 6: Placeholder avatar (Blender script → glb)

**Files:**
- Create: `tools/blender/placeholder_avatar.py`, `public/models/avatar.glb` (generated), `src/assets.test.ts`

**Interfaces:**
- Produces: `public/models/avatar.glb` meeting the avatar contract in Global Constraints.

- [ ] **Step 1: Write the failing test** `src/assets.test.ts`. It reads the glb with `fs`, checks that the magic is `glTF`, and parses chunk 0 as JSON. Assert:
  - `animations.map(a => a.name)` includes `'idle'`, `'walk'` and `'turn'`.
  - `nodes.map(n => n.name)` includes `'mixamorig:Hips'`, `'mixamorig:LeftUpLeg'`, `'mixamorig:RightUpLeg'` and `'mixamorig:Head'`.
  - The `max[1]` of every mesh `POSITION` accessor, plus its node translation, is ≤ 2.0 (≈1.8 tall).
- [ ] **Step 2: Run** `npm test -- assets`. Expected: FAIL (the file is missing).
- [ ] **Step 3: Write `placeholder_avatar.py`** (bpy, run headless). It clears the scene and builds an armature whose bones use Mixamo names: Hips, Spine, Neck, Head, Left/Right UpLeg, Leg, Arm, ForeArm. Each bone gets a rounded capsule, a pastel color, and is bone-parented, so the shapes stay rigid (no skinning needed for the placeholder). Model it facing Blender −Y, which exports as glTF +Z. It creates three actions and pushes each to an NLA track so all of them export:
  - `idle`: 2 s chest bob.
  - `walk`: 1 s loop, legs swinging ±30° and arms countering ±20°, covering one stride of 1.6 units.
  - `turn`: 1 s, Hips rotating 180° around Z.

  Export with `bpy.ops.export_scene.gltf(filepath=…, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS')`.
- [ ] **Step 4: Generate the glb.** Run `/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/placeholder_avatar.py -- public/models/avatar.glb`. Expected: exits 0 and the file exists.
- [ ] **Step 5: Run** `npm test -- assets`. Expected: PASS.
- [ ] **Step 6: Commit** with `feat: scripted placeholder avatar following the avatar contract`.

---

### Task 7: 3D scene: canvas, avatar, stand-in cities

**Files:**
- Create: `src/journey/scene/JourneyCanvas.tsx`, `src/journey/scene/Avatar.tsx`, `src/journey/scene/CameraRig.tsx`, `src/journey/scene/StandInCities.tsx`, `src/journey/scene/standIn.ts`, `src/journey/scene/standIn.test.ts`, `src/journey/scene/JourneyCanvas.test.tsx`

**Interfaces:**
- Consumes: `getScreens` (Task 5); `distanceAt`, `pathPoint`, `pathTangent`, `cameraPose`, `walkClipTime` (Task 4); `SEGMENTS`, `segmentStart` (Task 3); `/models/avatar.glb` (Task 6).
- Produces:
  ```ts
  export function JourneyCanvas(): JSX.Element;  // fixed inset-0, z-index 0, aria-hidden; error boundary renders null on failure
  // standIn.ts (pure, deterministic — seeded RNG, seed = segment index)
  export type Block = { along: number; x: number; z: number; w: number; h: number; d: number; color: string }; // along = path distance it sits beside
  export function standInBlocks(id: SegmentId): { blocks: Block[]; water: { x: number; z: number; w: number; d: number } | null; sky: string };
  ```
- Per-segment stand-in colors follow spec §6 moods. Braga: cream/granite, sky `#f6d7a7`. Porto: orange roofs, sky `#f3a46b`. Voyage: no blocks, all water. Jönköping: red `#b23a2e` cottages, sky `#bcd3e6`. Stockholm: ochre, sky `#2b3555`. The scene background and fog lerp toward the current segment's sky.
- `Avatar` loads `/models/avatar.glb` with `useGLTF` and `useAnimations`, rotated π around Y so it walks toward −Z. Each frame it sets the position to `pathPoint(d)` and the `walk` clip's time to `walkClipTime(d, 1.6, clip.duration)`, with the action paused and driven manually. When d hasn't changed for 300 ms, it cross-fades to `idle`.
- `CameraRig` lerps the camera toward `cameraPose(d)` each frame (factor 0.15).

- [ ] **Step 1: Write the failing tests:**
  - `standInBlocks('braga').water` is `null`. For porto, voyage, jonkoping and stockholm, `water` is not null.
  - `standInBlocks('voyage').blocks` has length 0.
  - For every non-voyage segment, every block's `along` is within `[segmentStart*40, (segmentStart+screens)*40]`. The block's horizontal (x/z) distance from `pathPoint(block.along)` is ≥ 3 (no blocks on the walkway).
  - Two calls to `standInBlocks('porto')` deep-equal each other (deterministic).
  - **Review Focus 5:** mock `@react-three/fiber`'s `Canvas` to throw on render, then render `<JourneyCanvas/>` next to `<p>still here</p>`. The test does not throw, and "still here" is in the document.
- [ ] **Step 2: Run** `npm test -- scene`. Expected: FAIL.
- [ ] **Step 3: Implement the files.** Each block is a `RoundedBox` from drei (radius 0.15) in a soft standard material. Lighting is one hemisphere light plus one directional light with soft shadows.
- [ ] **Step 4: Run** `npm test -- scene`. Expected: PASS.
- [ ] **Step 5: Check it visually.** Temporarily render `<ScrollDriver/>` and `<JourneyCanvas/>` in `page.tsx`, then run `npm run dev`. Scroll the full page. Expected: the avatar walks into the screen, seen from behind. Its legs move in step with the scroll with no foot sliding. The sky and blocks change across five segments. Braga has no water, and the voyage segment is water only.
- [ ] **Step 6: Commit** with `feat: journey 3D scene with placeholder avatar and stand-in cities`.

---

### Task 8: Stage header and chapter bar

**Files:**
- Create: `src/ui/StageHeader.tsx`, `src/ui/StageHeader.module.css`, `src/ui/StageHeader.test.tsx`

**Interfaces:**
- Consumes: `useScreens`, `scrollToScreens` (Task 5); `segmentAt`, `segmentStart`, `INTRO_END` (Task 3); `STAGES` (Task 2).
- Produces: `export function StageHeader(): JSX.Element`, rendered as a `<nav aria-label="Journey">`. It contains four buttons, one per city, with `aria-current="step"` on the current one, and a `<p>` holding the current stage `header`. During voyage the `<p>` reads `'At sea · Porto → Jönköping'` and no button is current. The header is hidden while `s < INTRO_END` (the home intro owns that moment), using `opacity: 0` and `pointer-events: none`.

- [ ] **Step 1: Write the failing tests** (set the store via `setScreens`):
  - At s=2, "Porto" has `aria-current="step"` and the text contains `'Deloitte · Cloud & DevOps'`.
  - At s=4, the text is `'At sea · Porto → Jönköping'` and no button is current.
  - Clicking "Stockholm" calls `scrollToScreens(7, 'smooth')` (spy on it).
  - At s=0.2, the nav has the hidden class.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement the component.** Style it as the dark glassy pill from the mockups, top center, with the current city's button highlighted.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: stage header doubling as chapter bar`.

---

### Task 9: Project detail dialog, shareable link and walk pause

**Files:**
- Create: `src/ui/ProjectDialog.tsx`, `src/ui/ProjectDialog.module.css`, `src/ui/useOpenProject.ts`, `src/ui/ProjectDialog.test.tsx`

**Interfaces:**
- Consumes: `Project`, `projectBySlug` (Task 2).
- Produces:
  ```ts
  // useOpenProject.ts — module store like progress.ts, synced to ?project=
  export function useOpenProject(): { slug: string | null; open(slug: string): void; close(): void };
  export function ProjectDialog(): JSX.Element | null; // renders when slug resolves to a project
  ```
- On mount, `useOpenProject` reads `?project=` and keeps it only if `projectBySlug` resolves it. `open` and `close` use `history.replaceState` to update the param, so there are no extra history entries. The dialog is `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing at the title. It shows the stage label, title, tags and sections. On open it focuses ✕, and on close it restores focus to the opener. Esc, ✕ and clicking the backdrop all close it. While it's open, `document.documentElement.style.overflow = 'hidden'`, which pauses the walk; on close it's restored. The card scales in from 0.6 to 1 (spec §5 mockup); with reduced motion it's instant.

- [ ] **Step 1: Write the failing tests:**
  - With the URL at `/?project=financial-hub`, the dialog has the heading "Financial Hub".
  - **Review Focus 2:** with the URL at `/?project=does-not-exist`, there is no dialog and nothing throws. With `/?project=` (empty), there is no dialog.
  - `open('saab-thesis')` makes `location.search` equal `'?project=saab-thesis'`, and `close()` makes it `''`.
  - Pressing Escape closes the dialog. Clicking ✕ closes it.
  - **Review Focus 3:** set `window.scrollY` to 1600 (stub it), open a project, and check that `documentElement.style.overflow` is `'hidden'`. After closing, overflow is `''`, and `window.scrollTo` was not called.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement the files.**
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: project dialog with shareable links and walk pause`.

---

### Task 10: Journey overlay (home intro ↔ project blurbs)

**Files:**
- Create: `src/ui/JourneyOverlay.tsx`, `src/ui/JourneyOverlay.module.css`, `src/ui/JourneyOverlay.test.tsx`

**Interfaces:**
- Consumes: `useScreens` (Task 5), `overlayAt` (Task 3), `projectBySlug` (Task 2), `useOpenProject().open` (Task 9).
- Produces: `export function JourneyOverlay(): JSX.Element`, a top-left block. **Intro:** a photo placeholder circle, `<h1>Eduardo Pereira</h1>`, the role line `'AI / ML / Software Engineer'`, and the intro text `'MSc in AI Engineering. Based in Stockholm, open to new roles. Scroll to walk through my journey from Braga to Stockholm.'` (placeholder copy, spec §11). **Project:** an `<h2>` title, a subtitle `<p>`, and a "Read more" button that calls `open(slug)`. Content cross-fades over 300 ms when the overlay changes. The intro text is server-rendered, so it shows before the 3D loads (spec §10).

- [ ] **Step 1: Write the failing tests:**
  - At s=0, the heading is "Eduardo Pereira" and "AI / ML / Software Engineer" is present.
  - At s=2, there's a heading "Mambu migration tool" and a "Read more" button. Clicking it calls `open('mambu-migration')`.
  - At s=4, there's no heading and no Read more button.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement the component.**
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: journey overlay for intro and project blurbs`.

---

### Task 11: Bottom bar, Projects fan, About placeholder

**Files:**
- Create: `src/ui/BottomBar.tsx`, `src/ui/BottomBar.module.css`, `src/ui/fan.ts`, `src/ui/fan.test.ts`, `src/ui/BottomBar.test.tsx`, `src/app/about/page.tsx`

**Interfaces:**
- Consumes: `PROJECTS` (Task 2), `useOpenProject().open` (Task 9).
- Produces:
  ```ts
  export function fanPositions(n: number, step?: number, rx?: number, ry?: number): { x: number; y: number }[];
  // defaults step=130, rx=420, ry=170; x = (k-(n-1)/2)*step; y = -sqrt(1-(x/rx)^2)*ry - 40
  export function BottomBar(): JSX.Element;
  ```
- `BottomBar` is fixed at the bottom center. It has a "Projects" button (`aria-expanded`) and an "About me" `next/link` to `/about`. The fan origin is centered between the two buttons (spec §4). Cards are 118 px wide: the graphic area uses the project `color` with a simple placeholder SVG, and the title sits underneath. The fan staggers out by 35 ms per card with a slight bounce, and hovering a card scales it to 1.1. Below 768 px wide, the fan becomes a horizontally scrollable row above the bar. Esc or a click outside closes it, and choosing a card closes the fan and calls `open(slug)`. `/about` renders "About me", the line "Coming soon.", and a link back home.

- [ ] **Step 1: Write the failing tests:**
  - `fanPositions(6)` x-values are `[-325,-195,-65,65,195,325]`, and consecutive x-gaps are ≥ 118 (no overlap).
  - `fanPositions(6)[2].y` is less than `fanPositions(6)[0].y` (the middle sits higher), and `fanPositions(1)` is `[{x:0, y:-210}]`.
  - Clicking "Projects" sets `aria-expanded="true"` and shows 6 buttons named after the project titles.
  - Clicking "Financial Hub" calls `open('financial-hub')` and collapses the fan. Escape collapses it too.
  - The "About me" link has `href="/about"`.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement the files**, matching `docs/superpowers/specs/mockups/home-and-project-fan.html`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: bottom bar with project fan and about placeholder`.

---

### Task 12: Assemble the page and run an end-to-end check

**Files:**
- Modify: `src/app/page.tsx`, `src/app/layout.tsx` (title "Eduardo Pereira · AI / ML / Software Engineer", and metadata description), `src/app/globals.css` (dark UI tokens, reduced-motion rule)
- Create: `playwright.config.ts` (webServer: `npm run dev`, port 3000), `e2e/journey.spec.ts`

**Interfaces:**
- Consumes: `ScrollDriver`, `JourneyCanvas`, `StageHeader`, `JourneyOverlay`, `BottomBar`, `ProjectDialog`.

- [ ] **Step 1: Write the failing e2e test** `e2e/journey.spec.ts`:
  - On `/`, the heading "Eduardo Pereira" is visible within 2 s (before the 3D is ready) and the "Projects" button is visible.
  - After scrolling to `2 * innerHeight`, the Journey nav shows "Porto" as current, and the heading "Mambu migration tool" is visible.
  - Clicking "Read more" shows a dialog, and the URL contains `?project=mambu-migration`. After Escape, the dialog is gone and `scrollY` is still `2 * innerHeight`.
  - On `/?project=financial-hub`, the dialog heading is "Financial Hub".
  - Clicking "Projects", then the card whose name contains "U-Net", opens a dialog.
  - After scrolling to `4 * innerHeight`, "At sea · Porto → Jönköping" is visible and the Projects button is still visible (navigation is never lost).
- [ ] **Step 2: Run** `npx playwright install chromium && npm run e2e`. Expected: FAIL.
- [ ] **Step 3: Compose `page.tsx`.** It's a client component rendering, in order: `ScrollDriver`, `JourneyCanvas` (via `next/dynamic` with `ssr:false`), then `StageHeader`, `JourneyOverlay`, `BottomBar` and `ProjectDialog` as fixed layers above the canvas (z-index 10+).
- [ ] **Step 4: Run** `npm run e2e && npm test && npm run build`. Expected: all pass, and the build succeeds.
- [ ] **Step 5: Commit** with `feat: assemble journey skeleton page with e2e coverage`.
