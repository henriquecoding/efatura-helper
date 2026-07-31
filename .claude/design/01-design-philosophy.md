# 01 — Design philosophy

## Built, not decorated

Every element must be able to answer *what would break if I removed you*. If the answer is "the
page would look emptier", it goes.

This is not minimalism as a style. Minimalism as a style produces its own decoration — the
performatively sparse page with three words and a lot of air. This is the opposite instinct: the
page is dense with real information, and nothing has been added on top of it.

## The substitution rules

These are the operative form of the philosophy. When you reach for the thing on the left, use the
thing on the right.

| Reaching for | Use instead | Why |
|---|---|---|
| Shadow | A 1px line | A line states an edge. A shadow implies a physical object that is not there. |
| Illustration | Typography | The page is about numbers and law. Set them well and they are the picture. |
| Colour | Hierarchy | Colour as the primary signal fails for ~8% of men and in every printout. |
| Marketing copy | Information | The strongest persuasion available here is being demonstrably right. |
| An icon | A word | Portuguese tax vocabulary has no reliable icon set. A word is unambiguous. |
| A card | Whitespace | Most "cards" are a box drawn around content that was already grouped by proximity. |
| An animation | Layout | If motion is needed to show a relationship, the layout has not shown it. |

## Whitespace is structure

Space is the primary grouping mechanism. It is load-bearing, and it is therefore *specified*, not
sprinkled: everything derives from one rhythm unit (`--step`), and proximity always means
relationship.

Two elements 12px apart are one thing. Two elements 100px apart are two things. If those distances
are inconsistent down a page, the reader has to re-learn the grammar in every section — which is
exactly why the pre-30-07-2026 homepage read as an undifferentiated wall despite being well
written.

## Inevitability

A finished component should look like the only reasonable solution, not like one of several
attractive options. The test: could you explain every dimension, every weight, every gap, without
saying "it looked better"? Where the answer is no, that choice has not been made yet — it has been
defaulted.

This is the difference between a page that is designed and a page that is styled.

## Precision is the aesthetic

Alignment that is exactly right, a scale where every step is deliberate, optical corrections where
they are needed, numbers that line up because they are tabular. This is where beauty comes from
here — not from ornament. A page where nothing is decorated and everything is exact reads as
expensive. A page with a gradient and misaligned baselines reads as cheap, whatever the palette.

## Honesty as a design constraint

Unusually for a design document, this is the strongest constraint in it. The interface is
describing someone's legal and financial position to them.

- Uncertainty must be *visible*, at the same size as the number it qualifies. Not a tooltip.
- Example data must be unmistakable as example data.
- A default is a recommendation, whatever you intended, because most people do not change it.
  Choose defaults as if nobody will read the alternative — because that is measurably what happens.
- Where the tool cannot know something, the interface says so rather than showing a confident blank.

A beautiful interface that misleads is a failed interface. This ranks above every other rule here.

## Density is allowed

Calm does not mean empty. This audience is reading a legal document rendered as a webpage; they
want the detail. Give them the detail, in a clear order, at a comfortable measure, with a rhythm
that lets them find their place. Do not thin the content to make the page look serene.

The failure mode to avoid is not density. It is *undifferentiated* density.
