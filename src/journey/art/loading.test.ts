import { expect, test } from "vitest";
import { landmarksToLoad } from "./loading";

test("loads the current city's landmarks and the next city's, in path order", () => {
  expect(landmarksToLoad(0)).toEqual(["arcada", "bom-jesus", "uminho", "clerigos", "dom-luis"]);
  expect(landmarksToLoad(4)).toEqual(["jonkoping-university"]);
  expect(landmarksToLoad(8.8)).toEqual(["stadshuset"]);
});

test("jumping straight to Stockholm doesn't wait on earlier cities", () => {
  const ids = landmarksToLoad(7.0);
  expect(ids).toContain("stadshuset");
  for (const early of ["arcada", "bom-jesus", "uminho", "clerigos", "dom-luis"]) expect(ids).not.toContain(early);
});
