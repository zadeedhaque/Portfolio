// Reads dist/ and vercel.json from disk: the built site must work under a strict CSP.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { filesUnder } from "./helpers";

const htmlFiles = () => filesUnder("dist").filter((f) => f.endsWith(".html"));

function headersFor(source: string): Record<string, string> {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
  const rule = config.headers.find((h) => h.source === source);
  return Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]));
}

test("built HTML has no inline script, inline style attribute or third-party origin", () => {
  const files = htmlFiles();
  expect(files.length).toBeGreaterThanOrEqual(14);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    expect(html, file).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[^<]/); // no inline script bodies
    expect(html, file).not.toMatch(/<style[\s>]/);
    expect(html, file).not.toMatch(/\sstyle="/);
    expect(html, file).not.toMatch(/https?:\/\/(fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr)/);
    expect(html, file).not.toMatch(/\son[a-z]+="/); // no inline event handlers
  }
});

test("every external link opens safely", () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, "utf8");
    for (const [tag] of html.matchAll(/<a\s[^>]*href="https?:\/\/[^>]*>/g)) expect(tag, file).toMatch(/rel="noopener noreferrer"/);
  }
});

test("vercel.json sets the security headers", () => {
  const h = headersFor("/(.*)");
  expect(h["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  expect(h["Content-Security-Policy"]).not.toContain("'unsafe-inline'");
  expect(h["X-Content-Type-Options"]).toBe("nosniff");
  expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(h["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains; preload");
});

test("demo-only helpers did not ship", () => {
  for (const file of filesUnder("dist").filter((f) => /\.(html|js)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    expect(text, file).not.toContain("#bonus");
    expect(text, file).not.toContain('id="fonts"');
  }
});
