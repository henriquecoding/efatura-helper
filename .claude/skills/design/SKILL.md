---
name: design
description: Load the Fatura Boa design system before any visual, CSS, layout, typography, colour, animation or component work — including redesigns, restyles, new pages, and design review. Covers the gov.pt-derived palette, the anti-patterns list, component specs and the acceptance gates.
---

# Fatura Boa — design system

Read this file, then load only the documents you need from `.claude/design/`. Do not load all of
them; each is self-contained.

## Before touching anything visual

1. **Render the current state and look at it.** The browser pane here does not composite frames —
   `computer{action:"screenshot"}` times out, and computed styles are not a look. Use
   `playwright-core` with `C:/Program Files/Google/Chrome/Application/chrome.exe`, write a PNG,
   open it with Read.
2. **Diagnose structurally.** "It looks dated" is not a diagnosis. "Every section has identical
   padding so nothing has rank" is.
3. Load the relevant doc below.

## The map

| Doc | Load it when |
|---|---|
| `00-mission.md` | tone, copy, what the product must never imply |
| `01-design-philosophy.md` | deciding whether something should exist at all |
| `02-art-direction.md` | colour, type, lines, the gov.pt kinship, the greyscale test |
| `03-design-system.md` | any token — the palette provenance table lives here |
| `04-layout-rules.md` | grid, rhythm, banding, measure, breakpoints, mobile |
| `05-component-specs.md` | building or changing a component |
| `06-animation-language.md` | any motion at all |
| `07-css-architecture.md` | writing CSS — naming, order, modern features |
| `08-refactoring-process.md` | a restyle or redesign; which layer you are allowed to rewrite |
| `09-acceptance-tests.md` | before claiming done |
| `anti-patterns.md` | **always** — 60 numbered bans, read before designing |
| `prompts/*.md` | building that specific page |

## The five that are never optional

1. **Built, not decorated.** Lines instead of shadows, type instead of illustration, hierarchy
   instead of colour, information instead of marketing. If removing it only makes the page emptier,
   remove it.
2. **The palette is gov.pt's, warmed.** Blues and neutral text ramp taken exactly from gov.pt's
   tokens; the paper (`--bg: #FAF9F6`) is ours. Kinship yes, clone no, and never anything implying
   the State endorses this. Provenance table in `03-design-system.md` — read it before retuning
   anything, because the palette was already replaced by accident once.
3. **Content must never depend on an animation callback to be visible.** Arm hidden states inside
   the first callback, never before. This shipped as a blank section once.
4. **It must survive greyscale, no shadows, no JS, and 390px.** Four hard gates,
   `09-acceptance-tests.md`.
5. **Never claim a visual result you have not looked at.**

## Two layers, two rules

- **Visual layer** (tokens, spacing, scale, banding, card chrome, motion): rewrite freely. Patching
  is how a redesign ends up looking identical to what it replaced.
- **Load-bearing layer** (consent gate, published request list, `DRAFT = true`, ceiling agreement,
  truthful-column default, security copy): never change without first making its test go red on
  purpose. Table in the root `CLAUDE.md`.

## Done

`npm test` (16/16) · `node test-design.js` · rendered and looked at, 1440 and 390 · four gates ·
docs updated in the same change.
