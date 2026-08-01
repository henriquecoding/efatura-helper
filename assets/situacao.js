/* Homepage A minha situação - UI adapter over the EXISTING engine in perfil.html.
 *
 * The engine (partition store, bookmarklet return, the nine sources, the summary) is untouched:
 * it owns #banner and #out and is pinned by test-render / test-profiling / test-deadlines /
 * test-obligations. This file may only adapt the surface around it (ch.17 responsibilities).
 *
 * What it adds:
 *   1. "Apagar os meus dados" as an explicit, confirmed, acknowledged action. The engine already
 *      had a reset, but as a quiet inline "apagar agora" link with no confirmation - one stray
 *      click and the reading is gone. Destructive actions get a verb, a consequence and a
 *      confirmation (ch.15: "Apagar os meus dados" beats a bin icon).
 *   2. A visible statement of when the local copy expires.
 */
(function () {
  "use strict";

  var PKEY = "fb-profile-v1";        // same key the engine in perfil.html writes
  var EXTRA_KEY = "fb-profile-extra";

  function endOfDayLabel() {
    try {
      var s = JSON.parse(localStorage.getItem(PKEY) || "null");
      if (!s || !s.expiresAt) return null;
      var d = new Date(s.expiresAt);
      return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return null; }
  }

  function hasProfile() {
    try {
      var s = JSON.parse(localStorage.getItem(PKEY) || "null");
      if (!s) return false;
      if (s.expiresAt && Date.now() >= s.expiresAt) return false;
      return !!(s.partitions && Object.keys(s.partitions).length);
    } catch (e) { return false; }
  }

  function mount() {
    var host = document.getElementById("data-actions");
    if (!host) return;

    var present = hasProfile();
    var until = endOfDayLabel();

    host.innerHTML =
      '<div class="danger-row">' +
        '<div>' +
          "<b>Apagar os meus dados</b>" +
          "<p>" + (present
            ? "Remove agora tudo o que foi lido para este navegador." +
              (until ? " Caso contrário, é apagado automaticamente às " + until + "." : "")
            : "Não há nada guardado neste navegador de momento.") + "</p>" +
        "</div>" +
        '<button class="btn btn-quiet" type="button" id="wipe"' + (present ? "" : " disabled") + ">" +
          '<svg aria-hidden="true" focusable="false"><use href="/assets/icons.svg#fb-lixo"></use></svg>' +
          "Apagar os meus dados</button>" +
      "</div>" +
      '<p class="wipe-status" id="wipe-status" role="status"></p>';

    var btn = document.getElementById("wipe");
    if (!btn || !present) return;

    btn.addEventListener("click", function () {
      // Simple confirmation, stating the consequence and that it cannot be undone.
      if (!window.confirm("Apagar os dados deste navegador? Esta ação não pode ser desfeita.")) return;
      try {
        localStorage.removeItem(PKEY);
        localStorage.removeItem(EXTRA_KEY);
      } catch (e) {}
      document.getElementById("wipe-status").textContent =
        "Apagado. Não ficou nada guardado neste navegador.";
      btn.disabled = true;
      // Let the engine repaint from the now-empty store if it exposes a render hook; otherwise the
      // status line above is the feedback and a reload shows the empty state.
      try { if (typeof window.__fbRender === "function") window.__fbRender(); } catch (e) {}
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
