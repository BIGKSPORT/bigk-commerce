# Storefront slowdown — development investigation, 2 November 2026

## Verified incident

Owner reports slow storefront/product pages. Vercel runtime logs show multiple product GETs reaching **300-second function timeouts** on preview deployment `dpl_DqGodUE1LpfySKGHeTr96eGTDBrJ` (10:57 UTC). Affected paths include Nano, Alpin, Velvet and other product pages. These logs establish a serious timeout incident, not its complete root cause.

The newer preview's `/api/catalog` responded HTTP200; its headers include `x-vercel-id: cdg1:iad1::iad1`, confirming the function's US execution. The configured Supabase database is EU-west-3 / Paris. A measured 3.77s native connector call includes connector overhead and is **not a browser TTFB or Core Web Vitals score**. No database connections/locks under the two application-role names were present in a later pg_stat_activity sample; this single sample does not rule out earlier saturation.

## Targeted development changes

- Pin functions to Paris (`cdg1`) in `vercel.json`, near the database. No database movement or production deployment.
- Disable automatic prefetch for storefront/card/colour/language/B10 links, avoiding speculative dynamic product requests while browsing. Normal click navigation remains available.
- Read catalogue products/content/variants concurrently and group variants by product once. No shared stock cache; database quantities remain authoritative.
- Use React **request-scoped** memoization for catalogue + private-preview checks shared by metadata and the generic PDP. Private data is not cached across requests or customers.
- Reject absent admin cookies before a database lookup. Invalid/present cookies still require the stored session check.
- Keep `Cache-Control: no-store` and add a `Server-Timing: catalog;dur=...` header to the public catalogue response, to separate measured catalogue work from connector/network overhead.

These address observed unnecessary work and geographical latency. They are not proof that the full 300-second incident has been resolved; verify the replacement deployment's timings, error logs and owner navigation.

## Separate completed ALPIN/care work

Preview `f1dccc51eff5ca1f453a2588ba5ddb486f52edee` passed **all GitHub Actions checks**, run https://github.com/BIGKSPORT/bigk-commerce/actions/runs/41432602808. Screenshots were downloaded and reviewed, including desktop/mobile care layout. The earlier failure was a sample-catalogue name assertion in the payment email test; the revised test asserts exact approved Alpin Fleece naming in both stored order and email while retaining payment/stock/total checks.

ALPIN staging records were saved with version checking and before/after revisions: P001 v3→v4, P002 v1→v2. The twelve supplied GTIN mappings, approved prose/care/SEO and Fleece category are now visible in the backoffice. Prices 14690 cents, stock 224 Black +232 Dusty Blue, existing IDs, photos, slugs and unpublished flags were retained. Production fingerprint stayed `7d4ae24f100dea2a251681008d8533aa`; unrelated staging products/content fingerprint stayed `2af0502d1a5fccb89d5c44d676b463ed`.
