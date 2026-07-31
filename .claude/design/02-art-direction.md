# 02 — Art direction

## The reference point

A well-set **statutory instrument** or a **ledger**: numbered chapters, hairline rules, tabular
figures, wide margins, no ornament. Then made warm, so it does not read as bureaucracy.

Not: a fintech app. Not: a government portal. Not: a startup landing page.

The nearest honest comparisons are the typographic discipline of a Swiss legal annual report and
the tone of a good explanatory newspaper piece. If a section starts to look like a product tour,
it has drifted.

## Civic kinship: gov.pt's blues, our paper

The palette is taken from **gov.pt's own design tokens** — primary `#034AD8`, deep `#021C51`,
secondary `#1CA3FC`, the neutral text ramp `#2B363C` / `#475164` / `#64718B`, and gov.pt's own
success `#00724C` and error `#D12332`. Full provenance table in `03-design-system.md`.

The reason is not imitation. This tool is read alongside Portal das Finanças and gov.pt, and a
palette from a different family reads as less serious than the work deserves. Sharing the civic
blues buys that credibility honestly.

**Where we diverge, and why it matters:** the surface ramp is warm (`--bg: #FAF9F6`,
`--bg2: #EFEEE9`, `--rule: #CFCEC8`) where gov.pt's is cool (`#F7F8FA`, `#F1F3F8`, `#CDD2DC`).
Pure cool grey behind a page about someone's tax debt reads clinical and faintly hostile; warm
paper reads like a document someone prepared for you. The focus ring is amber, not gov.pt's
magenta, because ours must also clear a dark-blue header.

So: **shared blues and text ramp, our own paper.** Enough kinship to belong to the same civic
family; enough divergence that nobody mistakes this for a government site. That second half is a
hard requirement, not an aesthetic preference — see anti-patterns #31. Kinship of palette is
allowed. Crests, seals, wordmarks, `.gov`-style chrome and official-sounding badges are not, and
the disclaimer stays prominent.

## Colour is signal, never surface

Four accents, each with exactly one meaning. They appear as small marks — a rule, a dot, a number,
a border-left — never as fills behind content.

| Token | Value | Means | Never means |
|---|---|---|---|
| `--pri` | `#034AD8` | action, link, "you can do this" | brand decoration |
| `--green` | `#00724C` | verified, settled, evidence | success celebration |
| `--amber` | `#8A6100` | needs your attention, unvalidated | warning-as-urgency |
| `--red` | `#D12332` | blocked, overdue, real deadline | emphasis |

Rules:

- **No more than two strong colours visible in one viewport.** Count them; if there are three, one
  is decoration.
- **Colour never carries meaning alone.** Always paired with position, a label, or a shape. A red
  dot with no word next to it is a failure.
- **No colour fills behind body text.** Tinted callout backgrounds are allowed at the very low
  saturation already in use (`#fdf8ec`, `#f1f7f3`); anything stronger is banned.

## Lines instead of shadows

Hairlines are `color-mix(in oklab, var(--ink) 12%, transparent)` — derived from the ink, so they
sit in the same family as the text rather than as an unrelated grey.

Shadow is permitted in exactly one situation: a surface that genuinely floats above the page and
can be dismissed (a modal). It is not permitted on cards, headers, buttons, or inputs. The example
dossier carries a very low shadow to lift it off the paper; that is the ceiling, and it is already
at it.

**Test: turn every shadow off. The page must be unchanged in meaning.** `test-design.js` checks a
subset of this.

## Typography

**IBM Plex Sans** for everything read as language. **IBM Plex Mono** for everything read as a
figure, a code, a legal reference, or a label. That split is semantic, not decorative: mono means
*this is data you might check*.

Two families is the budget and it is now a settled decision. A display serif (Fraunces, `opsz`
driven, `WONK` 0) was tried on 30-07-2026 and **rejected on sight**: the high-contrast old-style
made the page read as a magazine feature, which is a worse mistake than reading as plain. A tax
record should not have a literary voice.

The consequence, and it is the whole discipline of this project: **character has to come from
composition, rule work and rhythm — never from the letterforms.** If a page feels generic, the
answer is never a new typeface.

- Numerals are always tabular. Money that does not align in a column is a bug.
- Headings: tight tracking (−0.02 to −0.035em), `text-wrap: balance`, generous size contrast.
- Body: 16px base, 1.6 line-height, 60–66ch measure, `text-wrap: pretty`, left-aligned.
- Mono eyebrows: uppercase, ~0.72rem, letter-spacing 0.07–0.14em. The only place all-caps is used.

Two families is the budget. A third is a redesign, not an addition.

## Rhythm

One unit, `--step: clamp(56px, 7vw, 104px)`, governs vertical section spacing. Sections alternate
onto a card-stock band so the page reads as numbered chapters rather than one scroll.

Contrast in spacing is what creates rank. Within a section, elements are close (12–20px). Between
sections, they are far (`--step`). The jump between those two scales is the signal.

## Motion

Motion explains cause and effect, or it does not happen. See `06-animation-language.md`. Nothing
loops, nothing attracts attention to itself, nothing is longer than 400ms on a path the user is
waiting on, and nothing that must be read depends on it.

## The greyscale test

Print the page in black and white with images and shadows off.

It must remain **completely** usable: hierarchy legible, states distinguishable, every warning
still reading as a warning. If it does not, the design was leaning on colour, and the fix is
structural — weight, size, position, a label — not a darker colour.

This is the single most useful check in this document. Run it before asking anyone's opinion.
