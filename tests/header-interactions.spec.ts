import { expect, test } from "@playwright/test";

const relativeLuminance = (color: string) => {
  const channels = color.match(/\d+/g)?.slice(0, 3).map(Number);

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected an RGB color, received: ${color}`);
  }

  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
};

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
        background: getComputedStyle(document.body).backgroundColor,
        paragraph: paragraph ? getComputedStyle(paragraph).color : null,
        heading: heading ? getComputedStyle(heading).color : null,
      };
    });

    expect(colors.paragraph).not.toBeNull();
    expect(colors.heading).not.toBeNull();
    expect(contrastRatio(colors.paragraph!, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.heading!, colors.background)).toBeGreaterThanOrEqual(4.5);
  });
});
