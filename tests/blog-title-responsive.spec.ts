import { expect, test, type Page } from "@playwright/test";

const postPath = process.env.BLOG_TITLE_CHECK_PATH ?? "/blog/sample-post/";
const bookReviewTitle = "『フェイク・マッスル』を読んだ";
const longJapaneseTitle =
  "これはとても長い日本語の記事タイトルでスマートフォン表示でも不自然に巨大化せず本文冒頭まで読み進めやすいかを確認するためのテストです";

const viewports = [
  { width: 375, height: 1200 },
  { width: 390, height: 1200 },
  { width: 768, height: 1200 },
  { width: 1024, height: 1200 },
  { width: 1280, height: 1200 },
];

type TitleMetrics = {
  fontSize: number;
  lineHeight: number;
  lineHeightRatio: number;
  overflowX: number;
};

type PageMetrics = {
  horizontalOverflow: number;
};

const getTitleMetrics = async (page: Page): Promise<TitleMetrics> => {
  return page.locator(".title h1").evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      fontSize: Number.parseFloat(styles.fontSize),
      lineHeight: Number.parseFloat(styles.lineHeight),
      lineHeightRatio: Number.parseFloat(styles.lineHeight) / Number.parseFloat(styles.fontSize),
      overflowX: element.scrollWidth - element.clientWidth,
    };
  });
};

const getPageMetrics = async (page: Page): Promise<PageMetrics> => {
  return page.evaluate(() => {
    return {
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
};

const getTitleLines = async (page: Page): Promise<string[]> => {
  return page.locator(".title h1").evaluate((element) => {
    const textNode = element.firstChild;
    const range = document.createRange();
    const fragments: Array<{ character: string; top: number }> = [];

    if (!textNode?.textContent) {
      return [];
    }

    for (let index = 0; index < textNode.textContent.length; index++) {
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      fragments.push({
        character: textNode.textContent[index],
        top: Math.round(rect.top),
      });
    }

    const lines: Array<{ top: number; text: string }> = [];

    for (const fragment of fragments) {
      const line = lines.find((item) => Math.abs(item.top - fragment.top) < 2);

      if (line) {
        line.text += fragment.character;
      } else {
        lines.push({ top: fragment.top, text: fragment.character });
      }
    }

    return lines.map((line) => line.text);
  });
};

test.describe("blog post title responsive typography", () => {
  for (const viewport of viewports) {
    test(`${viewport.width}px keeps the article title readable`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(postPath);

      await expect(page.locator(".title h1")).toBeVisible();
      const metaDescription = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(metaDescription?.trim().length).toBeGreaterThan(0);

      const metrics = await getTitleMetrics(page);
      const pageMetrics = await getPageMetrics(page);
      expect(pageMetrics.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(metrics.overflowX).toBeLessThanOrEqual(1);

      if (viewport.width <= 480) {
        expect(metrics.fontSize).toBeGreaterThanOrEqual(22);
        expect(metrics.fontSize).toBeLessThanOrEqual(24);
        expect(metrics.lineHeightRatio).toBeGreaterThanOrEqual(1.28);
      } else {
        expect(metrics.fontSize).toBeLessThanOrEqual(40);
        expect(metrics.lineHeightRatio).toBeGreaterThanOrEqual(1.18);
      }

      await page.locator(".title h1").evaluate((element, title) => {
        element.textContent = title;
      }, bookReviewTitle);

      const bookTitleMetrics = await getTitleMetrics(page);
      const bookTitlePageMetrics = await getPageMetrics(page);
      expect(bookTitlePageMetrics.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(bookTitleMetrics.overflowX).toBeLessThanOrEqual(1);

      if (viewport.width <= 480) {
        await expect(async () => {
          expect(await getTitleLines(page)).toEqual([bookReviewTitle]);
        }).toPass();
      }

      await page.locator(".title h1").evaluate((element, title) => {
        element.textContent = title;
      }, longJapaneseTitle);

      const longTitleMetrics = await getTitleMetrics(page);
      const longTitlePageMetrics = await getPageMetrics(page);
      expect(longTitlePageMetrics.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(longTitleMetrics.overflowX).toBeLessThanOrEqual(1);

      const layout = await page.evaluate(() => {
        const title = document.querySelector(".title h1");
        const hero = document.querySelector(".hero-image");
        const firstBodyElement = document.querySelector(
          ".prose > :not(.source-link):not(.related-posts)",
        );
        const rect = (element: Element | null) => {
          if (!element) {
            return null;
          }

          const { top, bottom, height } = element.getBoundingClientRect();

          return { top, bottom, height };
        };

        return {
          title: rect(title),
          hero: rect(hero),
          firstBodyElement: rect(firstBodyElement),
        };
      });

      expect(layout.title?.height).toBeGreaterThan(0);
      expect(layout.firstBodyElement?.height).toBeGreaterThan(0);

      if (layout.hero) {
        expect(layout.hero.top).toBeGreaterThan(layout.title!.bottom);
        expect(layout.firstBodyElement!.top).toBeGreaterThan(layout.hero.bottom);
      } else {
        expect(layout.firstBodyElement!.top).toBeGreaterThan(layout.title!.bottom);
      }
    });
  }
});
