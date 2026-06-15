// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "http://localhost:4321";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [mdx(), sitemap()],
  markdown: {
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
