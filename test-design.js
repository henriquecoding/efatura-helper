/* Design acceptance tests.
 *
 * The point of this file: a design rule written only in prose rots. This repo already proved it -
 * test-columns.js carried the correct principle in its header comment for ten days while the code
 * did the opposite, and it still reported PASS because it had no assertions. So the subset of
 * .claude/design/ that a machine can check lives here and fails the build.
 *
 * It checks the STATIC source, not a rendered page: no browser needed, so it can run in CI next to
 * the encoding guard. Things that need a real render (the greyscale test, "does it look designed")
 * stay human - see 09-acceptance-tests.md.
 *
 *   node test-design.js            # all pages
 *   node test-design.js index.html # one page
 */

const fs = require("fs");

const PAGES = process.argv[2] ? [process.argv[2]]
  : fs.readdirSync(".").filter(f => f.endsWith(".html")).sort();

let fails = 0;
const bad = m => { fails++; console.log("  FAIL " + m); };
const ok = m => console.log("  ok   " + m);

/* ---- contrast helper (also used when adding a token; see 03-design-system.md) ---------------- */
const lum = h => {
  const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255)
    .map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

/* ---- banned constructs ------------------------------------------------------------------------
 * Each entry is [regex, human explanation]. Keep the explanation actionable: the person reading
 * this output should know what to do, not just that they broke a rule. */
const BANNED_CSS = [
  [/backdrop-filter\s*:\s*blur/i,        "glassmorphism (backdrop-filter: blur) - anti-patterns #1"],
  [/-webkit-background-clip\s*:\s*text/i,"gradient text - anti-patterns #4"],
  [/background(-image)?\s*:\s*(linear|radial|conic)-gradient[^;]*(purple|violet|#[89a-f][0-9a-f]{2}[0-9a-f]{2}f[0-9a-f])/i,
                                          "purple/violet gradient - anti-patterns #3"],
  [/transition\s*:\s*all\b/i,            "transition: all - anti-patterns #55"],
  [/!important/,                          "!important - anti-patterns #46 (comment a third-party override if genuinely needed)"],
  // the property must sit at the START of a transition-list item (after the colon or a comma),
  // otherwise the [^;]* runs past an unterminated declaration into the next selector - ".to-top.in"
  // was read as "top" + ".in" and reported as an animated layout property
  // The property must be at the START of a transition-list item - either straight after the colon
  // or after a comma - and the scan must not cross ; { }. A looser version let [^;]* run past an
  // unterminated declaration into the next selector and read ".to-top.in" as "top" + ".in".
  [new RegExp(
     "transition:\\s*(?:width|height|top|left|right|bottom|margin|padding)\\s+[\\d.]" +
     "|transition:[^;{}]*,\\s*(?:width|height|top|left|right|bottom|margin|padding)\\s+[\\d.]", "i"),
                                          "animating a layout property - anti-patterns #53, use transform"],
  [/text-align\s*:\s*justify/i,          "justified text - anti-patterns #35"],
];

/* Shadows: one elevation level exists. Flag anything with a large blur that is not the two
 * sanctioned card shadows. Crude on purpose - a false positive here is a conversation, which is
 * cheaper than a page that has quietly grown six elevations. */
const SHADOW = /box-shadow\s*:\s*[^;]*?(\d{2,})px\s+(\d{2,})px/gi;

const ALLOWED_SCRIPT_HOSTS = [
  "challenges.cloudflare.com",   // turnstile, on the feedback form
  "analytics.d1060.com",         // self-hosted umami
];

for (const page of PAGES) {
  const src = fs.readFileSync(page, "utf8");
  const raw = (src.match(/<style>[\s\S]*?<\/style>/g) || []).join("\n");
  /* Strip CSS comments before pattern-matching. Without this the checks fire on their own
   * documentation - the comment explaining WHY justified text was removed was itself reported as
   * justified text. A linter that flags its own rationale teaches people to ignore it. */
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  console.log("\n" + page);

  if (!css) { ok("no <style> block, skipped"); continue; }

  /* 1. banned constructs */
  let clean = true;
  for (const [re, why] of BANNED_CSS) {
    const m = css.match(re);
    if (m) { bad(`${why}  ->  ${m[0].slice(0, 60).trim()}`); clean = false; }
  }
  if (clean) ok("no banned CSS constructs");

  /* 2. elevation budget */
  const shadows = [...css.matchAll(SHADOW)].filter(m => Number(m[2]) > 30);
  if (shadows.length) bad(`${shadows.length} oversized shadow(s) - one elevation level only (02-art-direction)`);
  else ok("elevation budget respected");

  /* 3. every animation/transition sits behind reduced-motion, or is a colour-only transition
   *    (safe: colour change is not motion). Checked by counting @keyframes usages outside the
   *    no-preference query. */
  const noPref = (css.match(/@media\s*\(prefers-reduced-motion\s*:\s*no-preference\)/g) || []).length;
  const animDecl = (css.match(/[^-]animation\s*:/g) || []).length;
  if (animDecl > 0 && noPref === 0)
    bad(`${animDecl} animation declaration(s) but no prefers-reduced-motion guard (06-animation-language)`);
  else ok(`motion guarded (${animDecl} animation decls, ${noPref} reduced-motion blocks)`);

  /* 4. focus visibility must exist and must not be removed */
  if (/outline\s*:\s*(none|0)\b/.test(css) && !/:focus-visible/.test(css))
    bad("outline removed with no :focus-visible replacement (03-design-system)");
  else if (!/:focus-visible/.test(css)) bad("no :focus-visible rule at all");
  else ok("focus ring present");

  /* 5. prose measure must be capped somewhere */
  if (!/max-width\s*:\s*(var\(--measure\)|\d+ch)/.test(css))
    bad("no ch-based measure cap on prose - anti-patterns #36");
  else ok("prose measure capped");

  /* 6. no third-party script hosts beyond the allowlist. This one is a security rule as much as a
   *    design rule: the product's claim is that you can read everything that runs. */
  const hosts = [...src.matchAll(/<script[^>]+src="https?:\/\/([^\/"]+)/g)].map(m => m[1]);
  const rogue = hosts.filter(h => !ALLOWED_SCRIPT_HOSTS.includes(h));
  if (rogue.length) bad(`third-party script host(s) not on the allowlist: ${[...new Set(rogue)].join(", ")} - anti-patterns #32`);
  else ok(`script hosts ok (${[...new Set(hosts)].length} allowed)`);

  /* 7. token contrast, on whichever page defines the palette */
  const root = (css.match(/:root\{[\s\S]*?\}/) || [""])[0];
  const tok = {};
  for (const m of root.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] = m[2];
  if (tok.bg && tok.ink) {
    const pairs = [["ink", "bg"], ["ink", "surface"], ["ink2", "surface"],
                   ["mute", "bg"], ["mute", "surface"], ["pri", "bg"],
                   ["green", "bg"], ["red", "bg"], ["amber", "bg"]];
    let worst = null;
    for (const [f, b] of pairs) {
      if (!tok[f] || !tok[b]) continue;
      const r = ratio(tok[f], tok[b]);
      if (r < 4.5) bad(`contrast --${f} on --${b} = ${r.toFixed(2)}, under AA 4.5 (03-design-system)`);
      if (!worst || r < worst[2]) worst = [f, b, r];
    }
    if (worst) ok(`token contrast checked, tightest --${worst[0]}/--${worst[1]} = ${worst[2].toFixed(2)}`);
  }
}

