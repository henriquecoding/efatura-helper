# 08 — Refactoring process

## The two layers

The source proposal for this document said: *never modify an existing component, always recreate;
never reuse CSS; never preserve old layouts.*

**That is right for one layer of this codebase and catastrophic for the other.** Applied wholesale
it would delete the consent gate, the published network-request list, the `DRAFT = true` guard and
the security copy — all of which are load-bearing, tested, and the reason the product is allowed to
touch someone's tax account.

So the rule splits.

### Visual layer — recreate, do not patch

Tokens, spacing, type scale, banding, card chrome, motion, decorative markup.

Here the aggressive instinct is correct. Incremental patching is exactly how the 30-07-2026
"redesign" ended up looking identical to what it replaced: a palette swap plus two components,
bolted onto a structure — `section{padding:38px}`, `h2{1.4rem}`, justified prose — that was never
touched. The result had new colours and the same silhouette.

When restyling: **change the architecture first** (scale, rhythm, banding, measure), then the
surface. If the diff is only colours, you have not redesigned anything.

### Load-bearing layer — never touch without a red test first

| | |
|---|---|
| Consent gate and its silence | `test-network.js` phase 1 |
| The published request list | `test-network.js` phase 2 |
| `DRAFT = true` | `test-draft.js` |
| Ceilings agreeing across three files | `test-deducoes-sync.js` |
| Truthful-column default | `test-columns.js`, `test-r1.js` |
| `tool.js` pure ASCII | `encoding-guard.yml` |
| Security copy, source citations, "indicador, confirma" | prose — treat as code |

Procedure: **make the guarding test fail on purpose, look at what it says, then decide.** If you
cannot find a test for a behaviour you are about to change, that is the finding — write the test
first.

## Order of work

1. **Look.** Render the current state and actually view it. `npm run dev`, then screenshot with
   playwright-core and the local Chrome. The browser pane here does not composite frames, so
   `computer{action:"screenshot"}` times out and computed styles are not a look.
2. **Diagnose structurally.** Name the architectural cause. "It looks dated" is not a diagnosis;
   "every section has identical padding so nothing has rank" is.
3. **Design.** Decide scale, rhythm, hierarchy before writing a selector.
4. **Implement.** Visual layer freely; load-bearing layer only via step 0 above.
5. **Verify.** `npm test` (15 must pass), `node test-design.js`, render again and *look*, check
   390px for horizontal overflow, check `prefers-reduced-motion`.
6. **Record.** Update `docs/homepage-redesign.md` and the relevant `.claude/design/` file in the
   same change. A decision not written down will be re-litigated.

## Deleting

Deletion is the highest-value edit available and is encouraged in the visual layer. Before
deleting anything in the content layer, check it is not pinned by a test or cited as a source.

## When a rule here is wrong

Say so, with the case. These documents are a constitution, not scripture — but amend them
explicitly rather than quietly working around them. A rule silently ignored twice is a rule that no
longer exists, and nobody will know which ones are still real.

## Definition of done

Not "implemented". Done means:

- [ ] The originally requested thing is fully addressed
- [ ] `npm test` — 15/15
- [ ] `node test-design.js` — passes
- [ ] Rendered and **looked at**, at 1440px and 390px
- [ ] No document-level horizontal scroll at 390px
- [ ] Greyscale / no-shadow / no-JS all still usable
- [ ] Every deviation from the system commented with its reason
- [ ] Docs updated in the same change
- [ ] Residual risks stated plainly, including anything that could not be verified

Reporting a visual result that has not been looked at is the specific failure this list exists to
prevent. It has already happened once.
