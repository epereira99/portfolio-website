# Portfolio website: design

Status: ready for Eduardo's approval · 2026-11-01 (reviewer pass done)

Throughout, **[Eduardo]** marks a decision Eduardo made, and **[my call]** marks a choice Claude made that Eduardo has not explicitly confirmed.

## 1. Intent

Eduardo Pereira is an AI / ML / Software Engineer (BSc Computer Science at Universidade do Minho, two years at Deloitte Porto, MSc AI Engineering at Jönköping University, now at Effektify in Stockholm), and is job hunting. The site's primary visitor is a **recruiter**. **[Eduardo]**

Within seconds, a recruiter must understand two things: this is a **portfolio**, and Eduardo is an **AI / ML / Software Engineer**. They then choose to see projects, learn about Eduardo, or take an interactive walk through his career, the Journey. **[Eduardo]**

The site should be **clean but fun**, with **motion design** as part of the experience. **[Eduardo]** The Journey is the thing people should remember the site for.

## 2. Goals, non-goals, anti-goals

**Goals**
- A recruiter identifies "portfolio of an AI/ML/Software engineer" within about 5 seconds of landing.
- A recruiter can reach any project's details in two clicks from the home page.
- The Journey is memorable, and every stage of it keeps the recruiter oriented (where am I, how much is left).
- The site is pleasant on a recruiter's laptop and still works on a phone.

**Non-goals (for now)**
- The About page content (deferred **[Eduardo]**; ship a simple placeholder route).
- The GitHub cleanup (a separate job).
- Final per-project graphics, final project write-ups and Eduardo's final 3D avatar (all come later; build with placeholders).
- A blog, CMS, analytics dashboards, internationalization.

**Anti-goals (failure even if it technically works)**
- **The Journey drags.** A recruiter should never feel they have to scroll forever. **[Eduardo]**
- **The recruiter feels trapped.** Navigation is visible at all times, and they can leave the Journey at any moment. **[Eduardo]**
- **A 2D side-scroller.** Eduardo explicitly rejected a character walking left to right. The character walks *forward, into the screen*, seen from behind. **[Eduardo]**
- **Water everywhere.** Water appears only where it is real (see §6). **[Eduardo]**
- **A thin, empty "Projects" page.** There are too few projects for a dedicated page. **[Eduardo]**
- **Links to GitHub.** Projects are described, not linked to code. **[Eduardo]**
- **Leaking confidential details** from Saab, Jordbruksverket, Effektify or Deloitte work. Project write-ups describe approach and results in general terms.
- Neon/wireframe "AI cliché" visuals. **[my call]**

## 3. Site structure

| Route | What it is |
|---|---|
| `/` | Home **is** the start of the Journey **[Eduardo]** |
| `/about` | Separate page about Eduardo's personal life **[Eduardo]**; placeholder until designed |

There is **no separate Projects page**. **[Eduardo]** Projects are reached from the home page's project fan and along the Journey.

Global navigation (Projects fan button, About button, and the stage header once the walk starts) stays visible on every screen of the Journey. **[Eduardo]**

## 4. Home page (Journey start)

Reference mockup: `mockups/home-and-project-fan.html`. Its sunset and path are a flat stand-in for the 3D scene.

- **Background:** the live 3D Journey scene at its starting point in Braga, with the avatar standing on the path, seen from behind. **[Eduardo]**
- **Intro, top left:** photo of Eduardo, name, "AI / ML / Software Engineer", and a two-line intro. **[Eduardo]** Exact copy is TBD. The photo is not provided yet.
- **Scroll hint** at the bottom center ("scroll to start the journey"). It hides while the fan is open. **[my call]**
- **Bottom bar:** two pill buttons, **Projects** and **About me**. **[Eduardo]**
- **Projects fan:** clicking Projects fans the projects out as **small cards (graphic plus title)** on an arc above the buttons, centered between the two buttons (not over the Projects button). **[Eduardo]** The cards are spaced evenly left to right on an elliptical arc so they never overlap. They animate out with a slight stagger and bounce, and lift on hover. Clicking a card opens its project detail card (§5). Clicking outside or pressing Esc closes the fan.
- **About me** navigates to `/about`. **[Eduardo]**
- **Phones:** a six-card arc does not fit. Use a horizontally swipeable row of the same mini cards. **[my call]**

## 5. Project detail card

Reference mockup: `mockups/project-card-expand.html` (expand motion) and the detail card in `home-and-project-fan.html`.

- Opens over a blurred, dimmed backdrop. Closes with ✕, Esc or a click outside. Focus moves into the card and back on close. **[my call]**
- Contents: an animated graphic about the project itself (not a stock photo) **[Eduardo]**, the stage label (city · context), title, tech tags, then short sections: *The problem*, *What I built*, *Result / Impact*. **[my call]** on the section names.
- **The expand motion must not disturb anything else on screen.** Only the opened card animates. (Eduardo rejected a version where other cards reflowed during the expand.) **[Eduardo]**
- **No GitHub links.** **[Eduardo]** Whether Financial Hub links to its live demo is open (§11).
- All motion respects `prefers-reduced-motion`.

