import { expect, test } from "vitest";
import { resolvePalette, type Mode, type Section, type Theme } from "../../src/lib/palette";

test.each([
  ["hero", "dev", "auto", "blue"], ["work", "dev", "auto", "forest"], ["about", "dev", "auto", "plum"],
  ["off", "dev", "auto", "olive"], ["studio", "dev", "auto", "blue"], ["contact", "dev", "auto", "forest"],
  ["hero", "creator", "auto", "white"], ["work", "creator", "auto", "red"], ["about", "creator", "auto", "black"],
  ["off", "creator", "auto", "sage"], ["studio", "creator", "auto", "teal"], ["contact", "creator", "auto", "white"],
  ["work", "dev", "light", "paper"], ["off", "creator", "light", "white"],
  ["about", "dev", "dark", "forest"], ["work", "creator", "dark", "black"],
])("resolvePalette(%s,%s,%s) = %s", (s, m, t, want) => expect(resolvePalette(s as Section, m as Mode, t as Theme)).toBe(want));
