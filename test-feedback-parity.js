// TEST-NEW-04. The client-side feedback check and the server-side one must agree on the limits,
// the dangerous-content pattern and the dwell threshold.
//
// The point is NOT that the client is a security boundary - it is not, and the server stays
// authoritative. The point is that a person who types a "<" into a legitimate sentence about a
// ceiling ("menos de < 250 EUR") must get the same answer from both, and must not be told
// "enviado" by the page and then silently rejected by the endpoint, or vice versa.
//
// test-sanitize.js already pins that the two regexes are textually identical. This pins the
// numbers, the dwell, and that a realistic set of vectors is judged the same way by both.
//   node test-feedback-parity.js
const fs = require("fs");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const server = fs.readFileSync("functions/api/feedback.js", "utf8");
const page = fs.readFileSync("index.html", "utf8");

// --- limits -------------------------------------------------------------------------------
const srvMax = server.match(/const MAX = \{([^}]*)\}/);
if (!srvMax) { bad("feedback.js: nao encontrei o objecto MAX"); }
const limits = {};
if (srvMax) for (const [, k, v] of srvMax[1].matchAll(/(\w+):\s*(\d+)/g)) limits[k] = Number(v);

const EXPECT = { message: 4000, context: 300, email: 200 };
for (const [k, v] of Object.entries(EXPECT)) {
  if (limits[k] !== v) bad(`feedback.js: MAX.${k} = ${limits[k]}, esperado ${v}`);
}
ok(`limites do servidor: message ${limits.message}, context ${limits.context}, email ${limits.email}`);

// the form must advertise the same ceilings via maxlength, or the person is cut off at a
// different point than the server rejects at
const need = [["fb-msg", limits.message], ["fb-ctx", limits.context], ["fb-mail", limits.email]];
for (const [id, max] of need) {
  const tag = (page.match(new RegExp(`<(?:input|textarea)[^>]*id="${id}"[^>]*>`)) || [])[0];
  if (!tag) { bad(`index.html: campo #${id} nao encontrado`); continue; }
  const ml = (tag.match(/maxlength="(\d+)"/) || [])[1];
  if (Number(ml) !== max) bad(`index.html: #${id} maxlength=${ml}, servidor aceita ${max}`);
}
if (!fails) ok("maxlength do formulario == limites do servidor");

// --- dwell --------------------------------------------------------------------------------
const srvDwell = Number((server.match(/MIN_DWELL_MS = (\d+)/) || [])[1]);
if (srvDwell !== 3000) bad(`feedback.js: MIN_DWELL_MS = ${srvDwell}, esperado 3000`);
else ok("dwell minimo de 3000 ms no servidor");
if (!/elapsed/.test(page)) bad("index.html: o cliente nao envia `elapsed` - o dwell nao pode ser validado");
else ok("o cliente envia elapsed para o servidor validar");

// --- honeypot -----------------------------------------------------------------------------
if (!/name="website"/.test(page)) bad("index.html: honeypot `website` em falta");
else ok("honeypot presente no formulario");
if (!/website/.test(server)) bad("feedback.js: o servidor ignora o honeypot");

// --- the dangerous pattern, applied to the same vectors by both ----------------------------
const srvRe = (server.match(/const DANGEROUS =\s*\n\s*\/(.+)\/i;/) || [])[1];
const cliRe = (page.match(/var FB_DANGEROUS =\s*\n?\s*\/(.+)\/i;/) || [])[1];
if (!srvRe) bad("feedback.js: nao encontrei DANGEROUS");
if (!cliRe) bad("index.html: nao encontrei FB_DANGEROUS");

if (srvRe && cliRe) {
  const S = new RegExp(srvRe, "i"), C = new RegExp(cliRe, "i");

  // [text, shouldBeRejected]
  const VECTORS = [
    ["<script>alert(1)</script>", true],
    ["<img src=x onerror=alert(1)>", true],
    ["javascript:alert(1)", true],
    ["<a href='#'>ola</a>", true],
    ["{{constructor.constructor('alert(1)')()}}", true],
    ["<% out.println(1) %>", true],
    ["<iframe srcdoc='x'>", true],
    ["data:text/html;base64,PHN2Zz4=", true],
    ["vbscript:msgbox(1)", true],
    // legitimate fiscal prose that LOOKS dangerous and must pass
    ["O teto e < 250 > 0 euros, certo?", false],
    ["Comprei em 2026 e o IVA foi 23%. A deducao deu 15% ate 1.000 EUR.", false],
    ["A empresa chama-se Silva & Filhos, Lda.", false],
    ["Acho que a classificacao da farmacia esta errada - deveria ser Saude.", false],
    ["Nao percebi a diferenca entre 78.o-B e 78.o-F.", false],
  ];

  let mismatch = 0, wrong = 0;
  for (const [text, shouldReject] of VECTORS) {
    const s = S.test(text), c = C.test(text);
    if (s !== c) { bad(`cliente e servidor discordam em: ${JSON.stringify(text.slice(0, 46))}`); mismatch++; }
    if (s !== shouldReject) {
      bad(`veredicto errado (${s ? "rejeita" : "aceita"}) em: ${JSON.stringify(text.slice(0, 46))}`);
      wrong++;
    }
  }
  if (!mismatch) ok(`${VECTORS.length} vetores: cliente e servidor concordam em todos`);
  if (!wrong) ok("texto fiscal legitimo passa; injecoes sao rejeitadas");
}

// --- the endpoint stays a POST, and the form still points at it ------------------------------
if (!/action="\/api\/feedback"/.test(page)) bad("index.html: o formulario deixou de apontar para /api/feedback");
if (!/method="post"/i.test(page)) bad("index.html: o formulario deixou de ser POST");

console.log(fails ? `\n  ${fails} FALHA(S) de paridade cliente/servidor` : "\n  cliente e servidor concordam em limites, dwell e sanitizacao");
process.exit(fails ? 1 : 0);
