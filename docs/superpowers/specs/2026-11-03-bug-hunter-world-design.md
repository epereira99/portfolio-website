# Bug Hunter World: design

**Date:** 2026-11-03
**Replaces:** the 3D scroll journey (voyage, memories, city art) on `feat/memories`.

## 1. Intent

Eduardo's portfolio becomes a small explorable game in the style of the Game Boy Advance (Pokémon FireRed/Emerald era), with Witcher-like worldbuilding. Eduardo is a **bug hunter**, a witcher who hunts code bugs rather than monsters. The companies he worked for are **villages** that needed help, and his jobs and projects are **contracts** pinned to a notice board.

**Why:** visitors, recruiters above all, should leave remembering him as "the guy with the fun website," not as one more CV. Bruno Simon's portfolio is the reference for the kind of memorable experience; the twist is 2D GBA pixel art and the witcher framing.

**Success:** exploring feels fun and polished, and a recruiter in a hurry still reaches every contract within seconds.

## 2. Goals, non-goals, anti-goals

**Goals**
- Everything lives inside the world, with shortcuts (the Start menu) for visitors who want to get straight to the content.
- The contracts read as serious, real professional work. The fantasy is only the frame.
- The world is small: crossing it takes a minute or two (Bruno's world is too big).
- The architecture allows a later "graphics upgrade" (higher-resolution art) without rewriting game logic or content.

**Non-goals**
- Bug monsters, combat, or random encounters. Bugs exist only in the contract stories.
- A 3D version now.
- A graphics toggle on the live site. The upgrade is a later redesign, not a user setting.
- Real geography or distances.

**Anti-goal (top quality bar):** it must not feel off or look bad. Concretely:
- All art shares one master palette and one pixel scale. No mixed resolutions and no blurry pixels (integer scaling, `image-rendering: pixelated`).
- Movement is snappy tile-by-tile at 60 fps, without floaty easing or input lag.
- UI (text boxes, menu, scroll) looks like game UI in the same style, not generic web widgets.
- Every milestone ends with a visual review in the browser. "Works" is not "done".

## 3. The world

One compact top-down tile map (16×16 px tiles, a GBA screen of 240×160 px scaled by a whole-number factor).

- **A river crosses the map with one bridge.** One bank is **Sweden**, the other **Portugal**. Crossing the bridge stands for his move abroad.
- **Spawn:** on the Swedish bank, beside the bridge. The **job board** stands at spawn, so it's the first thing every visitor sees.
- **Portugal side:** Eduardo's **childhood house** (his family stand there as NPCs), the **UMinho academy**, and the **Deloitte village**.
- **Sweden side:** Eduardo's **current house**, the **Jönköping University academy**, the **Saab village**, the **Jordbruksverket village**, and the **Effektify village**.
- **Villages** are small clusters of 3–4 houses, one per company.
- **Academies** are witcher schools. Interacting there opens the degree (BSc / MSc), using the existing degree content.
- **Every place with contracts has its own small board** (each village, each academy, the current house) holding only its contracts. It uses the same close-up → scroll flow as the main board.
- **Direction signs** throughout the world point to each village and academy.
- **NPCs:** real people from Eduardo's life (coworkers, supervisors…) stand in the relevant village or academy. Talking to one shows a line about Eduardo in a Pokémon-style text box. **Eduardo writes every line himself, with each person's consent.** Lines live in a content file (name, place, line), and an NPC with no approved line doesn't appear.
- **Personal projects** (e.g. Financial Hub) are contracts on the **current (Swedish) house's** board, with Village: Home *(which house and the label are Claude's calls)*. The childhood house has no board, only family NPCs.

## 4. Contracts and boards

- **One contract = one project.** A village can hold several (Deloitte has Mambu migration and Azure ML).
- **A contract can belong to more than one place.** The Saab thesis and the Jordbruksverket U-Net project belong to their village *and* to the JU academy, so the contract data lists places, not a single village.
- **The main board at spawn holds every contract**: all villages, academy work and personal projects. The local boards are filtered views of the same data.

## 5. The job board: three steps

