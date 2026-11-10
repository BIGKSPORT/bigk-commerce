# Search and catalogue-feed readiness — 10 November 2026

## Goal and reused code
Extend the existing shop, shared/colour editors, strict trade schema, public-catalogue projection, grouping, stock/reservations and owner MFA. Preserve the mobile native gallery and overlapping information sheet. No new dependency, paid service, database table, tracking or CSP change.

## Audit: value versus effort
1. High value / small effort: product metadata was missing Twitter cards and x-default; localized metadata discarded colour selection; product/blog sitemap entries lacked language alternates. Corrected in this release.
2. High value / medium effort: add a protected catalogue readiness report and exact public variant exports. Report missing/duplicate GTINs, price, photos, colour, size, gender, age and condition. New editor attributes remain blank until confirmed.
3. High value / large effort: six complete public language journeys. EN/NL/FR are public; DE/IT/ES are editor drafts only. No false activation.
4. High value / medium-to-large effort: checkout accepts only BE/NL/FR/DE/LU. IT/ES require verified shipping/carrier configuration, checkout UI/server/email work and end-to-end tests.
5. High value / owner input: verified legal policies, Google/Meta account setup and consent/analytics choices. No copied company policy or fabricated legal assurances.
6. Medium-to-high value / larger effort: server-paginated public catalogue and admin catalogue, collection URLs/rules and full saved views remain open. This report uses 25-row server-side pagination and adds no public admin bundle.

Live audit: robots.txt allows public crawling with private-path exclusions; sitemap.xml is populated. The historical blanket robots block is fixed. Google indexing timing is outside this code.

## Files
Complete implementation is committed on feat/search-feeds. New server helpers: product-seo, catalogue-feed, product-feed-access and store-structured-data. New routes: /api/admin/catalogue-readiness and /api/product-feeds/[vendor]. New admin components: admin-catalogue-readiness and admin-merchant-fields. Existing product editors, group save handler, Operations, product/home metadata and sitemap are extended.

## Data and security
No SQL migration: optional gender, ageGroup and condition are added to the existing validated trade JSON. Existing admin save/version/audit flows remain mandatory. Shared editing changes the parent only; feed colours inherit parent merchant fields unless explicitly set on the colour. Prices, photos, variants, GTIN, stock/reservations and orders are not rewritten.

Readiness requires the existing owner MFA session; staff and anonymous callers receive 401. Feed bearer tokens are vendor-specific HMAC values derived with a domain-separated purpose from the existing server-only ADMIN_MFA_KEY. The key itself is never returned. Bearer URLs contain only public-product exports and never admin/customer data. Do not post them publicly or include them in screenshots/logs. PRODUCT_FEED_VERSION revokes feed URLs without changing the MFA encryption key. Never rotate ADMIN_MFA_KEY merely to revoke a feed.

Public exports are disabled on Vercel preview and bigk_staging, when indexing/live gates are off, or PRODUCT_FEEDS_ENABLED=false. Missing/invalid/wrong-vendor tokens return 404 before catalogue loading. Responses use noindex/nofollow, nosniff and private five-minute caching (no shared CDN cache). Authenticated invalid eligibility lists never reach public exports.

Google uses RSS/XML; Meta uses CSV from the same validated items. GTINs remain strings; archived/unpublished records and duplicate identifiers are excluded. Availability is physical minus reserved stock. URLs select the correct reviewed colour/size; grouped VELVET stays one style. All prices use saved EUR/VAT-inclusive catalogue values. No MPN, gender, age, condition, reviews, ratings, shipping or return policy is invented.

## Environment and rollback
PRODUCT_SEO_ENABLED=false restores previous generic metadata/sitemap/home structured-data behavior. PRODUCT_FEEDS_ENABLED=false disables public exports. Defaults are enabled subject to live/indexing/secret guards. PRODUCT_FEED_VERSION defaults to 1; changing it invalidates only the bearer URLs. These environment changes require Vercel redeployment, not new source changes. No new secret required.

Rollback: switch exports off and deploy the previous code. Retain added JSON attributes; they are additive and no stock/order data was changed. The previous strict editor schema may require the new optional attributes to remain supported if that older editor is used to save records containing them; keep the updated trade schema when rolling back UI only.

## Owner checklist
1. Admin → Operations → Search and product-feed readiness. Refresh, inspect counts and page through errors.
2. Products → Edit shared product → English → Product-feed attributes. Confirm intended gender, age group and condition from your products; save and reopen. Use colour editor for identifiers, price and colour photos.
3. Reopen Operations and refresh. Only complete, valid public variants are export eligible. Drafts/archived variants stay private. No existing stock/price changes should occur.
4. On production, expand Private product-feed URLs. Copy Google XML into Merchant Center's scheduled product source. Verify store ownership and set actual shipping and return settings for supported countries. Use account diagnostics before ads; this release does not approve the merchant account.
5. Meta CSV is a draft catalogue source. Official Meta field documentation was behind a sign-in wall during this audit; validate/import with Commerce Manager's current diagnostics before advertising. No Pixel/CAPI or ad spend is enabled.
6. In Search Console, inspect EN/NL/FR public home/product pages, test live URLs and resubmit sitemap.xml. Confirm canonical, x-default and reciprocal language URLs. Google controls discovery/indexing timing.
7. Check a selected non-default colour and size URL: page selection, social image and metadata should match the intended product colour; canonical remains the style URL.
8. Check mobile swipe/overlap, colour/size selection, bag photos, checkout, admin MFA, staff permissions, stock adjustment, printing and customer email against the existing regression suite.
9. Keep DE/IT/ES routes, IT/ES delivery and unconsented marketing disabled until their complete journeys and verified policies are delivered.

## Validation and cost
Unit tests cover XML/CSV escaping, eligibility, duplicates, archived/unpublished filtering, exact prices/available stock, IDs/URLs, metadata, bearer validation/rotation and live/preview guards. Existing SQLite and Postgres-protocol operations tests cover owner/staff access and no inventory mutation. Browser tests cover the report plus the full existing shop/admin/commerce suites.

The report reads the existing catalogue only on Operations entry/refresh/page changes. Public pages gain no readiness requests or tracking. Each feed fetch loads the catalogue once; requesters may cache privately for five minutes. This is suitable for scheduled provider fetches; it adds ordinary function/database/bandwidth usage, not a paid service. Large-catalogue feed streaming/query pagination is future work.

## DONE / NEXT / BACKLOG
DONE: metadata/sitemap fixes, Organization/WebSite JSON-LD, readiness diagnostics and pagination, merchant attributes, protected Google XML/Meta CSV draft, isolated tests.
NEXT: preview CI and browser verification, then production release; owner confirms missing product attributes and validates merchant accounts.
BACKLOG: complete six-language public journeys and reviewed copy, IT/ES shipping, clean collection pages/rules, catalogue-scale pagination/saved views, legal review, consent and chosen analytics, Meta Pixel/CAPI, performance baselines and remaining catalogue/admin tools.
