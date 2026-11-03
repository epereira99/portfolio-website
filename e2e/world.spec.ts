import { expect, test } from "@playwright/test";

test("from spawn, A reads the main board and a contract opens at its own URL", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(300); // the scene finishes loading its map
  await page.keyboard.press("z");
  await expect(page.getByText("Contracts are pinned to the board.")).toBeVisible();
  await page.keyboard.press("z");
  await page.keyboard.press("z");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /^Saab/ })).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("z");
  await expect(page).toHaveURL(/\/contracts\/saab-thesis$/);
  await expect(page.getByRole("heading", { name: "Predicting shooting performance from motion" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: /^Saab/ })).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/\/world$/);
});

test("A reads a sign and the next A puts it away for good", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(300);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(160 * 2 - 40); // two steps, from spawn to below the sign
  await page.keyboard.up("ArrowLeft");
  await page.waitForTimeout(200);
  await page.keyboard.down("ArrowUp"); // the sign blocks, so the hunter only turns to face it
  await page.waitForTimeout(60);
  await page.keyboard.up("ArrowUp");
  await page.keyboard.press("z");
  const sign = page.getByText("← Portugal · UMinho · Deloitte · Childhood house");
  await expect(sign).toBeVisible();
  await page.keyboard.press("z");
  await page.waitForTimeout(300);
  await expect(sign).toBeHidden();
});

test("the Start menu opens the raven from anywhere", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.keyboard.press("Shift");
  await expect(page.getByText("Send a raven")).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("z");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toBeVisible();
});

test("a shared contract link opens straight on its scroll", async ({ page }) => {
  await page.goto("/contracts/saab-thesis");
  await expect(page.getByText("Find the smallest sensor setup that still predicts performance.")).toBeVisible();
  await page.locator("canvas").waitFor(); // the scroll is server HTML; keys work once the game has mounted
  await page.keyboard.press("x");
  await expect(page).toHaveURL(/\/world$/);
});

// Cache Components streams before notFound(), so the status stays 200; the page is Next's not-found with noindex.
test("an unknown contract shows the not-found page", async ({ page }) => {
  await page.goto("/contracts/nope");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
});
