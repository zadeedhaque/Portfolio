import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { coursework } from "../../src/data/academics";
import { projects } from "../../src/data/projects";
import { roles } from "../../src/data/roles";

test("ten projects with unique slugs and https links", () => {
  expect(projects).toHaveLength(10);
  expect(new Set(projects.map((p) => p.slug)).size).toBe(10);
  for (const p of projects) for (const url of [p.play, p.code]) if (url) expect(url).toMatch(/^https:\/\//);
});

test("no project ships a video yet", () => {
  for (const p of projects) expect(p.video).toBeUndefined();
});

test("every project has a case study file, plus cloud-computing", () => {
  for (const slug of [...projects.map((p) => p.slug), "cloud-computing"]) expect(existsSync(`src/content/case-studies/${slug}.md`), slug).toBe(true);
});

test("seven roles, four coursework items", () => {
  expect(roles).toHaveLength(7);
  expect(coursework).toHaveLength(4);
});
