# 05 — Component specs

## The template

Every component is specified in this order. A component missing any section is unfinished — most
often the states, which is why half-built interfaces feel broken rather than look broken.

```
Purpose        one sentence; what breaks without it
Hierarchy      what the eye must hit first, second, third
HTML           semantic skeleton
CSS            tokens only; deviations commented
States         default / hover / focus / active / disabled / loading / empty / error
Responsive     what changes, at what width, and why
Accessibility  role, name, keyboard path, what a screen reader announces
Performance    what it costs; what it must not trigger
```

"Empty" and "error" are not optional. A component that has only been designed full and correct is
a component that will look broken the first time real data disappoints it.

---

## Button

**Purpose** — commit to an action. **Hierarchy** — one primary per view; everything else outlined
or plain.

```html
<button type="button" class="bm">Ver a minha situação</button>
```

- Default: `--pri` fill, white text (6.22:1), `--r` 6px, 11px/22px padding, min 44px.
- Hover: darkens to `--pri-dark`. No lift, no shadow.
- Focus: `3px solid var(--focus)`, 2px offset. Never removed.
- Active: no transform; the colour change is the feedback.
- Disabled: `--mute` on `--bg2`, `cursor:not-allowed`, `aria-disabled` — and next to it, in text,
  *why*. A disabled control with no explanation is a dead end.
- Loading: label changes to the present participle ("A ler…"), `aria-busy="true"`, width held so
  the layout does not jump. No spinner.

Never: gradient fill, `rounded-full`, icon-only without `aria-label`, more than one primary.

---

## Card (`.proof-card`, `.box`)

**Purpose** — group content that is genuinely one unit. If proximity already groups it, no card.

- `--surface`, 1px `--hair`, 14–16px radius, 19–22px padding.
- Accent: `border-left` 3–4px for a category (`.box.draft` amber, `.box.give` green).
- Hover (only if the whole card is a link): `--lift: -3px` via `@property`, border to
  `--hair-strong`. Cards that are not links do not react.
- No shadow at rest.

---

## Signal (`.signal`)

**Purpose** — one figure with its meaning and its source.

**Hierarchy** — label → figure → source. The figure is the largest thing; the source is always
present.

- Mono, tabular, 1.5rem, 600 for the figure. 12px radius. `border-left` 3px carries the state:
  `--green` settled, `--amber` needs attention, `--red` overdue.
- Colour never alone: the state is also in the label text.
- Empty: "sem dados" in `--mute`, same box, no collapse. Never a zero where the truth is unknown —
  `0 €` and "we could not read this" are different facts and must look different.
- Unvalidated: amber, plus the words "confirma" in the meta line. Not a tooltip.

---

## Example dossier (`.dossier`)

**Purpose** — show the shape of the output before anyone installs anything.

**Non-negotiable**: it contains fabricated numbers, so it carries **three independent disclosures**
— a visible `exemplo` chip, the figcaption, and `aria-label` on the `<figure>`. Removing any one is
a regression. Figures stay round and generic; never a plausible personal balance.
See anti-patterns #28.

---

## Chapter heading

```
[01]  Title
      subtitle
```

Two-column grid, counter badge + title. Counter from CSS `counter()`, never hand-typed. Subtitle in
`--mute` at prose weight in column 2. Stacks below 640px. Headings inside boxes get no counter.

---

## Form field

- Label above, always visible. Never placeholder-as-label.
- Input at `--surface` so it reads writable against paper. Min 44px.
- Error: text below in `--red`, `aria-describedby`, plus a non-colour marker. Never colour alone,
  never a tooltip.
- Validate on blur and on submit — never on every keystroke, which punishes people mid-thought.

---

## Table

- Hairline rows, no zebra, no vertical rules.
- `thead` in mono uppercase 0.72rem `--mute`, separated by `--hair-strong`.
- Numeric columns right-aligned, mono, tabular.
- Always wrapped in `.tscroll` (`overflow-x:auto`). Never `overflow:hidden` — it silently clips
  columns on mobile and nobody finds out.
- Caption above, describing what the table is; it is the accessible name.

---

## Marker highlight (`.mark-hl`)

**Purpose** — mark the operative phrase in a heading, the way a person marks the line that matters
in a document they are working through. **One per page.** A second one is decoration.

- `--pri` at **26%**, warped by an inline `feTurbulence` + `feDisplacementMap` filter
  (`#fb-marker`, `scale: 24`), tilted `-0.7deg`.
- The tilt and the warp are load-bearing: a level, sharp-edged tint at this opacity reads as an
  **OS text selection**, not as a mark. Tested — it did, before the tilt.
- Draws on with `scaleX` from the left, reusing the chapter-rule gesture. One motion vocabulary.
- Ink stays `--ink` over it: **7.0:1**, computed. A highlight that costs legibility is decoration
  pretending to be emphasis.
- Survives greyscale as a grey band that still reads as emphasis — verified in a render.
- Below 560px the filter is dropped for a clean rounded band: the warp distorts badly at small
  sizes.

This is the only sanctioned "hand" gesture in the system. It is allowed because it is an argument
rather than an ornament — the product is about finding the part of your record that matters, and a
hand mark says exactly that. Do not extend it to body text, buttons, or a second heading.

## Status pill (`.badge-status`)

The only legitimate `border-radius: 999px`. Dot + text; the dot is never the only signal. Mono,
0.72rem, `--bg` fill, `--hair` border.

---

## Adding a component

1. Check no existing component does the job.
2. Write the spec above **before** the CSS.
3. Tokens only.
4. Build every state, including empty and error.
5. Check keyboard path and screen-reader output.
6. Render it and look at it — at 1440px and 390px.
7. Add it here.
