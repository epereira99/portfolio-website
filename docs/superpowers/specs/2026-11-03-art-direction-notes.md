# Art direction: brainstorm notes (in progress, not yet an approved design)

**Date:** 2026-11-03. Continues spec §8 of `2026-11-03-bug-hunter-world-design.md`. Phase 1 (greybox world) is built and merged on `feat/memories`; run it at `/world`.

## Decided by Eduardo
- **Witcher medieval first, Pokémon second.** Pokémon only shapes the camera angle (top-down, tilted: roof + front face) and the controls.
- **Tooling:** PixelLab via its MCP server in Claude Code. Claude generates, cleans up and places the art; Eduardo reviews and approves. (Replaces "by hand" in spec §8.) Retro Diffusion is optional, a backup for one-off pieces.
- **The hunter is Eduardo as a witcher**, a mix of his real look and a witcher. Concept art: `art/references/eduardo-witcher.*`, made with Nano Banana from 4 photos as a front/side/back turnaround. Use it as PixelLab's reference for the 4-direction character + walk cycle. File: `art/references/eduardo-witcher.jpeg` (front/side/back). Reviewed with Eduardo:
  - **White hair** (Eduardo's call): the witcher signature. Keep the beard and his face shape. White hair also lifts him off the green grass.
  - Keep the green cloak, dark leather harness, brown boots and the **beetle medallion** (1–2 gold pixels). The beetle fits "bug hunter" and steers clear of Witcher IP.
  - **Two swords crossed on the back** in every direction. Drop the hip sword from the front view (the concept's views disagree).
  - Drop the potions, pouches and quilting; they don't survive at about 24×32 px (Claude's call on size).
  - Black outline, so he stays readable on green grass. Check him against a grass tile before paying for the walk cycle.
- **Budget over fidelity:** PixelLab is on a 40-generation trial. Pro mode (10 generations per character) is too expensive. Make the hunter the cheap way: front view of the concept → south-facing sprite (image-to-pixel-art) → `create_character` v3 with that reference, 4 directions, low top-down. That's about 2–3 generations.
- **At spawn** (Swedish bank, by the river, next to the main board):
  - A **place sign** "Sweden" on this bank and "Portugal" on the far bank.
  - **Direction signs** with arms pointing to Deloitte, BSc Computer Science, Saab, MSc AI (and the other places: Claude's guess).
  - Direction signs must look different from place-name signs.
- **Academies are stone fortresses** like a witcher school. Jönköping University (MSc) is bigger and grander than UMinho (BSc).
- **Each village has its own character:**
  - Jordbruksverket: crop fields and farm animals.
  - Saab: clearly a military compound.
  - Deloitte: a corporate building.
- **Layout:** places move closer together so there's less walking. This is a map change in `tools/world/make-map.mjs`, not only art.

- **Board close-up backdrop:** not the real surroundings (too much for a first run). A plain scene of pine trees and grass behind the board. Showing the real surroundings can come later.
- **Board:** a weathered timber notice board with a small shingle roof on two posts. Board + backdrop are one pixel-art image (Claude's guess, Eduardo OK'd it "for now").
- **Pinned contracts look like wanted posters** (Eduardo). The heading sits at the top, the company logo takes the portrait spot, then the title and the village. Finished contracts get a red wax seal. Papers are HTML on top of the board image, so they can lift, outline and be tapped. Layout details are Claude's call.
- **Scroll:** only the parchment frame is art (curled top-left corner, rolled bottom). The text stays HTML (Claude's guess, OK'd "for now").

## Claude's calls (Eduardo had no preference; changeable once he sees tiles)
- **Mood:** late afternoon under a light overcast, between grim and storybook. A muted, earthy palette (mud browns, mossy greens, grey stone, weathered timber) with no neon. The red of the seals and pins is the strong accent.
- **Banks:** Portugal warmer (terracotta roofs, dry golden grass); Sweden cooler (greener grass, dark pines, red-painted timber).
- **Effektify** is a startup workshop or guild hall. The childhood house is cosy and Portuguese; the current house is Swedish red timber.
- **Grid:** 16×16 tiles. The view is 20×13 tiles (`src/world/config.ts`). Big buildings (fortresses, the corporate building, the compound) are multi-tile structures.
- **One master palette** (about 32–48 colours). A normalizer script snaps every asset to the pixel grid and that palette.

## Still to discuss before writing the design
- Review the witcher concept image together.
- The board close-up illustration and the scroll art (Eduardo's scroll reference: curled top-left corner, rolled bottom).
- The NPC look, the UI frame style, sound (yes/no).
- Then write the art design document, run the builder check, get approval, and write the plan (superpowers:writing-plans).

## Mockups so far
`.superpowers/brainstorm/43984-1793704152/content/` (board-pov.html, contract-popup.html).
