// The profile written by tool.js must be read with exactly one key/schema by every consumer.
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const src = fs.readFileSync("assets/profile-contract.js", "utf8");
const dom = new JSDOM("<!doctype html>", { runScripts: "dangerously", url: "https://local.test" });
dom.window.eval(src);
const C = dom.window.FBProfileContract;
if (!C) bad("FBProfileContract nao foi publicado");
else if (C.KEY !== "fb-profile-v1") bad(`chave central e ${C.KEY}, esperada fb-profile-v1`);

function memory(initial) {
  const data = Object.assign({}, initial);
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null,
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    has: (k) => Object.prototype.hasOwnProperty.call(data, k),
  };
}

if (C) {
  const now = 1_700_000_000_000;
  const profile = { expiresAt: now + 1000, partitions: {
    efatura: { status: "done", data: { pendentes: 2 } },
    patrimonio: { status: "error", data: null }
  }};
  const store = memory({ [C.KEY]: JSON.stringify(profile) });
  const read = C.read(store, now);
  if (!read || read.partitions.efatura.data.pendentes !== 2) bad("perfil valido nao foi lido");
  const done = C.completedPartitions(read);
  if (JSON.stringify(done) !== JSON.stringify(["efatura"])) bad(`particoes concluidas erradas: ${done}`);

  const expired = memory({ [C.KEY]: JSON.stringify({ expiresAt: now - 1, partitions: {} }) });
  if (C.read(expired, now) !== null) bad("perfil expirado foi aceite");
  if (expired.has(C.KEY)) bad("perfil expirado nao foi removido");
  if (C.read(memory({ [C.KEY]: "{" }), now) !== null) bad("JSON corrompido foi aceite");
  ok("contrato le o perfil valido e rejeita expirado/corrompido");
}

for (const page of ["perfil.html", "deducoes.html"]) {
  const html = fs.readFileSync(page, "utf8");
  const posContract = html.indexOf('/assets/profile-contract.js');
  if (posContract === -1) bad(`${page} nao carrega o contrato central`);
}
for (const file of ["assets/situacao.js", "assets/deducoes.js"])
  if (!/FBProfileContract/.test(fs.readFileSync(file, "utf8"))) bad(`${file} contorna o contrato central`);

const dedHtml = fs.readFileSync("deducoes.html", "utf8");
const dedJs = fs.readFileSync("assets/deducoes.js", "utf8");
for (const legacy of ["fb-profile-deducoes-v1", "ded-year", "ded-kind"])
  if (dedHtml.includes(legacy) || dedJs.includes(legacy)) bad(`deducoes ainda contem o contrato/controlo placebo ${legacy}`);
if (!fails) ok("situacao e deducoes partilham a mesma chave; filtros placebo foram removidos");

console.log(fails ? `\n  ${fails} FALHA(S) no contrato de perfil`
                  : "\n  contrato de perfil unico e funcional");
process.exit(fails ? 1 : 0);
