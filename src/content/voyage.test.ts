import { expect, test } from "vitest";
import { BANNER_DISTANCE, WELCOME_BANNER } from "./voyage";

test("the welcome banner uses Eduardo's wording, just after landing", () => {
  expect(WELCOME_BANNER).toBe("Välkommen till Jönköping, och AI");
  expect(BANNER_DISTANCE).toBeGreaterThan(200);
  expect(BANNER_DISTANCE).toBeLessThanOrEqual(215);
});
