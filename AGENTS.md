# AGENTS.md

## Project Contract

This repository is a static Astro personal blog template for `/var/log/takuya.log`.
Keep changes small, text-first, and consistent with the existing quiet blog UI.

- Runtime/tooling: Node.js `>=22.12.0`, `pnpm`, Astro, Tailwind CSS, `oxfmt`, `oxlint`, Wrangler.
- In the primary maintainer environment, shell commands are run through `rtk`.
- If `rtk` is unavailable, use the equivalent raw command and mention that fallback.
- Prefer `pnpm` scripts over direct package binaries unless a targeted binary command is clearly narrower.
- Repo-local skill guidance lives at `.agents/skills/blog-template/SKILL.md`.
- Do not introduce SSR, an Astro Cloudflare adapter, a Worker script entrypoint, `main`, or `assets.binding`.
- Deployment is Cloudflare Workers Static Assets only. `wrangler.jsonc` should keep `assets.directory = "./dist"` and `not_found_handling = "404-page"`.
- Keep `.codegraph/`, `dist/`, `.astro/`, `.content/`, and secrets out of git.

## Repo Map

- `src/content.config.ts` defines the `blog`, `projects`, and `about` collections.
- `src/utils/blog.ts` owns blog filtering, date formatting, pagination, taxonomy helpers, reading time, and related posts.
- `src/utils/projects.ts` owns project ordering, project paths, and project taxonomy helpers.
- Components follow Atomic Design under `src/components/atoms`, `src/components/molecules`, `src/components/organisms`, and `src/components/templates`.
- Shared listing/taxonomy behavior belongs in `src/components/templates/BlogListingPage.astro`, `src/components/templates/BlogTaxonomyPage.astro`, and `src/components/templates/ProjectTaxonomyPage.astro`.
- `src/components/templates/BaseHead.astro` owns metadata, canonical URLs, RSS, OGP, Twitter cards, global CSS import, and theme bootstrap.
- `src/pages/og/[...slug].png.ts` statically prerenders OGP PNGs; `src/og/image.ts` owns OGP rendering.
- `src/utils/remark-mermaid.mjs` renders Mermaid diagrams at build time.
- `scripts/sync-content.sh` syncs external content through `CONTENT_REPO`, `CONTENT_DEPLOY_KEY_B64`, and optional `CONTENT_BRANCH`.

## Validation

Use the smallest validation set that covers the edited surface.

- General source change:
  - `rtk pnpm run build`
  - `rtk pnpm run lint`
  - `rtk pnpm run format:check`
  - `rtk git diff --check`
- Deployment config change:
  - `rtk pnpm run build`
  - `rtk pnpm run deploy:dry-run`
  - `rtk git diff --check`
- Content rendering or Mermaid change:
  - `rtk pnpm run build`
  - Verify `sample-project` when Mermaid output is affected.
- Content sync script change:
  - Do not run the full sync unless the required secrets are present and the user expects it.
  - Validate shell syntax and review the script path contract.

The repository has a pre-commit hook configured through `core.hooksPath = .githooks`.
The hook runs `oxfmt` on staged supported files and refuses to format files that also have unstaged changes.

## Subagent Workflow

Use subagents for non-trivial work that crosses deployment, Astro routing/content, UI behavior, content/SEO, or release risk. Keep ownership clear: PM defines scope, specialists review risks, implementation makes the patch, and QA reviews the final diff.

### Default Team

- PM:
  - Define scope, non-goals, acceptance criteria, and validation commands before implementation.
  - Preserve the repo contract: static Astro, Workers Static Assets, no SSR adapter, no Worker script entrypoint, no `main`, and no `assets.binding`.
  - Summarize final diff, verification, and remaining risks.
- Cloudflare Specialist:
  - Review Wrangler, Workers Static Assets, deploy hooks, Cloudflare build logs, and dashboard-facing settings.
  - Prefer assets-only fixes unless the user explicitly asks for Worker runtime code.
  - Use deployment validation when config changes: `rtk pnpm run build`, `rtk pnpm run deploy:dry-run`, and `rtk git diff --check`.
- Astro Specialist:
  - Review Astro config, static routes, content collections, metadata, RSS, sitemap, OGP, Markdown, and Mermaid rendering.
  - Keep route files thin and shared behavior in existing utilities/components.
  - Preserve static build behavior and the existing quiet blog UI conventions.
- Implementation Squad:
  - Make the smallest coherent code/config/docs change.
  - Do not revert unrelated user changes.
  - Run the validation set selected by PM.
  - Commit and push only when explicitly authorized.
- QA / Reviewer:
  - Review the final diff for regressions, validation gaps, config drift, and missing tests.
  - Check that the validation commands match the edited surface.
  - Lead with findings when reviewing; say clearly when no issues are found.
- Content / SEO:
  - Review Blog, Projects, About, metadata, canonical URLs, OGP, RSS, sitemap, taxonomy, and Japanese copy.
  - Keep copy plain, repo-grounded, and consistent with Tokyo/Japanese date handling.
  - Prefer content-local assets and schema-compatible frontmatter.

### Optional Specialists

- Security / Supply Chain:
  - Use for dependency additions, lockfile changes, install scripts, deploy hooks, secrets, or GitHub Actions.
  - Prefer explicit allowlists over broad trust settings.
- Design / UI:
  - Use for layout, responsive behavior, typography, and visual polish.
  - Keep the UI restrained, text-first, and aligned with the existing site tone.
- Release / Git:
  - Use for commit scope, branch state, push, tags, deployment order, and post-push checks.
  - PM can cover this role for small changes.

<!-- CODEGRAPH_START -->

## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured.
CodeGraph is a tree-sitter-parsed knowledge graph of symbols, edges, and files.
Use it for structural code questions and refactors before falling back to text search.

### When To Prefer CodeGraph

| Question                                      | Tool                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Where is X defined?" / "Find symbol named X" | `codegraph_search`                                                                   |
| "What calls function Y?"                      | `codegraph_callers`                                                                  |
| "What does Y call?"                           | `codegraph_node` with `includeCode: true`                                            |
| "What would break if I changed Z?"            | `codegraph_impact` if available, otherwise `codegraph_callers` / `codegraph_explore` |
| "Show me Y's signature / source"              | `codegraph_node`                                                                     |
| "Give me focused context for a task/area"     | `codegraph_explore`                                                                  |
| "See several related symbols' source at once" | `codegraph_explore`                                                                  |

### Rules Of Thumb

- Use CodeGraph for structural questions: callers, dependencies, definitions, route/component flow, and refactor scope.
- Use native `rg` for literal text queries, comments, strings, CSS values, docs, and files CodeGraph does not index.
- Do not grep first when looking up a symbol by name.
- Prefer one focused `codegraph_explore` call over many small file reads.
- After edits, allow for CodeGraph index lag before querying the same files again.
- If CodeGraph reports that the project is not initialized, ask before running `codegraph init -i`.
<!-- CODEGRAPH_END -->
