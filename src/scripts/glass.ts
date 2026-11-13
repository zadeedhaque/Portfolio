// The spinning glass logo in the Zeedio card. Tap (or Enter / Space) for the next
// colourway, drag or use the arrow keys to spin. All motion is time-based.

// Logo colourways: position on the logo sheet, plus the edge glow that suits each.
const LOOKS: [lx: number, ly: number, glow: string][] = [
  [190, 110, "#f73650"], // white tile
  [789, 590, "#6aa9d8"], // navy
  [789, 110, "#ffffff"], // red
  [190, 590, "#d98d57"], // black
  [1384, 590, "#f73650"], // teal
  [1384, 110, "#e8a36f"], // sage
];
const IDLE = 42; // degrees per second
const BURST = 360; // spin speed right after a tap
const TAP_TRAVEL = 8; // px; less movement than this between down and up is a tap

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export function initGlass(): void {
  const scene = document.getElementById("scene");
  const glass = document.getElementById("glass");
  if (!scene || !glass) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let look = 0;
  // Angles in degrees; vx / vy in degrees per second.
  const spin = { x: -10, y: 28, vx: 0, vy: reduce ? 0 : IDLE, drag: false, lx: 0, ly: 0, moved: 0 };

  function setLook(i: number, bump: boolean): void {
    look = (i + LOOKS.length) % LOOKS.length;
    const [lx, ly, glow] = LOOKS[look]!;
    glass!.style.setProperty("--lx", String(lx));
    glass!.style.setProperty("--ly", String(ly));
    glass!.style.setProperty("--glow", glow);
    if (bump && !reduce) {
      glass!.classList.remove("bump");
      void glass!.offsetWidth;
      glass!.classList.add("bump");
      spin.vy = BURST;
    }
  }
  setLook(0, false);

  scene.addEventListener("pointerdown", (e) => {
    spin.drag = true;
    spin.moved = 0;
    spin.lx = e.clientX;
    spin.ly = e.clientY;
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener("pointermove", (e) => {
    if (!spin.drag) return;
    const dx = e.clientX - spin.lx;
    const dy = e.clientY - spin.ly;
    spin.moved += Math.abs(dx) + Math.abs(dy);
    spin.y += dx * 0.5;
    spin.x = clamp(spin.x - dy * 0.5, -50, 50);
    spin.vy = clamp(dx * 30, -720, 720); // carry the drag speed into the release
    spin.lx = e.clientX;
    spin.ly = e.clientY;
  });
  scene.addEventListener("pointerup", () => {
    if (spin.drag && spin.moved < TAP_TRAVEL) setLook(look + 1, true);
    spin.drag = false;
  });
  scene.addEventListener("pointercancel", () => {
    spin.drag = false;
  });
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      setLook(look + 1, true);
      e.preventDefault();
      return;
    }
    const d = ({ ArrowLeft: [0, -15], ArrowRight: [0, 15], ArrowUp: [10, 0], ArrowDown: [-10, 0] } as Record<string, [number, number]>)[e.key];
    if (d) {
      spin.x = clamp(spin.x + d[0], -50, 50);
      spin.y += d[1];
      e.preventDefault();
    }
  });

  let last = 0;
  function frame(now: number): void {
    const dt = last ? Math.min(now - last, 1000) : 0;
    last = now;
    if (!spin.drag) {
      const f = dt / 16.67;
      spin.y += (spin.vy * dt) / 1000;
      spin.x += (-10 - spin.x) * (1 - Math.pow(0.98, f)); // settle back to a slight downward tilt
      const rest = reduce ? 0 : IDLE;
      spin.vy += (rest - spin.vy) * (1 - Math.pow(0.96, f)); // a tap's burst decays to the idle spin
    }
    glass!.style.transform = `rotateX(${spin.x.toFixed(1)}deg) rotateY(${spin.y.toFixed(1)}deg)`;
    scene!.dataset.yaw = spin.y.toFixed(1);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
