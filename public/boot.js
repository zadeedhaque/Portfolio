// Runs before first paint: restore the saved mode and theme so the page
// does not flash the defaults. Storage can be blocked, so nothing here may throw.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  try {
    var mode = localStorage.getItem("mode");
    var theme = localStorage.getItem("theme");
    if (mode === "dev" || mode === "creator") root.setAttribute("data-mode", mode);
    if (theme === "auto" || theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  } catch (e) {
    /* storage unavailable: keep the defaults */
  }
})();
