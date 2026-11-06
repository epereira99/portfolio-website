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
  await expect(page.getByRole("heading", { name: "AI Driven Sensor Optimization for Marksman Posture Analysis - Master Thesis" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: /^Saab/ })).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/\/world$/);
});

test("a sign reads itself as the hunter walks up, without pressing A", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(300);
  const sign = page.getByRole("status").filter({ hasText: "Sweden" });
  await expect(sign).toBeVisible(); // spawn is two steps from the "Sweden" sign
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(160 * 3 - 40); // three steps east, out of its range
  await page.keyboard.up("ArrowRight");
  await expect(sign).toBeHidden();
});

test("A reads a sign and the next A puts the dialogue away for good", async ({ page }) => {
  await page.goto("/world");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(300);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(160 - 40); // one step, from spawn to below the "Sweden" sign
  await page.keyboard.up("ArrowLeft");
  await page.waitForTimeout(200);
  await page.keyboard.down("ArrowUp"); // the sign blocks, so the hunter only turns to face it
  await page.waitForTimeout(60);
  await page.keyboard.up("ArrowUp");
  await page.keyboard.press("z");
  const dialogue = page.getByRole("status").filter({ hasText: "▼" }); // only the A dialogue has the cursor
  await expect(dialogue).toContainText("Sweden");
  await page.keyboard.press("z");
  await page.waitForTimeout(300);
  await expect(dialogue).toBeHidden();
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
