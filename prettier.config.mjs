/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  printWidth: 160,
  singleQuote: true,
  useTabs: true,
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
  astroSkipFrontmatter: true,
};
