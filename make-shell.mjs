// Write the shared shell (security rule, brand, primary nav, menu, footer) into every page.
//
// WHY A GENERATOR AND NOT A RUNTIME INJECTION: the shell must be real HTML in every document, so
// navigation works with JavaScript off, the landmarks are announced early, and each route is
// indexable (ch.17). That means the markup is duplicated across 12 files - and duplicated markup
// drifts. The project has no template build, so the fix is: generate it from one source here, and
// let test-shell-sync.js fail the build when a page diverges. Same contract as make-audit.mjs.
//
//   node make-shell.mjs          rewrite the shell block in every page
//   node make-shell.mjs --check  exit 1 if any page is out of date (used by the test)
//
// Everything OUTSIDE the FB:SHELL markers is left untouched - this never rewrites page content.
import { readFileSync, writeFileSync } from "fs";

const START = "<!-- FB:SHELL:START (gerado por make-shell.mjs - nao editar a mao) -->";
const END = "<!-- FB:SHELL:END -->";
const DEMO_START = "<!-- FB:DEMO:START (gerado por make-shell.mjs - nao editar a mao) -->";
const DEMO_END = "<!-- FB:DEMO:END -->";
const FOOT_START = "<!-- FB:FOOTER:START (gerado por make-shell.mjs - nao editar a mao) -->";
const FOOT_END = "<!-- FB:FOOTER:END -->";

// The four modes, in nav order. This array is the single source of truth for destination, label
// and order; test-shell-sync.js compares every page against it.
export const MODES = [
  { id: "empresa", href: "/", label: "Empresa", icon: "fb-empresa", demo: "empresa" },
  { id: "situacao", href: "/perfil", label: "A minha situação", short: "Situação", icon: "fb-situacao", demo: "situacao" },
  { id: "deducoes", href: "/deducoes", label: "Deduções", icon: "fb-deducoes", demo: "deducoes" },
  { id: "legal", href: "/base-legal", label: "Base legal e fiscal", short: "Base legal", icon: "fb-legal", demo: "legal" },
];

// page -> which mode is CURRENT. null means a support page: it carries the same nav, but no link
// points at it, so nothing gets aria-current. Marking one anyway would be a lie to assistive tech.
export const PAGES = {
  "index.html": "empresa",
  "consulta.html": "empresa",
  "contrato.html": "empresa",
  "perfil.html": "situacao",
  "deducoes.html": "deducoes",
  "base-legal.html": "legal",
  "auditoria.html": null,
  "verificar.html": null,
  "sobre.html": null,
  "privacidade.html": null,
  "termos.html": null,
  "404.html": null,
};

const icon = (id, cls) =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#${id}"></use></svg>`;

const BRAND_SVG = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect class="plate" width="32" height="32" rx="7"></rect>
        <path fill="#fff" d="M6.75 6.5 H13.375 C18.875 6.5 22.75 10.3125 22.75 16 C22.75 21.6875 18.875 25.5 13.375 25.5 H6.75 Z M10 9.5 V22.5 H13.1875 C16.8125 22.5 19.5 20 19.5 16 C19.5 12 16.8125 9.5 13.1875 9.5 H10 Z"></path>
        <path fill="#fff" d="M18.25 25.5 L23.875 6.5 H26.375 L20.75 25.5 Z"></path>
        <path fill="#fff" d="M25.25 6.5 H27.75 L22.125 25.5 H19.625 Z"></path>
        <rect class="cut" x="20.875" y="16.375" width="4.875" height="2.25" rx="0.5" fill="#fff"></rect>
      </svg>`;

function shell(current) {
  const navItems = MODES.map((m) => {
    const isCurrent = m.id === current;
    // Full label for the desktop bar, short one for the five-up bottom bar. Both ship in the DOM;
    // CSS swaps them, and the short variant is aria-hidden so the accessible name is always the
    // full destination regardless of viewport.
    const text = m.short
      ? `<span class="nav-long">${m.label}</span><span class="nav-short" aria-hidden="true">${m.short}</span>`
      : `<span>${m.label}</span>`;
    return `    <a href="${m.href}" data-mode-link="${m.id}"${isCurrent ? ' aria-current="page"' : ""}>` +
           `${icon(m.icon, "")}${text}</a>`;
  }).join("\n");

  return `${START}
