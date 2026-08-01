// TEST-NEW-03. The searched term - a NIF or a company name - must never reach the URL, the
// history, a data-* attribute, an analytics property, or a log.
//
// This is not hypothetical. The original shipped `history.replaceState(null,"","?q="+nif)`, and
// because Umami auto-tracks replaceState, every searched NIF landed in url_query on the analytics
// server. The fix was to stop writing it; this test is what stops it coming back.
//
//   node test-privacy-urls.js
const fs = require("fs");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

// --- 1. no page or script may push/replace a term into the URL ------------------------------
const FILES = [
  "index.html", "consulta.html", "deducoes.html", "base-legal.html", "perfil.html",
  "assets/empresa.js", "assets/site.js", "assets/deducoes.js", "assets/base-legal.js",
  "assets/situacao.js",
];

// pushState/replaceState carrying anything that looks like a built query string.
const STATE_WRITE = /history\.(?:replace|push)State\s*\([^)]*[?&]q=/i;
// the older, blunter form: replaceState with a concatenated variable
const STATE_CONCAT = /history\.(?:replace|push)State\s*\([^)]*\+\s*(?:q|nif|term|value)/i;

for (const f of FILES) {
  let src;
  try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (STATE_WRITE.test(src)) bad(`${f}: escreve o termo na URL via history.*State`);
  if (STATE_CONCAT.test(src)) bad(`${f}: concatena um termo para dentro de history.*State`);
}
if (!fails) ok("nenhum ficheiro escreve o termo pesquisado na URL");

// --- 2. analytics events may not carry a value ----------------------------------------------
// Allowed properties, from the event table in ch.13. Anything else is a leak until proven not.
const ALLOWED_PROPS = /^\{\s*(?:mode|kind)\s*:/;
let evFails = 0;
for (const f of FILES) {
  let src;
  try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
  const calls = src.match(/umami\.track\(([^)]*)\)/g) || [];
  for (const c of calls) {
    const args = c.replace(/^umami\.track\(/, "").replace(/\)$/, "");
    const comma = args.indexOf(",");
    if (comma === -1) continue;                      // name only - always fine
    const props = args.slice(comma + 1).trim();
    if (!ALLOWED_PROPS.test(props)) {
      bad(`${f}: evento com propriedades nao permitidas -> ${props.slice(0, 70)}`);
      evFails++;
    }
    /* Look for VARIABLES that hold user input, not the words themselves: `{ kind: "nif" }` sends
       the literal string "nif" (which is the allowed thing - the KIND of search), whereas
       `{ kind: nif }` would send the number. So strip string literals first, then look for a bare
       identifier. Without this the check flagged its own allowed case. */
    const noStrings = props.replace(/"[^"]*"|'[^']*'/g, '""');
    if (/:\s*(nif|term|q|value|input|email|mensagem|message)\b/i.test(noStrings)) {
      bad(`${f}: evento carrega um valor do utilizador -> ${props.slice(0, 70)}`);
      evFails++;
    }
  }
}
if (!evFails) ok("nenhum evento de analytics carrega o valor pesquisado");

// --- 3. the beacon must exclude query and hash on every page --------------------------------
// data-exclude-search keeps ?q= out of the report even if something ever writes it again; the
// host guard keeps the beacon from firing off the real domain.
const PAGES = ["index.html", "consulta.html", "deducoes.html", "base-legal.html", "perfil.html",
               "auditoria.html", "verificar.html", "sobre.html", "privacidade.html",
               "termos.html", "404.html", "contrato.html"];
let beacon = 0;
for (const p of PAGES) {
  let src;
  try { src = fs.readFileSync(p, "utf8"); } catch { continue; }
  const tag = (src.match(/<script[^>]*analytics\.d1060\.com[^>]*>/) || [])[0];
  if (!tag) continue;                                 // a page without the beacon cannot leak
  beacon++;
  if (!/data-exclude-search="true"/.test(tag)) bad(`${p}: beacon sem data-exclude-search`);
  if (!/data-exclude-hash="true"/.test(tag)) bad(`${p}: beacon sem data-exclude-hash`);
  if (!/data-domains="faturas\.diogoandrade\.com"/.test(tag)) bad(`${p}: beacon sem host guard`);
}
ok(`beacon verificado em ${beacon} paginas (exclui query, hash e host)`);

// --- 4. the search form must not be a GET that echoes the term into a tracked URL -----------
// The no-JS fallback DOES submit to /consulta?q=..., which is unavoidable without JS and is why
// data-exclude-search exists. What must not happen is the JS path leaving it there too.
const emp = fs.readFileSync("assets/empresa.js", "utf8");
if (!/preventDefault/.test(emp)) bad("empresa.js: o caminho com JS nao intercepta o submit");
else ok("empresa.js intercepta o submit e resolve o termo sem o escrever na URL");

console.log(fails ? `\n  ${fails} FALHA(S) de privacidade de URL` : "\n  o termo pesquisado nao sai para URL, history ou analytics");
process.exit(fails ? 1 : 0);
