import { expect, test, type Page } from "@playwright/test";

const scrollToScreens = (page: Page, s: number) => page.evaluate((s) => window.scrollTo(0, s * window.innerHeight), s);

test("the intro and navigation show before the 3D is ready", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Eduardo Pereira" })).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
});

test("walking into Porto shows its stage and first project, and a project opens and closes in place", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 2);
  const journey = page.getByRole("navigation", { name: "Journey" });
  await expect(journey.getByRole("button", { name: "Porto" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("heading", { name: "Mambu migration tool" })).toBeVisible();

  await page.getByRole("button", { name: "Read more" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(page.url()).toContain("?project=mambu-migration");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  const [y, vh] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
  expect(y).toBe(2 * vh);
});

test("keyboard focus stays inside an open project and the walk stays put", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 2);
  await page.getByRole("button", { name: "Read more" }).click();
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Enter");
  const [y, vh] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
  expect(y).toBe(2 * vh);
});

test("a shared project link opens its dialog", async ({ page }) => {
  await page.goto("/?project=financial-hub");
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Financial Hub" })).toBeVisible();
});

test("the Projects fan opens a project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Projects" }).click();
  await page.getByRole("button", { name: /U-Net/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("navigation is never lost, even at sea", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 4);
  await expect(page.getByText("At sea · Porto → Jönköping")).toBeVisible();
  await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
});
