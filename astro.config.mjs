// @ts-check

import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { remarkMermaid } from "./src/utils/remark-mermaid.mjs";

const site = process.env.SITE_URL ?? "http://localhost:4321";

// https://astro.build/config
export default defineConfig({
  site,
  build: {
    inlineStylesheets: "always",
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMermaid],
    }),
    syntaxHighlight: "shiki",
    shikiConfig: {
      themes: {
        light: "solarized-light",
        dark: "github-dark",
      },
      wrap: true,
      transformers: [
        transformerNotationFocus(),
        transformerNotationDiff(),
        transformerNotationHighlight(),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
