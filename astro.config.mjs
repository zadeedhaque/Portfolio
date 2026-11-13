import { defineConfig } from "astro/config";

// Scripts and stylesheets are always emitted as external files so the site
// can run under a strict Content-Security-Policy (see vercel.json).
export default defineConfig({
  site: "https://zadeedhaque.com",
  build: { inlineStylesheets: "never" },
  markdown: { syntaxHighlight: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
