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

test("every video and poster a project names exists under public/", () => {
  for (const p of projects)
    for (const file of [p.video, p.poster]) if (file) expect(existsSync(`public${file}`), file).toBe(true);
  expect(projects.filter((p) => p.video)).toHaveLength(8);
});

test("every project has a case study file, plus cloud-computing", () => {
  for (const slug of [...projects.map((p) => p.slug), "cloud-computing"]) expect(existsSync(`src/content/case-studies/${slug}.md`), slug).toBe(true);
});

test("seven roles, four coursework items", () => {
  expect(roles).toHaveLength(7);
  expect(coursework).toHaveLength(4);
});
