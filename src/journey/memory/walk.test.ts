import { expect, test } from "vitest";
import { ENDING_START, TOTAL_SCREENS } from "../timeline";
import { FRAMES_PER_SCREEN, WALK_FRAMES, easeProgress, walkFrame, walkFrameUrl } from "./walk";

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

test("easing follows the scroll, and snaps on big jumps", () => {
  expect(easeProgress(0, 0.1)).toBeGreaterThan(0);
  expect(easeProgress(0, 0.1)).toBeLessThan(0.1);
  expect(easeProgress(0, 3)).toBe(3);
  expect(easeProgress(5, 3.5)).toBe(3.5);
  expect(easeProgress(1, 1.00001)).toBe(1.00001);
});

test("frame urls are 3-digit", () => {
  expect(walkFrameUrl(7)).toBe("/walk/walk-007.webp");
});
