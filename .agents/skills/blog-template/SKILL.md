---
name: blog-template
description: Use when changing the Astro static personal blog template in /home/takuya/develop/github.com/takuyaw-w/blog-template, especially work involving blog or project routes, Astro content collections, taxonomy and pagination helpers, static OGP image generation, build-time Mermaid rendering, Cloudflare Workers Static Assets deployment, or repo-specific validation and commit workflow.
---

# Blog Template Skill

Use this skill with `AGENTS.md`; keep `AGENTS.md` as the repo-level contract and use this file for task workflow.

## First Pass

1. Start from the repository root.
2. Use `rtk` for commands when it is available; otherwise use the equivalent raw command and mention the fallback.
3. Check the current worktree with `rtk git status --short`.
4. For structural code work, use CodeGraph first:
   - broad area: `codegraph_explore`
   - callers: `codegraph_callers`
   - one file or symbol: `codegraph_node`
5. Use `rg` only for literal text, CSS selectors, docs, config, and unindexed files.

## Common Change Areas

### Blog Listing Or Taxonomy Routes

- Keep route files thin.
- Put shared blog behavior in `src/utils/blog.ts`.
- Use `BlogListingPage.astro` for root/blog listing pages.
- Use `BlogTaxonomyPage.astro` for blog categories, tags, and years.
- Use `Pagination.astro` with helper-generated base paths.
- Keep draft filtering inside `getBlogPosts()` / `isPublicBlogPost()`.
- Preserve Japanese/Tokyo date formatting through `Intl.DateTimeFormat` with `Asia/Tokyo` and ISO calendar behavior.

### Project Routes

- Put shared project behavior in `src/utils/projects.ts`.
- Use `ProjectList.astro` for repeated project cards.
- Use `ProjectTaxonomyPage.astro` for project categories and tags.
- Preserve `order`-based sorting through `getProjects()` / `sortProjectsByOrder()`.

### Markdown And Content

- Blog, project, and about frontmatter must match `src/content.config.ts`.
- Nested `index.md` files are expected.
- Keep entry-owned assets beside their entry where possible.
- For Mermaid, keep generation in `src/utils/remark-mermaid.mjs` and validate with `sample-project`.

### Metadata And OGP

- Site title and description live in `src/consts.ts`.
- `astro.config.mjs` sets `site` from `SITE_URL`, falling back to `http://localhost:4321`.
- `BaseHead.astro` owns canonical, RSS, OGP, Twitter cards, and global CSS.
- `src/pages/og/[...slug].png.ts` must stay static and use public blog posts only.
- `src/og/image.ts` owns OGP layout, tag rendering, and Japanese font loading.
- Keep OGP tag labels free of a leading `#`.

### UI Polish

- Favor localized changes over broad redesigns.
- Keep the UI readable, restrained, and text-first.
- Preserve the existing Solarized-influenced theme tokens in `src/styles/global.css`.
- Keep navigation labels as `Blog`, `Projects`, and `About`; do not rename Blog to Posts.
- Use existing components before adding new ones.
- Use `BackLink.astro` for history-aware back links.
- Do not reintroduce Astro View Transitions or a global Mermaid client loader.

### Deployment

- This repo deploys as Cloudflare Workers Static Assets.
- Do not add SSR, `@astrojs/cloudflare`, a Worker script, `main`, or `assets.binding`.
- Keep `wrangler.jsonc` assets-only with `directory = "./dist"`.
- `build:with-content` runs clean, content sync, then static build.
- Do not run content sync unless the user expects it and required secrets are available.

## Subagent Routing

Use `AGENTS.md` as the source of truth for subagent responsibilities. Route work by edited surface:

- Use PM for multi-step changes, ambiguous scope, release decisions, or when the user asks for planning.
- Use Cloudflare Specialist for `wrangler.jsonc`, Workers Static Assets, deploy hooks, Cloudflare build logs, dependency install failures in Cloudflare, or dashboard guidance.
- Use Astro Specialist for `astro.config.mjs`, routes, content collections, metadata, OGP, RSS, sitemap, Markdown, or Mermaid.
- Use Implementation Squad for bounded edits with a clear write scope.
- Use QA / Reviewer after non-trivial edits, before commit/push, or when validation coverage is uncertain.
- Use Content / SEO for Japanese copy, taxonomy, page titles/descriptions, canonical URLs, and content schema/frontmatter.
- Use Security / Supply Chain for dependency, lockfile, install-script, secret, or CI/CD changes.
- Use Design / UI for responsive layout, mobile behavior, typography, navigation, and visual tone.
- Use Release / Git when commit, push, deploy sequencing, or branch hygiene is the main risk.

For small single-file changes, one agent may cover multiple roles. Do not create parallel work unless the responsibilities and write scopes are disjoint.

## Validation

Use the validation matrix in `AGENTS.md`. For docs-only skill or README edits, run formatter check and `git diff --check`; for source, content rendering, Mermaid, OGP, or deployment changes, run the broader command set listed there.

Never push unless the user explicitly asks for push.
