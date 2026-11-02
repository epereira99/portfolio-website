import { describe, expect, test } from "vitest";
import {
  CHAPTER_SCREENS,
  INTRO_END,
  chapterDelay,
  ENDING_START,
  TOTAL_SCREENS,
  chapterAt,
  overlayAt,
  segmentAt,
  segmentStart,
  stageProgress,
} from "./timeline";

describe("segments", () => {
  test("follow the spec's length budget", () => {
    expect(TOTAL_SCREENS).toBe(9);
    expect(ENDING_START).toBe(8.5);
    expect(INTRO_END).toBe(0.5);
    expect(segmentStart("porto")).toBe(1.5);
    expect(segmentStart("voyage")).toBe(3.5);
    expect(segmentStart("jonkoping")).toBe(5);
    expect(segmentStart("stockholm")).toBe(7);
  });

  test("stageProgress tells how far through the current segment you are", () => {
    expect(stageProgress(2.5)).toBeCloseTo(0.5);
    expect(stageProgress(1.5)).toBe(0);
    expect(stageProgress(99)).toBe(1);
  });

  test("segmentAt is start-inclusive and clamps out-of-range values", () => {
    expect(segmentAt(-1)).toBe("braga");
    expect(segmentAt(1.5)).toBe("porto");
    expect(segmentAt(3.49)).toBe("porto");
    expect(segmentAt(3.5)).toBe("voyage");
    expect(segmentAt(8.5)).toBe("stockholm");
    expect(segmentAt(99)).toBe("stockholm");
  });
});

describe("overlayAt", () => {
  test("shows the intro only at the very start", () => {
    expect(overlayAt(0)).toEqual({ kind: "intro" });
    expect(overlayAt(0.49)).toEqual({ kind: "intro" });
    expect(overlayAt(-5)).toEqual({ kind: "intro" });
  });

  test("announces each stage with a chapter title as you enter it", () => {
    expect(overlayAt(0.5)).toEqual({ kind: "chapter", stage: "braga", t: 0 });
    expect(overlayAt(1.5)).toEqual({ kind: "chapter", stage: "porto", t: 0 });
    expect(overlayAt(5.1)).toMatchObject({ kind: "chapter", stage: "jonkoping" });
    expect(overlayAt(7.0)).toMatchObject({ kind: "chapter", stage: "stockholm" });
    const mid = overlayAt(1.5 + CHAPTER_SCREENS / 2);
    expect(mid.kind === "chapter" && mid.t).toBeCloseTo(0.5);
    expect(overlayAt(1.5 + CHAPTER_SCREENS).kind).not.toBe("chapter");
  });

  test("in Jönköping the chapter title appears as soon as you land", () => {
    expect(chapterDelay("jonkoping")).toBe(0);
    expect(overlayAt(segmentStart("jonkoping"))).toMatchObject({ kind: "chapter", stage: "jonkoping" });
  });

  test("chapter titles never overlap a project", () => {
    for (let s = 0; s <= 9; s += 0.01) {
      const o = overlayAt(s);
      if (o.kind !== "chapter") continue;
      expect(s - segmentStart(o.stage)).toBeLessThan(CHAPTER_SCREENS + chapterDelay(o.stage));
    }
    expect(overlayAt(2.0)).toEqual({ kind: "project", slug: "mambu-migration" });
  });

  test("shows each stage's projects one at a time with gaps between", () => {
    expect(overlayAt(2.0)).toEqual({ kind: "project", slug: "mambu-migration" });
    expect(overlayAt(2.6)).toEqual({ kind: "none" });
    expect(overlayAt(3.0)).toEqual({ kind: "project", slug: "azure-ml-integrations" });
  });

  test("shows nothing during the voyage", () => {
    expect(overlayAt(4.0)).toEqual({ kind: "none" });
  });
});

describe("ending", () => {
  test("the last half screen is the ending, and stays the ending past the end", () => {
    expect(overlayAt(8.5)).toEqual({ kind: "ending", t: 0 });
    const mid = overlayAt(8.75);
    expect(mid.kind === "ending" && mid.t).toBeCloseTo(0.5);
    expect(overlayAt(50)).toEqual({ kind: "ending", t: 1 });
  });

  test("scrolling back out of the ending returns to Stockholm's projects", () => {
    expect(overlayAt(8.3).kind).not.toBe("ending");
    for (const slug of ["financial-hub", "effektify-reconciliation"]) {
      let seen = false;
      for (let s = 7.33; s < 8.5; s += 0.01) {
        const o = overlayAt(s);
        if (o.kind === "project" && o.slug === slug) seen = true;
      }
      expect(seen, slug).toBe(true);
    }
  });
});

describe("chapterAt", () => {
  test("the stage's chapter stays for the whole stage, through and between its projects", () => {
    expect(chapterAt(0.6)).toBe("braga");
    expect(chapterAt(2.0)).toBe("porto");
    expect(chapterAt(2.6)).toBe("porto");
    expect(chapterAt(3.0)).toBe("porto");
    expect(chapterAt(5.0)).toBe("jonkoping");
  });

  test("no chapter during the intro, at sea or at the ending", () => {
    expect(chapterAt(0.2)).toBeNull();
    expect(chapterAt(4.0)).toBeNull();
    expect(chapterAt(ENDING_START)).toBeNull();
  });
});
