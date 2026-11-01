import { describe, expect, test } from "vitest";
import { INTRO_END, TOTAL_SCREENS, overlayAt, segmentAt, segmentStart } from "./timeline";

describe("segments", () => {
  test("follow the spec's length budget", () => {
    expect(TOTAL_SCREENS).toBe(8.5);
    expect(INTRO_END).toBe(0.5);
    expect(segmentStart("porto")).toBe(1.5);
    expect(segmentStart("voyage")).toBe(3.5);
    expect(segmentStart("jonkoping")).toBe(5);
    expect(segmentStart("stockholm")).toBe(7);
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
    expect(overlayAt(0.5)).toEqual({ kind: "none" });
  });

  test("shows each stage's projects one at a time with gaps between", () => {
    expect(overlayAt(2.0)).toEqual({ kind: "project", slug: "mambu-migration" });
    expect(overlayAt(2.6)).toEqual({ kind: "none" });
    expect(overlayAt(3.0)).toEqual({ kind: "project", slug: "azure-ml-integrations" });
  });

  test("shows nothing during the voyage or past the end", () => {
    expect(overlayAt(4.0)).toEqual({ kind: "none" });
    expect(overlayAt(50)).toEqual({ kind: "none" });
  });
});
