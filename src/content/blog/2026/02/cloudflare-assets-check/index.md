---
title: "Test Post: Cloudflare Assets Check"
description: "Cloudflare Workers Static Assets前提の静的生成を確認するためのテスト記事です。"
category: "Deployment"
tags:
  - Cloudflare
  - Test
  - Static
pubDate: "2026-02-18"
---

このテスト記事は、静的ビルドで複数記事が正しく生成されるかを確認するために追加しています。
このリポジトリは Workers Static Assets として配信する前提なので、記事ページも月別ページもビルド時にHTMLとして出力される必要があります。

## 確認したいこと

`rtk pnpm run build` を実行したとき、この記事の詳細ページ、タグページ、月別ページが静的ルートとして生成されるかを見ます。
Cloudflare というタグを入れているため、タグ一覧にもこのテスト記事が反映されます。

## 月別表示

2026-02 には2本の記事があります。
そのため `/years/` の 2026-02 行では、Blog が 2、Min が2本分の読了時間になる想定です。
