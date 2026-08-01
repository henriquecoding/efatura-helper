// TEST-NEW-06. Every rule that /base-legal can show must be able to point at its source, its
// place in the code, and its verification state. A rule card with a dead link, or one that renders
// green without a freshness entry behind it, is exactly the "green but wrong" failure the audit
// layer exists to prevent.
//
// This checks the DATA the page joins, not the pixels: legal_sources.json x audit-manifest.json x
// audit-freshness.json must be joinable, and the join must never manufacture a confirmation.
//   node test-legal-index.js
const fs = require("fs");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const legal = JSON.parse(fs.readFileSync("legal_sources.json", "utf8"));
const audit = JSON.parse(fs.readFileSync("audit-manifest.json", "utf8"));
const fresh = JSON.parse(fs.readFileSync("audit-freshness.json", "utf8"));
const js = fs.readFileSync("assets/base-legal.js", "utf8");

// --- 1. every source is addressable ---------------------------------------------------------
const ids = new Set();
for (const s of legal.sources) {
  if (!s.id) { bad("uma fonte sem id em legal_sources.json"); continue; }
  if (ids.has(s.id)) bad(`id duplicado em legal_sources.json: ${s.id}`);
  ids.add(s.id);
  /* https, with one documented exception: www.sicae.pt does not serve https at all (the TLS
     handshake fails, checked 01-08-2026). Rewriting it to https would produce a dead link, so the
     honest record is the http URL plus this note. Any OTHER http source is a defect. */
  if (!s.url) bad(`${s.id}: sem url`);
  else if (!/^https:\/\//.test(s.url) && s.id !== "sicae")
    bad(`${s.id}: url nao-https (${s.url}) - so o sicae tem excecao documentada`);
  if (!s.governs) bad(`${s.id}: sem "governs" - a ficha nao teria o que dizer`);
}
ok(`${legal.sources.length} fontes, todas com id unico e url https`);

// --- 2. every source the page can show is classified into a topic ---------------------------
// The taxonomy lives in base-legal.js on purpose (it is a decision, not something to infer from an
// article number). If a source is added to the data and not to the taxonomy, the page would file
// it under a default topic silently - so the mapping must cover every id.
const mapped = new Set();
const topicBlock = (js.match(/var TOPIC = \{([\s\S]*?)\};/) || [])[1] || "";
for (const [, id] of topicBlock.matchAll(/"([\w-]+)":/g)) mapped.add(id);
const unmapped = [...ids].filter((id) => !mapped.has(id));
if (unmapped.length) bad(`fontes sem tema atribuido em base-legal.js: ${unmapped.join(", ")}`);
else ok(`${mapped.size} fontes classificadas por tema`);

const ghost = [...mapped].filter((id) => !ids.has(id));
if (ghost.length) bad(`base-legal.js classifica ids que ja nao existem: ${ghost.join(", ")}`);

// --- 3. every audit row cites a source that exists, and has a place in the code --------------
for (const r of audit.rows || []) {
  if (!r.source_url || !/^https:\/\//.test(r.source_url))
    bad(`${r.code}: linha da matriz sem fonte oficial`);
  if (!r.code_location || !/^tool\.js:/.test(r.code_location))
    bad(`${r.code}: sem localizacao no codigo`);
  if (r.source_id && !ids.has(r.source_id))
    bad(`${r.code}: cita source_id "${r.source_id}" que nao existe em legal_sources.json`);
}
ok(`${(audit.rows || []).length} linhas da matriz com fonte oficial e localizacao no codigo`);

// --- 4. freshness only ever describes sources that exist ------------------------------------
const fmap = {};
for (const s of fresh.sources || []) {
  if (!ids.has(s.id)) bad(`audit-freshness.json refere "${s.id}", ausente de legal_sources.json`);
  fmap[s.id] = s.status;
}
if (!fresh._checked) bad("audit-freshness.json sem data _checked - a pagina nao poderia dizer quando conferiu");
else ok(`frescura conferida em ${fresh._checked}, ${Object.keys(fmap).length} fontes`);

// --- 5. THE RULE THAT MATTERS: nothing is green without proof --------------------------------
// base-legal.js must map only "OK" to the confirmed state. Any other status - and the absence of
// a status - has to fall through to "Por confirmar".
if (!/e\.freshness === "OK"/.test(js))
  bad("base-legal.js nao condiciona o estado confirmado a freshness === 'OK'");
else ok('so freshness "OK" produz "Conferido na fonte"');

if (!/Por confirmar/.test(js))
  bad("base-legal.js nao tem estado 'Por confirmar' - uma fonte sem prova ficaria sem estado");
else ok("fontes sem prova caem em 'Por confirmar', nunca em verde");

// A source with a non-OK status must not be reachable by the confirmed branch. Crude but real:
// the confirmed string must appear exactly once, inside the OK branch.
const confirmedHits = (js.match(/Conferido na fonte/g) || []).length;
if (confirmedHits !== 1) bad(`"Conferido na fonte" aparece ${confirmedHits}x em base-legal.js - deve haver um unico caminho para o verde`);

// --- 6. the page must not send the search phrase anywhere -----------------------------------
if (/fetch\([^)]*\+\s*(?:term|q)\b/.test(js))
  bad("base-legal.js envia o termo pesquisado numa chamada de rede");
else ok("a frase pesquisada nao sai do navegador");

console.log(fails ? `\n  ${fails} FALHA(S) no indice legal` : "\n  cada regra liga a fonte, ao codigo e ao seu estado de verificacao");
process.exit(fails ? 1 : 0);
