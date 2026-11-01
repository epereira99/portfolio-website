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

const MAP = "Map: sailing from Porto to Jönköping";

const settle = async (page: Page) => {
  // wait until scrollY has been stable for 300ms (smooth scrolling done)
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const y = window.scrollY;
        setTimeout(() => resolve(window.scrollY === y), 300);
      }),
  );
};

test("mid-voyage the map shows and navigation stays", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 4.3);
  await expect(page.getByRole("img", { name: MAP })).toBeVisible();
  await expect(page.getByText("At sea · Porto → Jönköping")).toBeVisible();
  await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
});

test("the map is gone once you land", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 4.3);
  await expect(page.getByRole("img", { name: MAP })).toBeVisible();
  await scrollToScreens(page, 5.2);
  await expect(page.getByRole("img", { name: MAP })).toHaveCount(0);
});

test("jumping to Jönköping from Porto leaves no map behind", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 2);
  const journey = page.getByRole("navigation", { name: "Journey" });
  await journey.getByRole("button", { name: "Jönköping" }).click();
  await expect(journey.getByRole("button", { name: "Jönköping" })).toHaveAttribute("aria-current", "step");
  await settle(page);
  const screens = await page.evaluate(() => window.scrollY / window.innerHeight);
  expect(screens).toBeCloseTo(5, 1);
  await expect(page.getByRole("img", { name: MAP })).toHaveCount(0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("both ends of the voyage fit on screen", async ({ page }) => {
    await page.goto("/");
    await scrollToScreens(page, 4.3);
    for (const name of ["Porto", "Jönköping"]) {
      const box = (await page.getByRole("img", { name: MAP }).getByText(name, { exact: true }).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
      expect(box.y + box.height).toBeLessThanOrEqual(812);
    }
  });
});

test("with reduced motion the map's ship holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await scrollToScreens(page, 4.3);
  const bob = page.locator('[data-part="ship"] > g');
  await expect(bob).toHaveCount(1);
  expect(await bob.evaluate((el) => getComputedStyle(el).animationIterationCount)).toBe("1");
});

test("entering Porto announces the Deloitte chapter, and the header keeps it in view", async ({ page }) => {
  await page.goto("/");
  await scrollToScreens(page, 1.6);
  await expect(page.getByRole("heading", { level: 2, name: "Deloitte" })).toBeVisible();
  await expect(page.getByText("Chapter 2 · Porto")).toBeVisible();
  await scrollToScreens(page, 2.2);
  await expect(page.getByRole("navigation", { name: "Journey" }).getByText("Deloitte", { exact: true })).toBeVisible();
});

test.describe("the ending", () => {
  test("invites the visitor with ways to get in touch, navigation still there", async ({ page }) => {
    await page.goto("/");
    await scrollToScreens(page, 9);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Email me" })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
    await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
  });

  test("scrolling back out of the ending returns to Stockholm", async ({ page }) => {
    await page.goto("/");
    await scrollToScreens(page, 9);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
    await scrollToScreens(page, 8.0);
    await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Journey" }).getByRole("button", { name: "Stockholm" }),
    ).toHaveAttribute("aria-current", "step");
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
