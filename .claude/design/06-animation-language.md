# 06 — Animation language

## The one rule that outranks everything

> **Content must never depend on an animation callback to be visible.**

Not a preference. This shipped as a bug on 30-07-2026: `.reveal { opacity: 0 }` was armed by a
class added *before* the IntersectionObserver was attached. In a browser pane with a frozen
rendering lifecycle — `requestAnimationFrame` ran zero times, a bare observer on `<body>` never
fired — the example dossier and the entire proof section were permanently invisible. The page
looked finished and showed nothing.

### The arming pattern

Hidden state is armed **inside the first callback**, never before:

```js
var armed = false, alive = false;
function arm(){ if(!armed){ armed = true; document.documentElement.className += " js-reveal"; } }
var io = new IntersectionObserver(function(entries){
  alive = true; arm();
  entries.forEach(function(e){ if(e.isIntersecting){ e.target.className += " in"; io.unobserve(e.target); } });
}, { rootMargin:"0px 0px -8% 0px", threshold:.1 });
els.forEach(function(el){ io.observe(el); });
setTimeout(function(){ if(!alive) io.disconnect(); }, 1000);
```

`.js-reveal` is what makes `.reveal` transparent. No callback → nothing hidden. The timeout is the
second belt.

Prefer the native path where available — it needs no script at all:

```css
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    .reveal{ animation:revealIn linear both; animation-timeline:view();
             animation-range:entry 8% cover 26% }
  }
}
```

and stand the observer down so only one mechanism ever runs:

```js
if (window.CSS && CSS.supports && CSS.supports("animation-timeline","view()")) return;
```

CSS entrance animations (`animation: … both` with a delay, no scroll dependency) are exempt from
the arming rule — a CSS animation always runs. That is why the hero timeline is done that way.

## What motion is for

Cause and effect, and nothing else:

- **State** — hover, focus, press, disabled. Confirms the interface heard you.
- **Continuity** — something appearing, moving, or being removed shows where from and where to.
- **Sequence** — a short stagger on first paint tells the eye where to start.

Not for: attracting attention, filling silence, demonstrating skill, or making a page feel
"premium".

## Budget

| | |
|---|---|
| Colour / border | 150ms |
| Transform (hover lift, translate) | 280ms |
| Reveal / entrance | 550ms |
| Anything on a path the user is waiting on | ≤400ms hard cap |
| Easing | `cubic-bezier(.2,.7,.3,1)` |
| Stagger between siblings | 80ms, max 4 steps |

## Properties

`transform`, `translate`, `opacity`, `filter`. Nothing else.

Never animate `width`, `height`, `top`, `left`, `margin`, `padding` — layout thrash, and it reads
as cheap. Use `@property` when a custom property needs to interpolate:

```css
@property --lift{ syntax:'<length>'; inherits:false; initial-value:0px }
```

## Reduced motion

Every animation sits inside `@media (prefers-reduced-motion: no-preference)`. Not "shorter" — the
finished state, immediately, with identical layout. The reduced-motion path is not a degraded
experience; for this product it is arguably the correct one.

## Banned

Loops of any kind. Parallax. Scroll-hijacking. Anything triggered by mouse position. Entrance
animations on content below the first two viewports (by then it is just latency). Motion on
anything showing a deadline, a debt, or a legal figure — those are read, not experienced.

## Checklist

- [ ] Content visible with JS disabled
- [ ] Content visible if the observer never fires
- [ ] Nothing animates under `prefers-reduced-motion: reduce`
- [ ] Only transform/opacity
- [ ] Nothing loops
- [ ] Verified in a real render, not by reading computed styles
