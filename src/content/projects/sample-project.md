---
title: "Sample Project"
description: "プロジェクトページで使えるfrontmatterと本文構成を一通り含めたサンプルです。"
category: "Website"
status: "Active"
period: "2026"
tags:
  - Astro
  - Portfolio
  - Documentation
url: "https://example.com"
repository: "https://github.com/example/sample-project"
heroImage: "../../assets/blog-placeholder-1.jpg"
heroImageAlt: "Sample project preview"
gallery:
  - image: "../../assets/blog-placeholder-1.jpg"
    alt: "Sample project gallery image"
    caption: "ギャラリー画像のキャプション例です。"
order: 1
---

このファイルは、プロジェクト記事を書くためのサンプルです。プロジェクト一覧、詳細ページ、タグ、カテゴリ、外部リンク、ギャラリーで使われる項目を一通り含めています。

## Frontmatter

プロジェクト記事のfrontmatterでは、一覧カードや詳細ページに必要な情報を管理します。

```yaml
title: "Sample Project"
description: "プロジェクトの短い説明"
category: "Website"
status: "Active"
period: "2026"
tags:
  - Astro
  - Portfolio
url: "https://example.com"
repository: "https://github.com/example/sample-project"
heroImage: "../../assets/blog-placeholder-1.jpg"
heroImageAlt: "Sample project preview"
gallery:
  - image: "../../assets/blog-placeholder-1.jpg"
    alt: "Sample project gallery image"
    caption: "ギャラリー画像のキャプション"
order: 1
```

`status` は `Active`、`Archived`、`Planning` のどれかを指定します。`url` と `repository` は必要な場合だけ書きます。

## Overview

このプロジェクトは、個人サイトやポートフォリオで使えるコンテンツ管理のサンプルです。

主な目的は次の3つです。

- 何を作ったかを短く説明する
- どの技術や役割が関係しているかを整理する
- 成果物やリポジトリへの導線を置く

## Role

このプロジェクトで担当した範囲を書きます。

| Area           | Description                                |
| -------------- | ------------------------------------------ |
| Planning       | 掲載する情報の整理とページ構成             |
| Design         | 一覧カード、詳細ページ、ギャラリーの見え方 |
| Implementation | AstroコンテンツコレクションとMarkdown本文  |

## Features

プロジェクトの特徴は、読者が素早く理解できる粒度でまとめます。

1. Markdownだけでプロジェクトを追加できる
2. カテゴリとタグで分類できる
3. 画像、外部URL、GitHubリポジトリを設定できる
4. ギャラリーで複数の画面や成果物を見せられる

## Technical Notes

実装メモや判断理由を書いておくと、後から見返しやすくなります。

```ts
const projectStatus = ["Active", "Archived", "Planning"] as const;
type ProjectStatus = (typeof projectStatus)[number];
```

## What I Learned

プロジェクトから得た学びや、次に改善したいことを書きます。

> 具体的な成果だけでなく、判断の理由や制約も残しておくと、プロジェクトページが将来の自分にとっても役立ちます。

## Links

- [Live site](https://example.com)
- [Repository](https://github.com/example/sample-project)
