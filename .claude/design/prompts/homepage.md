# Prompt — homepage (`index.html`)

## Job

Convince someone that a tool which reads their tax record without a password is (a) real,
(b) safe, and (c) worth the two minutes — and then get them to install it. In that order. Trust
before the ask, always.

## Structure (v2, approved 2026-07-30)

```
alert bar        the one safety rule: passwords only on .gov.pt
masthead         mark, name, "A minha situação" (primary), "Consultar NIF"
hero             h1 + sub + CTA + honesty badges
draft notice     "Só lê. Não submete nada."
example dossier  what the output looks like — labelled example, three ways
01 Controlo e prova   session / verifiable / data stays
02 O que já faz por ti  validated, then "o que ainda não"
   Apoia esta ferramenta (in a box — no chapter number)
03 Como classificar as faturas
04 O que acontece quando clicas  — the full network request list
05 Porque é seguro
06 Instalar
07 Que setor escolher
08 Ver a atividade de um comerciante
09 Porque é que a Fatura Boa existe
10 Obrigado, e diz-me o que está mal  (feedback form)
11 Quem fez isto
12 Fontes
footer
```

Chapters are CSS counters. Sections alternate onto `--band`.

## Load-bearing — do not rewrite

- **Chapter 04 must match reality.** It is the published network-request list and `test-network.js`
  phase 2 asserts against it. Adding a request means updating this section in the same change.
- **The draft notice** — `test-draft.js`.
- **Chapter 05's security claims.** Rewrite around them, never soften them for flow.
- **Chapter 12 sources.** Every legal figure on the site traces back here.
- **The example dossier's three disclosures** — chip, figcaption, `aria-label`.

## The hero is a document header band (concept C, 30-07-2026)

Title left, running prose and CTA right sharing its **baseline**, then a 2px ink rule, then the
colophon as **one horizontal strip** of five label/value pairs. The example ledger is NOT in the
hero — it opens chapter 02, where it gets the full main column.

**The governing rule, and the reason this rebuild happened: ONE ruled texture above the fold.**
The previous hero had two — a 5-row front matter and a 3-row ledger, side by side, same weight and
same rhythm. The eye saw twin tables competing and there was no first read. That is not a spacing
problem and cannot be fixed with spacing. If the hero has more than one column, exactly one may be
ruled; everything else is type.

Measured before → after, at 1440×900:

| | before | after | budget |
|---|---|---|---|
| elements above the fold | 20 | **10** | ≤ 12 |
| hero height | 822px | **527px** | ≤ 520 (+7, accepted) |
| void under the short column | 206px | **48px** | ≤ 40 (+8, accepted) |
| column baseline drift | 141px | **0** | 0 |
| ruled textures in the hero | 2 | **1** | 1 |

`test-design.js` pins the structure that produces these: one ruled texture, `align-items:end`,
left alignment, and the 5-column strip. It cannot measure the pixels — that needs a render.

## Hero rules

- `h1` is a statement of fact, not a slogan. Currently "A tua situação fiscal, das fontes oficiais."
- The sub must contain, in the first sentence, that it does not ask for a password. That is the
  single objection everything else has to get past.
- Badges are claims that are all literally true and all tested. Never add an untestable one.
- No `min-height: 80vh` — it pushes the dossier below the fold, which defeats the dossier.
- The recovered-euro counter stays hidden until the number is real and non-zero. No fake social
  proof, ever.

## Tone

Second person singular. Short sentences. The credibility comes from the admissions — "o que ainda
não", "indicador, confirma", "isto pode estar errado" — not from confident claims. Do not polish
those away.

## Do not

Add testimonials, logo strips, a pricing section, a comparison table against competitors, urgency
of any kind, or a second primary CTA. Do not centre body copy. Do not let the page imply the State
built or endorses it.

## Done

`node test-design.js`, `npm test`, render at 1440 and 390 and look, four gates in
`09-acceptance-tests.md`.
