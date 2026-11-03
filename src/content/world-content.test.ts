import { expect, test } from "vitest";
import { PLACES, placeById } from "./places";
import { CONTRACTS, contractBySlug, contractsFor, villageLabel } from "./contracts";
import { PROJECTS } from "./projects";
import { visibleNpcs } from "./npcs";

test("the world has two houses, two academies and four villages split by the river", () => {
  const side = (s: string) => PLACES.filter((p) => p.side === s).map((p) => p.id);
  expect(side("portugal")).toEqual(["childhood-house", "uminho", "deloitte"]);
  expect(side("sweden")).toEqual(["current-house", "ju", "saab", "jordbruksverket", "effektify"]);
  expect(placeById("uminho").degree).toBe("bsc-computer-science");
  expect(placeById("ju").degree).toBe("msc-ai-engineering");
});

test("every project is exactly one contract", () => {
  expect(CONTRACTS.map((c) => c.slug)).toEqual(PROJECTS.map((p) => p.slug));
});

test("contracts belong to their places, and the academy shares Saab and Jordbruksverket work", () => {
  const slugs = (p: Parameters<typeof contractsFor>[0]) => contractsFor(p).map((c) => c.slug);
  expect(slugs("deloitte")).toEqual(["mambu-migration", "azure-ml-integrations"]);
  expect(slugs("ju")).toEqual(["unet-segmentation", "saab-thesis"]);
  expect(slugs("saab")).toEqual(["saab-thesis"]);
  expect(slugs("jordbruksverket")).toEqual(["unet-segmentation"]);
  expect(slugs("current-house")).toEqual(["financial-hub"]);
  expect(slugs("effektify")).toEqual(["effektify-reconciliation"]);
  expect(slugs("childhood-house")).toEqual([]);
  expect(slugs("all")).toHaveLength(6);
});

test("the Saab contract carries Eduardo's wording", () => {
  const saab = contractBySlug("saab-thesis")!;
  expect(villageLabel(saab)).toBe("Saab · Jönköping");
  expect(saab.goal).toBe("Find the smallest sensor setup that still predicts performance.");
  expect(saab.done).toBe(true);
  expect(contractBySlug("effektify-reconciliation")!.done).toBe(false);
});

test("only approved NPC lines appear", () => {
  const npc = (approved: boolean) => ({ id: "x", name: "X", place: "saab" as const, line: "hi", approved });
  expect(visibleNpcs([npc(true), npc(false)])).toHaveLength(1);
});
