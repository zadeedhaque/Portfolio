// Custom cursor: a dot that tracks the mouse and a ring that eases behind it.
// Any element with data-cursor="<label>" shows that label inside the ring.
// Mouse only, and off under reduced motion.
export function initCursor(): void {
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dot = document.getElementById("cur-dot");
  const ring = document.getElementById("cur-ring");
  if (!fine || reduce || !dot || !ring) return;

  document.documentElement.classList.add("has-cursor");
  const cur = { x: 0, y: 0, rx: 0, ry: 0, on: false };
  const show = (v: boolean) => {
    ring.style.opacity = dot.style.opacity = v ? "1" : "0";
  };

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      cur.x = e.clientX;
      cur.y = e.clientY;
      if (!cur.on) {
        cur.on = true;
        cur.rx = cur.x;
        cur.ry = cur.y;
        show(true);
        requestAnimationFrame(frame);
      }
      const t = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-cursor], a, button") : null;
      const tag = t?.dataset.cursor;
      ring.classList.toggle("tag", Boolean(tag));
      ring.classList.toggle("link", Boolean(t) && !tag);
      ring.textContent = tag ?? "";
    },
    { passive: true },
  );
  addEventListener("pointerdown", () => ring.classList.add("down"), { passive: true });
  addEventListener("pointerup", () => ring.classList.remove("down"), { passive: true });
  document.addEventListener("pointerleave", () => show(false));
  document.addEventListener("pointerenter", () => {
    if (cur.on) show(true);
  });

  let last = 0;
  function frame(now: number): void {
    const dt = last ? Math.min(now - last, 100) : 16.67;
    last = now;
    const k = 1 - Math.pow(1 - 0.18, dt / 16.67); // same easing at any refresh rate
    cur.rx += (cur.x - cur.rx) * k;
    cur.ry += (cur.y - cur.ry) * k;
    dot!.style.transform = `translate(${cur.x}px,${cur.y}px)`;
    ring!.style.transform = `translate(${cur.rx.toFixed(1)}px,${cur.ry.toFixed(1)}px)`;
    requestAnimationFrame(frame);
  }
}
