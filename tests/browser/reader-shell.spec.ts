import { expect, test } from "@playwright/test";

test("direct navigation opens the calm Shape of Time reader shell", async ({ page }) => {
  await page.goto("/books/root/folios/1");

  await expect(page).toHaveTitle("Shape of Time");
  await expect(page.getByRole("heading", { name: "The reader is taking shape." })).toBeVisible();
  await expect(page.getByText("Shape of Time · folio zero")).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("min-height", "720px");
});
