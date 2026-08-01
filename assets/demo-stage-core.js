/* Mesa Fiscal - deterministic core. No DOM, no fetch, no storage, no dependencies.
 *
 * Three primitives, all injectable for tests:
 *   createStageClock  ONE clock per stage. Measures time, reports progress, decides the end of
 *                     the act. There is deliberately no second timeline: when the act cut lived
 *                     in a setTimeout and the bar in a CSS animation, a pause separated them
 *                     (the Recibo Certo lesson, commit 50b1847).
 *   createBlockSet    pause reasons as an independent set (explicit, focus, hover, offscreen,
 *                     document-hidden, manual, reduced-motion, completed). The clock runs only
 *                     while the set is empty, so "cursor leaves" can never un-pause a person who
 *                     pressed the pause button.
 *   interpolateKeyframes  progress -> pointer/scene state. Pure, so seek/pause/replay/reduced
 *                     all produce the same frame for the same progress.
 *
 * Browser global: window.FBDemoCore. Node: module.exports.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FBDemoCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MAX_DELTA = 100; // ms; a background tab returning must not fast-forward the act

  function createStageClock(options) {
    var requestFrame = options.requestFrame;
    var cancelFrame = options.cancelFrame;
    var onFrame = options.onFrame;
    var onComplete = options.onComplete;
    var durationMs = options.durationMs;

    var elapsed = 0;
    var last = null;
    var frame = 0;
    var running = false;
    var completed = false;
    var destroyed = false;

    function emit() {
      var progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;
      onFrame(progress, elapsed);
      return progress;
    }

    function tick(time) {
      if (!running || completed || destroyed) return;
      if (last == null) last = time;
      // clamp: never negative (timer skew), never huge (throttled tab)
      var delta = Math.max(0, Math.min(time - last, MAX_DELTA));
      last = time;
      elapsed = durationMs > 0 ? Math.min(durationMs, elapsed + delta) : 0;

      var progress = emit();
      if (progress >= 1) {
        completed = true;
        running = false;
        onComplete();
        return;
      }
      frame = requestFrame(tick);
    }

    return {
      play: function () {
        if (running || completed || destroyed) return;
        running = true;
        last = null;              // so the stopped interval is never added
        frame = requestFrame(tick);
      },
      pause: function () {
        if (!running) return;
        running = false;          // elapsed is preserved
        cancelFrame(frame);
      },
      reset: function (nextDurationMs) {
        cancelFrame(frame);
        if (typeof nextDurationMs === "number") durationMs = nextDurationMs;
        elapsed = 0; last = null; running = false; completed = false;
        emit();
      },
      seek: function (progress) {
        cancelFrame(frame);
        running = false;
        var p = Math.max(0, Math.min(1, progress));
        elapsed = durationMs > 0 ? p * durationMs : 0;
        completed = p >= 1 && durationMs > 0;
        emit();
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true; running = false;
        cancelFrame(frame);
      },
      getSnapshot: function () {
        return {
          elapsed: elapsed,
          durationMs: durationMs,
          progress: durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1,
          running: running,
          completed: completed
        };
      }
    };
  }

  var REASONS = ["reduced-motion", "explicit", "focus", "hover", "offscreen",
                 "document-hidden", "manual", "completed"];

  function createBlockSet(onChange) {
    var set = {};
    function count() {
      var n = 0; for (var k in set) if (set[k]) n++;
      return n;
    }
    return {
      add: function (reason) {
        if (REASONS.indexOf(reason) === -1) throw new Error("razao desconhecida: " + reason);
        var before = count();
        set[reason] = true;
        if (before === 0 && onChange) onChange(false); // was runnable, now blocked
      },
      remove: function (reason) {
        if (!set[reason]) return;
        delete set[reason];
        if (count() === 0 && onChange) onChange(true); // became runnable
      },
      has: function (reason) { return !!set[reason]; },
      isEmpty: function () { return count() === 0; },
      list: function () {
        var out = []; for (var k in set) if (set[k]) out.push(k);
        return out.sort();
      }
    };
  }

  /* keyframes: [{ at, ...numericOrBooleanProps }] sorted by `at`.
   * Numbers are linearly interpolated between the surrounding frames; booleans and anything else
   * hold the value of the last frame at-or-before `progress`. */
  function interpolateKeyframes(progress, frames) {
    if (!frames || !frames.length) return {};
    var p = Math.max(0, Math.min(1, progress));
    var prev = frames[0], next = frames[frames.length - 1];
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].at <= p) prev = frames[i];
      if (frames[i].at >= p) { next = frames[i]; break; }
    }
    var out = {};
    var span = next.at - prev.at;
    var t = span > 0 ? (p - prev.at) / span : 0;
    var keys = {};
    Object.keys(prev).concat(Object.keys(next)).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (k) {
      if (k === "at") return;
      var a = prev[k], b = next[k];
      if (typeof a === "number" && typeof b === "number") out[k] = a + (b - a) * t;
      else out[k] = prev[k] !== undefined ? prev[k] : b;
    });
    return out;
  }

  /* How many of `n` items are visible at `progress`, with the reveal packed into the first
   * `window` share of the act (the rest is reading time). Deterministic, derived, never event-
   * driven - so a seek to 0.5 shows exactly the items a play-through would have shown. */
  function itemsVisible(progress, n, window) {
    var w = typeof window === "number" ? window : 0.45;
    if (n <= 0) return 0;
    if (progress <= 0) return 0;
    if (progress >= w) return n;
    return Math.min(n, Math.floor((progress / w) * n) + (progress > 0 ? 1 : 0));
  }

  /* Characters of `value` visible at `progress` for a typed field: typing occupies the middle
   * band of the reveal window so the field appears first, then fills. */
  function typedSlice(progress, value, window) {
    var w = typeof window === "number" ? window : 0.45;
    var start = w * 0.2, end = w;
    if (progress <= start) return "";
    if (progress >= end) return value;
    var t = (progress - start) / (end - start);
    return value.slice(0, Math.round(t * value.length));
  }

  return {
    createStageClock: createStageClock,
    createBlockSet: createBlockSet,
    interpolateKeyframes: interpolateKeyframes,
    itemsVisible: itemsVisible,
    typedSlice: typedSlice,
    REASONS: REASONS,
    MAX_DELTA: MAX_DELTA
  };
});
