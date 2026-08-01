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
  await mobile.close();

  await browser.close();
  console.log(fails ? `\n  ${fails} FALHA(S) no menu em browser real`
                    : "\n  menu nativo funcional em desktop e mobile");
  process.exit(fails ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
