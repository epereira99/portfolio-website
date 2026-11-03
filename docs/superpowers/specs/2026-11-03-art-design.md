# Bug Hunter World: art design

**Date:** 2026-11-03
**Builds on:** `2026-11-03-bug-hunter-world-design.md` (§2 quality bar, §8 art pipeline, §9 phase 3). Decision log: `2026-11-03-art-direction-notes.md`.
**Starting point:** the phase 1 greybox world at `/world` (map from `tools/world/make-map.mjs` → `public/world/world.tmj`, tiles drawn at runtime in `src/world/WorldScene.ts`).

## 1. Intent

Replace the greybox with real pixel art, so the world looks like a finished GBA-era game with a witcher mood. **Witcher medieval first, Pokémon second.** Pokémon only sets the camera (top-down, tilted so you see roofs and front faces) and the controls.

**Why:** the site has to be memorable and must not look off (spec §2 anti-goal). Placeholder squares fail that bar.

**Success:** Eduardo walks the world at `/world` and every area looks like it belongs to one game. The hunter reads clearly as him (white hair, beard, green cloak, two swords) and never gets lost against the ground.

## 2. Goals, non-goals, anti-goals

**Goals**
- The world first: the hunter, the terrain, every place's buildings, signs, the board and the scroll.
- Fit the whole first pass into the PixelLab trial (40 generations + 5 daily bonus) with room for retries.

**Non-goals (deferred by Eduardo)**
- **NPC art.** The NPCs come at the very end.
- Showing the real surroundings behind the board close-up.
- Sound, and a final UI frame style (text boxes and menu keep their current look until a later pass).
- Pro-mode generations (too expensive; pro tilesets also need a paid plan).

**Anti-goals**
- Mixed resolutions, off-palette colours or blurry pixels. Everything sits on the 16 px grid and uses one master palette.
- Anything that copies Witcher or Pokémon assets, names or characters. The hunter must read as Eduardo, not Geralt: no wolf medallion, no copied armour.
- Spending generations on fixes the free PixelLab pixel editor (`pixelart_workbench`) can do.

## 3. Constraints

- **Tool:** PixelLab via its MCP server. Claude generates, cleans up and places the art; Eduardo reviews and approves. Use `standard` or `v3` modes only.
- **Grid:** 16×16 tiles. The view is 20×13 tiles (`src/world/config.ts`). Big buildings span several tiles.
- **Camera:** "low top-down" (about 20°) for characters. PixelLab's standard tilesets always draw "high top-down"; the normalizer and a visual check have to make the two sit together.
- **Overlays stay HTML** (spec §7): text in the posters, scroll, menu and text boxes is never baked into images.

## 4. Look (decided)

- **Mood:** late afternoon under a light overcast, between grim and storybook. Muted, earthy colours (mud browns, mossy greens, grey stone, weathered timber), no neon. Red (seals, pins) is the one strong accent. *(Claude's call.)*
- **Master palette:** about 32–48 colours. A **normalizer script** snaps every generated image to the true pixel grid and to that palette. Standard-mode PixelLab can't take a palette, so this script is what holds the set together. *(Claude's call.)*
- **Banks:** Portugal is warmer (terracotta roofs, dry golden grass); Sweden is cooler (green grass, dark pines, red-painted timber). *(Claude's call.)*
- **Layout change:** places move closer together so there's less walking. This is a change in `tools/world/make-map.mjs`, not art. *(Eduardo.)*

## 5. Assets

### The hunter (Eduardo)
Source: `art/references/eduardo-witcher.jpeg` (front/side/back turnaround).
- **White hair** (Eduardo), with his beard and face shape kept.
- Green hooded cloak, dark leather chest harness, brown boots, and a beetle medallion of 1–2 gold pixels.
- **Two swords crossed on the back** in every direction (the concept's views disagree; drop the hip sword).
- Drop the potions, pouches and quilting. Single-colour black outline.
- About 24×32 px on a canvas that fits a 16 px tile *(size is Claude's call)*.
- **How:** crop the front view → `image_to_pixelart` to make a south-facing sprite (1 generation). Fix the hair to white and tidy it in the workbench (free). Then `create_character` v3 with that reference, `n_directions: 4`, low top-down (about 2 generations). Then a walk cycle with a template animation, 4 directions (about 4 generations).
- **Gate:** before the walk cycle, put the south sprite on the grass tile and check it reads. If it doesn't, adjust the colours in the workbench first.

### Terrain (Wang tilesets, standard mode, 1 generation each)
Grass↔water (the river), grass↔dirt path, Swedish green grass↔Portuguese dry grass, and grass↔crop field. Chained through base tile IDs so they connect.

### Places
| Place | Look |
|---|---|
| Childhood house (PT) | cosy Portuguese house, terracotta roof |
| UMinho academy (PT) | stone fortress, witcher school, smaller |
| Deloitte (PT) | corporate building |
| Current house (SE) | Swedish red timber house |
| Jönköping University academy (SE) | stone fortress, bigger and grander than UMinho |
| Saab (SE) | clearly a military compound |
| Jordbruksverket (SE) | farm: crop fields and farm animals |
| Effektify (SE) | startup workshop or guild hall *(Claude's call)* |

Villages are clusters of 3–4 houses (spec §3). To save generations, a village reuses one house design with variations made in the workbench, plus its one landmark building.

### Props
- Bridge, pine trees (Sweden), a warmer tree for Portugal, rocks and bushes for filler.
- **Place-name signs:** "Sweden" on this bank and "Portugal" on the far bank, by the bridge.
- **Direction signs:** a post with arms pointing to Deloitte, BSc Computer Science, Saab, MSc AI and the other places. They must look clearly different from place-name signs.
- **Notice boards** in the world: the main one at spawn, plus a small one at each place with contracts.
- Small props (crops, animals, wax seal) are drawn in the workbench where that's good enough.

### Board close-up and scroll (HTML on top of art)
- **Close-up:** a weathered timber notice board with a small shingle roof on two posts. Behind it is a plain scene of pines and grass. Board and backdrop are one image.
- **Pinned contracts are wanted posters** (Eduardo). The heading sits at the top, the company logo takes the portrait spot, then the title and the village. Finished contracts get a red wax seal. Posters are HTML (lift, outline, tap). Their exact layout is Claude's call.
- **Scroll:** a parchment frame with a curled top-left corner and a rolled bottom. Only the frame is art; the text stays HTML.

## 6. Budget (40 generations + 5/day)

| Item | Est. generations |
|---|---|
| Hunter: sprite, 4 directions, walk | ~7 |
| Terrain tilesets | ~4 |
| Buildings (one design per place + village houses) | ~12 |
| Props and signs | ~5 |
| Board close-up | ~2 |
| **Total** | **~30**, leaving ~10 for retries |

`create_map_object` doesn't state its cost in the tool docs. Check it on the first call, and re-plan if it's above 1.

## 7. Order and review

1. Master palette + normalizer script.
2. The hunter, with the grass gate before the walk cycle.
3. Terrain tilesets + the map relayout (places closer together).
4. Buildings and props, one area at a time (Swedish spawn area first).
5. Board close-up, wanted posters, scroll frame.

Every step ends with Eduardo reviewing it in the browser at `/world`. "Generated" isn't "done".

## 8. Left to the builder

The exact palette colours; the sprite canvas size within "fits a 16 px tile"; how the art pack is loaded and where its files live (one place, swappable, as spec §7 requires); the tile IDs and the Tiled map rework; the poster layout; and how many frames the walk cycle plays per tile step.
