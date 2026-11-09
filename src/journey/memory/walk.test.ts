import { expect, test } from "vitest";
import { ENDING_START, TOTAL_SCREENS } from "../timeline";
import { easeProgress } from "../progress";
import { FRAMES_PER_SCREEN, WALK_FRAMES, stepFrame, walkFrame, walkFrameUrl, CARTOON_WALK } from "./walk";

test("frame advances with distance and wraps inside [0, 139)", () => {
  expect(WALK_FRAMES).toBe(139);
  expect(walkFrame(0)).toBe(0);
  expect(walkFrame(1.5 / FRAMES_PER_SCREEN)).toBe(1);
  expect(walkFrame((WALK_FRAMES + 0.5) / FRAMES_PER_SCREEN)).toBe(0);
});

test("walking back plays frames in reverse; negative progress still valid", () => {
  expect(walkFrame(-0.5 / FRAMES_PER_SCREEN)).toBe(WALK_FRAMES - 1);
  for (const s of [-3.7, -0.001, 2.5, 99]) {
    const f = walkFrame(s);
    expect(Number.isInteger(f) && f >= 0 && f < WALK_FRAMES).toBe(true);
  }
});

test("he stops at the ending", () => {
  expect(walkFrame(ENDING_START + 0.3)).toBe(walkFrame(ENDING_START));
  expect(walkFrame(TOTAL_SCREENS + 1)).toBe(walkFrame(ENDING_START));
});

test("frame urls are 3-digit", () => {
  expect(walkFrameUrl(7)).toBe("/walk/walk-007.webp");
});

test("a smooth-scrolled jump (many small steps) never moves the walk more than 3 frames a tick", () => {
  let p = 0.5;
  let shown = walkFrame(p);
  for (let i = 1; i <= 40; i++) {
    p = easeProgress(p, 0.5 + (7 * i) / 40); // header click to Stockholm, streamed by the browser
    const next = stepFrame(shown, walkFrame(p));
    const moved = Math.min(Math.abs(next - shown), WALK_FRAMES - Math.abs(next - shown));
    expect(moved).toBeLessThanOrEqual(3);
    shown = next;
  }
});

test("stepFrame takes the short way round the loop and lands when close", () => {
  expect(stepFrame(10, 12)).toBe(12);
  expect(stepFrame(10, 60)).toBe(13);
  expect(stepFrame(137, 1)).toBe(1);
  expect(stepFrame(1, 130)).toBe(137);
});

test("the cartoon walk keeps its own loop length and pace", () => {
  expect(walkFrame(1, CARTOON_WALK)).toBe(80 % 32);
  for (let s = 0; s < 7; s += 0.13) expect(walkFrame(s, CARTOON_WALK)).toBeLessThan(32);
  expect(walkFrameUrl(5, CARTOON_WALK)).toBe("/walk-cartoon/walk-005.webp");
  expect(stepFrame(31, 1, 3, 32)).toBe(1); // the short way round its 32-frame loop
});
