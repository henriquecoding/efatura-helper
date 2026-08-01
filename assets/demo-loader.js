/* Carrega a Mesa Fiscal apenas quando alguem pede para a abrir. O HTML e o resumo sem JS existem
 * antes disto; este ficheiro pequeno evita descarregar a encenacao inteira em todas as visitas. */
(function () {
  "use strict";
  var launchers = Array.prototype.slice.call(document.querySelectorAll("[data-demo-open]"));
  if (!launchers.length) return;
  var loading = null;

  function stylesheet(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.href = href;
    document.head.appendChild(link);
  }
  function script(src) {
    return new Promise(function (resolve, reject) {
      var node = document.createElement("script");
      node.src = src; node.onload = resolve; node.onerror = reject;
      document.head.appendChild(node);
    });
  }
  function load() {
    if (loading) return loading;
    stylesheet("/assets/demo-stage.css");
    loading = script("/assets/demo-fixtures.js")
      .then(function () { return script("/assets/demo-stage-core.js"); })
      .then(function () { return script("/assets/demo-stage.js"); });
    return loading;
  }

  function firstClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var launcher = event.currentTarget;
    launcher.setAttribute("aria-busy", "true");
    load().then(function () {
      launchers.forEach(function (item) { item.removeEventListener("click", firstClick, true); });
      launcher.removeAttribute("aria-busy");
      launcher.click();
    }).catch(function () {
      launcher.removeAttribute("aria-busy");
      launcher.setAttribute("aria-disabled", "true");
      var title = launcher.querySelector("b");
      if (title) title.textContent = "Não foi possível carregar a demonstração";
    });
  }

  launchers.forEach(function (launcher) {
    launcher.hidden = false;
    launcher.addEventListener("click", firstClick, true);
  });
})();