**Shareable links [my call]:** every project gets a slug, and `/?project=<slug>` opens that project's detail card over the home page (it does not jump the Journey). This lets Eduardo send a recruiter a direct link to one project without creating a Projects page.

**Single source of truth:** every project is defined once (title, stage, subtitle, tags, graphic, write-up) and rendered both by the home fan and by the Journey. **[my call]**

### Project list (initial)

Projects per stage will be revisited with Eduardo. **[Eduardo]** Initial dataset:

| Project | Stage | Notes |
|---|---|---|
| Predicting shooting performance from motion capture (MSc thesis, Saab) | Jönköping | featured |
| Land analysis with U-Net segmentation (Jordbruksverket) | Jönköping | featured |
| Financial Hub | Stockholm | featured |
| Deal reconciliation agents, HubSpot ↔ Slack (Effektify) | Stockholm | featured |
| Azure ML integrations (Deloitte) | Porto | |
| Mambu migration tool (Deloitte) | Porto | |
| RL movie recommender (DQN) | Jönköping | candidate |
| Player analysis for Jönköpings Södra | TBD | candidate |

Explicitly excluded: the multi-agent job application system **[Eduardo]**, Polyholmes, the Lovable clinic sites and coursework notebooks. **[my call]**, from the GitHub review.

## 6. The Journey

### Core experience **[Eduardo]**
- A **3D** world with a **third-person camera** just behind and above a 3D avatar of Eduardo.
- **Scrolling walks the avatar forward**, into the screen, along one continuous path. Scrolling up walks back. **[my call]** on reverse.
- The scenery changes as the avatar passes through four cities, each with **recognizable landmarks**.

### Stages
| # | City | Stage header | Landmarks **[my call: specific picks]** | Mood **[my call]** |
|---|---|---|---|---|
| 1 | Braga | BSc Computer Science · Universidade do Minho · 2017–2022 | Bom Jesus do Monte staircase, UMinho campus | morning, warm granite & cream; **no water** |
| 2 | Porto | Deloitte · Cloud & DevOps → Integration Software · 2022–2024 | Dom Luís I bridge, Ribeira riverfront, azulejo façades, Clérigos tower | golden hour, orange roofs, blue-white tiles; Douro river |
| 3 | Jönköping | MSc AI Engineering · Jönköping University · 2024–2026 | Lake Vättern, red Swedish cottages, pines, snow | winter blue |
| 4 | Stockholm | Effektify & personal projects · 2026–now | Gamla Stan façades, waterfront | evening lights on the water |

Effektify started in Aug 2026 (CV). The Saab thesis, Jordbruksverket placement and JIBS awards happened during the Jönköping stage.

