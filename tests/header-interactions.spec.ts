import { expect, test } from "@playwright/test";

test.describe("header interactions", () => {
  test("theme toggle switches the document theme and persists the choice", async ({ page }) => {
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: /toggle color theme|switch to/i });
    const moonIcon = themeToggle.locator(".icon-tabler-moon");
    const sunIcon = themeToggle.locator(".icon-tabler-sun");
    await expect(themeToggle).toBeVisible();

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(initialTheme === "light" || initialTheme === "dark").toBe(true);
    await expect(initialTheme === "dark" ? sunIcon : moonIcon).toBeVisible();
    await expect(initialTheme === "dark" ? moonIcon : sunIcon).toBeHidden();

    await themeToggle.click();

    const nextTheme = initialTheme === "dark" ? "light" : "dark";
    await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(nextTheme);
    await expect(nextTheme === "dark" ? sunIcon : moonIcon).toBeVisible();
    await expect(nextTheme === "dark" ? moonIcon : sunIcon).toBeHidden();
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

  test("dark theme keeps blog post body text readable", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/blog/sample-post/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const colors = await page.evaluate(() => {
      const paragraph = document.querySelector(".prose-blog p");
      const heading = document.querySelector(".prose-blog h2");

      return {
        paragraph: paragraph ? getComputedStyle(paragraph).color : null,
        heading: heading ? getComputedStyle(heading).color : null,
      };
    });

    expect(colors.paragraph).toBe("rgb(220, 228, 245)");
    expect(colors.heading).toBe("rgb(244, 247, 255)");
  });
});
