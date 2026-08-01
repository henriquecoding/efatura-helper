// TEST-NEW-01. The shell is duplicated in every page ON PURPOSE - navigation has to work with
// JavaScript off, be announced as a landmark early, and be indexable, none of which a runtime
// injection gives you. The cost of that choice is drift, and this is what pays it: every page must
// carry the same destinations, in the same order, with the same labels and the same menu button.
//
// It also re-runs make-shell.mjs in --check mode, so a hand-edit inside the generated block fails
// here instead of silently diverging from the generator.
//   node test-shell-sync.js
const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const EXPECTED = [
  ["empresa", "/"],
  ["situacao", "/perfil"],
  ["deducoes", "/deducoes"],
  ["legal", "/base-legal"],
];

// page -> current destination. Sobre has its own nav link; other support pages mark nothing.
const PAGES = {
  "index.html": "empresa",
  "consulta.html": "empresa",
  "contrato.html": "empresa",
  "perfil.html": "situacao",
  "deducoes.html": "deducoes",
  "base-legal.html": "legal",
  "auditoria.html": null,
  "verificar.html": null,
  "sobre.html": "sobre",
  "privacidade.html": null,
  "termos.html": null,
  "404.html": null,
};

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

for (const [page, current] of Object.entries(PAGES)) {
  let src;
  try { src = fs.readFileSync(page, "utf8"); }
  catch { bad(`${page}: nao existe`); continue; }

  const doc = new JSDOM(src).window.document;
  const nav = doc.querySelector('nav[aria-label="Principal"]');
  if (!nav) { bad(`${page}: navegacao principal em falta`); continue; }

  const got = [...nav.querySelectorAll("a[data-mode-link]")]
    .map((a) => [a.dataset.modeLink, a.getAttribute("href")]);
  if (JSON.stringify(got) !== JSON.stringify(EXPECTED))
    bad(`${page}: destinos/ordem divergem -> ${JSON.stringify(got)}`);

  // Every destination needs a visible text label. Icon-only navigation fails on exactly the
  // people this product is for (ch.15: the symbol is not a literacy test).
  for (const a of nav.querySelectorAll("a[data-mode-link], a.nav-help, button.nav-menu")) {
    if (!a.textContent.trim()) bad(`${page}: destino sem texto (${a.getAttribute("href") || "menu"})`);
  }

  // aria-current marks the page you are ON. A support page has no link pointing at it, so it must
  // carry none - marking one anyway would tell a screen reader something untrue.
  const marked = [...nav.querySelectorAll('[aria-current="page"]')];
  if (current === null && marked.length)
    bad(`${page}: pagina de apoio nao devia ter aria-current (tem ${marked.length})`);
  if (current === "sobre") {
    if (marked.length !== 1) bad(`${page}: esperado exatamente 1 aria-current, tem ${marked.length}`);
    else if (!marked[0].classList.contains("nav-help"))
      bad(`${page}: aria-current devia estar na ligacao Sobre`);
  } else if (current !== null) {
    if (marked.length !== 1) bad(`${page}: esperado exatamente 1 aria-current, tem ${marked.length}`);
    else if (marked[0].dataset.modeLink !== current)
      bad(`${page}: aria-current em "${marked[0].dataset.modeLink}", esperado "${current}"`);
  }

  const menuBtn = nav.querySelector('button[aria-controls="site-menu"]');
  if (!menuBtn) bad(`${page}: botao de menu nao esta dentro da navegacao`);
  else if (menuBtn.getAttribute("aria-expanded") !== "false")
    bad(`${page}: menu deve arrancar com aria-expanded="false"`);

  if (!doc.getElementById("site-menu")) bad(`${page}: painel #site-menu em falta`);
  if (!doc.querySelector(".security-rule")) bad(`${page}: regra de seguranca em falta`);
  if (!doc.querySelector(".site-brand")) bad(`${page}: marca em falta`);
  if (!doc.querySelector("footer.site-footer")) bad(`${page}: rodape partilhado em falta`);
  if (!doc.querySelector('a.skip-link[href="#conteudo"]')) bad(`${page}: skip link em falta`);
  if (!doc.getElementById("conteudo")) bad(`${page}: alvo #conteudo do skip link em falta`);

  // The security rule must be TEXT, and must name .gov.pt - it is the one claim that carries a
  // real safety consequence, and an image or a paraphrase would not survive translation or zoom.
  const sr = doc.querySelector(".security-rule");
  if (sr && !/\.gov\.pt/.test(sr.textContent)) bad(`${page}: a regra de seguranca nao menciona .gov.pt`);
}
if (!fails) ok(`shell identico em ${Object.keys(PAGES).length} paginas (destinos, ordem, rotulos, menu, aria-current)`);

// the generator itself must be idempotent against what is on disk
try {
  execFileSync("node", ["make-shell.mjs", "--check"], { encoding: "utf8" });
  ok("make-shell.mjs --check: shell gerado esta em sincronia");
} catch (e) {
  bad("make-shell.mjs --check falhou - corre `node make-shell.mjs`\n" +
      String(e.stdout || "").trim().split("\n").map((l) => "         " + l).join("\n"));
}

console.log(fails ? `\n  ${fails} FALHA(S) no shell` : "\n  shell sincronizado");
process.exit(fails ? 1 : 0);
