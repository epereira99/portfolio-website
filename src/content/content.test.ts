import { describe, expect, test } from "vitest";
import { STAGES } from "./stages";
import { PROJECTS, projectBySlug, projectsForStage } from "./projects";

describe("stages", () => {
  test("are the four cities in journey order", () => {
    expect(STAGES.map((s) => s.id)).toEqual(["braga", "porto", "jonkoping", "stockholm"]);
  });

  test("carry the exact stage headers from the spec", () => {
    expect(STAGES.map((s) => s.header)).toEqual([
      "BSc Computer Science · Universidade do Minho · 2017–2022",
      "Deloitte · Cloud & DevOps → Integration Software · 2022–2024",
      "MSc AI Engineering · Jönköping University · 2024–2026",
      "Effektify & personal projects · 2026–now",
    ]);
  });
});

describe("chapters", () => {
  test("each stage leads with the institution or employer", () => {
    expect(STAGES.map((s) => s.chapter.title)).toEqual([
      "BSc Computer Science",
      "Deloitte",
      "MSc AI Engineering",
      "Effektify",
    ]);
    expect(STAGES.map((s) => s.chapter.detail)).toEqual([
      "Universidade do Minho · 2017–2022",
      "Cloud & DevOps → Integration Software · 2022–2024",
      "Jönköping University · 2024–2026",
      "Growth & AI · personal projects · 2026–now",
    ]);
  });
});

describe("projects", () => {
  test("have unique slugs matching the initial dataset", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(slugs)).toEqual(
      new Set([
        "mambu-migration",
        "azure-ml-integrations",
        "unet-segmentation",
        "saab-thesis",
        "financial-hub",
        "effektify-reconciliation",
      ]),
    );
  });

  test("are grouped per stage in order", () => {
    const slugs = (id: Parameters<typeof projectsForStage>[0]) => projectsForStage(id).map((p) => p.slug);
    expect(slugs("braga")).toEqual([]);
    expect(slugs("porto")).toEqual(["mambu-migration", "azure-ml-integrations"]);
    expect(slugs("jonkoping")).toEqual(["unet-segmentation", "saab-thesis"]);
    expect(slugs("stockholm")).toEqual(["financial-hub", "effektify-reconciliation"]);
  });

  test("never link to GitHub", () => {
    expect(JSON.stringify(PROJECTS)).not.toMatch(/github\.com/i);
  });

  test("lookup by unknown slug is undefined", () => {
    expect(projectBySlug("nope")).toBeUndefined();
  });
});
