// Water: a height field solved with the 2D wave equation, plus a dye field that
// diffuses and fades. No DOM access, so it can be unit-tested.

export interface Field {
  readonly w: number;
  readonly h: number;
  /** Surface height per cell (water). Always zero for gas. */
  readonly height: Float32Array;
  /** Dye (water) or smoke density (gas) per cell. */
  readonly dye: Float32Array;
}

const DAMPING = 0.986;
const DYE_FADE = 0.991;

export function createWave(w: number, h: number): Field & { step(): void; drop(gx: number, gy: number, radius: number, amp: number, ink: number): void } {
  let a = new Float32Array(w * h); // current height
  let b = new Float32Array(w * h); // previous height, reused as the next one
  let dye = new Float32Array(w * h);
  let dye2 = new Float32Array(w * h);
  return {
    w,
    h,
    get height() { return a; },
    get dye() { return dye; },
    step() {
      for (let y = 1; y < h - 1; y++)
        for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
          b[i] = ((a[i - 1]! + a[i + 1]! + a[i - w]! + a[i + w]!) * 0.5 - b[i]!) * DAMPING; // wave equation + damping
          dye2[i] = (dye[i]! * 4 + dye[i - 1]! + dye[i + 1]! + dye[i - w]! + dye[i + w]!) * 0.125 * DYE_FADE; // diffuse + fade
        }
      [a, b] = [b, a];
      [dye, dye2] = [dye2, dye];
    },
    /** Pushes the surface up around a grid point and leaves dye there. */
    drop(gx, gy, radius, amp, ink) {
      for (let y = Math.max(1, Math.floor(gy - radius)); y <= Math.min(h - 2, Math.ceil(gy + radius)); y++)
        for (let x = Math.max(1, Math.floor(gx - radius)); x <= Math.min(w - 2, Math.ceil(gx + radius)); x++) {
          const d = Math.hypot(x - gx, y - gy);
          if (d > radius) continue;
          const fall = 0.5 + 0.5 * Math.cos((Math.PI * d) / radius);
          const i = y * w + x;
          a[i] = a[i]! + amp * fall;
          dye[i] = Math.min(1.1, dye[i]! + ink * fall);
        }
    },
  };
}

/** Simulation grid for a viewport: `longSide` cells on the long side, at least 48 on the short side. */
export function gridSize(viewW: number, viewH: number, longSide: number): { w: number; h: number } {
  return viewW >= viewH
    ? { w: longSide, h: Math.max(48, Math.round((longSide * viewH) / viewW)) }
    : { w: Math.max(48, Math.round((longSide * viewW) / viewH)), h: longSide };
}
