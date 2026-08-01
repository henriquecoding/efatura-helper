/* Homepage Base legal e fiscal - index, filters and rule cards.
 *
 * Every rule shown here is JOINED from files this site already publishes:
 *   legal_sources.json    the official source, its url and the `expect` strings
 *   audit-manifest.json   what the code actually computes with (rate, ceiling, code location)
 *   audit-freshness.json  whether a robot last found the article still saying that
 *
 * It NEVER invents an interpretation and never marks something confirmed on its own authority
 * (ch.17 responsibilities). A rule with no freshness entry renders as "Por confirmar", not green.
 *
 * The search phrase stays in the browser: filtering is a substring match over the already-loaded
 * index. Nothing is sent anywhere, and the term never reaches the URL or an analytics property.
 */
(function () {
  "use strict";

  var form = document.getElementById("legal-form");
  if (!form) return;

  var q = document.getElementById("lb-q");
  var diploma = document.getElementById("lb-diploma");
  var ano = document.getElementById("lb-ano");
  var results = document.getElementById("legal-results");
  var list = document.getElementById("lr-list");
  var count = document.getElementById("lr-count");
  var title = document.getElementById("lr-title");

  var INDEX = [];       // built once from the three artefacts
  var loaded = false;

  // Which topic each deduction code / source belongs to. Kept here, in the repository, because it
  // is a taxonomy decision - not something to infer from the article number at runtime.
  var TOPIC = {
    "cirs-78b": "deducoes", "cirs-78c": "deducoes", "cirs-78d": "deducoes",
    "cirs-78f": "deducoes", "cirs-84": "deducoes",
    "cirs-78e": "rendas", "cirs-8": "rendas", "cc-1076": "rendas",
    "cppt-59": "prazos", "cppt-70": "prazos", "lgt-78": "prazos",
    "ine-cae-rev3": "faturas", "sicae": "faturas", "dl-381-2007": "faturas",
    "dl-9-2025": "iva", "ebf-21": "deducoes", "ebf-63": "deducoes"
  };
  var TOPIC_LABEL = {
    deducoes: "Deduções do IRS", faturas: "Faturas e setores", rendas: "Rendas e habitação",
    iva: "IVA e atividade", prazos: "Prazos e correções", ss: "Segurança Social"
  };
  var DIPLOMA = function (id, gov) {
    if (/^cirs/.test(id)) return "CIRS";
    if (/^civa/.test(id)) return "CIVA";
    if (/^cppt/.test(id)) return "CPPT";
    if (/^lgt/.test(id)) return "LGT";
    if (/^ebf/.test(id)) return "EBF";
    return "Outros";
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  function load() {
    if (loaded) return Promise.resolve();
    return Promise.all([
      fetch("/legal_sources.json").then(function (r) { return r.json(); }),
      fetch("/audit-manifest.json", { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch("/audit-freshness.json", { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (a) {
      var legal = a[0], audit = a[1], fresh = a[2];

      var fmap = {};
      if (fresh && fresh.sources) fresh.sources.forEach(function (s) { fmap[s.id] = s.status; });

      // rows of the audit manifest, grouped by the source they cite
      var bySource = {};
      if (audit && audit.rows) audit.rows.forEach(function (r) {
        if (!r.source_id) return;
        (bySource[r.source_id] = bySource[r.source_id] || []).push(r);
      });

      INDEX = (legal.sources || []).map(function (s) {
        var rows = bySource[s.id] || [];
        var years = [];
        rows.forEach(function (r) {
          (r.effective_years || []).forEach(function (y) { if (years.indexOf(y) === -1) years.push(y); });
        });
        return {
          id: s.id,
          topic: TOPIC[s.id] || "deducoes",
          diploma: DIPLOMA(s.id),
          governs: s.governs || "",
          url: s.url,
          article: (s.expect && s.expect[0]) || "",
          expect: (s.expect || []).join(" · "),
          critical: !!s.critical,
          why: s.why_it_matters || "",
          freshness: fmap[s.id] || null,
          rows: rows,
          years: years.sort(),
          checked: fresh && fresh._checked ? fresh._checked : null
        };
      });

      // Year filter offers only years that actually appear in the data (DED-001 rule, same idea).
      var allYears = [];
      INDEX.forEach(function (e) {
        e.years.forEach(function (y) { if (allYears.indexOf(y) === -1) allYears.push(y); });
      });
      allYears.sort().forEach(function (y) {
        var o = document.createElement("option");
        o.value = y; o.textContent = y;
        ano.appendChild(o);
      });

      loaded = true;
    });
  }

  function stateFor(e) {
    if (e.freshness === "OK")
      return '<span class="state state-ok"><svg aria-hidden="true" focusable="false">' +
             '<use href="/assets/icons.svg#fb-check"></use></svg>Conferido na fonte</span>';
    if (e.freshness === "MUDOU")
      return '<span class="state state-bad"><svg aria-hidden="true" focusable="false">' +
             '<use href="/assets/icons.svg#fb-aviso"></use></svg>A fonte mudou — precisa de revisão</span>';
    if (e.freshness === "REVOGADO")
      return '<span class="state state-bad"><svg aria-hidden="true" focusable="false">' +
             '<use href="/assets/icons.svg#fb-aviso"></use></svg>Revogado</span>';
    // No entry, SKIP or INACESSIVEL all mean the same thing to a reader: not confirmed. Never green.
    return '<span class="state state-unknown"><svg aria-hidden="true" focusable="false">' +
           '<use href="/assets/icons.svg#fb-circulo"></use></svg>Por confirmar</span>';
  }

  function render(items, label) {
    results.hidden = false;
    count.textContent = items.length + (items.length === 1 ? " regra" : " regras") +
                        (label ? " · " + label : "");
    if (!items.length) {
      list.innerHTML = '<p class="note"><svg aria-hidden="true" focusable="false">' +
        '<use href="/assets/icons.svg#fb-info"></use></svg><span>Sem regras para esta pesquisa. ' +
        'A matriz completa está em <a href="/auditoria">/auditoria</a>.</span></p>';
    } else {
      list.innerHTML = items.map(function (e) {
        var ceil = e.rows.length && e.rows[0].ceiling_eur != null
          ? e.rows[0].rate + " até " + e.rows[0].ceiling_eur + " €" : "";
        return '<article class="lr-item">' +
          "<h4>" + esc(e.article || e.id) + " · " + esc(TOPIC_LABEL[e.topic] || "") + "</h4>" +
          '<p class="lr-gov">' + esc(e.governs) + "</p>" +
          '<p class="lr-meta">' +
            stateFor(e) +
            (ceil ? '<span class="mono">' + esc(ceil) + "</span>" : "") +
            (e.years.length ? '<span class="mono">anos ' + esc(e.years.join(", ")) + "</span>" : "") +
            (e.checked ? '<span class="mono">lido ' + esc(e.checked) + "</span>" : "") +
          "</p>" +
          '<p class="rule-actions">' +
            '<a class="btn btn-alt" href="' + esc(e.url) + '" target="_blank" rel="noopener">Abrir fonte oficial</a>' +
            '<a class="btn btn-quiet" href="/auditoria">Ver na matriz</a>' +
          "</p></article>";
      }).join("");
    }
    title.focus();
  }

  function apply(topicFilter) {
    var term = q.value.trim().toLowerCase();
    var d = diploma.value, y = ano.value;
    var items = INDEX.filter(function (e) {
      if (topicFilter && e.topic !== topicFilter) return false;
      if (d && e.diploma !== d) return false;
      if (y && e.years.indexOf(y) === -1) return false;
      if (!term) return true;
      return (e.governs + " " + e.article + " " + e.expect + " " + e.id + " " +
              (TOPIC_LABEL[e.topic] || "")).toLowerCase().indexOf(term) !== -1;
    });
    render(items, topicFilter ? TOPIC_LABEL[topicFilter] : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    load().then(function () { apply(null); });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".t-open"), function (btn) {
    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-filter");
      load().then(function () { apply(t); });
    });
  });

  // Changing a select re-filters only once the index exists, so the first paint costs nothing.
  [diploma, ano].forEach(function (sel) {
    sel.addEventListener("change", function () { if (loaded) apply(null); });
  });
})();
