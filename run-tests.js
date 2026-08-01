/* Local test runner. The suite has no runner of its own: .github/workflows only gates the three
 * dependency-free checks (node --check, check-functions, test-deducoes-sync), and the other twelve
 * tests are meant to be invoked by hand with the file under test as argv[2]. Running `node test-*.js`
 * with no argument just throws ERR_INVALID_ARG_TYPE, which reads like a broken test rather than a
 * missing argument. This maps each test to the argument it actually wants and reports one line each.
 *
 *   node run-tests.js            # everything
 *   node run-tests.js network    # only tests whose name contains "network"
 *
 * test-network.js drives a real browser through playwright-core and needs CHROME_PATH. It is
 * auto-detected on Windows/macOS/Linux below; if nothing is found the test is reported SKIP rather
 * than FAIL, because a missing browser is not a defect in tool.js. */

var fs = require("fs"), path = require("path"), cp = require("child_process");

var ROOT = __dirname;

// Tests that read something other than tool.js, or that take no argument at all.
var ARGS = {
  "test-deadlines.js": ["perfil.html"],
  "test-obligations.js": ["perfil.html"],
  "test-deducoes-sync.js": [],
  // reads tool.js and audit-manifest.json itself, by name
  "test-audit-sync.js": [],
  // the shell/product contracts: each reads the pages and assets it needs, by name
  "test-shell-sync.js": [],
  "test-home-modes.js": [],
  "test-privacy-urls.js": [],
  "test-feedback-parity.js": [],
  "test-mobile-nav.js": [],
  "test-nojs.js": [],
  "test-a11y-static.js": [],
  "test-render.js": [],
  // no argument = lint every .html. Passing it the default "tool.js" made it find no <style>
  // block, skip, and report PASS - a green test that checked nothing.
  "test-design.js": [],
  // reads functions/api/feedback.js and index.html directly
  "test-sanitize.js": []
};

var CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA && process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome"
];

function findChrome() {
  for (var i = 0; i < CHROME_CANDIDATES.length; i++) {
    var p = CHROME_CANDIDATES[i];
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

var filter = process.argv[2] || "";
var tests = fs.readdirSync(ROOT)
  .filter(function (f) { return /^test-.*\.js$/.test(f); })
  .filter(function (f) { return f.indexOf(filter) !== -1; })
  .sort();

if (!tests.length) { console.error("no test matches " + JSON.stringify(filter)); process.exit(1); }

var chrome = findChrome();
var pass = 0, fail = 0, skip = 0, failed = [];

tests.forEach(function (f) {
  var needsChrome = fs.readFileSync(path.join(ROOT, f), "utf8").indexOf("playwright-core") !== -1;
  if (needsChrome && !chrome) {
    skip++;
    console.log(pad(f) + "SKIP  no Chrome/Edge found - set CHROME_PATH to run this one");
    return;
  }

  var env = Object.assign({}, process.env);
  if (chrome) env.CHROME_PATH = chrome;

  var r = cp.spawnSync(process.execPath, [f].concat(ARGS[f] || ["tool.js"]), {
    cwd: ROOT, env: env, encoding: "utf8"
  });

  if (r.status === 0) { pass++; console.log(pad(f) + "PASS"); }
  else {
    fail++; failed.push(f);
    console.log(pad(f) + "FAIL");
    var out = ((r.stdout || "") + (r.stderr || "")).trim().split("\n").slice(-8);
    out.forEach(function (l) { console.log("    " + l); });
  }
});

function pad(s) { return (s + "                          ").slice(0, 26) + " "; }

console.log("\n" + pass + " passed, " + fail + " failed, " + skip + " skipped");
if (failed.length) console.log("failing: " + failed.join(", "));
process.exit(fail ? 1 : 0);
