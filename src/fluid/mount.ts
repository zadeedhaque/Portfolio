// Runs the fluid background: gas in Developer mode, water in Creator mode.
// The canvas is removed (plain background shows) under reduced motion or without WebGL2.
import { createGas } from "./gas";
import { createRenderer, type Rgb, type Tint } from "./renderer";
import { createWave, gridSize } from "./wave";

const STEP_MS = 16.67; // fixed simulation tick
const SLOWDOWN = 0.55; // both fluids run a little slower than real time
const MAX_BACKLOG_MS = 50; // never try to catch up more than this after a stall
const DOT_CELL_PX = 10;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function rgb(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function mountFluid(canvas: HTMLCanvasElement): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }
  const renderer = createRenderer(canvas);
  if (!renderer) {
    canvas.remove();
    return;
  }

  type Sim = { kind: "gas"; f: ReturnType<typeof createGas> } | { kind: "water"; f: ReturnType<typeof createWave> };
  const wantGas = () => document.documentElement.dataset.mode !== "creator";
  let sim: Sim;

  function size(): void {
    const gas = wantGas();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(innerHeight * dpr));
    const { w, h } = gridSize(innerWidth, innerHeight, gas ? 128 : 256);
    sim = gas ? { kind: "gas", f: createGas(w, h) } : { kind: "water", f: createWave(w, h) };
    renderer!.configure(w, h, gas, DOT_CELL_PX * dpr);
  }
  size();
  addEventListener("resize", size);
  addEventListener("modechange", size);

  // Colours ease toward the current palette.
  const goal: Tint = { bg: [0, 0, 0], ac: [1, 1, 1], hi: [1, 1, 1] };
  const tint: Tint = { bg: [0, 0, 0], ac: [1, 1, 1], hi: [1, 1, 1] };
  let tinted = false;
  function readColors(): void {
    const s = getComputedStyle(document.body);
    goal.bg = rgb(s.getPropertyValue("--bg")) ?? goal.bg;
    goal.ac = rgb(s.getPropertyValue("--accent")) ?? goal.ac;
    goal.hi = rgb(s.getPropertyValue("--text")) ?? goal.hi;
  }
  readColors();
  addEventListener("palettechange", readColors);

  // Pointer: moving pushes the fluid (harder when faster, capped); pressing drops a ripple or a puff.
  let lx = -1, ly = -1;
  const toGrid = (cx: number, cy: number) => [(cx / innerWidth) * sim.f.w, (cy / innerHeight) * sim.f.h] as const;
  addEventListener(
    "pointermove",
    (e) => {
      if (lx < 0) { lx = e.clientX; ly = e.clientY; }
      const dx = e.clientX - lx, dy = e.clientY - ly;
      const dist = Math.hypot(dx, dy);
      const n = Math.min(12, Math.ceil(dist / 14));
      const push = Math.min(1, dist / 40);
      for (let k = 1; k <= n; k++) {
        const [gx, gy] = toGrid(lx + (dx * k) / n, ly + (dy * k) / n);
        if (sim.kind === "gas") {
          const fx = clamp((dx / innerWidth) * sim.f.w * 0.35, -2.5, 2.5), fy = clamp((dy / innerHeight) * sim.f.h * 0.35, -2.5, 2.5);
          sim.f.puff(gx, gy, 4, fx / n, fy / n, 0.28 * push, 0);
        } else sim.f.drop(gx, gy, 3.2, 0.5 * push, 0.16 * push);
      }
      lx = e.clientX;
      ly = e.clientY;
    },
    { passive: true },
  );
  addEventListener(
    "pointerdown",
    (e) => {
      const [gx, gy] = toGrid(e.clientX, e.clientY);
      if (sim.kind === "gas") sim.f.puff(gx, gy, 8, 0, 0, 1.3, 2.2);
      else sim.f.drop(gx, gy, 6.5, 3.2, 0.9);
      lx = e.clientX;
      ly = e.clientY;
    },
    { passive: true },
  );

  let last = 0, acc = 0;
  function frame(now: number): void {
    const dt = last ? now - last : 0;
    last = now;
    const k = tinted ? 1 - Math.pow(1 - 0.07, Math.min(dt, 100) / 16.67) : 1;
    tinted = true;
    for (const key of ["bg", "ac", "hi"] as const) for (let i = 0; i < 3; i++) tint[key][i] = tint[key][i]! + (goal[key][i]! - tint[key][i]!) * k;
    acc = Math.min(acc + dt * SLOWDOWN, MAX_BACKLOG_MS);
    while (acc >= STEP_MS) {
      sim.f.step();
      acc -= STEP_MS;
    }
    renderer!.draw(sim.f, tint);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
