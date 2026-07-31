# 04 — Layout rules

## The editorial grid — the defining structure

Every `<section>` is a two-column grid: a narrow **rail** carrying the chapter number, and the
content in the main column.

```css
.wrap{max-width:1180px; counter-reset:sec}
section{display:grid; grid-template-columns:[rail] 132px [main] minmax(0,1fr); column-gap:48px}
section > *{grid-column:main; min-width:0}
section::before{
  counter-increment:sec; content:counter(sec,decimal-leading-zero);
  grid-column:rail; grid-row:1 / span 99;
  position:sticky; top:28px; align-self:start;
}
```

This is not decoration and it is not optional. The product's reference is a statutory instrument
or a ledger, and the defining feature of both is the **marginal rail**: the article number sits
outside the text block, the block keeps a fixed measure, and the reader always knows where they
are. The number is sticky, so through a long chapter it stays beside you — with twelve chapters
and a 13,000px page that is orientation, not ornament.

A page of full-width stacked prose sections is a blog. **A centred stack with bigger type is still
a centred stack** — that is precisely why the 30-07-2026 pass changed the scale, the spacing, the
palette and the banding and still read as the same page. Composition is what makes a layout, and
composition is what that pass never touched.

The rail collapses below 900px: the number goes inline above the heading and the grid becomes one
column.

## The hero is asymmetric

Claim on the left, example dossier on the right, both above the fold, left-aligned. Never a
centred stack of eyebrow → title → paragraph → buttons → badges: that is the single most generic
composition on the web and no amount of type scale rescues it.

## The column and the measure

`--wrap: 1180px`, 24px gutters — wide enough for the rail plus a full main column. Prose inside is
capped at `--measure: 64ch` **independently of the container**, so widening the page never widens
the reading line.

This is why body text does not fill the main column, and that is correct. The empty right side of
a paragraph is the measure doing its job.

## Full-bleed without wrappers

Bands span the viewport while content stays in the column, using no extra markup:

```css
section:nth-of-type(even){
  background: var(--band);
  box-shadow: 0 0 0 100vmax var(--band);
  clip-path: inset(0 -100vmax);
}
```

The shadow paints to the edges; the clip stops it painting over the scroll area. Prefer this to
wrapper divs — the markup stays semantic and the banding stays a stylesheet concern.

## Vertical rhythm

Between sections: `--step`. Within a section: 4/8/12/16/20/24. The **gap between those two scales
is the grouping signal** — do not fill it with intermediate values, or the reader loses the
grammar.

Section padding is symmetric (`--step` top and bottom). Adjacent bands therefore give `2 × --step`
between chapters, which is intended.

## Chapter headings

```
[01]  Section title
      (optional subtitle in --mute)
```

Two-column grid: the counter badge, then the title. Counter is CSS-generated
(`counter(sec, decimal-leading-zero)`) so it cannot drift from the markup. Below 640px it stacks
above the title.

Headings inside boxes are not chapters: no counter, `1.25rem`, `display:block`.

## Grids

Cards use `repeat(auto-fit, minmax(<min>, 1fr))` — never a fixed column count. `<min>` is chosen so
the card's *content* stops being readable below it, not so a particular number fits.

Use `container-type: inline-size` on card containers and container queries for the card's own
internal layout. Reserve media queries for page-level structure. Never both on the same property
of the same component.

## Reading order

DOM order is reading order, always. No CSS reordering that separates visual from tab order. If a
grid needs a different visual order, change the markup.

## Breakpoints

| | |
|---|---|
| ≤640px | one column; `--step` reduced; chapter number stacks |
| 641–940px | column with gutters; grids collapse by `auto-fit` |
| >940px | fixed column, bands bleed |

Three. Adding a fourth needs a reason in the commit message.

## Mobile

Not a compressed desktop. Specifically:

- Cards stack; they do not shrink until the text is unreadable.
- Tables get an `overflow-x: auto` wrapper (`.tscroll`) — never `overflow: hidden`, which silently
  clips columns.
- Sticky elements: none, unless it earns its 44px of permanent screen.
- Test at 390px. `document.documentElement.scrollWidth` must equal `window.innerWidth`. Any
  horizontal scroll on the document is a bug, always.

## Forms

Label above input, always visible. Never placeholder-as-label. Error text below the field, in
`--red`, with an `aria-describedby` link and a non-colour marker. Inputs at `--surface` so they
read as writable against the paper.

## What the layout must survive

- No CSS at all → readable document, correct heading order.
- No JS → everything visible, nothing hidden waiting for a callback.
- 200% browser zoom → no overlap, no horizontal scroll.
- `prefers-reduced-motion` → no motion, identical layout.
- Greyscale, no shadows, no images → full hierarchy intact.
