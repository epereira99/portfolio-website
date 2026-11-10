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
} from "./timeline";

describe("segments", () => {
  test("follow the spec's length budget", () => {
    expect(TOTAL_SCREENS).toBe(11.5);
    expect(ENDING_START).toBe(11);
    expect(INTRO_END).toBe(0.5);
    expect(segmentStart("porto")).toBe(1.5);
    expect(segmentStart("jonkoping")).toBe(4.5); // Porto and Jönköping have the most to tell: 3 screens each
    expect(segmentStart("stockholm")).toBe(7.5);
    expect(segmentStart("personal")).toBe(9); // his personal projects close the journey
  });

  test("segmentAt is start-inclusive and clamps out-of-range values", () => {
    expect(segmentAt(-1)).toBe("braga");
    expect(segmentAt(1.5)).toBe("porto");
    expect(segmentAt(4.49)).toBe("porto");
    expect(segmentAt(4.5)).toBe("jonkoping");
    expect(segmentAt(8.99)).toBe("stockholm");
    expect(segmentAt(9)).toBe("personal");
    expect(segmentAt(99)).toBe("personal");
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
    expect(overlayAt(4.6)).toMatchObject({ kind: "chapter", stage: "jonkoping" });
    expect(overlayAt(7.5)).toMatchObject({ kind: "chapter", stage: "stockholm" });
    const mid = overlayAt(1.5 + CHAPTER_SCREENS / 2);
    expect(mid.kind === "chapter" && mid.t).toBeCloseTo(0.5);
    expect(overlayAt(1.5 + CHAPTER_SCREENS).kind).not.toBe("chapter");
  });

  test("in Jönköping the chapter title appears as soon as you arrive", () => {
    expect(chapterDelay("jonkoping")).toBe(0);
    expect(overlayAt(segmentStart("jonkoping"))).toMatchObject({ kind: "chapter", stage: "jonkoping" });
  });

  test("chapter titles never overlap a project", () => {
    for (let s = 0; s <= TOTAL_SCREENS; s += 0.01) {
      const o = overlayAt(s);
      if (o.kind !== "chapter") continue;
      expect(s - segmentStart(o.stage)).toBeLessThan(CHAPTER_SCREENS + chapterDelay(o.stage));
    }
    expect(overlayAt(2.0)).toEqual({ kind: "project", slugs: ["mambu-migration"] });
  });

  test("a project appears when the story mentions it, and goes with its block of bubbles", () => {
    expect(overlayAt(1.9)).toEqual({ kind: "none" }); // Porto's first lines name no project yet
    expect(overlayAt(2.0)).toEqual({ kind: "project", slugs: ["mambu-migration"] }); // "…for Western Union"
    expect(overlayAt(2.9)).toEqual({ kind: "none" }); // the gap after that block
    expect(overlayAt(3.0)).toEqual({ kind: "none" }); // the next block hasn't mentioned one yet
    expect(overlayAt(3.7)).toEqual({ kind: "project", slugs: ["azure-ml-integrations"] }); // "…for Ageas"
    expect(overlayAt(4.0)).toEqual({ kind: "project", slugs: ["outsystems-salesforce"] }); // "And then…OutSystems"
  });

  test("the MSc's last block, about staying in Sweden, shows no project", () => {
    expect(overlayAt(6.3)).toEqual({ kind: "none" }); // its lines are on screen; the thesis card has gone
  });

  test("one line can bring in two projects at once", () => {
    const seen = new Set<string>();
    for (let s = 4.5; s < 7.5; s += 0.01) {
      const o = overlayAt(s);
      if (o.kind === "project") seen.add(o.slugs.join("+"));
    }
    expect(seen).toContain("unet-segmentation+jonkoping-sodra");
    expect(seen).toContain("jibs-entrepreneurship-challenge+jibs-case-competition");
    expect(seen).toContain("saab-thesis");
  });
});

describe("ending", () => {
  test("the last half screen is the ending, and stays the ending past the end", () => {
    expect(overlayAt(11)).toEqual({ kind: "ending", t: 0 });
    const mid = overlayAt(11.25);
    expect(mid.kind === "ending" && mid.t).toBeCloseTo(0.5);
    expect(overlayAt(50)).toEqual({ kind: "ending", t: 1 });
  });

  test("Effektify comes with its line in Stockholm; Personal projects brings Financial Hub, this site, then its RAG assistant", () => {
    expect(overlayAt(8.0)).toEqual({ kind: "project", slugs: ["effektify-reconciliation"] });
    expect(overlayAt(9.7)).toEqual({ kind: "project", slugs: ["financial-hub"] });
    expect(overlayAt(10.2)).toEqual({ kind: "project", slugs: ["portfolio-website"] });
    expect(overlayAt(10.7)).toEqual({ kind: "project", slugs: ["portfolio-rag"] });
  });

  test("the three personal projects are on screen for the same time", () => {
    const time: Record<string, number> = {};
    for (let s = segmentStart("personal"); s < ENDING_START; s += 0.01) {
      const o = overlayAt(s);
      if (o.kind === "project") for (const slug of o.slugs) time[slug] = (time[slug] ?? 0) + 0.01;
    }
    expect(Object.keys(time)).toEqual(["financial-hub", "portfolio-website", "portfolio-rag"]);
    for (const t of Object.values(time)) expect(t).toBeCloseTo(time["financial-hub"], 1);
  });
});

describe("chapterAt", () => {
  test("the stage's chapter stays for the whole stage, through and between its projects", () => {
    expect(chapterAt(0.6)).toBe("braga");
    expect(chapterAt(2.0)).toBe("porto");
    expect(chapterAt(2.6)).toBe("porto");
    expect(chapterAt(3.0)).toBe("porto");
    expect(chapterAt(4.6)).toBe("jonkoping");
  });

  test("no chapter during the intro or at the ending", () => {
    expect(chapterAt(0.2)).toBeNull();
    expect(chapterAt(ENDING_START)).toBeNull();
  });
});
