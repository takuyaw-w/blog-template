# /var/log/takuya.log blog template

Astro で構築した静的ブログテンプレートです。ブログ、プロジェクト、About を Astro Content Collections で管理し、Cloudflare Workers Static Assets として配信します。

## 概要

- Astro の静的ビルドで HTML、RSS、sitemap、OGP 画像を生成します。
- ブログ記事は `src/content/blog`、プロジェクトは `src/content/projects`、プロフィールは `src/content/about` に置きます。
- ブログ一覧、taxonomy、pagination は `src/utils/blog.ts` と共有コンポーネントに集約しています。
- プロジェクト一覧、taxonomy、path 生成は `src/utils/projects.ts` に集約しています。
- Mermaid はクライアントで描画せず、ビルド時に SVG へ変換します。
- OGP 画像は `src/pages/og/[...slug].png.ts` で静的に生成し、`src/og/image.ts` が Satori/Resvg の描画を担当します。
- Cloudflare では Workers Static Assets として配信します。SSR、Astro Cloudflare adapter、Worker script は使いません。

## 環境構築

### 前提

- Node.js `>=22.12.0`
- pnpm `11.7.0`
- Git
- Cloudflare へ deploy する場合は Wrangler で使う Cloudflare アカウント

メンテナ環境では shell command を `rtk` 経由で実行しています。`rtk` がない環境では、同じコマンドを `rtk` なしで実行してください。

### 初期セットアップ

この repo は `package.json` の `packageManager` で pnpm の現行バージョンを指定しています。mise、Corepack、その他の version manager のどれを使っても構いませんが、install 前に `packageManager` と同じ pnpm が使われていることを確認してください。

```sh
pnpm --version
```

```sh
pnpm install
```

pnpm が build script の承認で止まる場合は、表示された指示に従って承認するか、インストール後に次を実行します。

```sh
pnpm rebuild --pending
```

この repo では commit 時に `oxfmt` を自動実行する hook を使います。clone 直後は hooksPath を設定してください。

```sh
git config core.hooksPath .githooks
```

hook は staged file のうち `oxfmt` 対象ファイルを整形して再 stage します。同じファイルに unstaged change がある場合は、意図しない混在を避けるため commit を止めます。

### CodeGraph

この repo は CodeGraph を使って構造調査と refactor 範囲の確認をします。`@colbymchenry/codegraph` は devDependency として入っています。

初回は index を作成します。

```sh
pnpm exec codegraph init
```

index は `.codegraph/` に作られます。このディレクトリはローカル生成物なので git には含めません。

既存 index を更新したい場合は次を使います。

```sh
pnpm exec codegraph index
pnpm exec codegraph status
```

Codex などの MCP client から CodeGraph を使う場合は、設定例を CLI から確認できます。

```sh
pnpm exec codegraph install --print-config codex
```

このコマンドは設定ファイルを書き換えず、追加すべき MCP 設定だけを表示します。実際に設定を導入する場合は、環境に合わせて global か local のどちらに入れるかを決めてください。

```sh
pnpm exec codegraph install --target codex --location global
```

`codegraph_*` MCP tools が使える環境では、関数定義、caller、route/component の依存関係などの構造調査を CodeGraph で行い、文字列検索や CSS 値の確認には `rg` を使います。

## 開発コマンド

| Command                   | Action                                              |
| ------------------------- | --------------------------------------------------- |
| `pnpm run dev`            | Astro dev server を起動します。                     |
| `pnpm run clean`          | `dist` と `.astro` を削除します。                   |
| `pnpm run build`          | 静的サイトを `dist` にビルドします。                |
| `pnpm run preview`        | ビルド結果をローカル preview します。               |
| `pnpm run lint`           | `oxlint` を実行します。                             |
| `pnpm run format`         | `oxfmt` で整形します。                              |
| `pnpm run format:check`   | `oxfmt` の check を実行します。                     |
| `pnpm run worker:dev`     | Wrangler dev を起動します。                         |
| `pnpm run deploy:dry-run` | Cloudflare deploy の dry-run を実行します。         |
| `pnpm run deploy`         | Cloudflare Workers Static Assets へ deploy します。 |

## 環境変数

この repo の build-time 設定は `.env.example` を契約として管理します。実際の値は Cloudflare の build variables、ローカルの ignored `.env`、または shell env に置いてください。

| Name                     | 用途                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `SITE_URL`               | canonical URL、sitemap、RSS、OGP の絶対URL生成に使います。 |
| `SITE_TITLE`             | Header、RSS、OGP、各ページの `<title>` に使います。        |
| `SITE_DESCRIPTION`       | meta description、RSS、一覧系ページの説明に使います。      |
| `PUBLIC_GTM_ID`          | Google Tag Manager を有効にする場合に設定します。          |
| `CONTENT_REPO`           | 外部 content repository を同期する場合の `owner/repo`。    |
| `CONTENT_BRANCH`         | 外部 content repository の branch。省略時は `main` です。  |
| `CONTENT_DEPLOY_KEY_B64` | content sync 用の秘密鍵。実値は repo に commit しません。  |

## コンテンツ構成

```text
src/content/
├── about/
├── blog/
└── projects/
```

frontmatter schema は `src/content.config.ts` にあります。`blog` と `projects` は nested `index.md` を許容します。記事やプロジェクトに紐づく画像は、できるだけ該当 entry の近くに置いて Astro content image として参照してください。

外部 content repository から同期する場合は `scripts/sync-content.sh` を使います。

```sh
CONTENT_REPO=owner/repo \
CONTENT_DEPLOY_KEY_B64=... \
pnpm run build:with-content
```

`CONTENT_BRANCH` は省略時 `main` です。`about` は必須、`blog` と `projects` は存在しない場合に空ディレクトリとして扱います。

## OGP 画像

OGP 画像は Astro の静的ビルド時に生成します。Blog は `/og/{postId}.png`、Project は `/og/projects/{projectId}.png` に出力され、各詳細ページの `og:image` / `twitter:image` から参照されます。

対応している OGP 表示タイプは次の2種類です。Blog 記事はカテゴリ、タグ、本文内容に関わらず同じ見た目に統一します。

| Type      | 対象                   | 判定条件                         |
| --------- | ---------------------- | -------------------------------- |
| `Blog`    | 通常のブログ記事       | `blog` collection の各 entry     |
| `Project` | プロジェクト詳細ページ | `projects` collection の各 entry |

表示内容は `src/og/image.ts` で管理しています。Blog は Solarized cyan、Project は Solarized blue をアクセントカラーにしています。Blog 系 OGP の生成は `src/pages/og/[...slug].png.ts`、Project 系 OGP の生成は `src/pages/og/projects/[...slug].png.ts` が担当します。

## デプロイ

`wrangler.jsonc` は assets-only の Workers Static Assets 設定です。

```jsonc
{
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
  },
}
```

この repo では SSR を使わないため、次のものは追加しません。

- `@astrojs/cloudflare`
- Worker script entrypoint
- `main`
- `assets.binding`

deploy 前は通常、次を確認します。

```sh
pnpm run build
pnpm run deploy:dry-run
```

## 検証

通常の source/UI/content 変更では次を目安にします。

```sh
pnpm run build
pnpm run lint
pnpm run format:check
git diff --check
```

docs-only の変更では `pnpm run format:check` と `git diff --check` を最低ラインにします。Mermaid や OGP 画像に触れた場合は `pnpm run build` で静的生成まで確認してください。

## Codex / agent guidance

Codex 向けの repo rule は `AGENTS.md` にあります。repo-local skill は `.agents/skills/blog-template/SKILL.md` です。
