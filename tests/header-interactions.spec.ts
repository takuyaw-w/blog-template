import { expect, test } from "@playwright/test";

test.describe("header interactions", () => {
  test("theme toggle switches the document theme and persists the choice", async ({ page }) => {
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: /toggle color theme|switch to/i });
    await expect(themeToggle).toBeVisible();

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(initialTheme === "light" || initialTheme === "dark").toBe(true);

    await themeToggle.click();

    const nextTheme = initialTheme === "dark" ? "light" : "dark";
    await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(nextTheme);
  });

  test("mobile menu button opens and closes the navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 1200 });
    await page.goto("/");

    const menuToggle = page.locator(".menu-toggle");
    const menu = page.locator("#primary-navigation");

    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    await menuToggle.click();

    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();
  });
});
