import { expect, test, type Page } from "@playwright/test";

const SCROLL_PER_SCREEN = 1.5; // mirrors src/journey/progress.ts

const scrollToScreens = (page: Page, s: number) =>
  page.evaluate(([s, k]) => window.scrollTo(0, s * window.innerHeight * k), [s, SCROLL_PER_SCREEN]);

test("the intro and navigation show before the walk frames load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hey, great to see you here.")).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
});

test("walking into Porto shows its stage and first project, and a project opens and closes in place", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 2);
  await expect(page.getByRole("heading", { level: 2, name: "Deloitte" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mambu migration tool" })).toBeVisible();

  await page.getByRole("button", { name: "Read more" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(page.url()).toContain("?project=mambu-migration");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  const [y, vh] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
  expect(y).toBe(2 * vh * SCROLL_PER_SCREEN);
});

test("keyboard focus stays inside an open project and the walk stays put", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 2);
  await page.getByRole("button", { name: "Read more" }).click();
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Enter");
  const [y, vh] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
  expect(y).toBe(2 * vh * SCROLL_PER_SCREEN);
});

test("a shared project link opens its dialog", async ({ page }) => {
  await page.goto("/?project=financial-hub");
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Financial Hub" })).toBeVisible();
});

test("the Projects tree opens a project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Projects" }).click();
  await page.getByRole("button", { name: /^AI/ }).click();
  await page.getByRole("button", { name: /U-Net/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("entering Porto announces the Deloitte chapter, and its card stays for the stage", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 1.6);
  await expect(page.getByRole("heading", { level: 2, name: "Deloitte" })).toBeVisible();
  await expect(page.getByText("Cloud & DevOps → Integration Software · 2022–2024")).toBeVisible();
  await scrollToScreens(page, 2.2);
  await expect(page.getByRole("heading", { level: 2, name: "Deloitte" })).toBeVisible();
});

test.describe("the ending", () => {
  test("invites the visitor with ways to get in touch, navigation still there", async ({ page }) => {
    await page.goto("/");
    await scrollToScreens(page, 11);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Email me" })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
    await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
  });

  test("scrolling back out of the ending returns to the journey", async ({ page }) => {
    await page.goto("/");
    await scrollToScreens(page, 11);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
    await scrollToScreens(page, 6.8);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "MSc AI Engineering" })).toBeVisible();
  });

  test("scrolling past the very bottom keeps the ending and throws nothing", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (e) => errors.push(e));
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight + 1000));
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test("Eduardo walks down the road, with his stage's story beside him", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('img[src^="/walk/"]')).toBeVisible();
  await scrollToScreens(page, 1.6);
  await expect(page.getByRole("complementary")).toBeVisible();
});
