// @vitest-environment node
import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { CV_URL, EMAIL, LINKEDIN } from "./contact";

test("contact details match the CV", () => {
  expect(EMAIL).toBe("eduardoluisvp99@gmail.com");
  expect(LINKEDIN).toBe("https://www.linkedin.com/in/eduardopereira-/");
});

test("a CV link, once set, points at a real PDF", () => {
  if (CV_URL === null) return;
  expect(CV_URL.endsWith(".pdf")).toBe(true);
  expect(existsSync(`public${CV_URL}`)).toBe(true);
});
