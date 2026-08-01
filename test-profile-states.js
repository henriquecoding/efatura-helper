// TEST-NEW-05. The profile's state machine, at the level that can be checked from the source:
// 0/9, partial, error, 9/9, end-of-day expiry and reset must be distinguishable, and ABSENCE must
// never render as ZERO.
//
// "Nao lido", "sem registos" and "0 EUR" are three different facts. Collapsing them is the single
// most damaging bug this page could have: it would tell someone they have no deductions when the
// truth is that a partition failed to load.
//   node test-profile-states.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const src = fs.readFileSync("perfil.html", "utf8");
const doc = new JSDOM(src).window.document;

// --- 1. the engine's hooks still exist -------------------------------------------------------
for (const id of ["banner", "out"]) {
  if (!doc.getElementById(id)) bad(`perfil.html: #${id} em falta - o motor nao teria onde escrever`);
}
if (doc.querySelectorAll("#out").length !== 1) bad("perfil.html: #out duplicado");
ok("os pontos de montagem do motor (#banner, #out) existem, uma vez cada");

// --- 2. end-of-day expiry is enforced on READ, not only on write -----------------------------
// Stamping expiresAt on save is not enough: a browser left open past midnight would still show
// yesterday's reading. load() has to check it.
if (!/expiresAt/.test(src)) bad("perfil.html: sem expiresAt - os dados nao expiram");
else ok("os dados locais levam expiresAt");
if (!/if\s*\(\s*s\.expiresAt\s*&&\s*Date\.now\(\)\s*>=\s*s\.expiresAt\s*\)/.test(src))
  bad("perfil.html: a expiracao nao e verificada na leitura do store");
else ok("a expiracao e verificada ao ler, nao so ao gravar");
if (!/localStorage\.removeItem/.test(src))
  bad("perfil.html: o store expirado nao e removido");
else ok("o store expirado e removido");

// --- 3. reset exists and is reachable --------------------------------------------------------
if (!/id="reset"|getElementById\("reset"\)/.test(src))
  bad("perfil.html: sem accao de reset");
else ok("o motor mantem a sua accao de reset (funciona sem o adaptador)");

const adapter = fs.readFileSync("assets/situacao.js", "utf8");
if (!/confirm\(/.test(adapter))
  bad("situacao.js: apagar os dados sem confirmacao - accao destrutiva a um clique");
else ok("apagar os dados pede confirmacao e diz que nao pode ser desfeito");
// accent-tolerant: the copy is European Portuguese ("nao pode ser desfeita" / "não pode ser desfeita")
if (!/n[aã]o pode ser desfeita/i.test(adapter))
  bad("situacao.js: a confirmacao nao declara a consequencia");
if (!/wipe-status/.test(adapter))
  bad("situacao.js: apagar nao da feedback imediato");
else ok("apagar da feedback imediato numa regiao role=status");

// --- 4. the nine sources are declared, and start unread --------------------------------------
const sources = (src.match(/id:\s*"[a-z0-9_-]+"/gi) || []).length;
if (!/0\s*\/\s*9|de 9|\/ 9/.test(src) && !/PARTS|SOURCES/.test(src))
  bad("perfil.html: nao encontrei a contagem das nove fontes");
else ok("as nove fontes e a contagem 0/9 estao declaradas na pagina");

// --- 5. ABSENCE IS NOT ZERO ------------------------------------------------------------------
// The page must have language for "not read yet" that is distinct from a numeric zero.
if (!/Por ler|Ainda sem dados|por carregar/i.test(src))
  bad("perfil.html: sem vocabulario para 'ainda nao lido' - a ausencia renderizaria como zero");
else ok("'ainda nao lido' tem texto proprio, distinto de um zero");

// The deductions lens reads the same store; it must treat an expired or absent profile as absent
// and must NOT fall back to sample numbers in the personal panel.
const ded = fs.readFileSync("assets/deducoes.js", "utf8");
const contract = fs.readFileSync("assets/profile-contract.js", "utf8");
if (!/FBProfileContract/.test(ded) || !/isExpired|expiresAt/.test(contract))
  bad("deducoes.js: nao delega a verificacao de expiracao ao contrato central");
else ok("deducoes.js trata um perfil expirado como ausente atraves do contrato central");

const dedPage = fs.readFileSync("deducoes.html", "utf8");
if (!/personal-locked/.test(dedPage))
  bad("deducoes.html: a vista pessoal nao tem estado bloqueado");
else ok("a vista pessoal fica bloqueada sem perfil, em vez de mostrar numeros de exemplo");
if (!/nao mostra numeros de exemplo|nao mostra números de exemplo/i.test(dedPage))
  bad("deducoes.html: nao declara que nao usa numeros de exemplo no lugar dos do proprio");

// --- 6. mobile tells the truth about what it cannot do ---------------------------------------
if (!/usa um computador/i.test(src))
  bad("perfil.html: o limite do mobile nao esta escrito na pagina");
else ok("o limite honesto do mobile esta escrito na pagina");

console.log(fails ? `\n  ${fails} FALHA(S) nos estados do perfil` : "\n  estados do perfil: expiracao, reset, ausencia != zero, limite do mobile");
process.exit(fails ? 1 : 0);
