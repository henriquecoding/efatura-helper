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

/* ---- the shell composition: acceptance criteria for the 01-08-2026 rebuild --------------------
 * REPLACES the concept-C hero checks. Those pinned a composition that no longer exists: a masthead
 * with an inline search, a .hero-band that had to be display:block, a .frontmatter strip inside the
 * hero. The site now has ONE shell across twelve routes - security rule, centred brand, rectangular
 * navbar - and the hero is a plain eyebrow/h1/lead with no controls in it.
 *
 * The old checks were left passing by accident after the rebuild, because the CSS they matched on
 * (.hero-band, .frontmatter) survived as dead rules further down index.html's inline <style> while
 * the markup they described was gone. A check that cannot fail is worse than no check, so they are
 * replaced here rather than deleted quietly. */
const SHELL_PAGES = ["index.html", "perfil.html", "deducoes.html", "base-legal.html"];
console.log("\nshell - composition");
{
  const shellCss = fs.readFileSync("assets/site.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

  /* 1. The navbar is a rectangle with a hairline, NOT a floating capsule. The capsule (a pill
   *    detached from the page, usually blurred) is the single most generic thing a site can wear,
   *    and it is banned by name in anti-patterns. Pinned by: no blur anywhere on it, and a radius
   *    that is a real corner rather than a pill. */
  const navRule = (shellCss.match(/\.primary-nav \{[^}]*\}/) || [""])[0];
  if (/backdrop-filter|blur\(/.test(navRule)) bad("the primary nav uses blur - capsule/glass nav is banned");
  else ok("nav has no blur");
  const navRadius = (navRule.match(/border-radius:\s*(?:var\(--card-radius\)|(\d+)px)/) || [])[0];
  if (!navRadius) bad("the primary nav has no explicit border-radius");
  else if (/999|9999|50%/.test(navRadius)) bad("the primary nav is a pill - it must read as a rectangle");
  else ok("nav is a rectangle, not a pill");

  /* 2. The security rule is TEXT on every page, and is never demoted into a tooltip or an image.
   *    It is the only claim on this site whose failure mode is someone losing money. */
  for (const p of SHELL_PAGES) {
    const src = fs.readFileSync(p, "utf8");
    const sr = (src.match(/<div class="security-rule"[\s\S]*?<\/div>\s*<\/div>/) || [""])[0];
    if (!sr) { bad(p + ": no security rule"); continue; }
    if (/<img|background-image/.test(sr)) bad(p + ": the security rule is carried by an image");
    if (!/\.gov\.pt/.test(sr)) bad(p + ": the security rule does not name .gov.pt");
    if (/title="/.test(sr)) bad(p + ": part of the security rule is in a tooltip");
  }
  ok("security rule is real text naming .gov.pt on all four modes");

  /* 3. No action controls in the hero. Every mode owns its action in the search bar above; a CTA
   *    stack 300px below the same button is what made the previous centred hero generic. */
  for (const p of SHELL_PAGES) {
    const src = fs.readFileSync(p, "utf8");
    const hero = (src.match(/<header class="page-hero[^"]*">[\s\S]*?<\/header>/) || [""])[0]
      .replace(/<!--[\s\S]*?-->/g, "");
    if (!hero) { bad(p + ": no .page-hero"); continue; }
    const acts = (hero.match(/<button|class="[^"]*\bbtn\b/g) || []).length;
    if (acts) bad(p + ": " + acts + " action control(s) in the hero - the search bar owns actions");
  }
  ok("no action controls in any hero");

  /* 4. Every hero caps its own measure. Centred or ranged left, text with an uneven measure reads
   *    as accidental rather than set. */
  const flat = shellCss.replace(/\s+/g, " ");
  const capped = [/\.page-hero h1 \{[^}]*max-width: ?\d+ch/,
                  /\.page-hero \.lead \{[^}]*max-width: ?\d+ch/]
    .filter(re => re.test(flat)).length;
  if (capped < 2) bad("only " + capped + "/2 hero blocks cap their measure");
  else ok("hero h1 and lead both cap their measure");

  /* 5. The active nav state does not depend on colour alone (A11Y-010): it must also carry a
   *    weight change and a rule/inset, so it survives greyscale and forced colours. */
  const activeRule = (shellCss.match(/\.primary-nav \[aria-current="page"\] \{[^}]*\}/) || [""])[0];
  const signals = ["background", "font-weight", "box-shadow"].filter(k => activeRule.includes(k)).length;
  if (signals < 3) bad("the active nav state carries only " + signals + "/3 signals - colour alone fails greyscale");
  else ok("active nav state: wash + weight + rule (survives greyscale)");
}

/* ---- Mesa Fiscal: the ONE documented glass exception --------------------------------------
 * Glassmorphism stays banned in the product. assets/demo-stage.css is the single sheet allowed
 * to use backdrop-filter, and ONLY on the .demo-chrome selectors (the device's navigation
 * chrome). This block is what keeps the exception an exception: blur may never spread to the
 * stage, a panel, a card or a table, the solid fallback must come before the @supports
 * promotion, and the preference fallbacks must exist. */
console.log("\nassets/demo-stage.css - the demo chrome exception");
{
  const demoCss = fs.readFileSync("assets/demo-stage.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

  // Every backdrop-filter must live in a rule whose SELECTOR (not the @supports/@media prelude
  // above it) names .demo-chrome. Walk back from each occurrence to the nearest opening brace
  // whose prelude is a selector, skipping at-rule preludes.
  const lines = demoCss.split("\n");
  let blurOutside = 0;
  lines.forEach((line, i) => {
    if (!/backdrop-filter/.test(line) || /none/.test(line)) return;
    for (let j = i; j >= 0; j--) {
      const m = lines[j].match(/^([^{}]+)\{\s*$/) || lines[j].match(/^([^{}@]+)\{/);
      if (!m) continue;
      const sel = m[1].trim();
      if (sel.startsWith("@")) continue;          // at-rule prelude: keep walking to the selector
      if (!/\.demo-chrome/.test(sel)) { bad(`backdrop-filter fora do chrome: "${sel.slice(0, 60)}"`); blurOutside++; }
      break;
    }
  });
  if (!blurOutside) ok("backdrop-filter apenas em .demo-chrome");
  for (const banned of ["demo-stage", "demo-panel", "demo-row", "demo-kv", "demo-scene"]) {
    const re = new RegExp("\\." + banned + "[^{]*\\{[^}]*backdrop-filter", "m");
    if (re.test(demoCss)) bad(`blur no conteudo: .${banned}`);
  }

  // solid fallback FIRST, promotion only via @supports
  const iSolid = demoCss.indexOf(".demo-chrome {");
  const iSupports = demoCss.indexOf("@supports");
  if (iSolid === -1 || iSupports === -1 || iSolid > iSupports)
    bad("o fallback solido nao precede a promocao @supports");
  else ok("fallback solido antes do @supports de blur");

  if (!/prefers-reduced-transparency/.test(demoCss)) bad("sem fallback de transparencia reduzida");
  else ok("prefers-reduced-transparency coberto");
  if (!/prefers-reduced-motion/.test(demoCss)) bad("sem bloco de reduced motion");
  if (!/forced-colors:\s*active/.test(demoCss)) bad("sem bloco de forced-colors");
  else ok("reduced motion e forced-colors cobertos");

  if (/transition:\s*all/.test(demoCss)) bad("transition: all na demo");
  if (/animation[^;]*:(?:[^;]*\b(width|height|top|left|margin)\b)/.test(demoCss)) bad("animacao de layout na demo");
  if (/#(8b5cf6|a855f7|7c3aed|9333ea)|violet|purple/i.test(demoCss)) bad("violeta na demo");
  else ok("sem transition:all, sem animacao de layout, sem violeta");

  // one elevation level only: the device shadow token
  const shadows = (demoCss.match(/box-shadow:(?![^;]*inset)[^;]*;/g) || [])
    .filter((s) => !/var\(--demo-shadow\)|none/.test(s));
  if (shadows.length) bad(`${shadows.length} sombra(s) alem de --demo-shadow - um nivel de elevacao apenas`);
  else ok("um unico nivel de elevacao (--demo-shadow)");
}

console.log(fails
  ? `\n  ${fails} DESIGN CHECK(S) FAILED - fix the CSS, or amend .claude/design/ and say why`
  : "\n  design acceptance: all checks pass");
process.exit(fails ? 1 : 0);
