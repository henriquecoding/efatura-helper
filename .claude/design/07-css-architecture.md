# 07 — CSS architecture

## Where CSS lives

Inline `<style>` in each page's `<head>`. This is deliberate and stays: the site is a handful of
static pages with **no build step**, and `tool.js` must remain a single self-contained file that
can be read end to end by someone auditing it before running it against their tax account. A
bundler would break the thing the product sells.

Cost: the masthead and footer rules are duplicated across pages. Accepted, and commented where it
happens. If a page count above ~12 makes that untenable, that is a build-step decision, not a
CSS-organisation decision.

## Order within a `<style>` block

1. `@property` declarations
2. `:root` tokens
3. Reset / base elements
4. Layout primitives (`.wrap`, grids)
5. Page furniture (masthead, header, footer)
6. Components
7. Utilities
8. Media queries local to a component, next to that component

An **editorial layer** may be appended at the end for a coherent restyle pass. This is what the
30-07-2026 redesign did, and the reason it is legitimate rather than lazy: it reads as one
intentional pass instead of edits smeared through 200 lines. Mark it with a banner comment
explaining what it overrides and why.

## Naming

Plain, semantic, lowercase, hyphenated. `.signal`, `.proof-card`, `.dossier-head`, `.badge-status`.

No BEM, no utility framework, no `sm:`/`md:` prefixes. The stylesheets are small and read
top-to-bottom; ceremony costs more than it saves here.

State: `.is-*` / `.has-*` when JS toggles it, or a real attribute (`[open]`, `[aria-current]`,
`[hidden]`) when the platform provides one. Prefer the platform.

## Selectors

- Element + one class. `.signal .v` is fine; `.a .b .c .d` is not.
- No IDs for styling — IDs are for JS hooks and anchors.
- `:has()` when it expresses a real relationship: `.signals:has(.signal.due){ gap:11px }`.
- `:where()` to keep base styles at zero specificity so components override cleanly.
- No `!important` outside a commented third-party override.

## Tokens

Never a raw hex where a token exists. Derive rather than duplicate:

```css
--hair: color-mix(in oklab, var(--ink) 12%, transparent);
```

A derived value stays correct when the base changes. A copied hex does not — that is how a palette
retune leaves eleven stale greys behind.

The 30-07-2026 retune changed nine lines and the whole page followed, precisely because the
variable *names* were kept and only their values changed. Preserve that property.

## Modern CSS — use it

`clamp()` for every fluid size. `color-mix()` for derived colour. `@property` for interpolable
custom properties. Container queries for component-internal layout. `:has()` for relationships.
`text-wrap: balance` on headings, `pretty` on prose. `animation-timeline: view()` behind
`@supports`. Logical properties (`margin-inline`, `padding-block`) for anything that could be
mirrored.

Guard anything not universally supported with `@supports`, and make the unsupported path the
*plain, working* one — never the broken one.

## Comments

Comment the **why**, never the what. `/* 16px flex gap */` above a 16px flex gap is noise.

Comment mandatory where:

- A value contradicts the system (and why it is allowed).
- A rule exists to prevent a specific bug — name the bug.
- A hack works around a browser issue — name the browser.
- Order or specificity is load-bearing.

The comment above `--mute` explaining that `#617184` fails AA on paper is the model: it stops a
future reader "cleaning up" the value back to the broken one.

## Performance

Animate transform/opacity only. `content-visibility: auto` on long below-fold sections if the page
gets heavier. No web font beyond the two already loaded; both are `display: swap`. No CSS that
triggers layout on scroll.

## Review checklist

- [ ] No hardcoded colour that should be a token
- [ ] No magic spacing outside the scale
- [ ] No `!important`
- [ ] Every animated property is transform or opacity
- [ ] Every non-universal feature behind `@supports`, with a working fallback
- [ ] Focus visible on everything interactive
- [ ] No document-level horizontal scroll at 390px
- [ ] Every deviation from the system carries a comment saying why
