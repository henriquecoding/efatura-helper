/* Homepage Empresa - search behaviour.
 *
 * THE PRIVACY CONTRACT THIS FILE EXISTS TO KEEP (ch.05, ch.13, test-privacy-urls.js):
 *   - never history.pushState/replaceState the term;
 *   - never put the term in a data-* attribute, an event name or an analytics property;
 *   - the only analytics call is consulta-submeteu with, at most, { kind: "nif" | "name" } -
 *     the KIND of search, never the value.
 * Umami auto-tracks replaceState, so writing "?q=" + nif was enough to put searched NIFs into
 * url_query. That is why the value is looked up in place instead.
 *
 * Without JavaScript the form is a plain GET to /consulta, which renders the same result
 * server-side. Everything below is enhancement.
 */
(function () {
  "use strict";

  var form = document.getElementById("empresa-form");
  if (!form) return;

  var input = document.getElementById("sb-input");
  var label = document.getElementById("sb-input-label");
  var help = document.getElementById("sb-help");
  var errBox = document.getElementById("sb-error");
  var errText = document.getElementById("sb-error-text");
  var aside = document.getElementById("sb-aside-text");
  var status = document.getElementById("sb-status");
  var submitText = document.getElementById("sb-submit-text");
  var nif = document.getElementById("sb-nif");
  var nome = document.getElementById("sb-nome");

  var MODES = {
    nif: {
      label: "NIF da empresa",
      placeholder: "Ex.: 500 960 046",
      hint: "Nove dígitos. Espaços são ignorados.",
      inputmode: "numeric",
      aside: "Só sabes o nome? Escolhe <b>Nome</b> acima."
    },
    nome: {
      label: "Nome da empresa",
      placeholder: "Ex.: Padaria Central",
      hint: "Pelo menos 3 letras.",
      inputmode: "text",
      aside: "Já tens o número? Escolhe <b>NIF</b> acima."
    }
  };

  function mode() { return nome && nome.checked ? "nome" : "nif"; }

  /* Switching mode must NOT destroy what the person already typed when it is still usable in the
     other mode - retyping a 9-digit number because you tapped the wrong chip is exactly the kind
     of small cruelty this product is supposed to avoid. */
  function applyMode() {
    var m = MODES[mode()];
    label.textContent = m.label;
    input.placeholder = m.placeholder;
    help.textContent = m.hint;
    input.setAttribute("inputmode", m.inputmode);
    aside.innerHTML = m.aside;
    clearError();
  }

  function clearError() {
    errBox.hidden = true;
    errText.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function showError(msg) {
    errText.textContent = msg;
    errBox.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();          // focus stays on the field; the text is NOT cleared
  }

  function digits(s) { return s.replace(/\D/g, ""); }

  // Portuguese NIF: 9 digits with the standard mod-11 check digit.
  function validNif(s) {
    var d = digits(s);
    if (d.length !== 9) return false;
    var sum = 0;
    for (var i = 0; i < 8; i++) sum += Number(d[i]) * (9 - i);
    var chk = 11 - (sum % 11);
    if (chk >= 10) chk = 0;
    return chk === Number(d[8]);
  }

  if (nif) nif.addEventListener("change", applyMode);
  if (nome) nome.addEventListener("change", applyMode);
  input.addEventListener("input", function () { if (!errBox.hidden) clearError(); });

  var controller = null;

  form.addEventListener("submit", function (e) {
    var term = input.value.trim();
    var kind = mode();

    if (kind === "nif") {
      if (digits(term).length !== 9) {
        e.preventDefault();
        showError("Um NIF português tem 9 dígitos. Confirma o número.");
        return;
      }
      if (!validNif(term)) {
        e.preventDefault();
        showError("Este número não parece um NIF válido. Confirma os dígitos.");
        return;
      }
    } else if (term.length < 3) {
      e.preventDefault();
      showError("Escreve pelo menos 3 letras.");
      return;
    }

    /* From here the input is valid. With fetch available we handle it in place so the term never
       reaches the URL. Without it, we let the plain GET to /consulta proceed. */
    if (typeof window.fetch !== "function") return;
    e.preventDefault();
    clearError();

    // KIND only. Never the value.
    try { if (window.umami) window.umami.track("consulta-submeteu", { kind: kind === "nif" ? "nif" : "name" }); } catch (err) {}

    if (controller) controller.abort();
    controller = new AbortController();

    status.textContent = "A procurar nas fontes públicas…";
    submitText.textContent = "A procurar";
    document.getElementById("sb-submit").disabled = true;

    var url = kind === "nif"
      ? "/api/nif/" + encodeURIComponent(digits(term))
      : "/api/search?nome=" + encodeURIComponent(term);

    fetch(url, { signal: controller.signal, credentials: "omit" })
      .then(function (r) {
        if (r.status === 429) throw new Error("rate");
        if (!r.ok) throw new Error("http");
        return r.json();
      })
      .then(function (data) { render(kind, data); })
      .catch(function (err) {
        if (err.name === "AbortError") return;
        if (err.message === "rate") {
          renderMessage("Demasiadas consultas seguidas. Espera um momento e tenta outra vez.", "warn");
        } else {
          /* The lookup endpoints are the ones /consulta already uses. If they are unreachable from
             here, the honest fallback is the page that renders the same thing server-side - not a
             dead end. The term goes in the link the person clicks, not in this page's history. */
          renderMessage(
            "Não foi possível ligar. Verifica a ligação e tenta outra vez.", "bad",
            "/consulta?q=" + encodeURIComponent(kind === "nif" ? digits(term) : term),
            "Abrir na página de consulta");
        }
      })
      .then(function () {
        submitText.textContent = "Consultar";
        document.getElementById("sb-submit").disabled = false;
      });
  });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  var out = document.getElementById("sb-result");

  function renderMessage(msg, tone, href, linkText) {
    out.hidden = false;
    out.innerHTML =
      '<p class="note note-' + (tone === "bad" ? "bad" : "warn") + '">' +
      '<svg aria-hidden="true" focusable="false"><use href="/assets/icons.svg#fb-aviso"></use></svg>' +
      "<span>" + esc(msg) +
      (href ? ' <a href="' + esc(href) + '">' + esc(linkText) + "</a>" : "") +
      "</span></p>";
    status.textContent = msg;
  }

  function render(kind, data) {
    out.hidden = false;
    if (!data || (kind === "nome" && (!data.resultados || !data.resultados.length))) {
      renderMessage("Sem resultados para esta pesquisa.", "warn");
      return;
    }

    if (kind === "nome") {
      var items = data.resultados.slice(0, 20).map(function (r) {
        return '<li><a href="/consulta?q=' + esc(String(r.nif || "").replace(/\D/g, "")) + '">' +
               "<b>" + esc(r.nome || "(sem nome)") + "</b>" +
               '<span class="num">' + esc(r.nif || "") + "</span></a></li>";
      }).join("");
      out.innerHTML = '<h2 class="res-title" tabindex="-1" id="res-title">Resultados</h2>' +
                      '<ul class="res-list">' + items + "</ul>";
      status.textContent = data.resultados.length + " resultado(s).";
      document.getElementById("res-title").focus();
      return;
    }

    var rows = [
      ["Nome oficial", data.nome, "SICAE"],
      ["NIF", data.nif, "SICAE"],
      ["CAE principal", data.cae_principal, "SICAE"],
      ["Situação de IVA", data.iva, "VIES"],
      ["Morada", data.morada, "SICAE"]
    ].filter(function (r) { return r[1]; });

    out.innerHTML =
      '<h2 class="res-title" tabindex="-1" id="res-title">' + esc(data.nome || "Resultado") + "</h2>" +
      '<div class="tablewrap"><table><tbody>' +
      rows.map(function (r) {
        return "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td>" + esc(r[1]) +
               '</td><td class="mono">' + esc(r[2]) + "</td></tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<p><a class="btn btn-alt" href="/consulta?q=' + esc(String(data.nif || "").replace(/\D/g, "")) +
      '">Ver o dossiê completo</a></p>';
    status.textContent = "Resultado encontrado.";
    document.getElementById("res-title").focus();
  }

  applyMode();
})();
