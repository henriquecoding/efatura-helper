// Mesa Fiscal - static + jsdom accessibility. Mounts the real scripts over the real section
// markup and asserts the APG tabs contract, the disclosure and the announcement channel.
//   node test-demo-a11y.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const idx = fs.readFileSync("index.html", "utf8");
const secStart = idx.indexOf('<section id="demonstracao"');
const secEnd = idx.indexOf("</section>", secStart) + "</section>".length;
const sectionHtml = idx.slice(secStart, secEnd);

const page = "<!doctype html><html lang='pt'><body>" + sectionHtml + "</body></html>";
const dom = new JSDOM(page, { runScripts: "dangerously", pretendToBeVisual: true });
const w = dom.window, doc = w.document;

// jsdom lacks these; the controller must cope (no observer -> visible and parked)
w.matchMedia = w.matchMedia || function () { return { matches: false, addEventListener: function () {} }; };

for (const f of ["assets/demo-fixtures.js", "assets/demo-stage-core.js", "assets/demo-stage.js"]) {
  const s = doc.createElement("script");
  s.textContent = fs.readFileSync(f, "utf8");
  doc.body.appendChild(s);
}

setTimeout(() => {
  // --- mount happened; summary hidden, shell shown -------------------------------------------
  const shell = doc.querySelector("[data-demo-root]");
  if (!shell || shell.hidden) bad("a shell nao montou");
  else ok("shell montada por progressive enhancement");
  const summary = doc.querySelector("[data-demo-summary]");
  if (summary && !summary.hidden) bad("o resumo estatico ficou visivel em duplicado");

  // --- tablist per APG -----------------------------------------------------------------------
  const tablist = doc.querySelector('[role="tablist"]');
  if (!tablist) { bad("sem tablist"); }
  else {
    if (!tablist.getAttribute("aria-label")) bad("tablist sem nome");
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    if (tabs.length !== 7) bad(`${tabs.length} tabs, esperadas 7`);
    else ok("7 tabs num unico tablist");
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    if (selected.length !== 1) bad(`${selected.length} tabs selecionadas, esperada 1`);
    const roving = tabs.filter((t) => t.tabIndex === 0);
    if (roving.length !== 1) bad(`roving tabindex quebrado: ${roving.length} tabs com tabindex 0`);
    else ok("roving tabindex: exatamente uma tab alcancavel por Tab");
    for (const t of tabs) {
      const panel = doc.getElementById(t.getAttribute("aria-controls") || "");
      if (!panel) bad(`tab ${t.id}: aria-controls sem alvo`);
      else if (panel.getAttribute("role") !== "tabpanel") bad(`tab ${t.id}: alvo nao e tabpanel`);
      else if (panel.getAttribute("aria-labelledby") !== t.id) bad(`painel de ${t.id}: aria-labelledby errado`);
      if (!t.textContent.trim()) bad(`tab ${t.id}: sem texto visivel`);
    }
    const hiddenPanels = [...doc.querySelectorAll('[role="tabpanel"]')].filter((p) => p.hidden);
    if (hiddenPanels.length !== 6) bad(`${hiddenPanels.length} paineis escondidos, esperados 6`);
    else ok("paineis inativos hidden; controls/labelledby integros");

    // the report link must NOT be a tab
    const report = doc.querySelector(".demo-report");
    if (report && report.getAttribute("role") === "tab") bad("Reportar erro entrou no tablist");

    // --- keyboard: arrows move focus without activating --------------------------------------
    const before = doc.querySelector('[role="tab"][aria-selected="true"]').id;
    tabs[0].focus();
    tabs[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const after = doc.querySelector('[role="tab"][aria-selected="true"]').id;
    if (before !== after) bad("seta ativou uma tab - a ativacao deve ser manual");
    else ok("setas movem o foco sem ativar (ativacao manual)");
    const nowFocusable = tabs.filter((t) => t.tabIndex === 0);
    if (nowFocusable.length !== 1) bad("roving tabindex nao acompanhou a seta");
  }

  // --- act ruler -----------------------------------------------------------------------------
  const acts = doc.querySelector(".demo-acts");
  if (!acts || acts.tagName !== "OL") bad("a regua de atos nao e uma lista ordenada");
  else ok("regua de atos e uma <ol> nomeada");
  const current = doc.querySelectorAll('.demo-panel:not([hidden]) [aria-current="step"]');
  if (current.length !== 1) bad(`${current.length} atos com aria-current="step", esperado 1`);
  else ok("exatamente um ato corrente");
  for (const b of doc.querySelectorAll(".demo-act"))
    if (!/Passo \d+ de \d+/.test(b.getAttribute("aria-label") || "")) {
      bad("um ato sem aria-label 'Passo N de M'"); break;
    }

  // --- disclosure: chip + figcaption + accessible name ---------------------------------------
  const fig = doc.querySelector("figure.demo-stage");
  if (!fig || !fig.getAttribute("aria-label")) bad("figure sem nome acessivel");
  if (!doc.querySelector("figure.demo-stage > figcaption")) bad("sem figcaption persistente");
  if (!doc.querySelector(".demo-panel:not([hidden]) .example-badge")) bad("sem chip de exemplo no painel ativo");
  if (fails === 0) ok("disclosure triplo presente (chip, figcaption, nome do figure)");

  // --- one polite status channel -------------------------------------------------------------
  const statuses = doc.querySelectorAll('#demonstracao [role="status"]');
  if (statuses.length !== 1) bad(`${statuses.length} regioes de status, esperada 1`);
  else ok("um unico canal role=status");

  // --- decorative svg hidden; window dots not clickable --------------------------------------
  for (const svg of doc.querySelectorAll("#demonstracao svg"))
    if (!svg.getAttribute("aria-hidden")) { bad("svg decorativo sem aria-hidden na demo"); break; }
  const dots = doc.querySelector(".demo-dots");
  if (dots && (dots.tagName === "BUTTON" || dots.querySelector("button, a")))
    bad("os marcadores de janela parecem clicaveis");
  else ok("marcadores de janela decorativos e inertes");

  // --- CTA is a real anchor ------------------------------------------------------------------
  const cta = doc.querySelector(".demo-panel:not([hidden]) .demo-cta");
  if (!cta || cta.tagName !== "A" || !cta.getAttribute("href")) bad("CTA nao e um <a> real");
  else ok("CTA e um <a href> real");

  console.log(fails ? `\n  ${fails} FALHA(S) de acessibilidade na demo` : "\n  demo acessivel conforme APG");
  process.exit(fails ? 1 : 0);
}, 400);
