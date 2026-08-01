// Mesa Fiscal - the fixture and source contract. What this pins is HONESTY, not style: the demo
// must not be able to submit, to leak, to fake a hash, to fake coverage, or to loop.
//   node test-demo-contract.js
const fs = require("fs");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const FIX = require("./assets/demo-fixtures.js");

// --- 1. seven journeys, unique ids, every journey complete --------------------------------
const J = FIX.journeys || [];
if (J.length !== 7) bad(`esperadas 7 jornadas, ha ${J.length}`);
const ids = new Set();
const ROUTES = ["/", "/perfil", "/deducoes", "/base-legal", "/verificar", "/consulta"];
for (const j of J) {
  if (ids.has(j.id)) bad(`jornada duplicada: ${j.id}`);
  ids.add(j.id);
  for (const k of ["tabLabel", "title", "summary", "icon", "href", "ctaLabel"])
    if (!j[k]) bad(`${j.id}: falta ${k}`);
  if (j.fixtureKind !== "illustrative") bad(`${j.id}: fixtureKind deve ser "illustrative"`);
  if (!ROUTES.some((r) => j.href === r || j.href.indexOf(r + "#") === 0 || j.href.indexOf("/#") === 0))
    bad(`${j.id}: CTA "${j.href}" nao aponta a uma rota real`);
  if (!Array.isArray(j.acts) || j.acts.length < 4) bad(`${j.id}: menos de 4 atos`);
  const actIds = new Set();
  j.acts.forEach((a, i) => {
    if (actIds.has(a.id)) bad(`${j.id}/${a.id}: ato duplicado`);
    actIds.add(a.id);
    if (!a.label || !a.ariaLabel) bad(`${j.id}/${a.id}: falta label/ariaLabel`);
    if (typeof a.dwellMs !== "number" || a.dwellMs < 0) bad(`${j.id}/${a.id}: dwellMs invalido`);
    const last = i === j.acts.length - 1;
    if (last && a.dwellMs !== 0) bad(`${j.id}: o ultimo ato tem de ser estatico (dwellMs 0) - sem loop`);
    if (!last && a.dwellMs === 0) bad(`${j.id}/${a.id}: ato intermedio estatico`);
  });
}
if (!fails) ok("7 jornadas, ids unicos, CTAs reais, ultimo ato estatico em todas");

// --- 2. the copy that must and must not exist ----------------------------------------------
const all = JSON.stringify(FIX);
// masked NIF only - a 9-digit sequence would read as a real one
if (/\b[1-9]\d{8}\b/.test(all.replace(/500960046/g, ""))) bad("um NIF nao mascarado na fixture");
else ok("NIF apenas mascarado");
if (/sha384-[A-Za-z0-9+/]{20,}/.test(all)) bad("hash falso completo na fixture - so mascarado");
else ok("hashes apenas mascarados");
for (const banned of ["Aplicado", "Submetido", "Classificação concluída", "Alterações guardadas"])
  if (all.indexOf('"' + banned) !== -1 || all.indexOf(banned + '"') !== -1)
    bad(`copy proibida com DRAFT=true: "${banned}"`);
const classificar = J.find((j) => j.id === "classificar");
const finalAct = classificar && classificar.acts[classificar.acts.length - 1];
if (!finalAct || !/[Nn]ada foi submetido/.test(finalAct.say))
  bad("classificar: o ato final nao afirma que nada foi submetido");
else ok("classificar termina em plano: “nada foi submetido”");
if (!/DRAFT/.test(JSON.stringify(finalAct))) bad("classificar: o ato final nao menciona DRAFT");

// --- 3. coverage manifest: nine sources, textual states from the fixed enum ----------------
const COV = FIX.coverage || [];
if (COV.length !== 9) bad(`manifesto de cobertura com ${COV.length} fontes, esperadas 9`);
const STATES = ["validated", "development", "coverage-unknown"];
for (const c of COV) {
  if (STATES.indexOf(c.status) === -1) bad(`${c.id}: estado "${c.status}" fora do enum`);
  if (!c.statusLabel) bad(`${c.id}: sem estado textual`);
  if (/success|done|safe|accurate/i.test(c.status)) bad(`${c.id}: vocabulario proibido`);
}
ok("9 fontes com estado textual do enum fixo");

// disclosure exists and is not empty
if (!FIX.disclosure || FIX.disclosure.length < 30) bad("disclosure de dados ilustrativos em falta");
else ok("disclosure persistente definida");

// --- 4. zero network / storage in the three demo files -------------------------------------
const BANNED = ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
                "localStorage", "sessionStorage", "indexedDB", "document.cookie",
                "location.search", "location.hash", "import("];
for (const f of ["assets/demo-fixtures.js", "assets/demo-stage-core.js", "assets/demo-stage.js"]) {
  // strip comments so a comment naming fetch is not a false positive
  const src = fs.readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const b of BANNED)
    if (src.indexOf(b) !== -1) bad(`${f}: contem "${b}" - a demo nao pode tocar rede/armazenamento`);
  if (/createElement\(\s*["']script/.test(src)) bad(`${f}: cria <script>`);
  if (/javascript:/.test(src)) bad(`${f}: URL javascript: - nunca executar o bookmarklet`);
  // In CODE the word password may not appear at all. In the FIXTURES the copy may state the
  // guarantee ("nada toca em campos de password") - what is banned there is a simulated password
  // FIELD, checked below on the structured data instead of on prose.
  if (f !== "assets/demo-fixtures.js" && /password/i.test(src))
    bad(`${f}: menciona password no codigo`);
}
for (const j of J) for (const a of j.acts) for (const it of (a.items || [])) {
  if (it.kind === "field" && /password|palavra-passe/i.test((it.label || "") + (it.value || "")))
    bad(`${j.id}/${a.id}: campo simulado de password - proibido em absoluto`);
  if (it.kind === "field" && it.typed && /gov\.pt/.test(it.value || ""))
    bad(`${j.id}/${a.id}: digitar um dominio oficial encena escrita na barra de endereco`);
}
ok("zero rede, zero storage, zero script/bookmarklet nos tres ficheiros da demo");

// --- 5. the fixtures are frozen -------------------------------------------------------------
try {
  FIX.journeys.push({});
  bad("fixtures nao estao congeladas");
  FIX.journeys.pop();
} catch (e) { ok("fixtures congeladas (Object.freeze)"); }

// --- 6. index.html carries the no-JS summary and the section sits between prova and faz -----
const idx = fs.readFileSync("index.html", "utf8");
const iProva = idx.indexOf('<section id="prova">');
const iDemo = idx.indexOf('<section id="demonstracao"');
const iFaz = idx.indexOf('<section id="faz">');
if (!(iProva < iDemo && iDemo < iFaz)) bad("#demonstracao nao esta entre #prova e #faz");
else ok("#demonstracao entre #prova e #faz");
const summary = idx.slice(idx.indexOf("data-demo-summary"), idx.indexOf("data-demo-root"));
let links = 0;
for (const href of ["/#empresa-form", "/perfil", "/deducoes", "/base-legal", "/verificar"])
  if (summary.indexOf('href="' + href) !== -1) links++;
if (links < 5) bad(`resumo sem JS so tem ${links}/5 destinos`);
else ok("resumo sem JS cobre os destinos reais");
if (!/data-demo-root[^>]*hidden/.test(idx)) bad("a shell nao arranca escondida (progressive enhancement)");

console.log(fails ? `\n  ${fails} FALHA(S) no contrato da demo` : "\n  contrato da Mesa Fiscal integro");
process.exit(fails ? 1 : 0);
