// A card with data-href opens its project page from a single click or tap anywhere on it,
// not just on the title. The card's own links (Open, GitHub) still do their own thing,
// selecting text does not navigate, and Ctrl / Cmd / middle click open a new tab.
// The title link stays the keyboard and no-JavaScript route.

export function initCardLink(): void {
  for (const card of document.querySelectorAll<HTMLElement>(".card[data-href]")) {
    const href = card.dataset.href!;
    const open = (e: MouseEvent, newTab: boolean) => {
      const target = e.target as Element;
      if (target.closest("a, button") && !target.closest(".slot")) return;   // a real link or button handles itself
      if (getSelection()?.toString()) return;                               // the visitor was selecting text
      e.preventDefault();
      if (newTab) window.open(href, "_blank", "noopener");
      else location.assign(href);
    };
    card.addEventListener("click", (e) => open(e, e.ctrlKey || e.metaKey || e.shiftKey));
    card.addEventListener("auxclick", (e) => { if (e.button === 1) open(e, true); });
  }
}
