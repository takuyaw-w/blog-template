import { expect, test } from "@playwright/test";

test.describe("blog list readability", () => {
  test("uses improved wrapping for post titles and descriptions", async ({ page }) => {
    await page.goto("/");

    const firstPost = page.locator("main > section > ul > li").first();
    const title = firstPost.locator("h4");
    const description = firstPost.locator("p").first();

    await expect(title).toBeVisible();
    await expect(title).toHaveText("日本語タイトルの表示確認サンプル");
    await expect(description).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const wrapping = await firstPost.evaluate((element) => {
      const titleElement = element.querySelector("h4");
      const descriptionElement = element.querySelector("p");

      if (!titleElement || !descriptionElement) {
        throw new Error("Expected blog list title and description to exist.");
      }

      const titleStyle = window.getComputedStyle(titleElement);
      const descriptionStyle = window.getComputedStyle(descriptionElement);

      return {
        titleFontSizeAdjust: titleStyle.fontSizeAdjust,
        titleTextWrapStyle: titleStyle.getPropertyValue("text-wrap-style"),
        descriptionTextWrapStyle: descriptionStyle.getPropertyValue("text-wrap-style"),
      };
    });

    expect(wrapping.titleFontSizeAdjust).toBe("none");
    expect(wrapping.titleTextWrapStyle).toBe("balance");
    expect(wrapping.descriptionTextWrapStyle).toBe("pretty");
  });
});
