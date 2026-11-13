// Gas: an incompressible fluid (the "stable fluids" method). The velocity field
// (u, v) carries itself and the smoke; a pressure solve keeps the flow from
// compressing; buoyancy makes smoke rise. No DOM access, so it can be unit-tested.
import type { Field } from "./wave";

const VELOCITY_KEEP = 0.992;
const DENSITY_KEEP = 0.996;
const BUOYANCY = 0.03;
const PRESSURE_PASSES = 14;
const MAX_DENSITY = 2.5;

export function createGas(w: number, h: number): Field & { step(): void; puff(gx: number, gy: number, radius: number, fx: number, fy: number, ink: number, burst: number): void } {
  const n = w * h;
  const height = new Float32Array(n); // unused by gas; kept so both fluids share one texture layout
  const dye = new Float32Array(n), dye0 = new Float32Array(n);
  const u = new Float32Array(n), v = new Float32Array(n), u0 = new Float32Array(n), v0 = new Float32Array(n);
  const pr = new Float32Array(n), div = new Float32Array(n);

  /** Bilinear sample of a field at a fractional grid position, clamped to the grid. */
  function sample(f: Float32Array, x: number, y: number): number {
    x = x < 0.5 ? 0.5 : x > w - 1.5 ? w - 1.5 : x;
    y = y < 0.5 ? 0.5 : y > h - 1.5 ? h - 1.5 : y;
    const x0 = x | 0, y0 = y | 0, sx = x - x0, sy = y - y0, i = y0 * w + x0;
    return (f[i]! * (1 - sx) + f[i + 1]! * sx) * (1 - sy) + (f[i + w]! * (1 - sx) + f[i + w + 1]! * sx) * sy;
  }

  return {
    w,
    h,
    height,
    dye,
    step() {
      for (let i = 0; i < n; i++) v[i] = v[i]! - dye[i]! * BUOYANCY; // smoke rises (y grows downward)
      u0.set(u);
      v0.set(v);
      for (let y = 1; y < h - 1; y++)
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
          const bx = x - u0[i]!, by = y - v0[i]!; // velocity carries itself
          u[i] = sample(u0, bx, by) * VELOCITY_KEEP;
          v[i] = sample(v0, bx, by) * VELOCITY_KEEP;
        }
      for (let y = 1; y < h - 1; y++)
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) div[i] = -0.5 * (u[i + 1]! - u[i - 1]! + v[i + w]! - v[i - w]!);
      for (let k = 0; k < PRESSURE_PASSES; k++)
        for (let y = 1; y < h - 1; y++)
          for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) pr[i] = (div[i]! + pr[i - 1]! + pr[i + 1]! + pr[i - w]! + pr[i + w]!) * 0.25;
      for (let y = 1; y < h - 1; y++)
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
          u[i] = u[i]! - 0.5 * (pr[i + 1]! - pr[i - 1]!);
          v[i] = v[i]! - 0.5 * (pr[i + w]! - pr[i - w]!);
        }
      dye0.set(dye);
      for (let y = 1; y < h - 1; y++)
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) dye[i] = sample(dye0, x - u[i]!, y - v[i]!) * DENSITY_KEEP; // smoke rides the flow and thins
    },
    /** Adds smoke around a grid point, pushed by (fx, fy) and blown outward by `burst`. */
    puff(gx, gy, radius, fx, fy, ink, burst) {
      for (let y = Math.max(1, Math.floor(gy - radius)); y <= Math.min(h - 2, Math.ceil(gy + radius)); y++)
        for (let x = Math.max(1, Math.floor(gx - radius)); x <= Math.min(w - 2, Math.ceil(gx + radius)); x++) {
          const d = Math.hypot(x - gx, y - gy);
          if (d > radius) continue;
          const fall = 0.5 + 0.5 * Math.cos((Math.PI * d) / radius);
          const i = y * w + x;
          const out = d > 0.01 ? burst / d : 0;
          u[i] = u[i]! + fx * fall + (x - gx) * out * fall;
          v[i] = v[i]! + fy * fall + (y - gy) * out * fall;
          dye[i] = Math.min(MAX_DENSITY, dye[i]! + ink * fall);
        }
    },
  };
}
