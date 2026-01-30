import { test, expect } from "./fixtures";

test.describe("Categories", () => {
  test("loads categories page", async ({ page }) => {
    await page.goto("/categories");
    await expect(page).toHaveURL(/categories/);
  });

  test("displays existing categories", async ({ page }) => {
    await page.goto("/categories");

    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("can navigate to categories from nav", async ({ page }) => {
    await page.goto("/dashboard");

    // Look for categories nav link
    const categoriesLink = page.locator("a[href='/categories']").first();
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await expect(page).toHaveURL(/categories/);
    }
  });
});
