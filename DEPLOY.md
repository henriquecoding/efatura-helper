# Deploying

This is a static site: `index.html` + `tool.js`. Host it anywhere that serves files.

## Before you deploy tool.js

`tool.js` must be **pure ASCII**. The e-Fatura page is served as Latin-1, so a raw accented
character renders as mojibake there. Portuguese text goes in as `\uXXXX` escapes.

```bash
node escape-tool.js     # rewrites any non-ASCII char as \uXXXX
node --check tool.js    # syntax
```

CI enforces the ASCII rule on push.

**A passing `node --check` is not verification.** It cannot catch a called-but-undefined function -
that ships fine and then throws at runtime for every user. Check the symbols exist too.

## Testing without publishing

Open e-Fatura, log in, open the browser console (F12), paste the entire contents of `tool.js`,
press enter. Identical behaviour to the bookmarklet, nothing published. Always do this first -
real invoice data exercises paths nothing else will.

## Related service

The bookmarklet reads its merchant map from a **cae-db** instance. Point `CAEMAP_URL` in
`tool.js` at your own, or use the public one at `https://cae-db.diogoandrade.com`.

The cae-db source is **private**, deliberately. The split is: *how your tax is calculated* is
public and auditable (`tool.js` here, plus the CAE -> sector map it relies on); *how the merchant
data is fetched* is not. The registry-scraping mechanics are an implementation detail and
publishing them mostly just invites people to hammer SICAE.

The map API stays open where it has to be: `/sectors.json`, `/map.json`, `/cae-map.json` and
`/stats` answer to anyone. Serving the whole map is what lets the bookmarklet work without ever
telling the server which merchants you shop at.

`/nif/{nif}` and `/search` are PUBLIC reads since 2026-07-22 (opened for the NIF searcher;
/search is deliberately restricted to trading businesses - see the docstring in cae-db server.py,
that restriction is load-bearing). The map-MUTATING routes remain token-gated. An earlier version
of this note said both reads were 401-gated; that was true on 2026-07-21 and superseded a day
later - verified live 2026-07-28.

## Provably-fair releases
Before every deploy: bump `FB_VERSION` in tool.js if the code changed, then `node make-versions.mjs` (regenerates versions.json, the published hash + the release tag/source), `node make-audit.mjs` (regenerates audit-manifest.json for /auditoria; fails loud via test-audit-sync.js if it drifts) and `node make-shell.mjs` (rewrites the shared shell in every page; test-shell-sync.js fails if a page drifted). Deploy. Verify at /verificar. Tag the release: `git tag vYYYY.MM.DD && git push --tags` - the tag is the public timestamped commitment.

Release gate: `npm test` must be **36/36 with `CHROME_PATH` set**. A SKIP on the browser checks is not a pass - test-network.js is the only thing proving the consent gate still makes the tool inert, and test-demo-browser.js / test-shell-browser.js are the only things that can see the two regressions that shipped visually green (a demo that opened frozen, and a text column crushed to 73px on a phone). Setting `CI=true` turns a missing browser into a failure instead of a skip.
