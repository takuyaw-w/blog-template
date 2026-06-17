import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string().default("Uncategorized"),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.optional(image()),
    }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string().default("Uncategorized"),
      status: z.enum(["Active", "Archived", "Planning"]),
      period: z.string(),
      tags: z.array(z.string()).default([]),
      url: z.string().optional(),
      repository: z.string().optional(),
      heroImage: z.optional(image()),
      heroImageAlt: z.string().optional(),
      gallery: z
        .array(
          z.object({
            image: image(),
            alt: z.string(),
            caption: z.string().optional(),
          }),
        )
        .default([]),
      order: z.number().default(0),
    }),
});

const about = defineCollection({
  loader: glob({ base: "./src/content/about", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      name: z.string(),
      role: z.string(),
      age: z.string().optional(),
      location: z.string().optional(),
      company: z.string().optional(),
      experience: z.string().optional(),
      heroImage: z.optional(image()),
      highlights: z.array(z.string()).default([]),
      skillGroups: z
        .array(
          z.object({
            category: z.string(),
            items: z.array(
              z.object({
                name: z.string(),
                years: z.string(),
              }),
            ),
          }),
        )
        .default([]),
      career: z
        .array(
          z.object({
            period: z.string(),
            company: z.string(),
            title: z.string(),
            description: z.string(),
          }),
        )
        .default([]),
      uses: z
        .array(
          z.object({
            category: z.string(),
            items: z.array(
              z.object({
                name: z.string(),
                description: z.string(),
                url: z.string().url().optional(),
              }),
            ),
          }),
        )
        .default([]),
      socials: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url(),
            icon: z.enum(["github", "x"]),
          }),
        )
        .default([]),
    }),
});

export const collections = { blog, projects, about };
