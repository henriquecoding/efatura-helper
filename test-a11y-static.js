// TEST-NEW-10. The accessibility facts that can be checked from the source alone: labels,
// landmarks, id uniqueness, aria-controls targets, heading order, language, and the rule that an
// icon never carries meaning on its own.
//
// This does not replace a screen-reader pass (A11Y-007 needs NVDA/VoiceOver). It catches the
// regressions that a text edit causes silently - a label pointing at a renamed id, a duplicated
// id after a copy-paste, an h2 promoted to h1 in a second place.
//   node test-a11y-static.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const PAGES = ["index.html", "consulta.html", "perfil.html", "deducoes.html", "base-legal.html",
               "auditoria.html", "verificar.html", "sobre.html", "privacidade.html", "termos.html",
               "404.html", "contrato.html"];

for (const p of PAGES) {
  let src;
  try { src = fs.readFileSync(p, "utf8"); } catch { bad(`${p}: nao existe`); continue; }
  const dom = new JSDOM(src);
  const doc = dom.window.document;

  // --- language
  const lang = doc.documentElement.getAttribute("lang");
  if (!lang || !/^pt/i.test(lang)) bad(`${p}: <html lang> ausente ou nao portugues (${lang})`);

  // --- exactly one h1
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length !== 1) bad(`${p}: ${h1s.length} <h1>, esperado exatamente 1`);

  // --- landmarks
  if (!doc.querySelector("main")) bad(`${p}: sem <main>`);
  if (!doc.querySelector('nav[aria-label]')) bad(`${p}: <nav> sem aria-label`);
  if (!doc.querySelector("footer")) bad(`${p}: sem <footer>`);

  // --- duplicate ids. A duplicate breaks every label/aria reference pointing at it.
  const seen = new Set(), dupes = new Set();
  for (const el of doc.querySelectorAll("[id]")) {
    if (seen.has(el.id)) dupes.add(el.id);
    seen.add(el.id);
  }
  if (dupes.size) bad(`${p}: ids duplicados -> ${[...dupes].slice(0, 6).join(", ")}`);

  // --- every aria-controls / aria-describedby / aria-labelledby points at something real
  for (const attr of ["aria-controls", "aria-describedby", "aria-labelledby"]) {
    for (const el of doc.querySelectorAll(`[${attr}]`)) {
      for (const ref of el.getAttribute(attr).split(/\s+/).filter(Boolean)) {
        if (!doc.getElementById(ref))
          bad(`${p}: ${attr}="${ref}" aponta para um id inexistente`);
      }
    }
  }

  // --- every form control has an accessible name
  for (const el of doc.querySelectorAll("input, select, textarea")) {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "hidden") continue;
    if (el.hasAttribute("aria-hidden")) continue;               // honeypot
    const id = el.getAttribute("id");
    const named = (id && doc.querySelector(`label[for="${id}"]`)) ||
                  el.closest("label") ||
                  el.getAttribute("aria-label") ||
                  el.getAttribute("aria-labelledby") ||
                  el.getAttribute("title");
    if (!named) bad(`${p}: controlo sem nome acessivel (${el.tagName.toLowerCase()}#${id || "?"})`);
  }

  // --- a placeholder is never the only label
  for (const el of doc.querySelectorAll("input[placeholder], textarea[placeholder]")) {
    const id = el.getAttribute("id");
    const hasLabel = (id && doc.querySelector(`label[for="${id}"]`)) || el.closest("label") ||
                     el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
    if (!hasLabel) bad(`${p}: placeholder usado como rotulo (#${id || "?"})`);
  }

  // --- buttons and links have a discernible name (text, aria-label, or a labelled child)
  for (const el of doc.querySelectorAll("a[href], button")) {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    const name = text || el.getAttribute("aria-label") || el.getAttribute("title");
    if (!name) bad(`${p}: <${el.tagName.toLowerCase()}> sem nome acessivel`);
  }

  // --- decorative svg must be hidden from the tree; an <svg> that is the ONLY content of a
  //     control and is aria-hidden would leave that control nameless (caught above).
  for (const svg of doc.querySelectorAll("svg")) {
    if (!svg.hasAttribute("aria-hidden") && !svg.getAttribute("role") &&
        !svg.querySelector("title")) {
      bad(`${p}: <svg> sem aria-hidden nem <title> - entra na arvore sem nome`);
      break;                                   // one report per page is enough to act on
    }
  }

  // --- heading order never skips a level going down
  const levels = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      bad(`${p}: salto de h${levels[i - 1]} para h${levels[i]} na ordem de titulos`);
      break;
    }
  }
}
if (!fails) ok(`${PAGES.length} paginas: landmarks, h1 unico, ids, aria-refs, rotulos e ordem de titulos`);

// --- the focus ring is never removed anywhere in the shared stylesheet
const css = fs.readFileSync("assets/site.css", "utf8");
if (/outline:\s*(none|0)\b/.test(css.replace(/outline:\s*0\s+solid/g, "")))
  bad("assets/site.css: remove o anel de foco em algum lado");
else ok("o anel de foco nunca e removido");
if (!/:focus-visible[\s\S]*outline:\s*3px solid var\(--focus\)/.test(css))
  bad("assets/site.css: sem anel de foco de 3px");

console.log(fails ? `\n  ${fails} FALHA(S) de acessibilidade estatica` : "\n  acessibilidade estatica conforme");
process.exit(fails ? 1 : 0);
