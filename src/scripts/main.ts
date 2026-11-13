// Single entry point for every page. Each part looks for its own elements
// and does nothing on pages that do not have them.
import { mountFluid } from "../fluid/mount";
import { mountGame } from "../game/mount";
import { initCursor } from "./cursor";
import { initGlass } from "./glass";
import { initRipple } from "./ripple";
import { initSite } from "./site";
import { initTilt } from "./tilt";

initSite();
initCursor();
initRipple();
initTilt();
initGlass();

const stage = document.getElementById("stage");
if (stage) mountGame(stage);

const water = document.getElementById("water");
if (water instanceof HTMLCanvasElement) mountFluid(water);
