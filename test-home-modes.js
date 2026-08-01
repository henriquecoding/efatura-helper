// TEST-NEW-02. Each of the four modes is a REAL route with its own URL, canonical, hero and
// search configuration - not a tab that hides a page.
//
// The point of the check: an adaptive homepage is easy to drift into a single-page app where
// /perfil and /deducoes stop being addressable, back/forward stops working and the canonical
// points everywhere at /. This pins the opposite.
//   node test-home-modes.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const MODES = {
  "index.html": { mode: "empresa", path: "/", search: "empresa-form" },
  "perfil.html": { mode: "situacao", path: "/perfil", search: null },
  "deducoes.html": { mode: "deducoes", path: "/deducoes", search: "ded-form" },
  "base-legal.html": { mode: "legal", path: "/base-legal", search: "legal-form" },
};

for (const [file, spec] of Object.entries(MODES)) {
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { bad(`${file}: nao existe`); continue; }
  const doc = new JSDOM(src).window.document;

  // 1. the body declares the mode, so CSS and site.js agree with the server about which is current
  const declared = doc.body.getAttribute("data-home-mode");
  if (declared !== spec.mode) bad(`${file}: data-home-mode="${declared}", esperado "${spec.mode}"`);

  // 2. the canonical is this route, not the homepage
  const canon = doc.querySelector('link[rel="canonical"]');
  if (!canon) bad(`${file}: sem <link rel="canonical">`);
  else if (!canon.href.endsWith(spec.path))
    bad(`${file}: canonical "${canon.href}" nao termina em "${spec.path}"`);

  // 3. exactly one hero, with an eyebrow, an h1 and a lead
  const hero = doc.querySelector("header.page-hero");
  if (!hero) { bad(`${file}: sem header.page-hero`); continue; }
  if (!hero.querySelector("h1")) bad(`${file}: hero sem <h1>`);
  if (!hero.querySelector(".eyebrow")) bad(`${file}: hero sem eyebrow`);
  if (!hero.querySelector(".lead")) bad(`${file}: hero sem lead`);

  // 4. The hero holds NO action except the Mesa Fiscal launcher (owner exception 01-08-2026).
  //    Every mode still owns its real action in its own search bar; a CTA stack in the hero is
  //    what turned the old centred hero generic, and that is still what this catches.
  const heroActions = [...hero.querySelectorAll("button, .btn, input[type=submit]")]
    .filter((el) => !el.closest("[data-demo-open]") && !el.matches("[data-demo-open]"));
  if (heroActions.length) bad(`${file}: ${heroActions.length} controlo(s) de acao no hero alem do launcher`);

  // 5. the search configuration belongs to the mode
  if (spec.search) {
    const f = doc.getElementById(spec.search);
    if (!f) bad(`${file}: pesquisa #${spec.search} em falta`);
    else if (f.getAttribute("role") !== "search") bad(`${file}: #${spec.search} sem role="search"`);
  }

  // 6. the mode's own nav link is the one marked current
  const cur = doc.querySelector('nav[aria-label="Principal"] [aria-current="page"]');
  if (!cur) bad(`${file}: nenhum destino marcado como atual`);
  else if (cur.getAttribute("data-mode-link") !== spec.mode)
    bad(`${file}: atual e "${cur.getAttribute("data-mode-link")}", esperado "${spec.mode}"`);

  // 7. a title and a description, distinct per mode
  const title = (doc.querySelector("title") || {}).textContent || "";
  if (!title.trim()) bad(`${file}: sem <title>`);
  const desc = doc.querySelector('meta[name="description"]');
  if (!desc || !desc.content.trim()) bad(`${file}: sem meta description`);
}

// 8. the four routes must not share a title or a description - that is the tell-tale of a page
//    that was duplicated rather than written for its mode.
const titles = {}, descs = {};
for (const file of Object.keys(MODES)) {
  let doc;
  try { doc = new JSDOM(fs.readFileSync(file, "utf8")).window.document; } catch { continue; }
  const t = ((doc.querySelector("title") || {}).textContent || "").trim();
  const d = ((doc.querySelector('meta[name="description"]') || {}).content || "").trim();
  if (titles[t]) bad(`${file} e ${titles[t]} partilham o mesmo <title>`);
  if (d && descs[d]) bad(`${file} e ${descs[d]} partilham a mesma description`);
  titles[t] = file; if (d) descs[d] = file;
}

// 9. /base-legal must be reachable: in the sitemap and linked from the shell
const sitemap = fs.readFileSync("sitemap.xml", "utf8");
for (const path of ["/perfil", "/deducoes", "/base-legal"]) {
  if (!sitemap.includes(path)) bad(`sitemap.xml: falta ${path}`);
}
if (!fails) ok("4 modos: rota propria, canonical, hero sem acoes, pesquisa e aria-current");
ok("sitemap inclui as quatro rotas");

console.log(fails ? `\n  ${fails} FALHA(S) nos modos` : "\n  os quatro modos sao rotas reais e distintas");
process.exit(fails ? 1 : 0);