<a class="skip-link" href="#conteudo">Saltar para o conteúdo</a>

<div class="security-rule" role="note" aria-label="Regra de segurança">
  <div class="wrap">
    ${icon("fb-escudo", "sr-icon")}
    <p><b>Regra de segurança</b>
      A tua password das Finanças só se escreve em páginas cujo endereço termina em
      <code>.gov.pt</code>. Aqui, nunca.</p>
    <a class="sr-why" href="/privacidade#password">Porquê?${icon("fb-externo", "")}</a>
  </div>
</div>

<div class="wrap">
  <a class="site-brand" href="/" aria-label="Fatura Boa, início">
      ${BRAND_SVG}
    <span class="brand-name">Fatura Boa</span>
  </a>

  <nav class="primary-nav" aria-label="Principal">
${navItems}
    <a class="nav-help" href="/sobre#ajuda">${icon("fb-ajuda", "")}<span>Ajuda</span></a>
    <button class="nav-menu" type="button" aria-expanded="false" aria-controls="site-menu">${icon("fb-menu", "")}<span>Menu</span></button>
  </nav>

  <div class="site-menu" id="site-menu" hidden>
    <div class="menu-cols">
      <div>
        <h2>Usar</h2>
        <ul>
          <li><a href="/">Consultar uma empresa</a></li>
          <li><a href="/perfil">A minha situação</a></li>
          <li><a href="/deducoes">Deduções</a></li>
          <li><a href="/base-legal">Base legal e fiscal</a></li>
        </ul>
      </div>
      <div>
        <h2>Confiar</h2>
        <ul>
          <li><a href="/verificar">Verificar o código</a></li>
          <li><a href="/auditoria">Auditoria</a></li>
          <li><a href="/sobre">Sobre</a></li>
          <li><a href="https://github.com/nobodykr/efatura-helper" target="_blank" rel="noopener">Código no GitHub</a></li>
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>
          <li><a href="/privacidade">Privacidade</a></li>
          <li><a href="/termos">Termos</a></li>
          <li><a href="https://polyformproject.org/licenses/noncommercial/1.0.0" target="_blank" rel="noopener">Licença</a></li>
        </ul>
      </div>
      <div>
        <h2>Ajuda</h2>
        <ul>
          <li><a href="/sobre#ajuda">Como funciona</a></li>
          <li><a href="/#relato">Reportar um erro</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>
${END}`;
}

/* The Mesa Fiscal launcher + dialog, on EVERY navbar route (owner decision 01-08-2026 - the
   report had confined it to the homepage). `data-demo-start` makes the demo open on the journey
   that matches the page you launched it from, instead of always Empresa. */
function demoBlock(mode) {
  const journey = (MODES.find((m) => m.id === mode) || {}).demo || "empresa";
  return `${DEMO_START}
<button type="button" class="demo-launch demo-launch-top" data-demo-open data-demo-start="${journey}" hidden>
  <span class="demo-launch-device" aria-hidden="true">
    <span class="dl-screen">
      <svg aria-hidden="true" focusable="false"><use href="/assets/icons.svg#fb-grafico"></use></svg>
    </span>
    <span class="dl-base"></span>
  </span>
  <span class="demo-launch-txt">
    <b>Ver a demonstração guiada</b>
    <span class="dl-sub">Sete jornadas encenadas, passo a passo — do NIF ao plano de faturas.</span>
    <span class="dl-meta mono">Dados ilustrativos &middot; nada é submetido</span>
  </span>
  <span class="demo-launch-go" aria-hidden="true">
    <svg aria-hidden="true" focusable="false"><use href="/assets/icons.svg#fb-seta"></use></svg>
  </span>
</button>

