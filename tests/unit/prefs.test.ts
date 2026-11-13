import { afterEach, expect, test, vi } from "vitest";
import { nextTheme, readPrefs, writePref } from "../../src/lib/prefs";

afterEach(() => vi.unstubAllGlobals());

test("readPrefs falls back when storage throws", () => {
  vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } });
  expect(readPrefs()).toEqual({ mode: "dev", theme: "auto" });
  expect(() => writePref("mode", "creator")).not.toThrow();
});

test("readPrefs falls back when storage does not exist", () => {
  vi.stubGlobal("localStorage", undefined);
  expect(readPrefs()).toEqual({ mode: "dev", theme: "auto" });
  expect(() => writePref("theme", "dark")).not.toThrow();
});

test("readPrefs ignores junk values", () => {
  vi.stubGlobal("localStorage", { getItem: (k: string) => (k === "mode" ? "admin" : "neon") });
  expect(readPrefs()).toEqual({ mode: "dev", theme: "auto" });
});

test("readPrefs returns saved values", () => {
  vi.stubGlobal("localStorage", { getItem: (k: string) => (k === "mode" ? "creator" : "dark") });
  expect(readPrefs()).toEqual({ mode: "creator", theme: "dark" });
});

test("nextTheme cycles auto, light, dark", () => {
  expect(nextTheme("auto")).toBe("light");
  expect(nextTheme("light")).toBe("dark");
  expect(nextTheme("dark")).toBe("auto");
});
