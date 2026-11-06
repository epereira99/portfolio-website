import { describe, expect, test } from "vitest";
import { STAGES } from "./stages";
import { PROJECTS, projectBySlug, projectsForStage } from "./projects";
import { DEGREES } from "./degrees";

describe("stages", () => {
  test("are the four cities in journey order, then his personal projects", () => {
    expect(STAGES.map((s) => s.id)).toEqual(["braga", "porto", "jonkoping", "stockholm", "personal"]);
  });

  test("carry the exact stage headers from the spec", () => {
    expect(STAGES.map((s) => s.header)).toEqual([
      "BSc Computer Science · Universidade do Minho · 2017–2022",
      "Deloitte · Cloud & DevOps → Integration Software · 2022–2024",
      "MSc AI Engineering · Jönköping University · 2024–2026",
      "Effektify · Growth & AI · Aug–Oct 2026",
      "Personal projects",
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
      "Personal projects",
    ]);
    expect(STAGES.map((s) => s.chapter.detail)).toEqual([
      "Universidade do Minho · 2017–2022",
      "Cloud & DevOps → Integration Software · 2022–2024",
      "Jönköping University · 2024–2026",
      "Growth & AI · Aug–Oct 2026",
      "Built in my own time",
    ]);
  });
});

describe("projects", () => {
  test("have unique slugs: the initial dataset plus OutSystems–Salesforce, Jönköpings Södra and the case competitions", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(slugs)).toEqual(
      new Set([
        "mambu-migration",
        "azure-ml-integrations",
        "outsystems-salesforce",
        "unet-segmentation",
        "jonkoping-sodra",
        "jibs-entrepreneurship-challenge",
        "jibs-case-competition",
        "saab-thesis",
        "financial-hub",
        "effektify-reconciliation",
      ]),
    );
  });

  test("are grouped per stage in order", () => {
    const slugs = (id: Parameters<typeof projectsForStage>[0]) => projectsForStage(id).map((p) => p.slug);
    expect(slugs("braga")).toEqual([]);
    expect(slugs("porto")).toEqual(["mambu-migration", "azure-ml-integrations", "outsystems-salesforce"]);
    expect(slugs("jonkoping")).toEqual([
      "unet-segmentation",
      "jonkoping-sodra",
      "jibs-entrepreneurship-challenge",
      "jibs-case-competition",
      "saab-thesis",
    ]);
    expect(slugs("stockholm")).toEqual(["effektify-reconciliation"]);
    expect(slugs("personal")).toEqual(["financial-hub"]);
  });

  test("never link to GitHub", () => {
    expect(JSON.stringify(PROJECTS)).not.toMatch(/github\.com/i);
  });

  test("lookup by unknown slug is undefined", () => {
    expect(projectBySlug("nope")).toBeUndefined();
  });
});

describe("degrees", () => {
  test("the BSc and MSc open like projects, from their chapters, without joining the project list", () => {
    expect(STAGES.find((s) => s.id === "braga")!.degree).toBe("bsc-computer-science");
    expect(STAGES.find((s) => s.id === "jonkoping")!.degree).toBe("msc-ai-engineering");
    expect(STAGES.filter((s) => s.degree)).toHaveLength(2);
    for (const d of DEGREES) {
      expect(projectBySlug(d.slug)).toBe(d);
      expect(PROJECTS).not.toContain(d);
      expect(projectsForStage(d.stage)).not.toContain(d);
    }
  });

  test("list every subject from the diplomas", () => {
    const subjects = (slug: string) => projectBySlug(slug)!.lists!.flatMap((l) => l.items);
    expect(subjects("bsc-computer-science")).toHaveLength(33);
    expect(subjects("bsc-computer-science")).toContain("Compilers and Language Processing");
    expect(subjects("msc-ai-engineering")).toHaveLength(13);
    expect(subjects("msc-ai-engineering")).toContain("Reinforcement Learning");
  });

  test("never carry grades or personal identity details", () => {
    const text = JSON.stringify(DEGREES);
    expect(text).not.toMatch(/19991123|T570|grade|Fyra|Fem|Eurico|Madalena/i);
  });
});
