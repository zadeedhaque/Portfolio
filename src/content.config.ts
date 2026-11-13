import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per project (id = project slug), plus cloud-computing.
const caseStudies = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/case-studies" }),
  schema: z.object({ title: z.string() }),
});

export const collections = { "case-studies": caseStudies };
