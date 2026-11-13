import { expect, test } from "vitest";
import { createGame, grant, resizeGame, startBonus, stepGame, type Input } from "../../src/game/engine";

const idle: Input = { targetX: null, left: false, right: false };
/** A random source that never rolls a power-up drop. */
const noDrops = () => 0.5;
/** Small deterministic generator (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("name level has 190 bricks, bonus has 89", () => {
  expect(createGame(1000, 480, 0).total).toBe(190);
  expect(createGame(1000, 480, 1).total).toBe(89);
});

test("clearing the name prompts the bonus, clearing ADIBA returns to the name", () => {
  const g = createGame(1000, 480);
  g.bricks.forEach((b) => (b.alive = false));
  stepGame(g, 16, idle);
  expect(g.phase).toBe("bonus-prompt");
  stepGame(g, 3300, idle);
  expect(g.level).toBe(1);
  expect(g.phase).toBe("play");
  g.bricks.forEach((b) => (b.alive = false));
  stepGame(g, 16, idle);
  expect(g.phase).toBe("between");
  stepGame(g, 1500, idle);
  expect(g.level).toBe(0);
});

test("the Play button skips the bonus countdown", () => {
  const g = createGame(1000, 480);
  startBonus(g); // ignored while playing
  expect(g.level).toBe(0);
  g.bricks.forEach((b) => (b.alive = false));
  stepGame(g, 16, idle);
  startBonus(g);
  expect(g.level).toBe(1);
  expect(g.phase).toBe("play");
});

test("power-ups", () => {
  const g = createGame(1000, 480);
  grant(g, "wide");
  stepGame(g, 2000, idle, noDrops);
  expect(g.paddle.w).toBeCloseTo(g.paddle.base * 1.6, 0);
  stepGame(g, 9000, idle, noDrops);
  stepGame(g, 2000, idle, noDrops);
  expect(g.paddle.w).toBeCloseTo(g.paddle.base, 0);
  const n = g.balls.length;
  grant(g, "multi");
  expect(g.balls.length).toBe(n + 2);
  grant(g, "fire");
  expect(g.fireMs).toBe(6000);
});

test("same outcome at 60 fps and 240 fps", () => {
  const a = createGame(1000, 480), b = createGame(1000, 480);
  for (let i = 0; i < 300; i++) stepGame(a, 1000 / 60, idle, seeded(1));
  for (let i = 0; i < 1200; i++) stepGame(b, 1000 / 240, idle, seeded(1));
  expect(Math.abs(a.balls[0]!.y - b.balls[0]!.y)).toBeLessThan(a.cell);
});

test("a 60-second frame does not tunnel or produce NaN", () => {
  const g = createGame(1000, 480);
  stepGame(g, 60000, idle);
  for (const b of g.balls) {
    expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
    expect(b.y).toBeLessThanOrEqual(g.h + 50);
  }
});

test("bad frame times are ignored", () => {
  const g = createGame(1000, 480);
  for (const dt of [NaN, -5, 0, Infinity]) stepGame(g, dt, idle);
  expect(g.ageMs).toBe(0);
});

test("resize keeps play going", () => {
  const g = createGame(1000, 480);
  g.bricks[0]!.alive = false;
  resizeGame(g, 340, 420);
  expect(g.bricks[0]!.alive).toBe(false);
  expect(g.total).toBe(190);
  expect(g.bricks.every((b) => b.x >= 0 && b.x + g.cell <= 340)).toBe(true);
  stepGame(g, 2000, idle);
  for (const b of g.balls) expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
});

test("a lost ball is served again", () => {
  const g = createGame(1000, 480);
  g.balls[0]!.stuck = false;
  g.balls[0]!.y = g.h + 100;
  g.balls[0]!.vy = 5;
  stepGame(g, 16, idle);
  expect(g.balls).toHaveLength(1);
  expect(g.balls[0]!.stuck).toBe(true);
});

test("arrow keys move the paddle and it stays on the stage", () => {
  const g = createGame(1000, 480);
  stepGame(g, 5000, { targetX: null, left: true, right: false }, noDrops);
  expect(g.paddle.x).toBeCloseTo(g.paddle.w / 2, 0);
  stepGame(g, 100, { targetX: 99999, left: false, right: false }, noDrops);
  stepGame(g, 3000, idle, noDrops);
  expect(g.paddle.x).toBeCloseTo(g.w - g.paddle.w / 2, 0);
});
