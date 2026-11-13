import { expect, test } from "vitest";
import { createGas } from "../../src/fluid/gas";
import { createWave, gridSize, type Field } from "../../src/fluid/wave";

function centreOfMassY(f: Field): number {
  let sum = 0, weighted = 0;
  for (let i = 0; i < f.dye.length; i++) {
    sum += f.dye[i]!;
    weighted += f.dye[i]! * Math.floor(i / f.w);
  }
  return weighted / sum;
}

test("a drop disturbs the water and it settles", () => {
  const f = createWave(64, 48);
  f.drop(32, 24, 5, 3, 0.9);
  expect(Math.max(...f.height)).toBeGreaterThan(0.5);
  for (let i = 0; i < 2000; i++) f.step();
  expect(Math.max(...f.height.map(Math.abs))).toBeLessThan(0.01);
  expect(Math.max(...f.dye)).toBeLessThan(0.01);
});

test("gas stays finite and thins out", () => {
  const g = createGas(64, 48);
  g.puff(32, 30, 6, 2, 0, 1.3, 2.2);
  const start = g.dye.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 600; i++) g.step();
  expect(g.dye.every(Number.isFinite)).toBe(true);
  expect(g.dye.reduce((a, b) => a + b, 0)).toBeLessThan(start * 0.5);
});

test("smoke rises", () => {
  const g = createGas(64, 48);
  g.puff(32, 40, 4, 0, 0, 1.5, 0);
  for (let i = 0; i < 120; i++) g.step();
  expect(centreOfMassY(g)).toBeLessThan(40);
});

test("grid keeps the long side and a floor on the short side", () => {
  expect(gridSize(1920, 1080, 256)).toEqual({ w: 256, h: 144 });
  expect(gridSize(375, 812, 256)).toEqual({ w: 118, h: 256 });
  expect(gridSize(4000, 200, 256).h).toBe(48);
});
