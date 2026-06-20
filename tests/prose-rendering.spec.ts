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

  test("markdown lists use prose-specific markers", async ({ page }) => {
    await page.goto("/blog/sample-post/");

    const unorderedList = page.locator(".prose-blog ul:not([class])").first();
    const taskList = page.locator(".prose-blog ul.contains-task-list").first();

    await expect(unorderedList).toBeVisible();
    await expect(taskList).toBeVisible();

    const unorderedRendering = await unorderedList.evaluate((element) => {
      const firstItem = element.querySelector("li");

      return {
        display: getComputedStyle(element).display,
        listStyleType: getComputedStyle(element).listStyleType,
        markerContent: firstItem ? getComputedStyle(firstItem, "::before").content : null,
      };
    });

    const taskRendering = await taskList.evaluate((element) => {
      const firstItem = element.querySelector("li");
      const checkbox = element.querySelector('input[type="checkbox"]');

      return {
        listStyleType: getComputedStyle(element).listStyleType,
        markerContent: firstItem ? getComputedStyle(firstItem, "::before").content : null,
        checkboxAccentColor: checkbox ? getComputedStyle(checkbox).accentColor : null,
      };
    });

    expect(unorderedRendering.display).toBe("grid");
    expect(unorderedRendering.listStyleType).toBe("none");
    expect(unorderedRendering.markerContent).toBe('""');
    expect(taskRendering.listStyleType).toBe("none");
    expect(taskRendering.markerContent).toBe("none");
    expect(taskRendering.checkboxAccentColor).not.toBe("auto");
  });
});
