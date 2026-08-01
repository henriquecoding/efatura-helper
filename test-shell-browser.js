// Native menu semantics and geometry in a real browser. This guards the old plain-div focus trap
// and the mobile sheet sitting outside the viewport.
const { chromium } = require("playwright-core");
const { readFileSync } = require("fs");
const path = require("path");

const EXE = process.env.CHROME_PATH || "/usr/bin/chromium";
const ROOT = __dirname;
let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });

  async function pageAt(width, height) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "https://local.test") return route.fulfill({ status: 204, body: "" });
      const rel = url.pathname.replace(/^\//, "") || "index.html";
      try {
        const body = readFileSync(path.join(ROOT, rel));
        const contentType = rel.endsWith(".css") ? "text/css" : rel.endsWith(".js")
          ? "text/javascript" : rel.endsWith(".svg") ? "image/svg+xml" : "text/html";
        route.fulfill({ body, contentType });
      } catch (error) { route.fulfill({ status: 404, body: "" }); }
    });
    await page.goto("https://local.test/sobre.html", { waitUntil: "domcontentloaded" });
    return page;
  }

  const desktop = await pageAt(1440, 900);
  const native = await desktop.locator("#site-menu").evaluate((el) => el.tagName === "DIALOG");
  if (!native) bad("o menu complementar nao e um <dialog> nativo");
  await desktop.click("button.nav-menu");
  const opened = await desktop.evaluate(() => ({
    open: document.querySelector("#site-menu").open,
    expanded: document.querySelector("button.nav-menu").getAttribute("aria-expanded"),
    focus: document.activeElement.hasAttribute("data-menu-close"),
  }));
  if (!opened.open || opened.expanded !== "true") bad("abrir nao sincroniza dialog e aria-expanded");
  if (!opened.focus) bad("o foco nao entra pelo botao Fechar");
  else ok("desktop: dialog abre, anuncia e recebe o foco");
  await desktop.keyboard.press("Escape");
  const closed = await desktop.evaluate(() => ({
    open: document.querySelector("#site-menu").open,
    expanded: document.querySelector("button.nav-menu").getAttribute("aria-expanded"),
    returned: document.activeElement.matches("button.nav-menu"),
  }));
  if (closed.open || closed.expanded !== "false" || !closed.returned)
    bad("Escape nao fecha ou nao devolve o foco ao acionador");
  else ok("Escape fecha e devolve o foco");
  await desktop.close();

  const mobile = await pageAt(390, 844);
  await mobile.click("button.nav-menu");
  const geometry = await mobile.evaluate(() => {
    const rect = document.querySelector("#site-menu").getBoundingClientRect();
    return { left: rect.left, right: rect.right, bottom: rect.bottom,
      width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth };
  });
  if (geometry.left < -1 || geometry.right > geometry.width + 1 || geometry.bottom > geometry.height + 1)
    bad(`menu mobile fora do viewport: ${JSON.stringify(geometry)}`);
  if (geometry.scroll > geometry.width + 1) bad("menu mobile cria overflow horizontal");
  else ok("mobile: dialog cabe no viewport e nao alarga a pagina");
  await mobile.keyboard.press("Escape");

  /* THE MEASURE OF THE TEXT COLUMN ON A PHONE.
   * /sobre lays its chapters on a [rail]/[main] grid. The <=900px query drops the [rail] line but
   * `> *` cannot reach ::before, which kept asking for it - an unresolvable name makes an IMPLICIT
   * track, that track took ~193px of a 362px viewport, and every paragraph in the long chapters
   * rendered about eight characters wide. The page stood at 60.000px and read as if the content
   * were missing. Nothing in the suite could see it, because height and overflow were both legal.
   * A body-copy column narrower than half the viewport is the symptom to refuse. */
  const measure = await mobile.evaluate(() => {
    const out = [];
    document.querySelectorAll(".about-wrap > section").forEach((section) => {
      const block = section.querySelector("p, li, dd");
      if (block) out.push({ id: section.id, w: Math.round(block.getBoundingClientRect().width) });
    });
    return { blocks: out, vw: innerWidth, height: document.documentElement.scrollHeight };
  });
  const narrow = measure.blocks.filter((b) => b.w < measure.vw * 0.5);
  if (narrow.length)
    bad(`coluna de texto esmagada a 390px em ${narrow.map((b) => "#" + b.id + " (" + b.w + "px)").join(", ")}`);
  else ok(`mobile: a medida do texto acompanha o viewport nos ${measure.blocks.length} capitulos`);
  if (measure.height > 32000)
    bad(`/sobre tem ${measure.height}px a 390px - a grelha voltou a colapsar`);
  else ok(`mobile: /sobre cabe em ${measure.height}px`);
  await mobile.close();

  await browser.close();
  console.log(fails ? `\n  ${fails} FALHA(S) no menu em browser real`
                    : "\n  menu nativo funcional em desktop e mobile");
  process.exit(fails ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
