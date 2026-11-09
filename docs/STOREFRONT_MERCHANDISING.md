# Storefront merchandising

The existing BIG K storefront, product routes, filters, cart and checkout are reused. The standard catalogue now groups its default view by category; searches and explicit price/name sorting retain their expected cross-category results. Admin > Storefront adds campaigns, curated product blocks and styled looks without a page-builder dependency.

## Owner workflow

1. Sign in at /admin with the existing password and authenticator/recovery code.
2. Open Storefront. Nothing is publicly changed by editing.
3. Click Create an organized draft from my categories for a starting layout. It chooses up to four available products per category and avoids duplicate styles across colour records. Review and change every choice.
4. Collection blocks: set a heading, select up to eight products and use Move up/down on products and blocks. Newly published catalogue products are never automatically inserted into these curated blocks.
5. Banner: choose/upload a desktop photo and optional mobile crop. Enter heading, image description, button and an internal destination, such as /?category=Pants#catalog. Use photographs without baked-in promotional text.
6. Shop the look: add an outfit photo, choose up to four products, and set each numbered dot's horizontal/vertical percentage. Use the draft preview to check placement. A dot opens the existing product chooser; customers select their sizes. No bundle discounts or automatic size selections are invented.
7. Announcement and banner/look schedules use the editor's local time and are stored as UTC. Empty dates mean no time limit. Exact start is included; end is excluded.
8. Select a language to edit its text. Empty translated fields use English. Six language drafts are supported; public routes currently remain EN/NL/FR.
9. Save draft, then Preview current draft. Save before changing backoffice tabs. Preview uses currently available products and current campaign dates.
10. Publish saved draft. Refresh the public shop. Switch off custom homepage immediately restores the standard homepage and retains all content.

## Files and reuse

- lib/merchandising-content.ts: bounded strict schemas, campaign scheduling and public projection.
- lib/merchandising-copy.ts: small browser-safe copy helpers; no schema/database code in the public bundle.
- lib/merchandising.ts: singleton draft/published state, optimistic conflict checks and append-only operations audit.
- app/api/admin/storefront/route.ts: existing admin/MFA, same-origin protection, bounded request and rate limit.
- components/admin-storefront.tsx and .module.css: lazy admin-only editor using the existing Media API and Sharp upload pipeline.
- components/storefront-merchandising.tsx and .module.css: responsive hero, announcement, chosen collections, photo looks, numbered product dots.
- app/page.tsx: one extra server-side document read on homepage renders; only published, active content reaches visitors.
- components/backoffice.tsx: lazy Storefront tab.
- components/storefront.tsx and app/globals.css: preserve the existing hero as fallback, category-grouped default catalogue, and collapsible complete catalogue for curated homepages.
- tests/merchandising.test.ts, tests/merchandising-browser.mjs and tests/fixtures/seed-merchandising.ts: isolated fixtures, draft/publish, ordering, permissions, stock, browser and mobile checks.
- tests/operations-postgres.mjs and .github/workflows/ci.yml extend existing regression coverage.

## Database and rollback

New idempotent migration: supabase/migrations/20261109110000_storefront_merchandising.sql. Creates one document table per existing application schema, enables RLS and revokes browser-role access. Only existing bigk_server / bigk_staging_server get SELECT/INSERT/UPDATE. The existing production web login inherits bigk_server; verify that membership before deployment. No DELETE grant, renamed columns or product/stock/order writes.

Test it twice in PGlite and apply to bigk_staging before production. Verify anon/authenticated cannot SELECT, server can read/write under RLS and cannot DELETE. Verify the actual web-login permissions, rather than only the group role. Roll back by switching custom homepage off and reverting application code; retain all saved draft and published data. Restoring a previous campaign is an edit/save/publish operation; full campaign version history is not provided by this increment.

No additional environment variables or paid services are required. The document's enabled switch, per-section enabled switches and publication state control availability without redeployment. Preview keeps the existing staging-only database, demo checkout, disabled email and noindex settings.

## Test checklist

1. Existing public EN/NL/FR homes, product routes, category/size/colour/series filters, search, saved items, product galleries and cart still work.
2. Standard homepage groups products by category. Price/name sorting and searches still span the selected catalogue.
3. Unauthenticated GET/POST to /api/admin/storefront returns 401; a foreign Origin is rejected. Existing MFA is required for owner sessions. Staff credentials do not become owner credentials.
4. Save an unpublished banner heading and verify it is absent from public HTML/payload. Publish and verify it appears. A second editor with an old version gets 409 rather than overwriting.
5. Set a future start or expired end; scheduled text and images are absent from public props. Drafts and disabled shelves/looks are excluded.
6. Try external/protocol-relative/admin destinations, unknown images, unavailable products, duplicate outfit selections and invalid positions. Publishing/saving rejects them with a useful message.
7. Publish a look and collection. Numbered dots and cards open the existing product chooser; selecting a size and adding to bag uses existing stock rules. Sold-out/unpublished products disappear on the next server render; empty blocks disappear. Checkout revalidates stock/prices as before.
8. Reorder blocks and selected products, save, publish and verify order. Adding another catalogue product must not change manual blocks.
9. Test desktop and 390px mobile layout, image crops, keyboard links/dots, English fallback, caption readability and no horizontal overflow. Optional mobile art direction uses picture source selection and responsive Next image URLs.
10. Switch off custom homepage; the saved document remains, standard hero/catalogue remain accessible and products/orders/stock stay unchanged.

## Costs and limitations

No new dependency, tracking, cookie, external service or CSP whitelist is added. No autoplay carousel or polling. Admin editor is lazily loaded. The homepage adds one small indexed singleton query and projects against the already-loaded catalogue; no per-product database reads are added. Campaign scheduling is evaluated on server renders and needs no cron. Public images use responsive sizes/lazy loading except the main hero, which has high fetch priority. Uploads reuse existing durable image storage, original retention, quotas and Sharp processing, so additional photos consume the existing database/media allowance and image delivery bandwidth. Full-catalogue payload size is inherited from the current storefront; separate server-paginated catalogue pages remain future work.

An organized category draft is generated only when requested by the owner; no new campaign images, outfit claims, prices, discounts or marketing consent are fabricated. Product publication and categorisation are separate from homepage selection. Collection block links currently target the existing query-filtered catalogue, not new SEO collection routes. The editor supports six content languages, not six completed storefront routes. Review promotional claims and offer terms against the actual products and applicable legal requirements before publication.
