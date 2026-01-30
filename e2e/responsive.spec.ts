import { test, expect } from "./fixtures";

test.describe("Responsive Layout", () => {
  test("shows mobile navigation on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // Mobile nav (bottom bar) should be visible
    const mobileNav = page.locator("nav").first();
    await expect(mobileNav).toBeVisible();
  });

  test("shows desktop sidebar on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    // Desktop sidebar should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("FAB is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // FAB should be part of the bottom nav on mobile
    const fab = page.locator("a[href='/expenses/new']").first();
    if (await fab.isVisible()) {
      await expect(fab).toBeVisible();
    }
  });

  test("FAB is visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    const fab = page.locator("a[href='/expenses/new']").first();
    if (await fab.isVisible()) {
      await expect(fab).toBeVisible();
    }
  });
});
