# Fatura Boa — operating rules

This file is the only one that loads automatically. Everything else in `.claude/design/` is loaded
on demand via the `design` skill. Keep this file short enough that it is always read in full: if it
grows past roughly 200 lines, move the detail out and leave a pointer.

---

## 1. What this product is

A free, no-password tool that reads a person's **own** official fiscal record — e-Fatura, Finanças,
Segurança Social — inside the session they already have open, in their own browser, and helps them
act on it. Nothing is submitted on their behalf. Every number is an indicator to confirm, never
advice.

The security claim is the product: *what you see is what runs*. `tool.js` is SRI-pinned, served
byte-identical to the repo, and verifiable at `/verificar`. If that claim can quietly become false,
the product has no reason to exist.

## 2. The load-bearing layer — never change without a red test first

These are not style. Changing any of them silently is the worst failure mode this repo has.

| What | Pinned by |
|---|---|
| Consent gate: zero network requests before the user agrees | `test-network.js` phase 1 |
| The published request list on the homepage matches reality | `test-network.js` phase 2 |
| `DRAFT = true` — the tool reads, never submits | `test-draft.js` |
| Deduction ceilings agree across `tool.js`, `deducoes.html`, `year_snapshots.json` | `test-deducoes-sync.js` |
| The pre-selected sector is the truthful column, not the one that pays most | `test-columns.js`, `test-r1.js` |
| `/auditoria` never quietly disagrees with the code it claims to audit | `test-audit-sync.js` |
| The searched NIF never reaches a URL, history, `data-*` or analytics | `test-privacy-urls.js` |
| Navigation, factual content and the feedback POST work with JS off | `test-nojs.js` |
| The shell is identical across all 12 routes | `test-shell-sync.js` |
| The mobile bar is 5 destinations, each icon **and** text | `test-mobile-nav.js` |
| Client and server agree on feedback limits and sanitisation | `test-feedback-parity.js` |
| `tool.js` is pure ASCII | `.github/workflows/encoding-guard.yml` |

Rule: **to change one of these, make its test go red on purpose first, then decide.** If you cannot
find the test that guards a behaviour you are about to change, that is the finding — write it.

## 3. Tax data is never asserted from memory

The model cutoff predates the income years this tool computes. Fetch the primary source — the DR PDF
at `files.diariodarepublica.pt`, because `diariodarepublica.pt` detail pages are SPAs that fetch as
blank. Read `produção de efeitos` and any `norma transitória` **separately** from the article text:
twice now the operative number lived in the transitional norm, not in the amended article.

`verified: true` in `year_snapshots.json` means *read verbatim from a DRE page*. Anything derived
gets `verified: false` plus a `verified_gap` saying exactly what is still unread.

## 4. Design

Full rules: `.claude/design/`. Load them with the `design` skill before any visual work.
The three that matter most, so they are never not loaded:

1. **Built, not decorated.** Nothing exists to embellish. Lines instead of shadows, type instead of
   illustration, hierarchy instead of colour, information instead of marketing.
2. **The page must survive in black and white, with no shadows and no images.** If it collapses,
   the hierarchy was carried by decoration. `node test-design.js` enforces a machine-checkable
   subset of this.
3. **Content must never depend on an animation callback to be visible.** Arm hidden states from
   inside the first animation/observer callback, never before. This has already shipped as a bug
   once — see the reveal layer in `index.html`.

## 5. Working rules

- Run `npm test` before saying anything is done. 27 checks; all must pass. `test-network.js` needs a
  browser — it reports SKIP without one, and a SKIP is not a pass. Set `CHROME_PATH` and get 27/27.
- `npm run dev` → http://localhost:4173.
- The browser pane does not composite frames here. To actually *see* a page, render it with
  `playwright-core` and the local Chrome, and look at the PNG. Do not claim a visual result you
  have not looked at.
- Any `tool.js` change: bump `FB_VERSION` **and** run `node make-versions.mjs` **and**
  `node make-audit.mjs` (the `/auditoria` matrix is generated from `tool.js`; `test-audit-sync.js`
  goes red if you forget).
- Any change to the shell (nav destinations, security rule, menu, footer): edit `make-shell.mjs`,
  never the generated block inside a page, then run `node make-shell.mjs`. The markup is duplicated
  across 12 files on purpose — navigation must work with JS off — and `test-shell-sync.js` is what
  keeps the copies honest.
- The site is four routes with one shell: `/` Empresa, `/perfil` Situação, `/deducoes` Deduções,
  `/base-legal` Base legal. Each is a real URL with its own canonical, not a tab. `test-home-modes.js`
  pins that.
- The static table in `deducoes.html` stays hand-maintained. It is the third *independent* source in
  `test-deducoes-sync.js`'s three-way agreement; generating it would compare a file to its own
  derivative and quietly retire the invariant.
- Scope: changed lines must serve the request. Found something unrelated and real? Write it down,
  do not fix it silently.
- Verification is not optional and "should work" is not verification.
