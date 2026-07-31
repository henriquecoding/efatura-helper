# 03 — Design system

Tokens are the contract. A value that is not a token is a bug unless it is commented as a
deliberate one-off. Current source of truth: the `:root` block in `index.html`.

## Colour — derived from gov.pt

The palette is **gov.pt's**, warmed. This is deliberate and is the single most important
constraint in this file. The tool sits next to Portal das Finanças and gov.pt in the user's head;
a stranger palette reads as less trustworthy than the product deserves.

```css
--pri:#034AD8;  --pri-dark:#021C51;  --pri-mid:#0338A2;  --pri-light:#1CA3FC;
--ink:#2B363C;  --ink2:#475164;      --mute:#64718B;
--bg:#FAF9F6;                 /* warm paper — the page (OURS, not gov.pt's) */
--surface:#FFFFFF;            /* card stock */
--bg2:#EFEEE9; --bg3:#E1E4EA; --rule:#CFCEC8;
--red:#D12332; --green:#00724C; --amber:#8A6100;
--focus:#ff7a00;

--band:color-mix(in oklab, var(--surface) 78%, var(--bg));
--hair:color-mix(in oklab, var(--ink) 12%, transparent);
--hair-strong:color-mix(in oklab, var(--ink) 22%, transparent);
```

### Provenance — which token comes from where

| ours | gov.pt token | |
|---|---|---|
| `--pri` `#034AD8` | `--color-primary-600` | exact |
| `--pri-dark` `#021C51` | `--color-primary-900` | exact |
| `--pri-mid` `#0338A2` | `--color-primary-700` | exact |
| `--pri-light` `#1CA3FC` | `--color-secondary-500` | exact |
| `--ink` `#2B363C` | `--color-neutral-900` | exact |
| `--ink2` `#475164` | `--color-neutral-800` | exact |
| `--mute` `#64718B` | `--color-neutral-700` | exact |
| `--bg3` `#E1E4EA` | `--color-neutral-200` | exact |
| `--green` `#00724C` | gov success | exact |
| `--red` `#D12332` | gov error | exact |
| `--bg` `#FAF9F6` | *(gov: `#F7F8FA`)* | **ours — warm** |
| `--bg2` `#EFEEE9` | *(gov: `#F1F3F8`)* | **ours — warm** |
| `--rule` `#CFCEC8` | *(gov: `#CDD2DC`)* | **ours — warm** |
| `--focus` `#ff7a00` | *(gov: `#F408FC`)* | **ours — amber, not magenta** |

**The blues and the neutral text ramp are shared. The paper is ours.** That is the whole formula:
enough kinship to read as part of the same civic family, enough divergence not to be a clone or to
imply endorsement. See `00-mission.md` — palette kinship is allowed, crests and seals are not.

Divergences and why: gov.pt's neutrals are cool, and a page about someone's tax debt reads
clinical on cool grey; the warm ramp is the product's own voice. gov.pt's focus magenta is a fine
accessibility choice on their white, but ours must also clear a dark-blue header, and amber does
both without the neon shock.

### Contrast — computed, not eyeballed

Tightest pair in the system is `--mute` on `--bg` at **4.66**. Every pair clears AA 4.5. Verified
by `node test-design.js`, which fails the build if any drops below.

`--bg` is `#FAF9F6` rather than a deeper cream partly for this reason: at `#F7F6F2` the mute pair
lands at 4.54, which is inside rounding distance of failing.

**Rule: no new colour ships without its ratio computed against both `--bg` and `--surface`.**

### Before changing any of this

Re-read the provenance table. The palette was accidentally replaced once on 30-07-2026 — the old
comment stated the intent ("reads like a state service") but never named gov.pt, so the values
looked arbitrary and got swapped for an unrelated cream-and-navy set. The table exists so that
cannot happen twice.

## Type scale

Fluid, `clamp()`, no fixed px.

| Role | Size |
|---|---|
| Hero `h1` | `clamp(2.1rem, 6vw, 3.7rem)` / 1.04 / −0.035em / balance |
| Section `h2` | `clamp(1.55rem, 3.4vw, 2.35rem)` / 1.12 / −0.022em / balance |
| Card `h3` | `1rem` – `1.25rem` / 1.35 |
| Lead | `clamp(1.02rem, 1.5vw, 1.16rem)` / 1.62 / max 60ch |
| Body | `1rem` / 1.6 / max 64ch (`--measure`) |
| Small / caption | `0.86rem` / 1.5 |
| Mono eyebrow | `0.72rem` / uppercase / +0.09em |
| Figure (mono) | `1.5rem` / 600 / tabular |

Hierarchy must survive with all weights set to 400. If it does not, it was carried by bold.

## Space

```css
--step: clamp(56px, 7vw, 104px);   /* between sections — the rhythm unit */
```

Within a component: 4, 8, 12, 16, 20, 24. Nothing between those. Between sections: `--step` only.
Mobile (≤640px) reduces `--step` to `clamp(40px, 9vw, 60px)`; nothing else changes.

## Radius

| Use | Value |
|---|---|
| Controls — buttons, inputs, chips | `6px` (`--r`) |
| Cards — dossier, proof, boxes | `14–16px` |
| Signals / inner cards | `12px` |
| Status pills | `999px` — the only legitimate `rounded-full` |

Controls and cards are deliberately different so a control never reads as a card.

## Lines

1px, `--hair`. `--hair-strong` for a boundary that separates two kinds of content (thead, footer).
Border-left 3–4px in an accent marks a category on a callout — the one place a thick rule is used.

## Elevation

One level. `0 10px 26px rgba(18,32,51,.055)` on the example dossier, `0 12px 28px` at 9% ink on
proof-card hover. Nothing else has a shadow. There is no `--shadow-md`, and adding one is a
system change requiring a reason.

## Focus

`3px solid var(--focus)` with `2px` offset, on every interactive element, everywhere. Amber because
it clears both the paper and the dark-ink header. Never removed, never restyled per component.

## Touch targets

44px minimum on every interactive element, including inline links in dense lists on mobile.

## Motion

```css
--ease: cubic-bezier(.2,.7,.3,1);
```

150ms colour, 280ms transform, 550ms reveal. Nothing over 400ms on an interaction path. Everything
inside `@media (prefers-reduced-motion: no-preference)`.

## Adding a token

1. Prove the existing set cannot express it.
2. Compute contrast against `--bg` and `--surface` if it is a colour.
3. Add it to `:root` with a comment saying what it is *for*, not what it looks like.
4. Update this file in the same change.

A token added without step 4 is how a system becomes a pile of variables.
