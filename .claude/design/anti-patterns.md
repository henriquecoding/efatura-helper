# Anti-patterns

The most useful document here. Read it before designing, not after.

Every ban below has a reason attached. A ban without a reason gets cargo-culted and then
misapplied; a ban with a reason can be argued with, which is the point. If you think one is wrong
for a specific case, say so and say why — do not silently ignore it, and do not silently obey it
into something worse.

---

## A. The generic-AI-output tells

These are the things that make a page look like it was generated. They are banned because they are
*someone else's* visual language, arrived at by default rather than by decision.

1. **Glassmorphism.** Frosted translucent panels. Banned outright.
2. **Neumorphism.** Soft extruded plastic. Banned outright.
3. **Purple/violet gradient anything.** The single strongest "an AI made this" signal in 2026.
4. **Gradient text.** Especially on headings.
5. **Gradient borders**, animated or not.
6. **Mesh gradients / blobs / aurora backgrounds.**
7. **Floating particles, animated dots, constellation canvases.**
8. **`shadow-xl` and friends** — big soft drop shadows doing the work a 1px line should do.
9. **`rounded-full` on non-circular things.** Pills for buttons that are not tags or status.
10. **Icons inside coloured circles**, three across, above three short paragraphs.
11. **Emoji as UI iconography.** (Emoji inside user-facing *prose* is a separate question; as an
    icon system it is banned.)
12. **A centred hero with a gradient blob behind it and two buttons.**
12b. **The split hero: copy column left, product card right.** Added 30-07-2026 after walking
    straight into it. Fixing #12 by going asymmetric is not enough — left-copy/right-card *is* the
    Stripe/Linear/Vercel hero and reads as generic SaaS instantly. If the hero has a second column,
    it must be a document element (a ruled table, a metadata block, a figure), never a rounded card
    with a shadow. See `.ledger` and `.frontmatter` in `index.html` for the form this takes here.
13. **Bento grids** used as decoration rather than because the content has that shape.
14. **Marquee / infinite-scroll logo strips.**
15. **Numbers that count up on scroll** when the number is not the point.
16. **"Trusted by" rows** with no real logos behind them.
17. **Fake dashboards** in a hero as a product screenshot.
18. **3D tilt on hover.**
19. **Spotlight-follows-cursor** border effects.
20. **Typewriter text animation.**

## B. The template smells

Bans on looking like a specific well-known template. Named deliberately — vagueness here does not
work.

21. Landing that reads as **Tailwind UI**.
22. Landing that reads as **shadcn/ui marketing**.
23. Landing that reads as **Vercel**, **Framer**, or **Linear** marketing.
24. Landing that reads as **Aceternity / Magic UI** component demos.
25. **SaaS dashboard chrome** — sidebar, avatar top-right, stat cards — on a page that is not a
    dashboard.
26. **Pricing table with a highlighted middle column.** This product is free; there is no pricing
    page, and if one ever appears it does not look like this.
27. **Feature grid of 3×2 cards with an icon, a bold line and two grey lines.**

## C. Bans specific to *this* product

These matter more than sections A and B, because breaking them is not ugly — it is dishonest.

28. **Never show a fabricated fiscal number** without three independent disclosures that it is an
    example (visible chip, caption, `aria-label`). A plausible-looking personal balance on a tax
    site is a lie whatever the intent.
29. **Never use urgency as decoration.** No countdowns, no red badges, no "3 dias restantes" unless
    it is that user's real deadline read from a real source.
30. **Never frame a number as advice.** It is an indicator to confirm. This is written into the
    product's risk stance and is not a copy preference.
31. **Never imply endorsement by the AT, Finanças, Segurança Social or any state body.** The palette
    is deliberately institutional; the page says plainly it is not a state service. Do not blur
    that with crests, seals, `.gov`-looking chrome, or official-sounding badges.
32. **Never add a third-party script for a visual effect.** The security claim is that you can read
    everything that runs. A CDN animation library breaks it for a fade.
33. **Never put anything behind an animation that must be readable.** Covered in
    `06-animation-language.md`; repeated here because it already shipped once.
34. **Never soften a security claim to make copy flow better.** The claims are load-bearing and
    tested. Rewrite around them.

## D. Layout and type

35. **Justified text.** Rivers of white in a narrow column; reads like a 2009 PDF. Left-aligned,
    `text-wrap: pretty`.
36. **Body measure over ~70ch.** Hard cap; 60–66ch is the target.
37. **More than two type families.** Currently IBM Plex Sans + IBM Plex Mono. That is the budget.
38. **Headings below ~1.6× body size.** If a heading is not obviously a heading without bold, the
    scale is broken.
39. **Uniform section padding down the whole page.** Rhythm requires contrast; everything at 38px
    reads as one undifferentiated scroll. This was the actual bug in the pre-30-07-2026 homepage.
40. **Centre-aligned body copy.** Centre the hero if it earns it; never centre paragraphs.
41. **Text over a photograph** without a solid backing.
42. **Fewer than 44px touch targets.**
43. **Placeholder-as-label** in forms.
44. **`letter-spacing` on lowercase body text.**
45. **All-caps for anything longer than three words**, outside mono eyebrows.

## E. CSS

46. **`!important`** outside a deliberate, commented override of third-party CSS.
47. **Hardcoded hex** where a token exists. If a new colour is genuinely needed, it becomes a token.
48. **Magic numbers** for spacing. Use the rhythm unit.
49. **`px` for type.** `rem`/`clamp()`.
50. **Fixed heights on text containers.**
51. **`position: absolute`** used to escape a layout problem rather than to place an overlay.
52. **`z-index` above 10** without a comment saying what it is stacking against.
53. **Animating `width`, `height`, `top`, `left`, or `margin`.** Transform and opacity only.
54. **Transitions longer than 400ms** on anything the user is waiting for.
55. **`transition: all`.**
56. **Media queries that contradict a container query** on the same component. Pick one axis.

## F. Process

56b. **Never ship a design without auditing it against THIS FILE, line by line.** Added
    30-07-2026, and it is the most important rule in the document. This list was written and then
    the very next artefact violated #7, #8, #13, #17 and #23 — a fake dashboard in a hero, in
    floating rounded cards, with an oversized shadow, by the same hand that had just banned all
    five, hours earlier. A specification you do not check your own output against is worth exactly
    nothing. Before saying a page is done, walk sections A–E and name the number of anything you
    are close to.
57. **Never call a visual change done without looking at a render.** Computed styles are not a look.
58. **Never describe a redesign you have not seen.** This has happened here.
59. **Never write a design rule without a test or a reason.** Prose rots — the `test-columns.js`
    header stated the correct principle for ten days while the code did the opposite and the test
    still reported PASS.
60. **Never treat "the user reaffirmed it" as "I no longer need to check."** Two supposedly
    hallucinated tax diplomas turned out to be real and correctly cited. Verify, then comply or
    object with evidence.
