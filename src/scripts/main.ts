// Single entry point for every page. Each part looks for its own elements
// and does nothing on pages that do not have them.
import { mountFluid } from "../fluid/mount";
import { mountGame } from "../game/mount";
import { initCursor } from "./cursor";
import { initGlass } from "./glass";
import { initRipple } from "./ripple";
import { initSite } from "./site";
import { initTilt } from "./tilt";
import { initCardVideo } from "./cardVideo";

// Fade the loading cover as soon as the page has really loaded. If the CSS
// fallback already hid it, leave it alone so it does not flash back.
const loaded = () => {
  const cover = document.querySelector(".loader");
  if (cover && getComputedStyle(cover).visibility !== "hidden") document.documentElement.classList.add("loaded");
};
if (document.readyState === "complete") loaded();
else addEventListener("load", loaded, { once: true });

initSite();
initCursor();
initRipple();
initTilt();
initCardVideo();
initGlass();

const stage = document.getElementById("stage");
if (stage) mountGame(stage);

const water = document.getElementById("water");
if (water instanceof HTMLCanvasElement) mountFluid(water);
