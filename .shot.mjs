import { chromium } from "playwright-core";
const url = process.argv[2], out = process.argv[3], w = Number(process.argv[4] || 1440);
const clip = process.argv[5];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: w, height: 1000 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
if (clip === "top") await p.screenshot({ path: out });
else await p.screenshot({ path: out, fullPage: true });
const m2 = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
console.log("shot ->", out, "| scrollWidth/innerWidth:", m2.join("/"),
            "| console errors:", errs.length ? errs.slice(0, 4) : "none");
await b.close();
