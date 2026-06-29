# Blog 一覧の読みやすさ改善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blog 一覧のタイトルと説明文の折り返しを小さく改善し、既存の静かな UI を保ったまま読みやすくする。

**Architecture:** 変更対象は Blog 一覧 item を描画する `PostList.astro` に限定する。CSS は Tailwind の utility class と arbitrary property で局所的に追加し、構造、routing、data flow、global CSS は変えない。回帰検知として Playwright で一覧タイトルと説明文の computed `text-wrap-style` を確認する。

**Tech Stack:** Astro, Tailwind CSS v4, Playwright, pnpm, rtk

---

## ファイル構成

- 変更: `src/components/organisms/PostList.astro`
  - Blog 一覧 item の title/description class を最小変更する。
  - DOM 構造、リンク、taxonomy、metadata の並びは変えない。
- 追加: `tests/blog-list-readability.spec.ts`
  - Blog 一覧の title/description に期待する `text-wrap` 指定が入っていることを検証する。
  - layout smoke test とは分け、失敗時の原因を Blog 一覧の読みやすさ改善に限定しやすくする。

## Task 1: Blog 一覧の文字組み回帰テストを追加する

**Files:**

- 追加: `tests/blog-list-readability.spec.ts`

- [ ] **Step 1: 失敗する Playwright test を追加する**

`tests/blog-list-readability.spec.ts` を次の内容で作成する。

```ts
import { expect, test } from "@playwright/test";

test.describe("blog list readability", () => {
  test("uses improved wrapping for post titles and descriptions", async ({ page }) => {
    await page.goto("/");

    const firstPost = page.locator("main li").first();
    const title = firstPost.locator("h4");
    const description = firstPost.locator("p").first();

    await expect(title).toBeVisible();
    await expect(description).toBeVisible();

    const wrapping = await firstPost.evaluate((element) => {
      const titleElement = element.querySelector("h4");
      const descriptionElement = element.querySelector("p");

      if (!titleElement || !descriptionElement) {
        throw new Error("Expected blog list title and description to exist.");
      }

      const titleStyle = window.getComputedStyle(titleElement);
      const descriptionStyle = window.getComputedStyle(descriptionElement);

      return {
        titleTextWrapStyle: titleStyle.getPropertyValue("text-wrap-style"),
        descriptionTextWrapStyle: descriptionStyle.getPropertyValue("text-wrap-style"),
      };
    });

    expect(wrapping.titleTextWrapStyle).toBe("balance");
    expect(wrapping.descriptionTextWrapStyle).toBe("pretty");
  });
});
```

- [ ] **Step 2: test が失敗することを確認する**

実行:

```sh
rtk pnpm run build
rtk proxy pnpm exec playwright test tests/blog-list-readability.spec.ts
```

期待結果:

```text
Expected: "balance"
Received: "auto"
```

または description 側で次のように失敗する。

```text
Expected: "pretty"
Received: "auto"
```

## Task 2: PostList の title/description に text-wrap を追加する

**Files:**

- 変更: `src/components/organisms/PostList.astro`
- 検証: `tests/blog-list-readability.spec.ts`

- [ ] **Step 1: `PostList.astro` の title class を更新する**

既存の記事タイトルを探す。

```astro
<h4 class="m-0 text-xl leading-[1.2] text-site-heading group-hover:text-site-text group-focus-visible:text-site-text max-[720px]:text-[1.08rem] max-[720px]:leading-[1.28]">
  {post.data.title}
</h4>
```

次の内容に置き換える。

```astro
<h4 class="m-0 text-xl leading-[1.2] text-site-heading [text-wrap:balance] group-hover:text-site-text group-focus-visible:text-site-text max-[720px]:text-[1.08rem] max-[720px]:leading-[1.28]">
  {post.data.title}
</h4>
```

- [ ] **Step 2: `PostList.astro` の description class を更新する**

既存の記事説明文を探す。

```astro
<p class="mt-[0.35rem] mb-0 leading-[1.5] text-site-muted max-[720px]:text-[0.92rem] max-[720px]:leading-[1.55]">{post.data.description}</p>
```

次の内容に置き換える。

```astro
<p class="mt-[0.45rem] mb-0 leading-[1.55] text-site-muted [text-wrap:pretty] max-[720px]:text-[0.92rem] max-[720px]:leading-[1.6]">{post.data.description}</p>
```

この変更で、余白調整はタイトルと説明文の関係に限定する。

- desktop の説明文 margin: `0.35rem` -> `0.45rem`
- desktop の説明文 line-height: `1.5` -> `1.55`
- mobile の説明文 line-height: `1.55` -> `1.6`
- DOM、metadata、link、tag の配置は変えない

- [ ] **Step 3: targeted test が通ることを確認する**

実行:

```sh
rtk pnpm run build
rtk proxy pnpm exec playwright test tests/blog-list-readability.spec.ts
```

期待結果:

```text
1 passed
```

## Task 3: 全体検証と commit

**Files:**

- 確認: `src/components/organisms/PostList.astro`
- 確認: `tests/blog-list-readability.spec.ts`

- [ ] **Step 1: source/UI 変更向けの検証を実行する**

実行:

```sh
rtk pnpm run build
rtk pnpm run lint
rtk pnpm run format:check
rtk git diff --check
```

期待結果:

```text
build、lint、format:check、diff whitespace check が通る
```

- [ ] **Step 2: 変更差分を確認する**

実行:

```sh
rtk proxy git diff -- src/components/organisms/PostList.astro tests/blog-list-readability.spec.ts
```

期待結果:

```text
PostList の title/description class と、新規 Blog list readability test だけが変更されている
```

- [ ] **Step 3: 実装 commit を作成する**

実行:

```sh
rtk git add src/components/organisms/PostList.astro tests/blog-list-readability.spec.ts
rtk git commit -m "Improve blog list text wrapping"
```

期待結果:

```text
commit が成功する
```

- [ ] **Step 4: 作業ツリーを確認する**

実行:

```sh
rtk proxy git status --short
```

期待結果:

```text
出力なし
```
