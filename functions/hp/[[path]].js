// Honeypot namespace. NOTHING under /hp/ is real. These paths are reachable only from hidden,
// robots-disallowed links that no human ever sees or clicks, so any request here is a bot/scraper
// that crawled every href or went hunting through disallowed paths. We record the hit and return a
// static decoy.
//
// SECURITY - this trap must never become its own attack surface (do not get counter-attacked):
//   - Capture only BOUNDED metadata from Cloudflare's own headers; never store the request body.
//   - NEVER reflect any attacker-controlled value into the response (no XSS back at a browser).
//   - NEVER fetch an attacker-controlled URL (no SSRF); forwarding goes to ONE fixed env sink only.
//   - The response is 100% static; the attacker learns nothing and gets nothing executable.
//   - Downstream: whatever displays these hits (the admin panel) MUST escape ua/ref/path - they are
//     attacker-controlled and are a stored-XSS vector if rendered raw.

const cap = (s, n) => String(s || "").slice(0, n);

async function record(request, env, ctx) {
  const url = new URL(request.url);
  const hit = {
    t: new Date().toISOString(),
    path: cap(url.pathname, 300),
    method: cap(request.method, 10),
    ip: cap(request.headers.get("CF-Connecting-IP"), 45),
    ua: cap(request.headers.get("User-Agent"), 400),
    ref: cap(request.headers.get("Referer"), 400),
    country: cap(request.headers.get("CF-IPCountry"), 4),
  };
  // Always log (visible in Cloudflare's function logs). Prefix makes it greppable.
  console.log("FB_HONEYPOT " + JSON.stringify(hit));
  // Optional persistence for the admin panel: POST to ONE fixed, trusted sink (never a value from
  // the request). Fire-and-forget with a hard timeout so a slow/blocked sink cannot hold the worker.
  if (env && env.HONEYPOT_SINK) {
    const p = fetch(env.HONEYPOT_SINK, {
      method: "POST",
      headers: { "content-type": "application/json", "x-fb-hp": env.HONEYPOT_KEY || "" },
      body: JSON.stringify(hit),
      signal: AbortSignal.timeout(2500),
    }).catch(() => {});
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  }
}

export async function onRequest(context) {
  try { await record(context.request, context.env, context); } catch { /* never fail loudly */ }
  // Static decoy. 404 so a scanner just files it as "not found"; the canary in the body is ours, so
  // if this exact text ever resurfaces elsewhere it was scraped from here. No input is reflected.
  return new Response(
    JSON.stringify({ error: "not_found", notice: "Fatura Boa - conteudo protegido, PolyForm Noncommercial 1.0.0. Acesso registado. ref fb-trap-8be21f04" }),
    { status: 404, headers: { "content-type": "application/json", "x-robots-tag": "noindex" } }
  );
}
