// Home cards: the poster shows by default, and the demo video plays silently on top of it.
// Mouse: while the card is hovered. Touch: while the card is mostly on screen, one at a time.
// The video file is only fetched the first time it is needed. Nothing autoplays under
// reduced motion or when the browser asks to save data.

type Conn = { saveData?: boolean };

export function initCardVideo(): void {
  const slots = [...document.querySelectorAll<HTMLElement>(".slot.media")].filter((s) => s.querySelector("video"));
  if (!slots.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if ((navigator as Navigator & { connection?: Conn }).connection?.saveData) return;

  const play = (slot: HTMLElement) => {
    const video = slot.querySelector("video")!;
    if (!video.src) video.src = video.dataset.src!;
    video.play().then(() => slot.classList.add("playing")).catch(() => {});
  };
  const stop = (slot: HTMLElement) => {
    const video = slot.querySelector("video")!;
    slot.classList.remove("playing");
    video.pause();
  };

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    for (const slot of slots) {
      const card = slot.closest(".card") ?? slot;
      card.addEventListener("pointerenter", () => play(slot));
      card.addEventListener("pointerleave", () => stop(slot));
    }
    return;
  }

  // Touch screens: play whichever card is most in view.
  const ratios = new Map<HTMLElement, number>();
  let current: HTMLElement | null = null;
  const watch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratios.set(e.target as HTMLElement, e.isIntersecting ? e.intersectionRatio : 0);
      let best: HTMLElement | null = null;
      let bestRatio = 0.6;
      for (const [slot, ratio] of ratios) if (ratio >= bestRatio && slot.offsetParent) { best = slot; bestRatio = ratio; }
      if (best === current) return;
      if (current) stop(current);
      current = best;
      if (current) play(current);
    },
    { threshold: [0, 0.6, 0.8, 1] },
  );
  for (const slot of slots) watch.observe(slot);
}
