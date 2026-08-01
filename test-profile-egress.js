// The fiscal profile is a local-only surface. This regression test prevents the removed
// contribution flow (response shapes, recoverable total and derived identifier) from returning.
const fs = require("fs");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const profile = fs.readFileSync("perfil.html", "utf8");
const privacy = fs.readFileSync("privacidade.html", "utf8");
const removedDestination = ["cae-db", "diogoandrade.com"].join(".");

const forbidden = [
  [removedDestination, "destino externo antigo"],
  ["sendShare", "envio das estruturas"],
  ["sendCounter", "envio do total recuperável"],
  ["COUNTER_PUBKEY_B64", "cifra do identificador para envio"],
  ['id="share"', "controlo de consentimento obsoleto"],
  ['"/shapes"', "endpoint de estruturas"],
  ['"/counter"', "endpoint do contador"],
];

for (const [needle, label] of forbidden)
  if (profile.includes(needle)) bad("perfil.html ainda contém " + label);

if (/\bfetch\s*\(/.test(profile)) bad("perfil.html ainda executa pedidos de rede");
if (!profile.includes('localStorage.removeItem("fb-profile-share")'))
  bad("a preferência antiga de contribuição não é eliminada");
if (!profile.includes('id="copyshape"'))
  bad("a cópia local e manual das estruturas desapareceu com a remoção do envio");

if (!/não envia para servidores externos/.test(privacy))
  bad("Privacidade não declara que o perfil deixou de enviar dados");
if (!/antiga contribuição opcional foi removida/.test(privacy))
  bad("Privacidade não documenta a remoção da contribuição");
if (!/href="\/sobre#pedidos-rede"/.test(privacy))
  bad("Privacidade não encaminha os restantes pedidos funcionais para o registo de rede");

if (!fails) ok("perfil sem egressão; preferência antiga removida e contrato de privacidade alinhado");

console.log(fails ? "\n  " + fails + " FALHA(S) de egressão do perfil"
                  : "\n  o perfil fiscal permanece integralmente no navegador");
process.exit(fails ? 1 : 0);
