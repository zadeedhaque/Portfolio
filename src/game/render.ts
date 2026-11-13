// Draws a Game on a 2D canvas, plus the short-lived particles and labels.
import type { Game, GameEvent, PowerKind } from "./engine";

export interface Colors { text: string; accent: string; onAccent: string }
export interface DrawOptions { round: boolean; reduce: boolean; font: string }

const GLYPH: Record<PowerKind, string> = { wide: "↔", multi: "×3", fire: "✹" };
const NAME: Record<PowerKind, string> = { wide: "Wide", multi: "Multi-ball", fire: "Fireball" };
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

interface Bit { x: number; y: number; vx: number; vy: number; life: number; hot: boolean }
interface Note { x: number; y: number; text: string; life: number }

export class Effects {
  private bits: Bit[] = [];
  private notes: Note[] = [];

  /** Turns engine events into particles and floating labels. */
  take(events: GameEvent[], reduce: boolean): void {
    for (const e of events) {
      if (e.type === "break") { if (!reduce) this.burst(e.x, e.y, e.hot, 7); }
      else {
        this.notes.push({ x: e.x, y: e.y - 18, text: NAME[e.kind], life: 1 });
        if (!reduce) this.burst(e.x, e.y, true, 14);
      }
    }
    if (this.bits.length > 400) this.bits.splice(0, this.bits.length - 400);
  }

  clear(): void { this.bits = []; this.notes = []; }

  private burst(x: number, y: number, hot: boolean, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = 1 + Math.random() * 3.2;
      this.bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hot });
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: Game, c: Colors, o: DrawOptions, dtMs: number): void {
    const f = dtMs / 16.67; // particle speeds are tuned per 60 Hz frame, so scale by the real frame time
    for (const p of this.bits) {
      p.x += p.vx * f; p.y += p.vy * f; p.vy += 0.12 * f; p.life -= 0.03 * f;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.hot ? c.accent : c.text;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    this.bits = this.bits.filter((p) => p.life > 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 15px ${o.font}`;
    for (const n of this.notes) {
      n.y -= 0.6 * f; n.life -= 0.016 * f;
      ctx.globalAlpha = Math.max(n.life, 0);
      ctx.fillStyle = c.text;
      ctx.fillText(n.text, clamp(n.x, 50, g.w - 50), n.y);
    }
    this.notes = this.notes.filter((n) => n.life > 0);
    ctx.globalAlpha = 1;
  }
}

export function drawGame(ctx: CanvasRenderingContext2D, g: Game, c: Colors, o: DrawOptions): void {
  ctx.clearRect(0, 0, g.w, g.h);
  const gap = g.cell > 9 ? 2 : 1;
  const fire = g.fireMs > 0;

  // Bricks: squares in Developer mode, circles in Creator mode. Each pops in on its own delay.
  for (const k of g.bricks) {
    if (!k.alive) continue;
    const t = o.reduce ? 1 : clamp((g.ageMs - k.delay) / 260, 0, 1);
    if (t <= 0) continue;
    const s = (g.cell - gap) * t * (2 - t);
    const cx = k.x + g.cell / 2, cy = k.y + g.cell / 2;
    ctx.fillStyle = k.hot ? c.accent : c.text;
    ctx.beginPath();
    if (o.round) ctx.arc(cx, cy, s / 2, 0, TAU);
    else ctx.rect(cx - s / 2, cy - s / 2, s, s);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 15px ${o.font}`;
  for (const d of g.drops) {
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.arc(d.x, d.y, 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = c.onAccent;
    ctx.fillText(GLYPH[d.kind], d.x, d.y + 1);
  }

  const p = g.paddle;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(p.x - p.w / 2, p.y, p.w, 10, 5);
  else ctx.rect(p.x - p.w / 2, p.y, p.w, 10);
  ctx.fill();

  for (const b of g.balls) {
    ctx.fillStyle = fire ? c.accent : c.text;
    ctx.beginPath(); ctx.arc(b.x, b.y, g.radius, 0, TAU); ctx.fill();
    if (fire) {
      ctx.strokeStyle = c.text; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, g.radius + 4, 0, TAU); ctx.stroke();
    }
  }
}
