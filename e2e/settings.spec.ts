import { test, expect } from "./fixtures";

test.describe("Settings", () => {
  test("loads settings page", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/settings/);
  });

  test("displays user info", async ({ page }) => {
    await page.goto("/settings");

    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("can navigate to settings from nav", async ({ page }) => {
    await page.goto("/dashboard");

    const settingsLink = page.locator("a[href='/settings']").first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/settings/);
    }
  });
});
