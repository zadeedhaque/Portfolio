// Name-breakout rules with no DOM access, so they can be unit-tested.
// Distances are CSS pixels, times are milliseconds, speeds are pixels per millisecond.
//
// The simulation always advances in fixed 4 ms ticks (leftover time is carried over),
// so it behaves the same at 60 Hz and 240 Hz, and a ball can never move more than
// about 2 px per tick: far less than half a brick, so it cannot tunnel.
import { FONT } from "./font";

export const LEVELS: string[][] = [["ZADEED", "HAQUE"], ["ADIBA"]];
export type PowerKind = "wide" | "multi" | "fire";

export interface Brick { x: number; y: number; alive: boolean; hot: boolean; /** ms after the level starts when the brick pops in */ delay: number }
export interface Ball { x: number; y: number; vx: number; vy: number; stuck: boolean; /** ms left before a stuck ball launches */ wait: number }
export type GameEvent = { type: "break"; x: number; y: number; hot: boolean } | { type: "grant"; kind: PowerKind; x: number; y: number };
export interface Game {
  w: number; h: number; cell: number; level: 0 | 1; bricks: Brick[]; balls: Ball[];
  drops: { x: number; y: number; kind: PowerKind }[];
  paddle: { x: number; w: number; base: number; y: number; /** where the paddle is heading */ tx: number };
  wideMs: number; fireMs: number; phase: "play" | "bonus-prompt" | "between"; phaseMs: number; broken: number; total: number;
  radius: number; speed: number; ageMs: number; acc: number;
  /** Things that just happened, for the renderer's particles. The mount drains this. */
  events: GameEvent[];
}
export interface Input { targetX: number | null; left: boolean; right: boolean; /** ease the paddle gently (auto-play) */ soft?: boolean }

const TICK = 4;
const FRAME = 16.67;
const WIDE_MS = 10_000, FIRE_MS = 6_000, PROMPT_MS = 3_200, BETWEEN_MS = 1_400;
const SERVE_FIRST_MS = 900, SERVE_AGAIN_MS = 700;
const DROP_CHANCE = 0.1, MAX_DROPS = 3, DROP_R = 13, PADDLE_THICK = 12;
const KEY_SPEED = 11 / FRAME;
const KINDS: PowerKind[] = ["wide", "multi", "fire"];
// Per-tick easing factors, derived from per-frame factors so they hold at any tick size.
const ease = (perFrame: number) => 1 - Math.pow(1 - perFrame, TICK / FRAME);
const K_WIDTH = ease(0.15), K_SOFT = ease(0.16), K_HARD = ease(0.42);

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function layout(g: Game, keepAlive?: boolean[]): void {
  const lines = LEVELS[g.level]!;
  const cols = Math.max(...lines.map((word) => word.length * 6 - 1));
  const rows = lines.length * 8 - 1;
  g.cell = clamp(Math.floor(Math.min((g.w - Math.max(28, g.w * 0.14)) / cols, (g.h * 0.52) / rows)), 5, Math.max(5, Math.floor(g.w / 22)));
  const top = Math.max(26, (g.h * 0.6 - rows * g.cell) / 2);
  g.bricks = [];
  lines.forEach((word, li) => {
    const x0 = (g.w - (word.length * 6 - 1) * g.cell) / 2;
    [...word].forEach((ch, ci) =>
      FONT[ch]!.forEach((row, ry) =>
        [...row].forEach((bit, rx) => {
          if (bit !== "1") return;
          const i = g.bricks.length;
          g.bricks.push({
            x: x0 + (ci * 6 + rx) * g.cell,
            y: top + (li * 8 + ry) * g.cell,
            alive: keepAlive ? keepAlive[i] !== false : true,
            hot: g.level === 1 || li === 1,
            delay: (ci * 6 + rx) * 14 + ry * 22 + li * 160,
          });
        }),
      ),
    );
  });
  g.total = g.bricks.length;
  g.broken = g.bricks.filter((b) => !b.alive).length;
  g.paddle.base = Math.max(72, g.w * 0.15);
  g.paddle.y = g.h - 44;
  g.radius = clamp(g.cell * 0.34, 5, 9);
  g.speed = clamp(g.h * 0.0105, 4.2, 7) / FRAME;
}

