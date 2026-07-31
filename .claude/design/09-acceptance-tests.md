# 09 — Acceptance tests

A design rule that is only prose rots. This repo has the receipt: `test-columns.js` carried the
correct principle in its header comment for ten days while the code did the opposite, and it still
reported PASS because it had no assertions.

So the criteria are split into what a machine checks and what a human must look at. Both must pass.

---

## Automated — `node test-design.js`

Runs over every `.html`, needs no browser, and is part of `npm test` (16 tests). Currently checks:

| Check | Rule |
|---|---|
| No `backdrop-filter: blur` | anti-patterns #1 |
| No gradient text | #4 |
| No purple/violet gradient | #3 |
| No `transition: all` | #55 |
| No `!important` | #46 |
| No animating width/height/top/left/margin | #53 |
| No `text-align: justify` | #35 |
| One elevation level (no oversized shadows) | 02-art-direction |
| Motion behind `prefers-reduced-motion` | 06-animation-language |
| `:focus-visible` present, outline not stripped | 03-design-system |
| Prose measure capped in `ch` | #36 |
| No script host outside the allowlist | #32 |
| Every token pair clears AA 4.5 against `--bg` and `--surface` | 03-design-system |

It strips CSS comments before matching — a linter that flags its own rationale teaches people to
ignore it.

**Extending it is cheap and expected.** When you add a rule to these documents, ask whether it can
be expressed as a regex or a computation. If it can, it goes in `test-design.js` in the same
change; if it cannot, it goes in the human list below and says why.

Found on its first run, all real: a dead `text-align: justify` block, two legal pages with no prose
measure, and `verificar.html` defining `--focus` but never applying it — that page had no visible
focus ring at all.

---

## Human — must be looked at, every time

The browser pane in this environment does not composite frames, so `screenshot` times out and
computed styles are **not** a look. Render with `playwright-core` and the local Chrome, write a
PNG, and open it.

### The four hard gates

1. **Greyscale.** `html{filter:grayscale(1)} *{box-shadow:none}`. Hierarchy, states and warnings
   must all survive. If they do not, the design was leaning on colour and the fix is structural —
   weight, size, position, a label.
2. **No JS.** Every piece of content visible. Nothing waiting on a callback.
3. **390px.** `document.documentElement.scrollWidth === window.innerWidth`. Any document-level
   horizontal scroll is a bug, always.
4. **Reduced motion.** No motion, identical layout.

### The judgement calls

- Does it look **built** or **decorated**? Could you justify every dimension without "it looked
  better"?
- Is there **rank**? Can you tell, at a glance from two metres, which section is which and where
  the page starts?
- Does it read as a **template**? Tailwind UI, a SaaS dashboard, a Vercel landing — any of those,
  it fails.
- Does it read as a **government site**? Palette kinship is intended; being mistaken for the State
  is a failure, and the disclaimer must be visible.
- Is every **fabricated figure** unmistakably an example, three ways?
- Is any **number framed as advice** rather than as an indicator to confirm?

---

## Definition of done

- [ ] `npm test` — 16/16
- [ ] `node test-design.js` — clean
- [ ] Rendered and **looked at**, 1440px and 390px
- [ ] Four hard gates pass
- [ ] Judgement calls honestly answered
- [ ] Every system deviation carries a comment saying why
- [ ] Docs updated in the same change
- [ ] Residual risks stated, including anything not verified

Reporting a visual result that has not been looked at is the specific failure this file exists to
prevent. It has happened here once already.
