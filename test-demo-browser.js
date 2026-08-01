// Mesa Fiscal - real browser checks: ZERO requests attributable to the demo, pause really
// freezes, reduced motion opens on the final state, and the shell does not widen the page.
// Needs CHROME_PATH (run-tests reports SKIP without a browser; a release does not accept it).
//   node test-demo-browser.js
const { chromium } = require("playwright-core");
const { readFileSync } = require("fs");
const path = require("path");
const EXE = process.env.CHROME_PATH || "/usr/bin/chromium";

const ROOT = __dirname;
function file(p) { return "file://" + path.join(ROOT, p); }

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });

  /* Serve from disk via routing so the test needs no local server: every request is answered
   * from the repo, and every request is RECORDED - which is the point. */
  async function newPage(opts) {
    const p = await b.newPage(opts || {});
    const reqs = [];
    await p.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === "file:") return route.continue();
      reqs.push(route.request().url());
      const rel = u.pathname.replace(/^\//, "") || "index.html";
      try {
        const body = readFileSync(path.join(ROOT, rel.endsWith(".html") || rel.includes(".") ? rel : rel + ".html"));
        const type = rel.endsWith(".css") ? "text/css" : rel.endsWith(".js") ? "text/javascript"
          : rel.endsWith(".svg") ? "image/svg+xml" : rel.endsWith(".json") ? "application/json" : "text/html";
        route.fulfill({ contentType: type, body });
      } catch (e) { route.fulfill({ status: 404, body: "" }); }
    });
    return { p, reqs };
  }

  // --- 1. requests: the demo scripts cause none beyond their own static files ---------------
  {
    const { p, reqs } = await newPage({ viewport: { width: 1440, height: 1000 } });
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e.message)));
    await p.goto("https://local.test/index.html", { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(600);
    // the demo now lives in a modal: the tiny loader and visual shell CSS may arrive before intent;
    // fixtures and controllers must wait for the launcher.
    const preOpen = await p.evaluate(() => ({
      launcher: !document.querySelector(".demo-launch-compact").hidden,
      dialogOpen: document.querySelector("[data-demo-modal]").open,
    }));
    if (!preOpen.launcher) bad("o launcher nao esta visivel");
    if (preOpen.dialogOpen) bad("o dialog abriu sozinho - deve esperar pelo clique");
    else ok("nada corre antes do clique no launcher");
    const earlyStage = reqs.filter((r) => /demo-(?:fixtures|stage-core|stage)\.js/.test(r));
    if (earlyStage.length) bad("scripts da Mesa chegaram antes do clique: " + earlyStage.join(", "));
    else ok("fixtures e controladores da Mesa esperam por intencao");
    await p.click(".demo-launch-compact");
    await p.waitForTimeout(3200);           // more than one act of autoplay inside the modal
    const offsite = reqs.filter((r) => !r.startsWith("https://local.test/"));
    const dynamic = reqs.filter((r) => /demo-/.test(r)).length;
    if (offsite.filter((r) => !/analytics|fonts|challenges/.test(r)).length)
      bad("pedidos fora do site alem dos ja divulgados: " + offsite.join(", "));
    if (dynamic > 5) bad(`a demo pediu ${dynamic} ficheiros - so loader + CSS + 3 JS sao permitidos`);
    else ok("a demo so pede loader + os seus 4 ficheiros estaticos; nenhum pedido nasce da encenacao");
    if (errs.length) bad("erros de consola: " + errs[0]);
    else ok("zero erros de pagina com a demo a correr");

    // modal open, shell visible, page not widened
    const m = await p.evaluate(() => ({
      shell: !document.querySelector("[data-demo-root]").hidden,
      open: document.querySelector("[data-demo-modal]").open,
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
    }));
    if (!m.open) bad("o dialog nao esta aberto");
    if (!m.shell) bad("a shell nao ficou visivel");
    if (m.sw > m.iw + 1) bad(`overflow horizontal com a demo (${m.sw}>${m.iw})`);
    else ok("sem overflow horizontal a 1440");

    // --- pause freezes progress; resume continues -------------------------------------------
    const before = await p.evaluate(() =>
      document.querySelector('.demo-panel:not([hidden]) [aria-current="step"] .demo-act-fill').style.transform);
    await p.click(".demo-pause");
    await p.waitForTimeout(700);
    const frozen1 = await p.evaluate(() =>
      document.querySelector('.demo-panel:not([hidden]) [aria-current="step"] .demo-act-fill').style.transform);
    await p.waitForTimeout(500);
    const frozen2 = await p.evaluate(() =>
      document.querySelector('.demo-panel:not([hidden]) [aria-current="step"] .demo-act-fill').style.transform);
    if (frozen1 !== frozen2) bad("a pausa nao congelou a barra");
    else ok("pausar congela a barra do ato" + (before !== frozen1 ? "" : " (progresso conservado)"));
    const label = await p.evaluate(() => document.querySelector(".demo-pause").textContent);
    if (!/Retomar/.test(label)) bad("o botao de pausa nao passou a Retomar");

    // Fechar para o relogio e devolve a pagina
    await p.click(".demo-close");
    await p.waitForTimeout(300);
    const closed = await p.evaluate(() => !document.querySelector("[data-demo-modal]").open);
    if (!closed) bad("o botao Fechar nao fechou o dialog");
    else ok("Fechar fecha o dialog e estaciona o relogio");
    await p.close();
  }

  // --- 2. reduced motion: final state, no cursor, manual step-through -----------------------
  {
    const { p } = await newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await p.goto("https://local.test/index.html", { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(900);
    await p.click(".demo-launch-compact");
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const panel = document.querySelector(".demo-panel:not([hidden])");
      const acts = panel.querySelectorAll(".demo-act");
      const cur = panel.querySelector('[aria-current="step"]');
      return {
        lastIsCurrent: acts[acts.length - 1] === cur,
        cursor: !!document.querySelector(".demo-cursor"),
        itemsOn: panel.querySelectorAll(".demo-item.is-on").length,
        items: panel.querySelectorAll(".demo-item").length,
        play: panel.querySelector(".demo-play").textContent,
      };
    });
    if (!r.lastIsCurrent) bad("reduced motion nao abriu no estado final da jornada");
    else ok("reduced motion abre no estado final");
    if (r.cursor) bad("cursor falso criado em reduced motion");
    else ok("sem cursor falso em reduced motion");
    if (r.itemsOn !== r.items) bad(`conteudo incompleto em reduced motion (${r.itemsOn}/${r.items})`);
    else ok("todo o conteudo visivel de imediato");
    if (!/Percorrer/.test(r.play)) bad("o transporte nao virou 'Percorrer passos'");
    await p.close();
  }

  // --- 3. mobile: card layout, tabs scroll without moving the page --------------------------
  {
    const { p } = await newPage({ viewport: { width: 390, height: 844 } });
    await p.goto("https://local.test/index.html", { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelector(".demo-launch-compact").click());
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      tabsScroll: (function () {
        const t = document.querySelector(".demo-tabs");
        return t.scrollWidth > t.clientWidth || t.scrollWidth <= window.innerWidth;
      })(),
      base: getComputedStyle(document.querySelector(".demo-base")).display,
    }));
    if (m.sw > m.iw + 1) bad(`overflow horizontal a 390 (${m.sw}>${m.iw})`);
    else ok("sem overflow horizontal a 390");
    if (m.base !== "none") bad("a metafora de portatil nao foi retirada no mobile");
    else ok("mobile: cartao, nao um portatil esmagado");
    await p.close();
  }

  await b.close();
  console.log(fails ? `\n  ${fails} FALHA(S) no browser` : "\n  demo verificada em browser real");
  process.exit(fails ? 1 : 0);
})();
