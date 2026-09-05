(function () {
  "use strict";

  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var progressEl = document.getElementById("progress");
  var body = document.body;

  var btnBack = document.getElementById("btn-back");
  var btnSkipText = document.getElementById("btn-skip-text");
  var btnReplay = document.getElementById("btn-replay");
  var btnNext = document.getElementById("btn-next");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var currentIndex = 0;
  var timers = []; // active pausable timers for the current scene

  /* ----------------------------------------------------------
     A setTimeout wrapper that can be paused and resumed without
     losing its remaining delay.
     ---------------------------------------------------------- */
  function pausableTimeout(callback, delay) {
    var start = Date.now();
    var remaining = delay;
    var isPaused = false;
    var id = setTimeout(fire, delay);

    function fire() {
      id = null;
      callback();
    }

    return {
      pause: function () {
        if (isPaused || id === null) return;
        isPaused = true;
        clearTimeout(id);
        remaining -= Date.now() - start;
        if (remaining < 0) remaining = 0;
      },
      resume: function () {
        if (!isPaused) return;
        isPaused = false;
        start = Date.now();
        id = setTimeout(fire, remaining);
      },
      clear: function () {
        if (id !== null) clearTimeout(id);
        id = null;
      }
    };
  }

  function clearTimers() {
    timers.forEach(function (t) { t.clear(); });
    timers = [];
  }

  /* ----------------------------------------------------------
     Progress dots
     ---------------------------------------------------------- */
  function buildProgress() {
    scenes.forEach(function () {
      var dot = document.createElement("span");
      dot.className = "dot";
      progressEl.appendChild(dot);
    });
  }

  function updateProgress() {
    var dots = progressEl.querySelectorAll(".dot");
    dots.forEach(function (d, i) {
      d.classList.toggle("active", i === currentIndex);
    });
  }

  /* ----------------------------------------------------------
     Nav button state
     ---------------------------------------------------------- */
  function updateNavButtons() {
    btnBack.disabled = currentIndex === 0;
    var isLast = currentIndex === scenes.length - 1;
    btnNext.disabled = isLast;
  }

  /* ----------------------------------------------------------
     Scene playback
     ---------------------------------------------------------- */
  function resetSceneLines(sceneEl) {
    var lines = sceneEl.querySelectorAll("[data-line]");
    lines.forEach(function (el) {
      el.classList.remove("visible");
      el.setAttribute("aria-hidden", "true");
      if (el.tagName === "BUTTON") el.setAttribute("tabindex", "-1");
    });
  }

  function revealLine(el) {
    el.classList.add("visible");
    el.removeAttribute("aria-hidden");
    if (el.tagName === "BUTTON") el.removeAttribute("tabindex");
  }

  function playScene(index) {
    if (index < 0 || index >= scenes.length) return;

    clearTimers();

    currentIndex = index;
    scenes.forEach(function (s, i) {
      s.classList.toggle("active", i === index);
    });
    body.setAttribute("data-scene", String(index));
    updateProgress();
    updateNavButtons();

    var sceneEl = scenes[index];
    resetSceneLines(sceneEl);

    var lines = Array.prototype.slice.call(sceneEl.querySelectorAll("[data-line]"));
    var gap = reduceMotion ? 140 : 1450;
    var cumulative = reduceMotion ? 80 : 450;

    lines.forEach(function (el) {
      var timer = pausableTimeout(function () {
        revealLine(el);
      }, cumulative);
      timers.push(timer);
      cumulative += gap;
    });
  }

  function goNext() { playScene(currentIndex + 1); }
  function goBack() { playScene(currentIndex - 1); }
  function replayCurrent() { playScene(currentIndex); }

  function skipText() {
    clearTimers();
    var sceneEl = scenes[currentIndex];
    var lines = sceneEl.querySelectorAll("[data-line]");
    lines.forEach(function (el) {
      revealLine(el);
    });
  }

  /* ----------------------------------------------------------
     Event wiring
     ---------------------------------------------------------- */
  btnNext.addEventListener("click", goNext);
  btnSkipText.addEventListener("click", skipText);
  btnBack.addEventListener("click", goBack);
  btnReplay.addEventListener("click", replayCurrent);

  document.querySelectorAll("[data-action]").forEach(function (el) {
    el.addEventListener("click", function () {
      var action = el.getAttribute("data-action");
      if (action === "next") goNext();
      if (action === "replay-all") playScene(0);
    });
  });

  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
    else if (e.key === " " || e.code === "Space" || e.key === "s" || e.key === "S") { e.preventDefault(); skipText(); }
    else if (e.key === "r" || e.key === "R") { e.preventDefault(); replayCurrent(); }
  });

  /* ----------------------------------------------------------
     Init
     ---------------------------------------------------------- */
  buildProgress();
  playScene(0);
})();
