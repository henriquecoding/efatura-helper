/* Mesa Fiscal - DOM controller. Progressive enhancement over the static summary in #demonstracao.
 *
 * Responsibilities (and nothing else): mount the shell, the tablist, the scenes, the act ruler
 * and the transport; drive ONE clock from demo-stage-core; keep ARIA and keyboard honest.
 * It never touches network, storage, the bookmarklet, tool.js or any personal data - the only
 * inputs are the frozen fixtures, clicks/keys inside the demo, media preferences, visibility
 * and the stage's own geometry (test-demo-browser.js intercepts requests to prove the first,
 * a source scan proves the rest).
 *
 * If anything is missing (fixtures, core, root), the static summary simply stays - the demo is
 * a supplement, never the only carrier of a fact.
 */
(function () {
  "use strict";

  function init() {
    var FIX = window.FB_DEMO_FIXTURES;
    var CORE = window.FBDemoCore;
    if (!FIX || !CORE) return;
    /* The launcher lives in each route's HERO; the expanded explanation belongs to Sobre and can no
       longer be the anchor - everything is looked up document-wide. Any number of triggers may
       open the demo; there is exactly one dialog. */
    var rootShell = document.querySelector("[data-demo-root]");
    var summary = document.querySelector("[data-demo-summary]");
    var launchers = Array.prototype.slice.call(document.querySelectorAll("[data-demo-open]"));
    var modal = document.querySelector("[data-demo-modal]");
    if (!rootShell || !launchers.length || !modal) return;

    var reduced = false, fineHover = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    } catch (e) {}

    var esc = function (s) { return String(s == null ? "" : s); }; // textContent only; no HTML paths

    var icon = function (id, cls) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      if (cls) svg.setAttribute("class", cls);
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "/assets/icons.svg#" + id);
      svg.appendChild(use);
      return svg;
    };

    var el = function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

    /* ------------------------------------------------------------------ build: chrome */
    var titlebar = rootShell.querySelector(".demo-titlebar");
    titlebar.textContent = "";
    var dots = el("span", "demo-dots");
    dots.setAttribute("aria-hidden", "true");
    for (var d = 0; d < 3; d++) dots.appendChild(el("i"));
    titlebar.appendChild(dots);
    titlebar.appendChild(el("span", "demo-app-title", "Mesa Fiscal"));
    var liveBadge = el("span", "demo-live", "Demo em direto");
    titlebar.appendChild(liveBadge);
    var pauseBtn = el("button", "demo-pause", "Pausar demonstração");
    pauseBtn.type = "button";
    titlebar.appendChild(pauseBtn);
    var closeBtn = el("button", "demo-close", "");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Fechar a demonstração");
    closeBtn.appendChild(icon("fb-fechar"));
    titlebar.appendChild(closeBtn);

    /* ------------------------------------------------------------------ build: tabs */
    var tabsNav = rootShell.querySelector(".demo-tabs");
    tabsNav.textContent = "";
    var tablist = el("div", "demo-tablist");
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Demonstrações das funcionalidades");
    var tabOrientation = window.matchMedia ? window.matchMedia("(max-width: 1024px)") : null;
    function syncTabOrientation() {
      tablist.setAttribute("aria-orientation", tabOrientation && tabOrientation.matches ? "horizontal" : "vertical");
    }
    syncTabOrientation();
    if (tabOrientation && tabOrientation.addEventListener)
      tabOrientation.addEventListener("change", syncTabOrientation);
    var groups = { ferramentas: "Ferramentas", confianca: "Confiança" };
    var tabEls = [];
    Object.keys(groups).forEach(function (g) {
      var lab = el("span", "demo-group mono", groups[g]);
      lab.setAttribute("aria-hidden", "true");
      tablist.appendChild(lab);
      FIX.journeys.forEach(function (j, ji) {
        if (j.group !== g) return;
        var t = el("button", "demo-tab");
        t.type = "button";
        t.setAttribute("role", "tab");
        t.id = "demo-tab-" + j.id;
        t.setAttribute("aria-controls", "demo-panel-" + j.id);
        t.setAttribute("aria-selected", "false");
        t.tabIndex = -1;
        t.appendChild(icon(j.icon));
        t.appendChild(el("span", "", j.tabLabel));
        t.setAttribute("data-journey", String(ji));
        tablist.appendChild(t);
        tabEls.push(t);
      });
    });
    tabsNav.appendChild(tablist);
    // a real utility link, outside the tablist and outside the arrow-key order
    var report = el("a", "demo-report", "Reportar erro");
    report.href = "/sobre#relato";
    tabsNav.appendChild(report);

    /* ------------------------------------------------------------------ build: panels */
    var stageHost = rootShell.querySelector(".demo-stage");
    stageHost.textContent = "";
    stageHost.setAttribute("aria-label", "Demonstração com dados ilustrativos");

    var status = el("p", "visually-hidden");
    status.setAttribute("role", "status");
    stageHost.appendChild(status);

    var panels = FIX.journeys.map(function (j, ji) {
      var p = el("div", "demo-panel");
      p.id = "demo-panel-" + j.id;
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", "demo-tab-" + j.id);
      p.hidden = true;

      var head = el("div", "demo-panel-head");
      var ht = el("div");
      ht.appendChild(el("h3", "demo-panel-title", j.title));
      ht.appendChild(el("p", "demo-panel-sub", j.summary));
      head.appendChild(ht);
      var chip = el("p", "example-badge");
      chip.appendChild(icon("fb-info"));
      chip.appendChild(document.createTextNode("Exemplo · dados ilustrativos"));
      head.appendChild(chip);
      p.appendChild(head);

      var scene = el("div", "demo-scene");
      scene.setAttribute("data-scene", j.id);
      p.appendChild(scene);

      var caption = el("p", "demo-say");
      p.appendChild(caption);

      // act ruler
      var acts = el("ol", "demo-acts");
      acts.setAttribute("aria-label", "Passos desta demonstração");
      j.acts.forEach(function (a, ai) {
        var li = el("li");
        var b = el("button", "demo-act");
        b.type = "button";
        b.setAttribute("aria-label", "Passo " + (ai + 1) + " de " + j.acts.length + ": " + a.ariaLabel);
        var track = el("span", "demo-act-track");
        track.setAttribute("aria-hidden", "true");
        track.appendChild(el("span", "demo-act-fill"));
        b.appendChild(track);
        b.appendChild(el("span", "demo-act-label", a.label));
        b.setAttribute("data-act", String(ai));
        li.appendChild(b);
        acts.appendChild(li);
      });
      p.appendChild(acts);

      var foot = el("div", "demo-foot");
      var play = el("button", "btn btn-alt demo-play", "Reproduzir");
      play.type = "button";
      foot.appendChild(play);
      var cta = el("a", "btn demo-cta", j.ctaLabel);
      cta.href = j.href;
      foot.appendChild(cta);
      p.appendChild(foot);

      stageHost.appendChild(p);
      return p;
    });

    // One real <figcaption>, last child of the <figure> - the persistent third disclosure
    // (the chip on each panel and the figure's accessible name are the other two).
    var figcap = el("figcaption", "demo-figcap", FIX.disclosure);
    stageHost.appendChild(figcap);

    // fake cursor (one, shared; only when it can clarify)
    var cursor = null;
    if (!reduced && fineHover) {
      cursor = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      cursor.setAttribute("class", "demo-cursor");
      cursor.setAttribute("aria-hidden", "true");
      cursor.setAttribute("viewBox", "0 0 24 24");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M5 3l14 8.5-6.2 1.3L10 19z");
      path.setAttribute("fill", "currentColor");
      cursor.appendChild(path);
      stageHost.appendChild(cursor);
    }

    /* ------------------------------------------------------------------ scene render */
    function renderScene(ji, ai) {
      var j = FIX.journeys[ji], a = j.acts[ai];
      var scene = panels[ji].querySelector(".demo-scene");
      scene.textContent = "";
      var items = a.coverage
        ? FIX.coverage.map(function (c) {
            return { kind: "row", icon: c.status === "validated" ? "fb-check" : "fb-circulo",
                     text: c.label + " — " + c.statusLabel,
                     state: c.status === "validated" ? "ok" : "muted" };
          })
        : (a.items || []);

      items.forEach(function (it) {
        var n;
        if (it.kind === "field") {
          n = el("div", "demo-field");
          n.appendChild(el("span", "demo-field-label", it.label));
          var v = el("span", "demo-field-value num");
          v.setAttribute("data-value", it.value);
          v.setAttribute("data-typed", it.typed ? "1" : "0");
          v.textContent = it.typed ? "" : it.value;
          n.appendChild(v);
        } else if (it.kind === "kv") {
          n = el("div", "demo-kv");
          n.appendChild(el("span", "demo-k", it.k));
          n.appendChild(el("span", "demo-v", it.v));
        } else if (it.kind === "bar") {
          n = el("div", "demo-bar");
          var bh = el("div", "demo-bar-head");
          bh.appendChild(el("span", "demo-bar-label", it.label));
          bh.appendChild(el("span", "demo-bar-note num", it.note));
          n.appendChild(bh);
          var tr = el("span", "demo-bar-track");
          tr.setAttribute("aria-hidden", "true");
          var fill = el("span", "demo-bar-fill");
          fill.style.transform = "scaleX(" + it.fill + ")";
          tr.appendChild(fill);
          n.appendChild(tr);
        } else if (it.kind === "badge") {
          n = el("p", "demo-badge" + (it.tone ? " demo-badge-" + it.tone : ""), it.text);
        } else if (it.kind === "note") {
          n = el("p", "demo-note" + (it.tone ? " demo-note-" + it.tone : ""), it.text);
        } else { // row
          n = el("div", "demo-row" + (it.state ? " demo-row-" + it.state : ""));
          n.appendChild(icon(it.icon || "fb-circulo"));
          n.appendChild(el("span", "", it.text));
        }
        n.classList.add("demo-item");
        scene.appendChild(n);
      });

      panels[ji].querySelector(".demo-say").textContent = a.say;
      return scene;
    }

    /* ------------------------------------------------------------------ state */
    var active = 0;      // journey index
    var act = 0;         // act index
    var completed = false;
    var clock = null;
    var lastVisible = -1, lastTyped = null;

    var blocks = CORE.createBlockSet(function (runnable) {
      if (!clock) return;
      if (runnable) { clock.play(); setLive("run"); }
      else { clock.pause(); if (!completed) setLive("pause"); }
    });
    if (reduced) blocks.add("reduced-motion");

    function setLive(mode) {
      liveBadge.textContent = mode === "run" ? "Demo em direto"
        : mode === "done" ? "Demonstração concluída" : "Demo em pausa";
      liveBadge.className = "demo-live" + (mode === "run" ? " is-run" : mode === "done" ? " is-done" : "");
      pauseBtn.disabled = mode === "done";
      pauseBtn.textContent = mode === "run" ? "Pausar demonstração"
        : mode === "done" ? "Demonstração concluída" : "Retomar demonstração";
    }

    function announce(ji, ai, extra) {
      var j = FIX.journeys[ji];
      status.textContent = j.title + ". Passo " + (ai + 1) + " de " + j.acts.length + ": " +
        j.acts[ai].ariaLabel + "." + (extra ? " " + extra : "");
    }

    function paintRuler(ji, ai, progress) {
      var btns = panels[ji].querySelectorAll(".demo-act");
      for (var i = 0; i < btns.length; i++) {
        var fill = btns[i].querySelector(".demo-act-fill");
        var p = i < ai ? 1 : i > ai ? 0 : progress;
        fill.style.transform = "scaleX(" + p + ")";
        if (i === ai) btns[i].setAttribute("aria-current", "step");
        else btns[i].removeAttribute("aria-current");
      }
    }

    function frame(progress) {
      var j = FIX.journeys[active], a = j.acts[act];
      var scene = panels[active].querySelector(".demo-scene");
      var items = scene.querySelectorAll(".demo-item");

      var vis = CORE.itemsVisible(progress, items.length);
      if (vis !== lastVisible) {
        for (var i = 0; i < items.length; i++) items[i].classList.toggle("is-on", i < vis);
        lastVisible = vis;
      }
      var typedEl = scene.querySelector('[data-typed="1"]');
      if (typedEl) {
        var t = CORE.typedSlice(progress, typedEl.getAttribute("data-value"));
        if (t !== lastTyped) { typedEl.textContent = t; lastTyped = t; }
      }
      if (cursor) {
        if (a.pointer && blocks.isEmpty()) {
          var pt = CORE.interpolateKeyframes(progress, a.pointer);
          var box = scene.getBoundingClientRect();
          var host = stageHost.getBoundingClientRect();
          cursor.style.opacity = String(pt.opacity || 0);
          cursor.style.transform = "translate3d(" +
            Math.round(box.left - host.left + (pt.x || 0) * box.width) + "px," +
            Math.round(box.top - host.top + (pt.y || 0) * box.height) + "px,0)" +
            (pt.pressed ? " scale(.9)" : "");
        } else {
          cursor.style.opacity = "0";
        }
      }
      paintRuler(active, act, progress);
    }

    function enterAct(ji, ai, autoplay) {
      act = ai;
      completed = false;
      lastVisible = -1; lastTyped = null;
      renderScene(ji, ai);
      var a = FIX.journeys[ji].acts[ai];
      var isStatic = !a.dwellMs;

      if (clock) clock.destroy();
      clock = CORE.createStageClock({
        durationMs: a.dwellMs,
        onFrame: frame,
        onComplete: function () {
          var next = ai + 1;
          if (next < FIX.journeys[ji].acts.length) {
            enterAct(ji, next, true);
            announce(ji, next);
          }
        },
        requestFrame: function (cb) { return window.requestAnimationFrame(cb); },
        cancelFrame: function (id) { window.cancelAnimationFrame(id); }
      });

      if (isStatic || reduced) {
        clock.seek(1);
        if (ai === FIX.journeys[ji].acts.length - 1) {
          completed = true;
          blocks.add("completed");
          setLive("done");
          // In reduced motion the transport is a manual step-through and keeps its name; only the
          // animated flow earns a "Repetir".
          if (!reduced) panels[ji].querySelector(".demo-play").textContent = "Repetir demonstração";
          announce(ji, ai, "Demonstração concluída.");
        }
      } else {
        /* Paint the act's first frame BEFORE deciding to play. Without this, an act entered
           straight into autoplay had nothing on screen (and no aria-current) until the first
           rAF tick - which on a slow first frame, or in a test that asserts synchronously, is a
           blank stage and a ruler with no current step. */
        clock.seek(0);
        if (autoplay && blocks.isEmpty()) {
          clock.play();
          setLive("run");
        }
      }
    }

    function selectJourney(ji, opts) {
      opts = opts || {};
      if (clock) { clock.pause(); }
      blocks.remove("completed");
      completed = false;
      tabEls.forEach(function (t) {
        var mine = Number(t.getAttribute("data-journey")) === ji;
        t.setAttribute("aria-selected", mine ? "true" : "false");
        t.tabIndex = mine ? 0 : -1;
      });
      panels.forEach(function (p, i) { p.hidden = i !== ji; });
      active = ji;
      panels[ji].querySelector(".demo-play").textContent = reduced ? "Percorrer passos" : "Reproduzir";

      /* Picking a tool STARTS ITS DEMONSTRATION (owner decision 01-08-2026): no second click on
       * "Reproduzir". The earlier behaviour parked the new journey behind a `manual` block, which
       * the report recommended so keyboard arrows could not fire scenes while browsing - that
       * concern is still met, because arrows only MOVE focus here; a journey starts on explicit
       * activation (click / Enter / Space), which is exactly the intent to watch it.
       * Reduced motion still opens on the final state and never animates. */
      if (reduced) {
        enterAct(ji, FIX.journeys[ji].acts.length - 1, false);
        announce(ji, FIX.journeys[ji].acts.length - 1);
        return;
      }
      blocks.remove("manual");
      blocks.remove("explicit");
      blocks.remove("focus");     // the click that selected the tab focused it; that is not a pause
      blocks.remove("hover");
      enterAct(ji, 0, true);
      announce(ji, 0);
    }

    /* ------------------------------------------------------------------ interactions */
    tabEls.forEach(function (t) {
      t.addEventListener("click", function () {
        selectJourney(Number(t.getAttribute("data-journey")));
        t.focus();
      });
      t.addEventListener("keydown", function (e) {
        var idx = tabEls.indexOf(t), next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % tabEls.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + tabEls.length) % tabEls.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabEls.length - 1;
        else return;
        e.preventDefault();
        tabEls.forEach(function (o) { o.tabIndex = -1; });
        tabEls[next].tabIndex = 0;
        tabEls[next].focus();     // manual activation: focus moves, Enter/Space activates
      });
    });

    stageHost.addEventListener("click", function (e) {
      var actBtn = e.target.closest ? e.target.closest(".demo-act") : null;
      if (actBtn) {
        blocks.add("manual");
        blocks.remove("completed");
        enterAct(active, Number(actBtn.getAttribute("data-act")), false);
        clock.seek(1);            // a chosen act shows its finished state, readable at once
        announce(active, Number(actBtn.getAttribute("data-act")));
        return;
      }
      var play = e.target.closest ? e.target.closest(".demo-play") : null;
      if (play) {
        // Play is an explicit intent to RUN: it clears every user-side block, including a stale
        // `focus` left by a tab click (which otherwise parked the clock until focus wandered off
        // and the scene burst into motion unprompted - the bug this comment is pinned to).
        blocks.remove("manual");
        blocks.remove("completed");
        blocks.remove("explicit");
        blocks.remove("focus");
        blocks.remove("hover");
        completed = false;
        if (reduced) {           // manual step-through, no motion
          var nx = (act + 1) % FIX.journeys[active].acts.length;
          enterAct(active, nx, false);
          announce(active, nx);
          return;
        }
        enterAct(active, 0, true);
        announce(active, 0);
      }
    });

    pauseBtn.addEventListener("click", function () {
      if (blocks.has("completed")) return;   // a finished run has nothing to pause; Repetir restarts
      if (blocks.has("explicit")) {
        blocks.remove("explicit");
        blocks.remove("manual");
      } else {
        blocks.add("explicit");
      }
    });

    // Focus pauses; the TRANSPORT controls are the documented exception (§12.14) - otherwise
    // clicking "Reproduzir" would focus the button, add the focus block, and the click could
    // never start anything.
    function isTransport(t) {
      return pauseBtn.contains(t) || (t.closest && t.closest(".demo-play"));
    }
    rootShell.addEventListener("focusin", function (e) {
      if (isTransport(e.target)) return;
      blocks.add("focus");
    });
    rootShell.addEventListener("focusout", function (e) {
      if (!e.relatedTarget || !rootShell.contains(e.relatedTarget)) blocks.remove("focus");
    });

    // Hover pauses the SCENE, not the whole stage - the play button and the CTA live outside the
    // animated region, so pointing at them must not be what blocks them from working.
    if (fineHover) {
      panels.forEach(function (p) {
        var scene = p.querySelector(".demo-scene");
        scene.addEventListener("mouseenter", function () {
          blocks.add("hover");
          if (cursor) cursor.style.opacity = "0";   // a real cursor displaces the fake one
        });
        scene.addEventListener("mouseleave", function () { blocks.remove("hover"); });
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) blocks.add("document-hidden");
      else blocks.remove("document-hidden");
    });

    /* ------------------------------------------------------------------ mount
     * The demo lives in a modal (owner decision 01-08-2026): nothing runs on the page itself.
     * Mounting reveals the LAUNCHER; the stage stays parked behind the `offscreen` block until
     * the dialog opens, and goes back to parked when it closes. No IntersectionObserver - the
     * dialog IS the visibility signal. */
    selectJourney(0, { auto: true });
    blocks.add("offscreen");   // parked until the dialog opens - selectJourney's play waits here
    rootShell.hidden = false;
    launchers.forEach(function (l) { l.hidden = false; });
    if (summary) summary.hidden = true;

    function journeyIndex(id) {
      for (var i = 0; i < FIX.journeys.length; i++) if (FIX.journeys[i].id === id) return i;
      return -1;
    }

    function openModal(e) {
      // Each route's launcher names its own journey, so /deducoes opens on Deduções rather than
      // always on Empresa. An unknown or absent id simply keeps whatever is selected.
      var trigger = e && e.currentTarget;
      var wanted = trigger && trigger.getAttribute ? trigger.getAttribute("data-demo-start") : null;
      var wi = wanted ? journeyIndex(wanted) : -1;
      var activeBefore = active;
      if (wi >= 0 && wi !== active) selectJourney(wi);
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "");       // jsdom and old engines: non-modal fallback
      // showModal focuses the first focusable element - in some engines that is a TAB, whose
      // focusin would arm the `focus` block and kill the advertised autoplay at birth. Focus the
      // transport (exempt) and clear any stale focus reason before deciding to play.
      try { panels[active].querySelector(".demo-play").focus(); } catch (err) {}
      blocks.remove("focus");
      blocks.remove("offscreen");
      if (wi >= 0 && wi !== activeBefore) return;   // selectJourney already started this one
      if (!reduced && act === 0 && !completed) {
        // first open plays once from the top; a re-open resumes wherever it was left
        blocks.remove("manual");
        enterAct(active, 0, true);
        announce(active, 0);
      }
    }
    function closeModal() {
      blocks.add("offscreen");                   // parks the clock, keeps the progress
      if (modal.open && typeof modal.close === "function") modal.close();
      else modal.removeAttribute("open");
    }
    launchers.forEach(function (l) { l.addEventListener("click", openModal); });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("close", function () { blocks.add("offscreen"); });
    modal.addEventListener("cancel", function () { blocks.add("offscreen"); });
    // click on the backdrop closes (the dialog itself is the only direct target there)
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