<dialog class="demo-modal" data-demo-modal aria-label="Mesa Fiscal — demonstração guiada com dados ilustrativos">
  <div class="demo-shell" data-demo-root hidden>
    <div class="demo-device">
      <div class="demo-screen">
        <header class="demo-chrome demo-titlebar"></header>
        <div class="demo-workspace">
          <nav class="demo-chrome demo-tabs" aria-label="Demonstrações das funcionalidades"></nav>
          <figure class="demo-stage" aria-label="Demonstração com dados ilustrativos"></figure>
        </div>
      </div>
      <div class="demo-base" aria-hidden="true"></div>
    </div>
  </div>
</dialog>
${DEMO_END}`;
}

const FOOTER = `${FOOT_START}
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-cols">
      <div>
        <h2>Usar</h2>
        <ul>
          <li><a href="/">Empresa</a></li>
          <li><a href="/perfil">A minha situação</a></li>
          <li><a href="/deducoes">Deduções</a></li>
          <li><a href="/base-legal">Base legal e fiscal</a></li>
        </ul>
      </div>
      <div>
        <h2>Confiar</h2>
        <ul>
          <li><a href="/verificar">Verificar o código</a></li>
          <li><a href="/auditoria">Auditoria</a></li>
          <li><a href="/sobre">Sobre</a></li>
          <li><a href="https://github.com/nobodykr/efatura-helper" target="_blank" rel="noopener">Código no GitHub</a></li>
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>
          <li><a href="/privacidade">Privacidade</a></li>
          <li><a href="/termos">Termos</a></li>
          <li><a href="https://polyformproject.org/licenses/noncommercial/1.0.0" target="_blank" rel="noopener">Licença</a></li>
        </ul>
      </div>
      <div class="foot-mark">
        ${BRAND_SVG}
        <div>
          <p class="foot-note"><b>Fatura Boa</b><br>Ferramenta comunitária e independente.
            Não afiliada à Autoridade Tributária.</p>
        </div>
      </div>
    </div>
    <div class="foot-base">
      <p class="foot-note">Isto é informação para confirmares, não aconselhamento fiscal.
        Os valores são indicadores: a ferramenta lê, tu decides e submetes.
        Fontes: SICAE &middot; VIES &middot; BASE &middot; DRE.</p>
    </div>
  </div>
</footer>
${FOOT_END}`;

function replaceBlock(src, start, end, block, file) {
  const a = src.indexOf(start);
  const b = src.indexOf(end);
  if (a === -1 || b === -1) return null;
  return src.slice(0, a) + block + src.slice(b + end.length);
}

const check = process.argv.includes("--check");
let changed = 0, missing = [];

for (const [file, mode] of Object.entries(PAGES)) {
  let src;
  try { src = readFileSync(file, "utf8"); }
  catch { missing.push(file + " (nao existe)"); continue; }

  let out = replaceBlock(src, START, END, shell(mode), file);
  if (out === null) { missing.push(file + " (sem marcadores FB:SHELL)"); continue; }
  const out2 = replaceBlock(out, FOOT_START, FOOT_END, FOOTER, file);
  if (out2 === null) { missing.push(file + " (sem marcadores FB:FOOTER)"); continue; }
  out = out2;

  // the demo block is optional: only the four navbar routes carry the markers
  const out3 = replaceBlock(out, DEMO_START, DEMO_END, demoBlock(mode), file);
  if (out3 !== null) out = out3;

  if (out !== src) {
    changed++;
    if (!check) writeFileSync(file, out);
    else console.log("  DESATUALIZADO " + file);
  }
}

if (missing.length) {
  console.log("  EM FALTA: " + missing.join(", "));
}
if (check) {
  const bad = changed || missing.length;
  console.log(bad
    ? `\n  ${changed} pagina(s) com shell desatualizado, ${missing.length} sem marcadores - corre \`node make-shell.mjs\``
    : "\n  shell sincronizado em todas as paginas");
  process.exit(bad ? 1 : 0);
} else {
  console.log(`make-shell.mjs -> ${changed} pagina(s) atualizada(s), ${Object.keys(PAGES).length - missing.length} verificada(s)`);
}
