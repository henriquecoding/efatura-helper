# Homepage redesign + reposition

- v1 approved 2026-07-24 (reposition to fiscal-profile engine)
- v2 approved 2026-07-30 (visual direction + dossier/proof sections) — supersedes v1 where they differ

## Why (unchanged from v1)
The homepage was 100% about the e-Fatura classifier. The tool is a fiscal-PROFILE engine that reads
the user's own official record; classification is one piece, no longer the headline. The profile is
PUBLIC (no `window.__FB_PROFILE` flag gate), honestly staged by what is validated.

## Positioning (unchanged from v1)
Fatura Boa = the free, verifiable, no-password, all-in-one tool that reads YOUR OWN fiscal record
(Financas + Seg. Social, in your own session) and helps you act on it. Competitors ask for your
password or for manual input; nobody else reads your own session locally. All local, provably
verifiable (/verificar).

## Risk stance (unchanged from v1 — still drives the staging)
Read-only + local + verifiable = low risk. The ONE managed risk is correctness: the active-atividade
/ recibos / IRS-with-rows paths are NOT validated against real non-zero data.
- Promote the VALIDATED partitions: e-Fatura, rendas (Cat F), situacao, patrimonio (IMI), IRS
  history, consultar NIF.
- Label the unvalidated ones "em desenvolvimento / confirma": atividade, recibos verdes, IVA regime.
- **Never frame a number as advice** ("indicador, confirma"). Telemetry stays opt-in + redacted.

## v2 — visual direction ("civic fintech")
Warm institutional, not cold SaaS. The page is a ledger about someone's own money.
- **Paper and ink, not white and grey.** `--bg` is paper `#f4f1e9`, `--surface` is card stock
  `#fffefb`, `--ink` is `#122033`. Action blue `#0757d9`, evidence green `#127457`, caution amber
  `#9a5a00`, blocking red `#b42333`.
- The retune is done **at the token layer only**. Variable names did not change, so every existing
  component followed automatically — that is why it is a small diff and not a restyle.
- `--mute` is `#5d6d80`, deliberately darker than the `#617184` in the brief: that value is 4.43:1
  on paper, under AA, and `--mute` carries real caption content.
- Hairline rules, IBM Plex Mono with tabular numerals for every figure, generous whitespace.

## v2 — structure
Sections 1–7 of v1 stand. Two are inserted after the hero:
1. Hero — "A tua situacao fiscal, das fontes oficiais" + CTA (Ver a minha situacao).
   **1a. Example dossier** (new) — a picture of the output so the value is legible before install.
   **1b. Controlo e prova** (new) — three cards: runs in your session / verifiable / data stays.
2. O que ja faz por ti — validated pieces.
3. O que ainda nao — honest "em desenvolvimento".
4. Como funciona / porque e seguro.
5. Instalar — the profiling bookmarklet, public, SRI kept.
6. Consultar NIF, porque existe, feedback, fontes.
7. SEO/URLs as in v1.

### The example dossier is example data, and must keep saying so
It shows round, generic figures (12 faturas, 80% of a ceiling, "Sem dividas"). It must never show a
plausible-looking personal balance. Three independent disclosures, none of them removable:
a visible `exemplo` chip, the figcaption under it, and an `aria-label` on the `<figure>`. This is
the "never frame a number as advice" rule applied to decoration.

## v2 — motion
Layered scroll reveals, **no animation library**. The brief proposed GSAP + ScrollTrigger from
cdnjs; rejected — it is third-party script on a site whose claim is that you can read everything it
runs, and `_headers` already announces a `script-src` CSP.

**Arming order is load-bearing.** `.js-reveal` on `<html>` is what makes `.reveal` transparent, and
it is added *inside the IntersectionObserver's first callback*, never before. If the observer never
delivers, nothing is ever hidden. This is not hypothetical: in a non-compositing browser pane the
rendering lifecycle was frozen (rAF ran zero times, a bare observer on `<body>` never fired) and the
arm-first version left the dossier and the entire proof section permanently invisible. Any
environment that throttles the lifecycle reproduces it.

Rule for anything added later: **content must never depend on an animation callback to be visible.**

## Build notes
- Keep the classifier reachable (it is a partition/entry, not removed).
- Preserve DRAFT=true and the security copy — load-bearing and tested by test-draft.js /
  served-matches-repo.