1. **In the world:** the hunter walks up to the board at spawn and presses A. A text box prompts "Contracts are pinned to the board. Read one?"
2. **Board close-up (hunter's view):** the camera cuts to a front-on illustration of the board filling the middle of the screen, with the town still visible behind it (inspired by Bruno Simon's project board). Pinned papers each show the village, a short title and a logo. Arrow keys / D-pad move the selection (the selected paper lifts and gets an outline), A opens it, B steps back into the world. A chalk sign shows the controls. A small box shows the selected contract's village · place · year.
3. **Scroll popup:** the contract unrolls over the board view as a parchment scroll (curled top-left corner, rolled bottom, as in Eduardo's reference image; style reference only, since that image is watermarked stock).
   - **Header:** title, Village, Date, Duration, logo slot (top right).
   - **Body:** Reason (what the village was struggling with), Goal, Work.
   - B rolls it up and returns to the board.

Mockups: `.superpowers/brainstorm/43984-1793704152/content/board-pov.html` and `contract-popup.html`. Visual details get settled during art generation.

Finished contracts carry a red wax seal; current work has none. *(Claude's call, confirm.)*

**Example contract (Saab thesis):**
- Village: Saab · Jönköping
- Reason: Saab is exploring motion capture to measure shooting performance, but doesn't know how many sensors it needs.
- Goal: find the smallest sensor setup that still predicts performance.
- Work: collected shooting data on Saab's simulator, built CNN models to predict shooting performance, then used feature-importance and ablation analyses to find the minimum sensor configuration that preserves predictive performance.

## 6. Start menu (shortcuts)

One button opens a Pokémon-style Start menu over the game from anywhere:
- **Contracts:** jumps straight to the board close-up (step 2).
- **Map:** fast travel to any village, academy, or either house.
- **Hunter:** profile about Eduardo, with the CV download (`CV_URL`).
- **Send a raven:** contact (email, LinkedIn).

## 7. How it's built (Claude's calls, agreed by Eduardo)

- **Stays in the current Next.js project** (hosting, domain, `src/content/`).
- **The live site keeps the 3D journey until the game is ready** *(Claude's call)*. The game is built alongside it and swapped in at the end. Then the 3D code and its dependencies (three, R3F, drei, the voyage, memories, city art, Blender landmark tooling, their tests) are deleted.
- **URLs** *(Claude's call)*: the game lives at `/`. Each contract also has its own server-rendered route (e.g. `/contracts/saab-thesis`), which is shareable and crawlable. Visiting it opens the game with that scroll unrolled. `/about` folds into the "Hunter" menu entry and redirects.
- **Phaser** renders the world, movement, collisions, NPCs and the camera.
- **Tiled** editor maps (`.tmj`), so the layout can be rearranged without code changes.
- **Scrolls, menus, text boxes and the board's selection UI are React/HTML overlays** above the canvas, styled as pixel game UI. This keeps the text sharp, readable on phones, selectable, accessible and indexable.
- **Content stays in data files.** Contracts extend today's `Project` data with the new fields (places, date, duration, reason, goal, work, logo). NPC lines get a new file. The game reads only data, so a future 3D or HD version reuses all of it.
- **Upgrade-ready art:** tile size and asset paths are set in one place, and the art is a swappable asset pack, so a later higher-resolution pack (e.g. 32×32, HD-2D look) replaces files rather than code.
- **Input:** keyboard (arrows/WASD, Z/Enter = A, X/Esc = B, Enter/Space or a button = Start). On touch devices, an on-screen D-pad + A/B + Start, Game Boy style. Mouse/tap also works directly on board papers and menu items.
- **Phones held upright are supported** *(Claude's call)*: the game screen sits on top with the controls below, like a Game Boy. In landscape the controls flank the screen.

## 8. Art pipeline

Eduardo doesn't draw pixel art. He generates it **by hand** in the GenAI tools' own apps, from Claude's prompt list. No API integration:
- **PixelLab** for the hunter (white hair, two swords: steel and silver), NPCs, 4-direction walk cycles and tilesets. **Retro Diffusion** for buildings, props, logos-as-pixel-art and the board close-up illustration. *(Check both tools' current features when starting.)*
- **Claude writes a prompt list** for every asset (size, view angle, palette and style rules), in the same spirit as `art/memory-prompts.md`.
- **Claude writes a normalizer script:** snaps each generated image to the true pixel grid and quantizes it to one shared **master palette (~32–48 colours)**, GBA-like and slightly darker and more earthy for the witcher mood (cozy towns, gloomy wilds).
- No Pokémon or Witcher copyrighted assets, names or characters.

## 9. Phasing (Claude's call)

1. **Greybox world:** Phaser + Tiled map with placeholder tiles, movement, collisions, spawn, bridge, signs, the board's three steps, Start menu, NPC dialogue, touch controls. Content wired from data.
2. **Content:** write each contract (reason / goal / work, dates, durations) and the NPC lines. Eduardo owns the words.
3. **Art:** prompts → generation → normalizer → swap placeholders. Visual review per area.
4. **Polish & cleanup:** sound if wanted, transitions, performance pass, remove the old 3D code.

## 10. Left to the builder

Engine/React integration details, the exact map layout and size within "small," the overlay components' structure, how Phaser assets load, test strategy, and the touch-control layout. The content fields and the visual bar above are fixed.
