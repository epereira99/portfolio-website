# Low-poly walk: a Blender-built scene behind the experience

Date: 2026-11-04 · Branch: feat/memories · Replaces the painted/cartoon sprite road (`src/journey/memory/road.ts`, `public/road/*`).

## Why

The current scene is a collage of 12 separately generated images (sky, mountains, ground, one tree, one pine, cloud,
tufts…) placed by code. They don't share light, perspective or brushwork, the same tree repeats dozens of times, nothing
casts a shadow, and the horizon is a hard seam. Eduardo: it "looks really cheap" and "not impressive".

The page exists to show his roles and experience. Earlier landmark art was removed because it pulled attention from that.
So the background's job is to make the site feel crafted and calm, never to compete with the cards.

One Blender scene with one camera and one light fixes the collage problem at the root: everything shares the same style
because it was made together.

## Decided (by Eduardo)

- **Medium:** Blender. His house-tour project (`~/Documents/projects/3d-walkthroughs`) had good results; its look
  (photoreal) is *not* wanted here, but its scripted pipeline (`blender/build_scene.py`, `bake_lightmap.py`,
  `render.py`, `export_web.py`) is the model to follow.
- **Style: low-poly.** Flat faceted shapes, flat shading, a small palette. Mockup "A · Low-poly at dusk"
  (`.superpowers/brainstorm/*/content/background-style.html`).
- **The walker is replaced** by a low-poly figure inside the same scene (the painted/cartoon walk frames go).
- **Camera: pulled back and higher** behind him (mockup "B", `camera.html`). He is small on the path; landscape and sky
  fill the frame; the role card sits in the sky.
- **No meaning in the scenery.** No cities, landmarks or country cues; a visitor sees a calm landscape and a walker.
- **Time of day carries the journey.** One continuous day, starting in the **morning** ("the start of my career and the
  start of the day"). Only light/sky/colour change between stages; the landscape shapes stay the same kind.

## Proposed (Claude's calls, open to change)

- **Light arc per stage:** BSc → early morning (cool, low sun, light mist) · Deloitte → bright late morning/midday ·
  MSc → afternoon · Stockholm/today → golden hour, ending on the warm dusk of mockup A. Transitions blend continuously
  with scroll, not as cuts.
- **Snow/season changes dropped.** The old grass→snow change was a Portugal→Sweden cue; the brief now says no place
  meaning. Only time of day changes.
- **Scenery kit:** rolling faceted ground, a dirt path with a gentle S-bend, 3–5 tree variants (rotated/scaled per
  instance), a few rocks, distant mountain silhouettes, 2–3 cloud shapes. Sparse: lots of open sky. Distance fog/haze for
  depth (far = lighter, toward sky colour).
- **Walker:** simple low-poly figure (no face detail needed from behind), dark jacket + jeans like Eduardo, a looping walk
  cycle, a soft contact shadow.

## Goals

- Reads as one designed world: consistent style, light and shadow everywhere.
- Calm enough that the role cards are the focus; sky region above/left of the walker stays uncluttered for text.
- Scroll-driven as today: walking forward with scroll, backward when scrolling up, stops at the ending.
- Works on mobile (390px portrait) without horizontal overflow and without the walker colliding with cards.
- Respects `prefers-reduced-motion` (still frame per stage, no scrubbing), as today.

## Non-goals

- Landmarks, cities, flags, seasons, weather events.
- Photorealism.
- Changing the content, card copy, header or stage structure (`src/journey/timeline.ts`, `src/content/stages.ts`).
  UI polish raised in the review (placeholders, double header bar, panels) is a separate task.

## Anti-goals (fails even if it "works")

- Anything that looks pasted together: mismatched light, objects without shadows, visible seams, obvious repetition.
- Scenery busy enough to compete with the cards.
- A heavy page: long blank load before anything shows, or janky scrolling.

## Constraints

- Next.js in this repo is a newer version with breaking changes; read `node_modules/next/dist/docs/` before code (AGENTS.md).
- Blender is installed at `/Applications/Blender.app` (not on PATH). Scene must be built by scripts in the repo
  (like the deleted `tools/blender/landmarks/*.py`), so it can be re-run and tweaked, not hand-made in the UI.
- Journey length: 7.5 screens (`TOTAL_SCREENS`), stages braga 1.5 / porto 2 / jonkoping 2 / stockholm 2, ending last 0.5.
- Current frame-sequence budget for reference: painted walk 3.7 MB (139 frames).

## Decided: real-time in the browser

Eduardo chose a **real-time Three.js scene** (2026-11-04) over pre-rendered frames. Blender scripts build the scene
and the walker, then export a GLB, following the house tour's `export_web.py`. The page draws it with Three.js, with
scroll driving the camera, the walk cycle and the time of day. Flat-shaded low-poly looks close to a render when drawn
live, and a single GLB of a few MB replaces what would be tens of MB of frames. The three / R3F dependencies that
were just removed from the working tree come back.

## Claude's calls from the builder check

- **First milestone is four stills** (morning, midday, afternoon, dusk) from the real camera, shown to Eduardo before the
  full scene is built. Only the dusk look has been approved so far.
- **Cards stay as they are.** Their dark glass panel already reads on any sky; the light arc is tuned so the sky
  behind the card never goes brighter than the morning/midday mockups. Card UI changes stay a separate task.
- **Shadows:** stills are free either way. If real-time, one directional sun light with a shadow map that moves with
  the arc; on low-end mobile, fall back to fixed shadows. Not a reason to pick frames over real-time.

## Left to the builder

- Exact palette per time of day, fog density, tree/rock counts and placement.
- Walk-cycle authoring method (hand-keyed vs. Mixamo-style rig) as long as it reads as a calm walk from behind.
- File layout under `tools/blender/` and `public/`, tests matching the repo's existing test style (vitest + Playwright e2e).
- Removing the `?style=` switch, `road.ts` sprite code and `public/road/*` once the new scene is in.
