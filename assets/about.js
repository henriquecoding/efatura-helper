/* Sobre + instrucoes. Comportamentos progressivos do documento: instalacao, feedback, orientacao e
 * regresso ao topo. Nenhum facto depende deste ficheiro para existir. */
(function () {
  "use strict";

  var HOST = location.origin;

  function wireBookmarklet() {
    var bookmarklet = document.getElementById("bookmarklet");
    var copy = document.getElementById("copybm");
    if (!bookmarklet) return;

    var loader = "javascript:(function(){if(!/(portaldasfinancas\\.gov\\.pt|seg-social\\.pt)$/.test(location.host)){alert('Abre uma pagina das Financas ou da Seguranca Social e faz login primeiro.');return;}window.__FB_PROFILE=1;var s=document.createElement('script');s.charset='utf-8';s.src='" + HOST + "/tool.js?v='+Date.now();document.body.appendChild(s);})();";
    bookmarklet.setAttribute("href", loader);
    if (!copy) return;

    var status = document.getElementById("copymsg");
    function done() {
      if (status) {
        status.className = "note ok";
        status.textContent = "Copiado. Agora cola num favorito novo.";
      }
      var howto = document.getElementById("howto");
      if (howto) howto.open = true;
    }
    function failed() {
      if (!status) return;
      status.className = "note err";
      status.textContent = "Não consegui copiar. Clica com o botão direito no favorito e copia o endereço.";
    }
    function fallback(code) {
      var ta = document.createElement("textarea");
      ta.value = code; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? done() : failed(); }
      catch (e) { failed(); }
      document.body.removeChild(ta);
    }
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(loader).then(done, function () { fallback(loader); });
      } else fallback(loader);
    });
  }

  /* Courtesy copy only. The endpoint remains the security boundary and escapes all email HTML. */
  var FB_DANGEROUS =
    /<\/?[a-z!][^>]*>|<\s*script|javascript:|vbscript:|on[a-z]+\s*=|data:text\/html|srcdoc\s*=|\{\{[\s\S]*\}\}|<%[\s\S]*%>/i;
  function fbHasCode(s) { return FB_DANGEROUS.test(s); }
  function fbSanitise(s) {
    var out = "", src = String(s).replace(/<\/?[a-z!][^>]*>/gi, "");
    for (var i = 0; i < src.length; i++) {
      var c = src.charCodeAt(i);
      if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) continue;
      if (c === 0x7f || c === 0x200b || c === 0x200c || c === 0x200d ||
          c === 0x2060 || c === 0xfeff) continue;
      out += src.charAt(i);
    }
    return out.trim();
  }

  function wireFeedback() {
    var form = document.getElementById("fb");
    if (!form) return;
    form.hidden = false;
    var token = "";
    var loadedAt = Date.now();
    window.fbToken = function (value) { token = value; };

    var message = document.getElementById("fb-msg");
    var counter = document.getElementById("fb-count");
    function tick() {
      var n = message.value.length, max = 4000;
      counter.textContent = n + "/" + max;
      counter.className = "cnt" + (n > max ? " over" : n > max * .9 ? " near" : "");
    }
    if (message && counter) { message.addEventListener("input", tick); tick(); }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = document.getElementById("fb-status");
      var button = document.getElementById("fb-send");
      var rawMessage = message.value;
      var rawContext = document.getElementById("fb-ctx").value;
      var cleanMessage = fbSanitise(rawMessage);

      if (!cleanMessage) {
        status.className = "form-status err"; status.textContent = "Escreve a mensagem primeiro."; return;
      }
      if (fbHasCode(rawMessage) || fbHasCode(rawContext)) {
        status.className = "form-status err";
        status.textContent = "A mensagem parece conter código ou HTML. Remove-o e tenta novamente.";
        return;
      }
      if (!token) {
        status.className = "form-status err";
        status.textContent = "A verificação anti-spam ainda não terminou. Aguarda um momento e tenta novamente.";
        return;
      }

      button.disabled = true;
      status.className = "form-status";
      status.textContent = "A enviar…";
      fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          context: fbSanitise(rawContext),
          email: fbSanitise(document.getElementById("fb-mail").value),
          website: document.getElementById("fb-web").value,
          token: token,
          elapsed: Date.now() - loadedAt
        })
      }).then(function (response) {
        return response.json().catch(function () { return { ok: false, error: "Resposta inválida do servidor." }; })
          .then(function (data) { return { response: response, data: data }; });
      }).then(function (result) {
        if (!result.response.ok || !result.data.ok) throw new Error(result.data.error || "Não consegui enviar.");
        form.reset(); tick(); button.disabled = false;
        status.className = "form-status ok";
        status.textContent = "Enviado. Obrigado — leio tudo.";
        try { if (window.umami) window.umami.track("relato-enviou"); } catch (e) {}
      }).catch(function (error) {
        button.disabled = false;
        status.className = "form-status err";
        status.textContent = error && error.message ? error.message : "Falhou o envio. Tenta o GitHub ou novamente daqui a pouco.";
      }).then(function () {
        if (window.turnstile) { window.turnstile.reset(); token = ""; }
      });
    });
  }

  function wireChapters() {
    var sections = Array.prototype.slice.call(document.querySelectorAll(".about-wrap > section"));
    sections.forEach(function (section) {
      var heading = section.querySelector("h2");
      if (!heading) return;
      var clone = heading.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll(".note"), function (note) { note.remove(); });
      var label = clone.textContent.replace(/\s+/g, " ").trim();
      if (label.length > 24) {
        var cut = label.slice(0, 24), space = cut.lastIndexOf(" ");
        label = (space > 12 ? cut.slice(0, space) : cut).replace(/[,;:.—-]+$/, "");
      }
      section.setAttribute("data-ch", label);
    });

    var reveal = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!reveal.length || !("IntersectionObserver" in window)) return;
    var armed = false;
    var observer = new IntersectionObserver(function (entries) {
      if (!armed) { document.documentElement.classList.add("js-reveal"); armed = true; }
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });
    reveal.forEach(function (element) { observer.observe(element); });
  }

  function wireTop() {
    var button = document.getElementById("to-top");
    var hero = document.querySelector(".about-hero");
    if (!button || !hero) return;
    button.hidden = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        button.classList.toggle("in", !entries[0].isIntersecting);
      }, { rootMargin: "-40px 0px 0px" }).observe(hero);
    } else button.classList.add("in");
    button.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, behavior: "instant" }); }
      catch (e) { window.scrollTo(0, 0); }
      var home = document.querySelector(".site-brand");
      if (home) home.focus({ preventScroll: true });
    });
  }

  function init() {
    wireBookmarklet();
    wireFeedback();
    wireChapters();
    wireTop();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
