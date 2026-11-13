// Connects the game engine to the hero stage: canvas, input, auto-play and the bonus pop-up.
import { createGame, resizeGame, startBonus, stepGame, type Game } from "./engine";
import { drawGame, Effects, type Colors } from "./render";

const IDLE_BACK_TO_AUTO_MS = 6000;
const MAX_FRAME_MS = 100; // a tab resumed after minutes must not fast-forward the game

export function mountGame(stage: HTMLElement): void {
  const canvas = stage.querySelector<HTMLCanvasElement>("canvas");
  const ctx = canvas?.getContext("2d");
  const countEl = document.getElementById("count");
  const hint = document.getElementById("hint");
  const pop = document.getElementById("pop");
  if (!canvas || !ctx || !countEl || !hint || !pop) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fx = new Effects();
  const keys = new Set<string>();
  let g: Game | null = null;
  let auto = true; // the game plays itself until someone steers
  let running = !reduce; // under reduced motion, nothing moves until a tap
  let visible = true;
  let target: number | null = null;
  let lastInput = 0;
  let last = 0;
  let shownBroken = -1;
  let shownLevel = -1;

  const colors: Colors = { text: "#fff", accent: "#fff", onAccent: "#000" };
  let font = "sans-serif";
  function readColors(): void {
    const s = getComputedStyle(document.body);
    colors.text = s.getPropertyValue("--text").trim() || colors.text;
    colors.accent = s.getPropertyValue("--accent").trim() || colors.accent;
    colors.onAccent = s.getPropertyValue("--on-accent").trim() || colors.onAccent;
    font = s.fontFamily || font;
  }
  readColors();
  addEventListener("palettechange", readColors);

  function setHint(): void {
    hint!.textContent = !running ? "Tap to start" : auto ? "Move to play" : "";
  }
  function setCount(): void {
    if (!g || (g.broken === shownBroken && g.level === shownLevel)) return;
    shownBroken = g.broken;
    shownLevel = g.level;
    const b = document.createElement("b");
    b.textContent = String(g.broken);
    countEl!.replaceChildren(b, ` / ${g.total}`);
  }

  function resize(): void {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (g && r.width === g.w && r.height === g.h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(r.width * dpr);
    canvas!.height = Math.round(r.height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (g) resizeGame(g, r.width, r.height);
    else g = createGame(r.width, r.height);
    setCount();
    setHint();
  }

  /** Someone is steering: leave auto-play (and start, if we were waiting for a tap). */
  function take(now: number, canStart: boolean): void {
    if (!running && !canStart) return;
    lastInput = now;
    if (auto || !running) {
      auto = false;
      running = true;
      setHint();
    }
  }
  const steer = (e: PointerEvent, canStart: boolean) => {
    target = e.clientX - stage.getBoundingClientRect().left;
    take(performance.now(), canStart);
  };
  // Under reduced motion only a deliberate tap or key press starts the game.
  stage.addEventListener("pointermove", (e) => steer(e, !reduce), { passive: true });
  stage.addEventListener("pointerdown", (e) => steer(e, true), { passive: true });
  stage.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    keys.add(e.key);
    target = null; // keys steer from where the paddle is
    take(performance.now(), true);
    e.preventDefault();
  });
  stage.addEventListener("keyup", (e) => keys.delete(e.key));
  stage.addEventListener("blur", () => keys.clear());
  document.getElementById("pop-go")?.addEventListener("click", () => {
    if (g) startBonus(g);
  });

  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver((es) => {
    visible = es[es.length - 1]?.isIntersecting ?? true;
  }).observe(stage);

  function frame(now: number): void {
    const dt = last ? Math.min(now - last, MAX_FRAME_MS) : 0;
    last = now;
    if (g && visible) {
      if (running && dt > 0) {
        if (keys.size) lastInput = now;
        if (!auto && now - lastInput > IDLE_BACK_TO_AUTO_MS) {
          auto = true;
          setHint();
        }
        let targetX = target;
        if (auto) {
          // Follow the lowest falling ball, with a little sway so it does not look robotic.
          const down = g.balls.filter((b) => b.vy > 0).sort((a, b) => b.y - a.y)[0] ?? g.balls[0];
          // While the ball is waiting on the paddle, drift around the middle instead of chasing it.
          targetX = down ? (down.stuck ? g.w / 2 : down.x) + Math.sin(now / 640) * g.paddle.w * 0.3 : null;
        }
        const level = g.level;
        stepGame(g, dt, { targetX, left: keys.has("ArrowLeft"), right: keys.has("ArrowRight"), soft: auto });
        target = null; // a pointer position is applied once; the engine remembers it
        if (g.level !== level) fx.clear();
        fx.take(g.events, reduce);
      }
      g.events.length = 0;
      setCount();
      const prompt = g.phase === "bonus-prompt";
      if (pop!.hidden === prompt) {
        pop!.hidden = !prompt;
        if (prompt) hint!.textContent = "";
        else setHint();
      }
      const o = { round: document.documentElement.dataset.mode === "creator", reduce, font };
      drawGame(ctx!, g, colors, o);
      fx.draw(ctx!, g, colors, o, dt);
      stage.dataset.paddleX = String(Math.round(g.paddle.x));
    }
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
}
