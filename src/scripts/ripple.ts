// A ring that expands from every tap or click. Off under reduced motion.
export function initRipple(): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  addEventListener(
    "pointerdown",
    (e) => {
      const r = document.createElement("span");
      r.className = "ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      r.addEventListener("animationend", () => r.remove());
      document.body.append(r);
    },
    { passive: true },
  );
}