### On-screen information: two layers **[Eduardo]**
1. **Stage header (top):** shows the current stage (city, institution or employer, role, years) for the whole time the avatar is in that city. It changes only when the city changes. **[my call]** It doubles as the chapter bar: all four cities are shown, the current one is highlighted, and clicking one jumps to its start.
2. **Projects (in the home intro's spot):** while walking through a city, that stage's projects appear **one at a time** in the same visual format as the home intro: **title, subtitle, and a "Read more" button** that opens the project detail card (§5). Each fades out as the next fades in. Stretches with no project are just walking and scenery. **[my call]** While a detail card is open, the walk pauses, and closing it returns to the same point.

No information floats inside the 3D world itself. **[Eduardo]**

### The voyage: Porto → Jönköping **[Eduardo]**
The turning point of the story: a change of country **and** the change to AI. It must feel impactful.
1. At the end of Porto, the avatar walks down to the Douro, where a **1500s Portuguese nau** is moored (three masts, square sails with the red Cross of the Order of Christ **[my call]**).
2. The avatar boards it.
3. The camera pulls up and away, and the scene transitions into an **old parchment "pirate map"** of Europe (sepia tones, compass rose; decorative sea creatures **[my call]**).
4. A **dotted line** draws from Porto to Jönköping as the user scrolls, with a small ship moving along it. The route is a simple stylized line, not a geographically exact canal route. **[Eduardo]**
5. The camera dives back into 3D: the avatar is in the Jönköping scenery and sees a banner, **"Välkommen till Jönköping, och AI"** (wording is open, §11).

### The ending: Stockholm
- Contact info, and an invitation for the visitor to **be part of Eduardo's journey**. **[Eduardo]**
- **[my calls]:** the walk ends on a Stockholm quay at evening; **the avatar turns around to face the viewer** for the first time; the path ahead continues into the distance but fades out unbuilt ("the next chapter"); copy in the spirit of "The next chapter starts here. Want to be part of it?"; contact actions: email (`eduardoluisvp99@gmail.com`), LinkedIn (`linkedin.com/in/eduardopereira-`), CV download (a PDF is needed), and a way back to the projects. The stage header shows all four cities completed.

### Length budget **[Eduardo approved; revisit after projects are placed]**
The whole walk is **about 60–90 seconds of normal scrolling, roughly 8–10 screen heights**.

| Part | Budget |
|---|---|
| Braga | ~1.5 screens |
| Porto | ~2 screens |
| Voyage (board → map → land) | ~1.5 screens |
| Jönköping | ~2 screens |
| Stockholm, including ending | ~1.5 screens |

## 7. Visual style

- **Townscaper-like** **[Eduardo]**: soft, rounded, toy-like low-poly shapes; chunky houses with slightly bulging walls; pastel palettes; soft light and gentle shadows; light distance haze. Cheerful, not childish. **[my call]** on the specifics.
- Each city keeps its own palette and time of day inside that shared style (see §6).
- **Water only where it is real**: the Douro (Porto), the sea (voyage map), Lake Vättern (Jönköping), the water around Gamla Stan (Stockholm). None in Braga. **[Eduardo]**
- The parchment map is the only non-3D-world visual and should feel hand-drawn.
- 2D UI (intro, header, buttons, cards) uses a dark, glassy, rounded look, as in the mockups. **[my call]** Typography and final palette are TBD.

## 8. The avatar

- Final: a 3D avatar of Eduardo, created later, likely from photos. **[Eduardo]** It should match the Townscaper style (stylized, not realistic). **[my call]**
- Now: a **placeholder figure** with a walk cycle.
- **Requirement:** the avatar is a swappable rigged glTF model with at least *idle*, *walk* and *turn to face camera* animations, so the final avatar drops in without code changes. **[my call]**
- **Rig contract [my call]:** a standard humanoid rig on the Mixamo skeleton, Y-up, facing +Z, about 1.8 units tall, animation clips named `idle`, `walk` and `turn`. The placeholder follows this contract. If the final avatar comes from a tool with a different rig, it is retargeted to this contract at swap time, not handled in code.
- Walk animation playback is tied to scroll speed, so feet don't slide. **[my call]**

## 9. Technology

| Choice | Status |
|---|---|
| **Three.js** for the Journey | **[Eduardo]** (open to suggestions) |
| React Three Fiber (+ drei) as the Three.js layer | [my call] |
| Next.js (App Router), TypeScript; Eduardo already uses both | [my call] |
| GSAP ScrollTrigger to drive the walk, camera and voyage from scroll | [my call] |
| Hosting on Vercel | [my call] |
| **3D art is made by us, not bought or commissioned.** Blender is installed on Eduardo's machine. | **[Eduardo]** |
| Ordinary buildings, trees and terrain are generated in code, Townscaper-style (rule-based houses assembled from a few rounded parts). Hero landmarks (Bom Jesus stairs, Dom Luís I bridge, Clérigos, the nau, Gamla Stan façades) are modeled in Blender, scripted through Blender's Python API where practical so they can be regenerated. | [my call] |
| 3D assets exported as compressed glTF (Draco/Meshopt; mostly vertex colors rather than textures, which suits the pastel style and keeps files small) | [my call] |
| Walk cycles from Mixamo (or similar) | [my call] |

## 10. Quality bars

- **Performance [my call]:** the home intro text and buttons are usable before the 3D scene finishes loading (show the scene progressively). Load city assets per stage, not all upfront. Target smooth scrolling on a typical recent laptop.
- **Phones [my call]:** a lighter Journey (fewer objects, lower resolution, simplified effects), with the swipeable project row from §4.
- **Reduced motion and no WebGL [my call]:** a static fallback. The four stages appear as a simple vertical timeline with the same stage headers and project "Read more" buttons. No content is reachable only through the 3D experience.
- **Accessibility [my call]:** all buttons are keyboard-reachable, the detail card behaves as a modal dialog, and text over the 3D scene keeps readable contrast.
- **Recruiter escape hatch [Eduardo]:** navigation always visible; no forced sequences or scroll-jacking that blocks leaving.

## 11. Open decisions (Eduardo)

1. Banner wording: "Välkommen till Jönköping, och AI" (Eduardo's) vs "Välkommen till Jönköping – och till AI" (suggested as more idiomatic).
2. Final project list and the stage each project belongs to (especially the Jönköpings Södra player analysis).
3. Whether Financial Hub links to its live demo (it is not a GitHub link).
4. Project write-ups, the intro copy and the ending copy.
5. Photo for the home intro; CV PDF for download.
6. The per-project animated graphics (Eduardo likes animated graphics; the specific ones are TBD).
7. The About page.

## 12. Left to the builder

Exact camera framing and easing, the path's shape, the transitions between cities (beyond the voyage), the exact scroll distances within the budget, component and file structure, the asset pipeline, and the loading-screen design (it must not delay the intro text).

## 13. Launch **[Eduardo]**

No interim "simple version first": the site launches with the full experience (home, project fan, Journey with real art, voyage, ending, fallbacks). Placeholder cities are for development only, not for the public site. **[my call]**, inferred from "we'll do it all".

## 14. Suggested build order [my call]

1. The Journey skeleton: scroll-driven walk with a placeholder avatar, a stand-in path through four blocky stand-in cities, the stage header, and project overlays from the shared project data.
2. Home overlay, project fan and detail card on top of it.
3. The voyage sequence (nau → map → landing).
4. The ending.
5. Real Townscaper-style art per city, landmarks, palettes.
6. Fallbacks (reduced motion, no WebGL, phones) and performance pass.
