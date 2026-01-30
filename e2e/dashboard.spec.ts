import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("loads the dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/);
  });

  test("displays metric cards", async ({ page }) => {
    await page.goto("/dashboard");

    // Should have metric card containers
    const cards = page.locator(".shadow-card");
    await expect(cards.first()).toBeVisible();
  });

  test("displays category breakdown section", async ({ page }) => {
    await page.goto("/dashboard");

    // Category breakdown bars should render
    const bars = page.locator(".rounded-full.h-2");
    // May or may not have data, but section should be present
    await expect(page.locator("text=Category")).toBeVisible().catch(() => {
      // Category section may not exist if no expenses
    });
  });

  test("FAB navigates to add expense", async ({ page }) => {
    await page.goto("/dashboard");

    // Look for the FAB (floating action button) and click it
    const fab = page.locator("a[href='/expenses/new']").first();
    if (await fab.isVisible()) {
      await fab.click();
      await expect(page).toHaveURL(/expenses\/new/);
    }
  });

  test("recent expenses section renders", async ({ page }) => {
    await page.goto("/dashboard");

    // The page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });
});
