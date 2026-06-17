---
title: "Test Post: Astro Routing Notes"
description: "Astroのルートと月別ログの関係を確認するためのテスト記事です。"
category: "Development"
tags:
  - Astro
  - Test
  - Routing
pubDate: "2026-02-04"
---

このテスト記事は、同じ月に複数の記事がある状態を確認するための1本目です。
`src/content/blog/2026/02/astro-routing-notes/index.md` というパスが、そのまま `/blog/2026/02/astro-routing-notes/` のような記事URLに反映されます。

## ルート確認

Astroのコンテンツコレクションでは、ネストした `index.md` を使うことで、記事ごとの画像や補助ファイルを同じディレクトリにまとめられます。
今回のテストでは画像を使いませんが、記事単位のディレクトリ構成が維持されているかを見る目的があります。

## 月別ログで見る点

同じ 2026-02 にもう1本の記事を追加しているため、Monthly Logs の Blog 数は 2 になるはずです。
タグは Astro と Test がこの月の代表的なタグとして見える想定です。