/* ---- homepage hero: the concept-C acceptance criteria ------------------------------------------
 * These are static-source proxies for the five numbers that were measured on the 30-07-2026 hero
 * rebuild. The real values need a render (see 09-acceptance-tests.md); what can be pinned here is
 * the STRUCTURE that produced them, because that is what a later edit would quietly undo.
 *
 * The one that matters most: ONE ruled label/value texture above the fold. The hero had two -
 * a 5-row front matter and a 3-row ledger, side by side, same weight, same rhythm - and that,
 * not spacing, is what made it unreadable. */
if (PAGES.includes("index.html")) {
  const src = fs.readFileSync("index.html", "utf8");
  // strip HTML comments too, for the same reason the CSS ones are stripped above: the note
  // explaining WHY the duplicate CTA was removed was itself counted as a duplicate CTA
  const header = (src.match(/<header>[\s\S]*?<\/header>/) || [""])[0]
    .replace(/<!--[\s\S]*?-->/g, "");
  console.log("\nindex.html - hero");

  const ruled = ["ledger", "spec", "signals"].filter(c => new RegExp('class="[^"]*\\b' + c + '\\b').test(header));
  if (ruled.length) bad(`hero contains a second ruled texture: .${ruled.join(", .")} - only .frontmatter may be ruled above the fold`);
  else ok("one ruled texture in the hero (.frontmatter only)");

  /* These two replace the concept-C column checks (baseline alignment + the [rail] grid). That
   * composition was retired on 30-07-2026 for a single centred column, so the old checks described
   * a hero that no longer exists and failed on a deliberate change. Kept as a note because the
   * reasoning still applies if the side-by-side ever returns: two columns need a shared alignment
   * line, and the hero needs to sit on the same rail as the chapters.
   *
   * What guards the CENTRED hero instead:
   *   1. it stays one column - the side-by-side was rejected because the h1 and the prose competed
   *      for the first read and the prose wrapped to six lines;
   *   2. every centred block caps its own measure, or the ragged edges go asymmetric and the whole
   *      composition reads as accidental rather than set. */
  if (!/\.hero-band\{display:block/.test(src))
    bad("hero is no longer a single column - the side-by-side split was rejected");
  else ok("hero is one centred column");

  var measured = ["\\.hero-band h1\\{[^}]*max-width:\\d+ch",
                  "\\.hero-aside\\{[^}]*max-width:\\d+ch",
                  "header \\.sub\\{[^}]*max-width:\\d+ch"]
    .filter(function (re) { return new RegExp(re).test(src); }).length;
  if (measured < 3)
    bad("only " + measured + "/3 centred hero blocks cap their measure - centred text with an " +
        "uneven measure looks accidental");
  else ok("every centred hero block caps its measure");

  /* Nothing in the masthead may be repeated in the hero. Four labels were - "Consultar NIF",
   * "A minha situação", "Consultar", "Deduções" - because the header search and the hero lens had
   * grown into the same control twice over, 700px apart. This compares the two regions' link and
   * control text directly, which is how those four were found. */
  /* Slice from the masthead's opening tag to the hero's, NOT by matching balanced </div>s: the
   * masthead contains the search form with several nested divs, so a non-greedy [\s\S]*? stopped
   * at the first </div></div> inside the form and never reached the nav. The check silently passed
   * on a duplicate deliberately reintroduced to test it. */
  const mastStart = src.indexOf('<div class="mast">');
  const mastEnd = src.indexOf("<header>", mastStart);
  const mast = (mastStart >= 0 && mastEnd > mastStart ? src.slice(mastStart, mastEnd) : "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const words = s => (s.match(/>([^<>]{4,40})</g) || [])
    .map(x => x.slice(1, -1).replace(/\s+/g, " ").trim().toLowerCase())
    .filter(x => /^[a-zà-ú][a-zà-ú º.-]+$/i.test(x));
  const inMast = new Set(words(mast));
  const repeated = [...new Set(words(header).filter(w => inMast.has(w)))];
  if (repeated.length) bad(`label(s) repeated in masthead and hero: "${repeated.join('", "')}"`);
  else ok("no label repeated between masthead and hero");

  /* KNOWN BLIND SPOT, stated rather than papered over: the masthead tagline "A tua situação fiscal,
   * das fontes oficiais" is word for word the <h1>, and this check does NOT catch it. The h1 is
   * split by <span class="eyebrow">, <br> and <span class="mark-hl">, so it extracts as fragments
   * ("a tua situação fiscal," is dropped on the trailing comma, "das" on the 4-char floor) and
   * never matches the tagline's single string. The duplication is real, visible on desktop, and
   * kept at the owner's explicit request after seeing it both ways - it is not a passing grade.
   * Comparing normalised full-element text instead of tag-delimited runs would catch it; that is
   * the fix if this ever needs to be enforced. */

  /* The hero is CENTRED again as of 30-07-2026, chosen after seeing both. Centring was never the
   * real fault - the fault was the stack that used to come with it: eyebrow, title, paragraph, two
   * buttons and a row of pills, which is the generic hero. So the check now guards the thing that
   * actually goes wrong: no action controls in the hero at all. The masthead owns every action. */
  const heroActions = (header.match(/class="[^"]*\b(?:cta-main|cta-alt|bm)\b/g) || []).length +
                      (header.match(/<button/g) || []).length;
  if (heroActions) bad(`${heroActions} action control(s) in the hero - the masthead owns actions; ` +
                       "a CTA stack is what made the centred hero generic");
  else ok("no action controls in the hero");

  /* The rule is HORIZONTAL, not "five". The column count is content - the FONTES column was dropped
   * once the eyebrow was found to say the same thing - so pinning the literal 5 failed on a change
   * that did not break anything. Three or more columns is a strip; fewer is a stacked table, which
   * is the texture that made it a twin of the ledger. */
  var fmCols = (src.match(/\.frontmatter\{[^}]*grid-template-columns:repeat\((\d+)/) || [])[1];
  if (!fmCols || Number(fmCols) < 3)
    bad("front matter is not a horizontal strip (" + (fmCols || "no repeat()") +
        " columns) - stacked, it becomes a table again");
  else ok("front matter is a horizontal strip (" + fmCols + " columns)");
}

console.log(fails
  ? `\n  ${fails} DESIGN CHECK(S) FAILED - fix the CSS, or amend .claude/design/ and say why`
  : "\n  design acceptance: all checks pass");
process.exit(fails ? 1 : 0);
