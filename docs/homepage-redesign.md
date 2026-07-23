# Homepage redesign + reposition (approved 2026-07-24)

## Why
The homepage is 100% about the e-Fatura classifier (hero + the despesas-gerais ceiling example).
The tool is now a fiscal-PROFILE engine that reads the user's own official record; the
classification is one piece, no longer the headline. Reposition + fix UI/spacing/SEO. Make the
profile PUBLIC (remove the window.__FB_PROFILE flag gate), honestly staged by what is validated.

## Positioning
Fatura Boa = the free, verifiable, no-password, all-in-one tool that reads YOUR OWN fiscal record
(Financas + Seg. Social, in your own session) and helps you act on it. Unique: competitors ask for
your password (fede) or manual input (henrique); nobody reads your own session locally. No session
sharing, all local, provably verifiable (/verificar).

## Risk stance (drives the staging)
Read-only + local + verifiable = low risk (confirmed). The ONE managed risk is correctness: the
active-atividade / recibos / IRS-with-rows paths are NOT validated with real non-zero data (Diogo's
account is cessada). So:
- Promote the VALIDATED partitions with confidence: e-Fatura, rendas (Cat F), situacao (dividas/
  prazos), patrimonio (IMI), IRS history, consultar NIF.
- Label the unvalidated ones "em desenvolvimento / confirma": atividade, recibos verdes, IVA regime.
- Never frame a number as advice ("indicador, confirma"). Telemetry stays opt-in + redacted.

## Homepage structure
1. Hero: "A tua vida fiscal, das fontes oficiais. Sem password, verificavel." + primary CTA (Criar o meu perfil).
2. O que ja faz por ti - the validated pieces (consumer/e-Fatura, landlord/rendas, situacao, IMI, IRS, NIF).
3. O que ainda nao - honest "em desenvolvimento" (atividade/recibos/IVA nuances).
4. Como funciona / porque e seguro - own session, no password, local, verificavel (link /verificar, provably-fair).
5. Instalar - the profiling bookmarklet, now PUBLIC (remove __FB_PROFILE gate; SRI/provably-fair stays).
6. Consultar NIF (secondary), porque existe, feedback, fontes.
7. SEO/URLs: retitle + meta around "perfil fiscal" + faturas + IRS; add /perfil + /verificar to sitemap; fix spacing/UI throughout.

## Build notes
- Un-gate: the public loader (index.html) + /perfil bookmarklet set window.__FB_PROFILE. Keep the SRI variant.
- Keep the classifier reachable (it is a partition/entry, not removed).
- Preserve the DRAFT=true safety and the security copy (adapt, do not weaken the claims - they are load-bearing and tested by test-draft.js / served-matches).
- Provably-fair: bump FB_VERSION + make-versions.mjs on any tool.js change.
