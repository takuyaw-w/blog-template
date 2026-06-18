import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/blog/",
  "/blog/sample-post/",
  "/projects/",
  "/projects/sample-project/",
  "/about/",
  "/categories/",
  "/tags/",
  "/years/",
];

const viewports = [
  { width: 375, height: 1200 },
  { width: 768, height: 1200 },
  { width: 1280, height: 1200 },
];

test.describe("responsive layout smoke check", () => {
  for (const path of pages) {
    for (const viewport of viewports) {
      test(`${path} at ${viewport.width}px does not overflow horizontally`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);

        await expect(page.locator("header.site-header")).toBeVisible();
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("footer.site-footer")).toBeVisible();

        const metrics = await page.evaluate(() => {
          const main = document.querySelector("main");
          const mainRect = main?.getBoundingClientRect();
          const viewportWidth = document.documentElement.clientWidth;
          const scrollWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          );

          return {
            horizontalOverflow: scrollWidth - viewportWidth,
            mainWidth: mainRect?.width ?? 0,
            mainLeft: mainRect?.left ?? 0,
            mainRight: mainRect?.right ?? 0,
            viewportWidth,
          };
        });

        expect(metrics.horizontalOverflow).toBeLessThanOrEqual(1);
        expect(metrics.mainWidth).toBeGreaterThan(0);
        expect(metrics.mainLeft).toBeGreaterThanOrEqual(-1);
        expect(metrics.mainRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      });
    }
  }
});
