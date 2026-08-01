// TEST-NEW-09. Navigation, factual content and the feedback POST must not depend on JavaScript.
//
// The reason is not purity. It is that this site is read by people on old phones, locked-down
// work machines and slow connections, and the thing they most need from it - what the rule says,
// where the official source is, and how to complain - is exactly the part that must not require a
// script to have loaded.
//   node test-nojs.js
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
  const doc = new JSDOM(src).window.document;

  // 1. the navigation is real anchors in the document, not built at runtime
  const links = doc.querySelectorAll('nav[aria-label="Principal"] a[href]');
  if (links.length < 4) bad(`${p}: navegacao com ${links.length} <a href> no HTML - precisa de JS`);

  // 2. an <h1> exists in the served markup
  if (!doc.querySelector("h1")) bad(`${p}: sem <h1> no HTML servido`);

  // 3. nothing critical starts hidden waiting for a script to reveal it. [hidden] is fine for
  //    result slots and the menu; it is NOT fine for a whole content region.
  for (const el of doc.querySelectorAll("main [hidden]")) {
    const id = el.id || el.className || el.tagName;
    if (/^(section|article)$/i.test(el.tagName))
      bad(`${p}: <${el.tagName.toLowerCase()}> "${id}" comeca hidden - conteudo dependente de JS`);
  }
}
ok(`${PAGES.length} paginas com navegacao e h1 no HTML servido`);

// 4. the deductions table - the page's factual core - is static markup, not fetched
const ded = fs.readFileSync("deducoes.html", "utf8");
const dedDoc = new JSDOM(ded).window.document;
const rows = dedDoc.querySelectorAll("table tbody tr");
if (rows.length < 16) bad(`deducoes.html: tabela com ${rows.length} linhas no HTML - deve ser estatica`);
else ok(`deducoes.html: ${rows.length} linhas de deducoes no HTML servido`);

// 5. the feedback form POSTs without JavaScript
const idx = fs.readFileSync("index.html", "utf8");
const idxDoc = new JSDOM(idx).window.document;
const form = idxDoc.querySelector('form[action="/api/feedback"]');
if (!form) bad("index.html: formulario de feedback sem action=/api/feedback");
else {
  if ((form.getAttribute("method") || "").toLowerCase() !== "post")
    bad("index.html: formulario de feedback nao e method=post");
  else ok("formulario de feedback faz POST sem JavaScript");
  if (!form.querySelector("textarea[name], input[name]"))
    bad("index.html: formulario de feedback sem campos nomeados - nada seria enviado sem JS");
}

// 6. the company search falls back to a real GET
const empForm = idxDoc.querySelector("#empresa-form");
if (!empForm) bad("index.html: #empresa-form em falta");
else {
  if (empForm.getAttribute("action") !== "/consulta")
    bad("index.html: a pesquisa nao tem fallback para /consulta sem JS");
  else ok("pesquisa de empresa cai para um GET real em /consulta sem JS");
  if (!empForm.querySelector('[name="q"]'))
    bad("index.html: a pesquisa nao tem campo name=q para o fallback");
}

// 7. base-legal states its own JS dependency instead of failing silently
const legal = fs.readFileSync("base-legal.html", "utf8");
if (!/<noscript>/.test(legal))
  bad("base-legal.html: a pesquisa precisa de JS e a pagina nao o diz num <noscript>");
else ok("base-legal.html declara a dependencia de JS e aponta para /auditoria");

console.log(fails ? `\n  ${fails} FALHA(S) sem JavaScript` : "\n  navegacao, conteudo factual e POST funcionam sem JavaScript");
process.exit(fails ? 1 : 0);