- Provably-fair: bump `FB_VERSION` **and** run `node make-versions.mjs` on any tool.js change.
- Local dev: `npm install` then `npm test` (jsdom + playwright-core; see package.json / run-tests.js).

## Deliberately not done in v2
Each of these is a decision taken with the brief in front of us, not an oversight. Re-opening any
of them is fine; re-opening it *without* reading the reason is not.

**Dark theme** (`[data-theme="dark"]` in brief section 3). Declined 2026-07-30. The brief sketches
the token block only, which reads as a one-page change; it is not. Applied to `index.html` alone
the masthead and footer go dark on `/` and stay light on `/perfil`, `/consulta`, `/deducoes` and the
rest, so navigation flickers between themes. Done properly it is 10 pages, ~24 colour literals per
page to audit, and a second full AA contrast pass. Not worth it against a light institutional
palette that is the product's whole visual argument. The `--surface` token added in v2 means a
future dark pass is a token override, not a restyle.

**Inter + system mono** (brief section 3). Declined 2026-07-30; keeping IBM Plex Sans + IBM Plex
Mono. Plex Sans fills the same humanist-editorial role the brief asks Inter for, Plex Mono has
better tabular numerals than Consolas for a page built on figures, and both are already loaded on
all 10 pages. The swap costs a visual review of every page and buys nothing legible.

**Hero `min-height:80vh`** (brief section 3). Not applied. The brief puts the dossier *inside* the
hero; at 80vh on a laptop the dossier lands below the fold, which defeats the reason it exists.
The hero keeps its own padding and the dossier stays visible without scrolling.

**Route split** to `/situacao`, `/entidade`, `/deducoes` (brief section 4.1). `/deducoes` already
exists; `/entidade` and `/situacao` would be renames of `/consulta` and `/perfil`, which breaks
canonicals, the sitemap and inbound links for no user-visible gain. If it is still wanted, do it as
additive redirects, not renames, and update sitemap.xml + every canonical in the same change.

**Automated normative validation against DRE/AT** (brief section 4.2, second bullet). Not built.
`year_snapshots.json` already references a `watch_artigos.mjs` that does not exist in the repo. The
2026-07-30 rendas correction is the argument for building it: the repo carried a stale 2025 ceiling
for months with `verified: true` on it. Scope it as a job that re-reads each article's dedicated
DRE page, compares `FragmentoVersaoId`, and fails when an id moves.

---

## v3 — Mesa Fiscal (01-08-2026)

**Intenção.** Uma demonstração guiada e finita das sete jornadas (Empresa, Instalar, Situação,
Classificar, Deduções, Base legal, Verificar), encenada dentro de uma moldura de portátil, para a
pessoa ver o caminho antes de usar. Especificação-mestre: relatório "demonstrações animadas".

**Colocação.** `#demonstracao`, entre `#prova` e `#faz`. Nunca no hero — o hero da rota Empresa
tem uma ação exclusiva e `test-home-modes.js` proíbe controlos adicionais lá.

**Exceção visual.** Material translúcido (blur + aresta especular) apenas no chrome do
dispositivo — titlebar e rail de tabs. O palco fiscal é opaco. Registado em
`anti-patterns.md` §1 e §20 e validado por `test-design.js`.

**Não objetivos.** Não é um vídeo, não é um dashboard falso, não é uma SPA, não executa
`tool.js`, não lê dados de ninguém, não promete funcionalidades incompletas (a vista pessoal de
deduções termina no estado bloqueado honesto; fontes sem cobertura publicada têm estado neutro).

**Decisões.** Sem biblioteca de animação (o relógio é um único `requestAnimationFrame` em
`demo-stage-core.js`, testável em Node com tempo falso). Sem loop: cada jornada corre uma vez e
para num ato estático. Pausa por razões independentes (explícita, foco, hover, offscreen,
separador escondido, manual, reduced-motion). Em reduced motion abre no estado final e o
transporte vira "Percorrer passos".

**Bloqueios conhecidos.** A vista pessoal de deduções não está pronta (chaves de storage
divergentes + `#personal-view` vazio) e por isso NÃO é encenada como funcional. Movimentos
financeiros e Segurança Social têm cobertura por confirmar no manifesto.
