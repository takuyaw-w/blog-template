import { expect, test } from "@playwright/test";

test.describe("prose rendering", () => {
  test("inline code does not render decorative backticks", async ({ page }) => {
    await page.goto("/blog/sample-post/");

    const inlineCode = page.locator(".prose-blog code").filter({ hasText: "inline code" });
    await expect(inlineCode).toBeVisible();

    const codeRendering = await inlineCode.evaluate((element) => {
      return {
        before: getComputedStyle(element, "::before").content,
        after: getComputedStyle(element, "::after").content,
        text: element.textContent,
      };
    });

    expect(codeRendering.text).toBe("inline code");
    expect(codeRendering.before).toBe("none");
    expect(codeRendering.after).toBe("none");
  });
});
