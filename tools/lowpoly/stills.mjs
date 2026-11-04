// node tools/lowpoly/stills.mjs [url] — with `npm run dev` up. Screenshots the low-poly walk at each time of day
// (each stage's midpoint; dusk where he stops) into docs/superpowers/specs/mockups/ for review.
import { chromium } from "@playwright/test";

const URL = process.argv[2] ?? "http://localhost:3000/";
const SCROLL_PER_SCREEN = 1.5; // mirrors src/journey/progress.ts
const STILLS = { morning: 0.75, midday: 2.5, afternoon: 4.5, dusk: 7 }; // screens; mirrors timeline.ts SEGMENTS

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL);
await page.locator("canvas").waitFor();
await page.waitForTimeout(3000); // the GLBs
for (const [name, s] of Object.entries(STILLS)) {
  await page.evaluate(([s, k]) => window.scrollTo(0, s * window.innerHeight * k), [s, SCROLL_PER_SCREEN]);
  await page.waitForTimeout(1500);
  const path = `docs/superpowers/specs/mockups/lowpoly-${name}.png`;
  await page.screenshot({ path });
  console.log("wrote", path);
}
await browser.close();