function serve(g: Game, wait: number): void {
  g.balls = [{ x: g.paddle.x, y: g.paddle.y - g.radius - 1, vx: 0, vy: 0, stuck: true, wait }];
}

function launch(g: Game, b: Ball, angle: number): void {
  b.vx = Math.sin(angle) * g.speed;
  b.vy = -Math.cos(angle) * g.speed;
  b.stuck = false;
}

function startLevel(g: Game, level: 0 | 1): void {
  g.level = level;
  layout(g);
  g.drops = [];
  g.wideMs = g.fireMs = 0;
  g.phase = "play";
  g.phaseMs = 0;
  g.ageMs = 0;
  g.paddle.w = g.paddle.base;
  g.paddle.x = g.paddle.tx = g.w / 2;
  serve(g, SERVE_FIRST_MS);
}

export function createGame(w: number, h: number, level: 0 | 1 = 0): Game {
  const g: Game = {
    w, h, cell: 10, level, bricks: [], balls: [], drops: [],
    paddle: { x: w / 2, w: 100, base: 100, y: h - 44, tx: w / 2 },
    wideMs: 0, fireMs: 0, phase: "play", phaseMs: 0, broken: 0, total: 0,
    radius: 6, speed: 0.3, ageMs: 0, acc: 0, events: [],
  };
  startLevel(g, level);
  return g;
}

/** Fits the game to a new stage size. Bricks are laid out again; broken ones stay broken. */
export function resizeGame(g: Game, w: number, h: number): void {
  if (!(w > 0) || !(h > 0)) return;
  const sx = w / g.w, sy = h / g.h;
  const alive = g.bricks.map((b) => b.alive);
  const wide = g.paddle.w / g.paddle.base;
  g.w = w;
  g.h = h;
  layout(g, alive);
  g.paddle.w = g.paddle.base * wide;
  g.paddle.x = clamp(g.paddle.x * sx, g.paddle.w / 2, w - g.paddle.w / 2);
  g.paddle.tx = g.paddle.x;
  for (const b of g.balls) {
    b.x = clamp(b.x * sx, g.radius, w - g.radius);
    b.y = b.stuck ? g.paddle.y - g.radius - 1 : Math.min(b.y * sy, g.paddle.y - g.radius);
    const v = Math.hypot(b.vx, b.vy);
    if (v > 0) { b.vx = (b.vx / v) * g.speed; b.vy = (b.vy / v) * g.speed; }
  }
  for (const d of g.drops) { d.x *= sx; d.y *= sy; }
}

export function grant(g: Game, kind: PowerKind): void {
  if (kind === "wide") g.wideMs = WIDE_MS;
  if (kind === "fire") g.fireMs = FIRE_MS;
  if (kind === "multi") {
    const src = g.balls.find((b) => !b.stuck) ?? g.balls[0] ?? { x: g.paddle.x, y: g.paddle.y - g.radius - 1 };
    for (const angle of [-0.7, 0.7]) {
      const b: Ball = { x: src.x, y: src.y, vx: 0, vy: 0, stuck: false, wait: 0 };
      launch(g, b, angle);
      g.balls.push(b);
    }
  }
  emit(g, { type: "grant", kind, x: g.paddle.x, y: g.paddle.y });
}

/** Skips the rest of the bonus pop-up's countdown. */
export function startBonus(g: Game): void {
  if (g.phase === "bonus-prompt") startLevel(g, 1);
}

function emit(g: Game, e: GameEvent): void {
  if (g.events.length < 200) g.events.push(e); // bounded when nothing drains it
}

