// TEST-NEW-07. The mobile bar carries EXACTLY five destinations, each with an icon AND a text
// label, and the body compensates for its height so the bar never sits on top of the content.
//
// Five is not a style preference: six targets across 390px puts each one under the 48px minimum,
// and dropping the labels to fit is how icon-only navigation gets shipped. So Ajuda folds into
// Menu, and this test fails if a sixth destination ever appears.
//   node test-mobile-nav.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

const css = fs.readFileSync("assets/site.css", "utf8");

// the mobile block
const mq = (css.match(/@media \(max-width: 760px\) \{[\s\S]*?\n\}/g) || []).join("\n");
if (!mq) { bad("assets/site.css: bloco @media (max-width: 760px) em falta"); }

// 1. the bar is fixed to the bottom, full width, and is NOT a floating capsule
if (!/\.primary-nav\s*\{[^}]*position:\s*fixed/.test(mq))
  bad("a navbar mobile nao e fixa ao fundo");
else ok("navbar fixa ao fundo");
if (!/\.primary-nav\s*\{[^}]*inset:\s*auto 0 0/.test(mq))
  bad("a navbar mobile nao ocupa a largura toda (deve ser barra solida, nao capsula)");
else ok("barra solida de largura total, nao capsula flutuante");
if (!/\.primary-nav\s*\{[^}]*border-radius:\s*0/.test(mq))
  bad("a navbar mobile mantem cantos arredondados - vira capsula");

// 2. exactly five columns, and Ajuda hidden so the count is really five
if (!/grid-template-columns:\s*repeat\(5,/.test(mq))
  bad("a navbar mobile nao tem exatamente 5 colunas");
else ok("5 colunas");
/* The rule must be SCOPED under .primary-nav. A bare `.nav-help{display:none}` is (0,1,0) and
   loses to `.primary-nav > :is(a, button){display:grid}` (0,1,1) declared above it, so Ajuda
   stayed visible and the bar wrapped onto two rows with six targets. Checking only that the text
   "display:none" appears is what let that ship - so check the selector that actually wins. */
if (!/\.primary-nav\s+\.nav-help\s*\{\s*display:\s*none/.test(mq))
  bad("a regra que esconde Ajuda nao esta dentro de .primary-nav - perde em especificidade e ficam 6 destinos");
else ok("Ajuda passa para Menu (regra com especificidade suficiente); ficam 5 destinos");

// 3. the body compensates for the bar, including the safe area
if (!/body\s*\{[^}]*padding-bottom:\s*calc\(var\(--nav-h\)[^}]*env\(safe-area-inset-bottom\)/.test(mq))
  bad("o body nao compensa a altura da navbar + safe area");
else ok("body compensa a navbar e o safe-area-inset-bottom");
if (!/env\(safe-area-inset-bottom\)/.test(mq))
  bad("a navbar ignora env(safe-area-inset-bottom)");

// 4. targets stay big enough to hit
const minH = mq.match(/\.primary-nav > :is\(a, button\)\s*\{[^}]*min-height:\s*(\d+)px/);
if (!minH || Number(minH[1]) < 48) bad(`alvos da navbar mobile abaixo de 48px (${minH ? minH[1] : "?"})`);
else ok(`alvos de ${minH[1]}px`);

// 5. focus must never be trapped under the fixed bar
if (!/scroll-padding-bottom:\s*calc\(var\(--nav-h\)/.test(css))
  bad("sem scroll-padding-bottom: um controlo focado pode ficar escondido pela navbar");
else ok("scroll-padding-bottom reserva a altura da navbar");

// 6. every page's markup carries five reachable destinations, each with text
const PAGES = ["index.html", "perfil.html", "deducoes.html", "base-legal.html", "consulta.html",
               "sobre.html", "privacidade.html", "termos.html", "verificar.html", "auditoria.html",
               "contrato.html", "404.html"];
for (const p of PAGES) {
  let src;
  try { src = fs.readFileSync(p, "utf8"); } catch { continue; }
  const doc = new JSDOM(src).window.document;
  const nav = doc.querySelector('nav[aria-label="Principal"]');
  if (!nav) { bad(`${p}: sem navegacao principal`); continue; }

  // what remains visible on mobile: the 4 modes + the menu button (Ajuda is display:none)
  const modes = nav.querySelectorAll("a[data-mode-link]");
  const menu = nav.querySelector("button.nav-menu");
  if (modes.length !== 4) bad(`${p}: ${modes.length} modos, esperados 4`);
  if (!menu) { bad(`${p}: sem botao Menu`); continue; }
  if (modes.length + 1 !== 5) bad(`${p}: a barra mobile nao daria 5 destinos`);

  // the menu button must live INSIDE the nav, not floating beside it
  if (menu.parentElement !== nav) bad(`${p}: o botao Menu esta fora da <nav>`);

  for (const a of modes) {
    if (!a.textContent.trim()) bad(`${p}: destino ${a.dataset.modeLink} sem rotulo de texto`);
    if (!a.querySelector("svg")) bad(`${p}: destino ${a.dataset.modeLink} sem icone`);
  }
  if (!menu.textContent.trim()) bad(`${p}: Menu sem rotulo de texto`);
}
if (!fails) ok(`${PAGES.length} paginas com 5 destinos, cada um com icone + texto`);

console.log(fails ? `\n  ${fails} FALHA(S) na navegacao mobile` : "\n  navegacao mobile conforme");
process.exit(fails ? 1 : 0);
