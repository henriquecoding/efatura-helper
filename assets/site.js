/* Fatura Boa - shell behaviour. Progressive enhancement only.
 *
 * Everything critical already works without this file: the navigation is real <a href> markup in
 * every page, the active mode is marked server-side with aria-current, the forms POST, and the
 * factual content is in the document. This adds the native supplementary dialog, the mobile
 * search sheet and the copy buttons.
 *
 * What this file may NOT do (ch.17 responsibilities): read the profile, search a NIF, or emit any
 * analytics carrying fiscal data. It never sees a tax value.
 */
(function () {
  "use strict";

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
                  ' textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
    });
  }

  /* ---------------------------------------------------------------- active mode
   * The server already ships aria-current on the right link. This only re-asserts it for pages
   * served from a path that differs from the canonical one (e.g. /consulta showing as Empresa),
   * and never invents a mode that the body did not declare. */
  function markActiveMode() {
    var mode = document.body.getAttribute("data-home-mode");
    if (!mode) return;
    var links = document.querySelectorAll("[data-mode-link]");
    Array.prototype.forEach.call(links, function (link) {
      if (link.getAttribute("data-mode-link") === mode) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  /* ---------------------------------------------------------------- supplementary menu
   * A native dialog supplies modal semantics, background inertness, Escape and focus containment.
   * Without JavaScript it remains closed and every destination also lives in the footer. */
  function wireMenu() {
    var btn = document.querySelector('button[aria-controls="site-menu"]');
    var panel = document.getElementById("site-menu");
    if (!btn || !panel) return;

    function isOpen() { return !!panel.open || panel.hasAttribute("open"); }
    function open() {
      btn.setAttribute("aria-expanded", "true");
      if (typeof panel.showModal === "function") panel.showModal();
      else panel.setAttribute("open", "");
      var first = panel.querySelector("[data-menu-close]") || focusables(panel)[0];
      if (first) first.focus();
    }
    function close(returnFocus) {
      if (panel.open && typeof panel.close === "function") panel.close();
      else panel.removeAttribute("open");
      btn.setAttribute("aria-expanded", "false");
      if (returnFocus) btn.focus();
    }

    btn.addEventListener("click", function () {
      if (isOpen()) close(true); else open();
    });
    var closer = panel.querySelector("[data-menu-close]");
    if (closer) closer.addEventListener("click", function () { close(true); });
    panel.addEventListener("close", function () {
      btn.setAttribute("aria-expanded", "false");
      if (document.activeElement !== btn) btn.focus();
    });
    panel.addEventListener("cancel", function () { btn.setAttribute("aria-expanded", "false"); });
    panel.addEventListener("click", function (e) { if (e.target === panel) close(true); });
  }

  /* ---------------------------------------------------------------- copy buttons
   * [data-copy-target] copies the href/text of another element and reports it in an aria-live
   * region. Used for the bookmarklet fallback ("Copiar o codigo"). */
  function wireCopy() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-copy-target]"), function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-copy-target"));
        if (!target) return;
        var text = target.getAttribute("href") || target.textContent || "";
        var status = btn.getAttribute("data-copy-status")
          ? document.getElementById(btn.getAttribute("data-copy-status"))
          : null;

        function done(ok) {
          if (!status) return;
          status.textContent = ok
            ? "Codigo copiado."
            : "Nao foi possivel copiar automaticamente. Seleciona o texto e copia com Ctrl+C.";
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); },
                                                     function () { done(false); });
          } else { done(false); }
        } catch (e) { done(false); }
      });
    });
  }

  /* ---------------------------------------------------------------- mobile search sheet
   * On narrow viewports the compact search opens a real <dialog> so the field is above the
   * keyboard and the bottom nav. Falls back to plain in-page scroll when <dialog> is missing. */
  function wireSheet() {
    var openers = document.querySelectorAll("[data-sheet-open]");
    if (!openers.length) return;

    Array.prototype.forEach.call(openers, function (opener) {
      var sheet = document.getElementById(opener.getAttribute("data-sheet-open"));
      if (!sheet) return;

      opener.addEventListener("click", function (e) {
        if (typeof sheet.showModal !== "function") return;  // no <dialog>: let the link/scroll work
        e.preventDefault();
        sheet.showModal();
        var first = focusables(sheet)[0];
        if (first) first.focus();
      });

      var closer = sheet.querySelector("[data-sheet-close]");
      if (closer) closer.addEventListener("click", function () { sheet.close(); });

      sheet.addEventListener("close", function () { opener.focus(); });
    });
  }

  /* ---------------------------------------------------------------- external link marking
   * Any link leaving the site gets rel hardening. Never rewrites the href. */
  function hardenExternal() {
    Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
      var rel = a.getAttribute("rel") || "";
      if (rel.indexOf("noopener") === -1) a.setAttribute("rel", (rel + " noopener").trim());
    });
  }

  /* ---------------------------------------------------------------- nav-mode analytics
   * The ONLY event this file emits, and it carries a mode name from a fixed set - never a term,
   * a NIF or a URL with a query (ch.13 allow-list). */
  var MODES = { empresa: 1, situacao: 1, deducoes: 1, legal: 1 };
  function wireNavEvent() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-mode-link]"), function (link) {
      link.addEventListener("click", function () {
        var mode = link.getAttribute("data-mode-link");
        if (!MODES[mode]) return;
        try { if (window.umami) window.umami.track("nav-mode-selected", { mode: mode }); } catch (e) {}
      });
    });
  }

  function init() {
    markActiveMode();
    wireMenu();
    wireCopy();
    wireSheet();
    hardenExternal();
    wireNavEvent();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
