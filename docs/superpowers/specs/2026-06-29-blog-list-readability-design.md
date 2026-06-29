# Blog 一覧の読みやすさ改善設計

## 背景

Blog 一覧は、このサイトの主な入口です。現在の一覧はすでに静かでテキスト中心の見た目ですが、複数行になったタイトルや説明文は、構造や見た目の方向性を変えずにもう少し読みやすくできます。

## 目的

タイトルと説明文の折り返しを中心に、Blog 一覧の読みやすさを小さく改善します。

## 対象範囲

- `src/components/organisms/PostList.astro` を更新します。
- 既存の記事一覧の DOM 構造は維持します。
- カテゴリ、日付、読了時間、タグの配置は変えません。
- JavaScript、polyfill、依存関係、route、全体 layout の変更は追加しません。

## 設計

各 Blog 一覧 item で、すでに表示しているテキストに段階的な表示改善として文字組みの調整を加えます。

- 記事タイトルに `text-wrap: balance` を追加し、複数行の見出しができるだけ均等に折り返されるようにします。
- 記事説明文に `text-wrap: pretty` を追加し、対応ブラウザでは不自然な最終行を減らします。
- 余白調整はタイトルと説明文の関係に限定し、変更量を最小にします。
- 既存の hover、focus、mobile layout、taxonomy link、静かな見た目は維持します。

`text-wrap: balance` と `text-wrap: pretty` は段階的な表示改善として扱います。非対応ブラウザでは通常の折り返しに戻るだけなので、fallback code は追加しません。

## 検証

source/UI 変更として、次を実行します。

```sh
rtk pnpm run build
rtk pnpm run lint
rtk pnpm run format:check
rtk git diff --check
```

## やらないこと

- Blog 一覧の情報設計を組み替えること。
- カテゴリ、日付、読了時間、タグを移動すること。
- 一覧 item の layout を redesign すること。
- 全体の typography rule を変更すること。
- ブラウザごとの fallback code を追加すること。
