// Verifies resubmissionWindows() in perfil.html: past-year IRS correction windows, grounded in
// DRE-verified law (CPPT 59.º/70.º, LGT 78.º). Extracts the pure functions from the page source
// and evals them (no DOM) so it tests the ACTUAL shipped code.
//   node test-deadlines.js perfil.html
const fs = require("fs");
const src = fs.readFileSync(process.argv[2] || "perfil.html", "utf8");
let failures = 0;
function ok(name, cond) { console.log((cond ? "  PASS " : "  FAIL ") + name); if (!cond) failures++; }

function grab(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let j = src.indexOf("{", i), depth = 0, k = j;
  for (; k < src.length; k++) { if (src[k] === "{") depth++; else if (src[k] === "}") { depth--; if (!depth) { k++; break; } } }
  return src.slice(i, k);
}
eval(grab("_addDays"));
eval(grab("_fmtDate"));
eval(grab("_daysLeft"));
eval(grab("resubmissionWindows"));

// Reference: income year Y declared in Y+1; statutory voluntary payment deadline = 31 Aug of Y+1;
// recover (reclamacao graciosa) deadline = +120 days = ~29 Dec of Y+1.

// 1) statutory estimate marks exact:false
let w = resubmissionWindows(2024, { today: "2026-01-01" });
ok("2024: exact=false when no real payment date", w.exact === false);
ok("2024: declaredIn is 2025", w.declaredIn === 2025);

// 2) recover deadline = 31 Aug 2025 + 120 days = 29 Dec 2025
ok("2024: recover deadline is 29/12/2025 (31 Aug + 120d)", w.recover.deadline === "29/12/2025");

// 3) on 2026-01-01 the 2024 recover window is CLOSED (past 29/12/2025)
ok("2024: recover CLOSED after its 120-day window", w.recover.open === false);

// 4) checked early enough, the window is OPEN with positive daysLeft
let w2 = resubmissionWindows(2024, { today: "2025-11-01" });
ok("2024: recover OPEN on 2025-11-01", w2.recover.open === true);
ok("2024: daysLeft positive when open", w2.recover.daysLeft > 0 && w2.recover.daysLeft < 90);

// 5) exact real liquidacao payment date is used and flagged exact:true
let w3 = resubmissionWindows(2023, { today: "2025-01-01", pagamentoLimite: "2024-09-30" });
ok("2023: exact=true when real payment date given", w3.exact === true);
ok("2023: recover deadline = 30 Sep 2024 + 120d = 28/01/2025", w3.recover.deadline === "28/01/2025");
ok("2023: recover still OPEN on 2025-01-01 (before 28/01)", w3.recover.open === true);

// 6) revisao is NEVER presented as reliable for a taxpayer's own omission
ok("revisao not reliable for own omission (LGT 78 limit honoured)", w.revisao.reliableForOwnOmission === false);

// 7) payMore window references caducidade (60 days before ~31 Dec of Y+4)
let w4 = resubmissionWindows(2024, { today: "2026-01-01" });
ok("2024: payMore deadline is 01/11/2028 (31 Dec 2028 - 60d)", w4.payMore.deadline === "01/11/2028");
ok("2024: payMore open in 2026", w4.payMore.open === true);

// 8) law citations are present (traceable to legal_sources.json)
ok("recover cites CPPT 59/70", /59\.º-3-b-II.*70\.º/.test(w.recover.law));
ok("payMore cites CPPT 59-3-b-III", /59\.º-3-b-III/.test(w.payMore.law));

console.log(failures ? ("\n  " + failures + " FAILED") : "\n  all deadline tests passed");
process.exit(failures ? 1 : 0);
