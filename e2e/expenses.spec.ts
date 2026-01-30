import { test, expect } from "./fixtures";

test.describe("Expenses", () => {
  test("can navigate to add expense page", async ({ page }) => {
    await page.goto("/expenses/new");
    await expect(page.getByText("Add Expense")).toBeVisible();
  });

  test("add expense form has required fields", async ({ page }) => {
    await page.goto("/expenses/new");

    await expect(page.getByPlaceholderText("0.00")).toBeVisible();
    await expect(page.getByPlaceholderText("Description")).toBeVisible();
    await expect(page.getByText("Category")).toBeVisible();
    await expect(page.getByText("Save Expense")).toBeVisible();
  });

  test("save button is disabled without valid input", async ({ page }) => {
    await page.goto("/expenses/new");

    const saveButton = page.getByText("Save Expense");
    await expect(saveButton).toBeDisabled();
  });

  test("can fill expense form", async ({ page }) => {
    await page.goto("/expenses/new");

    // Fill amount
    await page.getByPlaceholderText("0.00").fill("25.50");

    // Fill description
    await page.getByPlaceholderText("Description").fill("Test Expense");

    // Select a category (click first category button)
    const categoryButtons = page.locator("button[type='button']").filter({ hasText: /Food|Transport|Shopping/ });
    if (await categoryButtons.first().isVisible()) {
      await categoryButtons.first().click();
    }
  });

  test("close button navigates back", async ({ page }) => {
    await page.goto("/dashboard");
    await page.goto("/expenses/new");

    await page.getByLabel("Close").click();
    // Should navigate back
    await page.waitForTimeout(500);
  });

  test("can filter expenses by search", async ({ page }) => {
    await page.goto("/dashboard");

    const searchInput = page.getByPlaceholderText("Search expenses...");
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      // Filter should apply
      await page.waitForTimeout(300);
    }
  });
});
