// The homepage is operational; Sobre owns the long-form explanation and every former help block.
// This prevents a later shell regeneration or content edit from duplicating, losing or orphaning it.
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const home = fs.readFileSync("index.html", "utf8");
const about = fs.readFileSync("sobre.html", "utf8");
const hdoc = new JSDOM(home).window.document;
const adoc = new JSDOM(about).window.document;

// The long document must have one owner. The homepage keeps only a clear hand-off.
for (const selector of ["#prova", "#demonstracao", "#faz", "#relato", "form#fb", ".box.draft"])
  if (hdoc.querySelector(selector)) bad(`index.html ainda duplica ${selector}`);
if (!hdoc.querySelector('a[href="/sobre#ajuda"]')) bad("index.html nao encaminha para a nova ajuda");
if (/challenges\.cloudflare\.com\/turnstile/.test(home)) bad("index.html ainda descarrega Turnstile sem ter formulario");
else ok("homepage curta: sem documento duplicado nem Turnstile orfao");

const chapters = [
  "prova", "demonstracao", "faz", "apoiar", "classificar", "pedidos-rede", "seguranca",
  "instalar", "setores-fatura", "atividade-comerciante", "porque-existe", "relato", "autor", "fontes"
];
for (const id of chapters) if (!adoc.getElementById(id)) bad(`sobre.html perdeu #${id}`);
const toc = [...adoc.querySelectorAll('.toc a[href^="#"]')];
if (toc.length !== chapters.length) bad(`indice tem ${toc.length} entradas, esperadas ${chapters.length}`);
for (const a of toc) {
  const id = a.getAttribute("href").slice(1);
  if (!adoc.getElementById(id)) bad(`indice aponta para #${id}, que nao existe`);
}
if (!fails) ok("Sobre preserva os 14 capitulos e o indice aponta para alvos reais");

const essentials = [
  ['form[action="/api/feedback"]', "formulario de feedback"],
  ["#bookmarklet", "instalacao por favorito"],
  ["#pedidos-rede", "registo de pedidos de rede"],
  ["table", "tabela de referencia fiscal"],
  ["[data-demo-summary]", "resumo da Mesa sem JavaScript"],
  ["[data-demo-open]", "launcher da Mesa"],
  ['script[src="/assets/about.js"]', "comportamento progressivo da pagina"],
];
for (const [selector, label] of essentials)
  if (!adoc.querySelector(selector)) bad(`sobre.html perdeu ${label}`);

const current = adoc.querySelector('nav[aria-label="Principal"] [aria-current="page"]');
if (!current || current.getAttribute("href") !== "/sobre") bad("a navegacao nao marca Sobre como pagina atual");
if (!adoc.querySelector('a.nav-help[href="/sobre"]')) bad("a antiga Ajuda nao foi renomeada para Sobre");
else ok("Sobre e uma rota de primeira classe e conserva formulario, instalacao, rede, fontes e Mesa");

console.log(fails ? `\n  ${fails} FALHA(S) na reestruturacao de Sobre`
                  : "\n  reestruturacao de Sobre integra e sem duplicacao");
process.exit(fails ? 1 : 0);