function tick(g: Game, input: Input, rng: () => number): void {
  const p = g.paddle;
  g.ageMs += TICK;
  if (input.left) p.tx -= KEY_SPEED * TICK;
  if (input.right) p.tx += KEY_SPEED * TICK;
  g.wideMs = Math.max(0, g.wideMs - TICK);
  g.fireMs = Math.max(0, g.fireMs - TICK);
  p.w += ((g.wideMs > 0 ? p.base * 1.6 : p.base) - p.w) * K_WIDTH;
  p.tx = clamp(p.tx, p.w / 2, g.w - p.w / 2);
  p.x += (p.tx - p.x) * (input.soft ? K_SOFT : K_HARD);

  if (g.phase !== "play") {
    g.phaseMs -= TICK;
    if (g.phaseMs <= 0) startLevel(g, g.phase === "bonus-prompt" ? 1 : 0);
    return;
  }

  const r = g.radius, fire = g.fireMs > 0;
  for (const b of g.balls) {
    if (b.stuck) {
      b.x = p.x;
      b.y = p.y - r - 1;
      b.wait -= TICK;
      if (b.wait <= 0) launch(g, b, (rng() - 0.5) * 1.1);
      continue;
    }
    b.x += b.vx * TICK;
    b.y += b.vy * TICK;
    if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); }
    if (b.x > g.w - r) { b.x = g.w - r; b.vx = -Math.abs(b.vx); }
    if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy); }
    if (b.vy > 0 && b.y + r >= p.y && b.y - r <= p.y + PADDLE_THICK && Math.abs(b.x - p.x) <= p.w / 2 + r) {
      // Where the ball lands on the paddle sets the angle it leaves at.
      launch(g, b, clamp((b.x - p.x) / (p.w / 2), -1, 1) * 1.05);
      b.y = p.y - r;
    }
    for (const k of g.bricks) {
      if (!k.alive) continue;
      const nx = clamp(b.x, k.x, k.x + g.cell), ny = clamp(b.y, k.y, k.y + g.cell);
      const dx = b.x - nx, dy = b.y - ny;
      if (dx * dx + dy * dy > r * r) continue;
      k.alive = false;
      g.broken++;
      if (!fire) {
        if (Math.abs(dx) > Math.abs(dy)) b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
        else b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
      }
      const cx = k.x + g.cell / 2, cy = k.y + g.cell / 2;
      emit(g, { type: "break", x: cx, y: cy, hot: k.hot });
      if (g.drops.length < MAX_DROPS && rng() < DROP_CHANCE) g.drops.push({ x: cx, y: cy, kind: KINDS[Math.floor(rng() * 3) % 3]! });
      if (!fire) break; // a fireball keeps going through bricks
    }
  }
  g.balls = g.balls.filter((b) => b.y - r <= g.h);

  for (const d of g.drops) {
    d.y += g.speed * 0.5 * TICK;
    if (d.y + DROP_R >= p.y && d.y - DROP_R <= p.y + PADDLE_THICK && Math.abs(d.x - p.x) <= p.w / 2 + DROP_R) {
      d.y = g.h + 99;
      grant(g, d.kind);
    }
  }
  g.drops = g.drops.filter((d) => d.y < g.h + 20);

  if (!g.bricks.some((k) => k.alive)) {
    g.phase = g.level === 0 ? "bonus-prompt" : "between";
    g.phaseMs = g.level === 0 ? PROMPT_MS : BETWEEN_MS;
    g.balls = [];
    g.drops = [];
    return;
  }
  if (!g.balls.length) serve(g, SERVE_AGAIN_MS);
}

/** Advances the game by dtMs. Safe for any dt: long gaps are simulated tick by tick. */
export function stepGame(g: Game, dtMs: number, input: Input, rng: () => number = Math.random): void {
  if (!(dtMs > 0) || !Number.isFinite(dtMs)) return;
  if (input.targetX !== null && Number.isFinite(input.targetX)) g.paddle.tx = input.targetX;
  g.acc += dtMs;
  const ticks = Math.floor(g.acc / TICK);
  g.acc -= ticks * TICK;
  for (let i = 0; i < ticks; i++) tick(g, input, rng);
}
