# Backoffice foundation — preview delivery

Goal: extend the existing admin with practical staff, stock, printing and customer-service tools. Existing owner login/MFA, warehouse portal, product editing, import dry runs, checkout, carrier integrations and email outbox remain in place.

## Delivered in this increment

- Backoffice → Operations: runtime feature switches, staff setup/reset/disable, named operations audit.
- `/staff`: separate stock-manager and warehouse-manager accounts, each with its own password and authenticator. Setup links expire after 30 minutes. Sessions expire after two hours and are revoked on disable/reset. Existing warehouse accounts remain usable.
- Stock search/pagination (25 variants), physical-stock adjustment with a required reason and optimistic checks against both stock/reservations and product version. Prices, publication and refunds are inaccessible to these accounts.
- Warehouse queue of verified paid orders with private printable packing slips. Photo printing uses the variant's assigned image where available. Printing does not dispatch an order.
- Customer profile: individual plain-text customer-service email and recent message history through the existing Resend account. Preview recipient allowlisting remains enforced. Retries retain the same provider idempotency key; accepted means provider acceptance, not confirmed delivery.
- Consumer invoice preparation/printing from verified Stripe payment, billing address and completed VAT breakdown. Atomic, year-based numbering, one immutable snapshot per order, repeat printing uses that snapshot. Test documents are explicitly marked TEST. Business billing and unsupported VAT cases require accountant review; no tax percentage is invented. This is not a structured B2B e-invoice or credit-note service.
- Optional four-query order loading replaces the per-order query pattern without changing the existing API response.
- Six-language product drafts: EN/NL/FR/DE/IT/ES, including care and editable technical blocks/image descriptions. This prepares stored content; public routing and complete application of translated content are still Phase 3. Product names and commercial identifiers retain their existing behavior in this increment. Draft translation text is removed from public product payloads.

## Branch and complete source

Branch: `feat/backoffice-foundation`. Every changed/new file is provided in full in GitHub; no copy/paste fragments are required. Do not merge to `main` until preview checks are complete.

For a local checkout:

```bash
git fetch origin
git checkout feat/backoffice-foundation
npm ci
npm run typecheck
node --import tsx tests/operations.test.ts
node tests/operations-postgres.mjs
node --import tsx tests/catalog-translations.test.ts
npm run build
```

Both central database adapters remain unchanged; the new tables use a separate, narrowly scoped qualification helper. The new tools are confined to private admin/staff routes and their server helpers, plus additive translation schemas. Public changes remove draft translations from product payloads and restore saved carts through a local browser event instead of a page reload; checkout forms and navigation are preserved. The public shop does not import the new staff/admin components. Static review builders now replace Node environment references with an empty browser-safe object; no host environment values are embedded. The static demo reuses reviewed colour identities and the existing product-route resolver; its gallery checks distinguish the current desktop columns from the mobile overlay.

## Database and rollback

New migration: `supabase/migrations/20261108221452_backoffice_foundation.sql` (CLI-generated filename).

Creates seven application-private tables: `shop_features`, `staff_accounts`, `staff_sessions`, `operations_audit`, `customer_messages`, `invoice_counters`, `order_invoices`. It enables RLS, denies browser roles, grants scoped server access and keeps audit/invoices append-only for the dedicated server role. It also adds order-date and audit lookup indexes. No existing columns are dropped or renamed. Running it twice is tested with PGlite in both schemas.

Before production: test the full migration twice in an isolated database; apply the staging-only schema target to the connected staging environment. Production application is a separate release step. The feature table is initially empty, so all new features start off.

Rollback: switch features off in Operations and deploy the prior application. Retain the new tables and issued invoice numbers. Never reset a counter, delete an issued invoice or remove an audit history. Reprinting an already-issued invoice remains available to the authenticated owner when issuing is switched off.

## Environment variables

No new secrets or dependencies. Reuses `ADMIN_MFA_KEY`, existing database settings, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DELIVERY_ENABLED`, `EMAIL_TEST_RECIPIENT`, and `STRIPE_SECRET_KEY`.

Preview must use `DATABASE_SCHEMA=bigk_staging`, Stripe test credentials, `INDEXING_ENABLED=false` and the existing email recipient allowlist. The preview admin canonical origin must point to this branch's stable alias, not another preview branch. No production environment values need changing for this preview.

## Click-by-click verification

1. Open the preview `/admin`, sign in with the existing owner password and MFA. Existing Overview, Products, Orders and Customers must still open.
2. Open Operations. Enable staff tools, photo packing slips, customer email, efficient order loading and six-language drafts. Leave invoice issuance off until the test/numbering review.
3. Create a stock-manager setup link. Open it in a separate browser profile; set a 16+ character password and authenticator. Sign in at `/staff`.
4. Search for an article, move between pages, open Adjust stock. Enter the counted quantity and a reason. Verify it persists after refresh and appears with the staff name in Operations audit. Verify a reserved quantity cannot be removed and a stale screen cannot overwrite a newer count.
5. Confirm that this account cannot open owner admin data or warehouse orders. Disable/reset it from the owner profile and verify its session stops working immediately.
6. Set up a warehouse-manager account. Open a paid test order's packing slip. Verify photo, SKU, size, quantity and address; use Print to save as PDF. Confirm unpaid orders cannot be printed as paid packing slips.
7. In the owner Customers tab, open a customer. Compose a service message. Preview must block every recipient except the configured test recipient; do not send real customer mail during QA. Provider failure must allow an unchanged retry without duplicate sends.
8. For a paid Stripe test order with a complete billing address and standard VAT, enable invoice printing and choose Prepare/open invoice. Verify TEST marking, exact total/VAT, unique number, PDF printing and identical number/content on repeat. Check rejection of unpaid/mismatched payments and business billing. Disable issuance afterward if not yet approved for production.
9. In shared product editing, check all six draft language tabs, care fields and translated technology blocks. Save, refresh and reopen. Existing English content and colour-specific stock/photos must persist.
10. Regression: existing draft/publication controls, CSV/XLSX preview, photo uploads, Club balances, reservation expiry, Stripe settlement and returns remain covered by the existing automated suites. Manually check Dutch/French navigation and checkout in the preview. No real payment is necessary for QA.

## Risks and cost

No paid services or dependencies are added. Staff screens fetch 25 rows at a time. Runtime switches add small reads on private admin/staff requests, not public pages. Invoice issuance makes two Stripe read requests once per new invoice; reprints use the database. Customer messages use the existing provider quota and store their text in the private database. Agree retention and access policies with the adviser. Review invoice series, consumer invoice fields, VAT treatment and future B2B/credit-note needs with the accountant. A printable PDF is not a declaration of legal compliance.

## DONE / NEXT / BACKLOG

DONE: the operations increment above and isolated regression tests.
NEXT: complete preview build and browser verification, then review this increment before production. The new branch needs its own scoped staging credentials in Vercel; broadening the old branch credential to every preview was rejected by automatic approval review. Production configuration was not changed.
BACKLOG within Phase 1: full catalogue server-side filtering/sorting/saved views, scheduled publication, editor role, variant-specific pricing, expanded translation completeness dashboard and the rest of the catalogue-scale management work. Later phases: collections, complete six-language public journeys, SEO/feeds, consent and analytics/advertising.


## Category management and sportswear terminology increment (9 November 2026)

Goal: remove the hardcoded category limitation while retaining existing category keys, product IDs, links, stock and order history. Existing product editors, shared product groups, CSV exports/imports, server validation, MFA owner session and audit are reused. No dependency or paid service was added.

Added files: `lib/category-labels.ts`, `lib/catalog-categories.ts`, `lib/i18n/sportswear-terms.ts`, `lib/search-visibility.ts`, `components/admin-categories.tsx`, `components/use-product-categories.ts`, `app/api/admin/categories/route.ts`, `tests/categories.test.ts`, `tests/search-visibility.test.ts`, and `supabase/migrations/20261109003000_catalog_categories.sql`. Complete file contents are committed in this branch. Updated the existing operations flags/UI, category validation in catalogue/shared-product/import handlers, both product editors, public collection/product server routes, storefront category navigation, search metadata/robots/sitemap guards and browser/Postgres tests. Core database adapters remain unchanged.

The new Categories tab creates categories, edits six language labels and removes/restores categories. Long sleeves and Thermal are seeded even without products. Public collection navigation hides empty categories when category management is enabled. Stable category keys remain unchanged when labels are edited; old category query URLs keep working. Removing a category with products is blocked with its assigned record count: first move all those products, including archived records, in the existing editor or import. Removal retains the category and audit; restoration is one click. Disabled categories cannot be newly assigned by editors, colour creation or imports. Disabling the feature restores the original selectable list while permitting unchanged custom categories on existing records.

Language labels cover English, Dutch, French, German, Italian and Spanish. Missing labels fall back to English. Product translation editing now shows source text and missing source fields, plus a sportswear vocabulary guide (fit, layers, care measurements and distinct water-repellent/waterproof terminology). The guide never adds a property or technical claim to a product. Product and technical translations remain drafts; public German/Italian/Spanish routes, legal copy, checkout countries and emails are not yet activated.

Migration: new idempotent category table, unique case-insensitive name index, products(category) index, RLS and server-only SELECT/INSERT/UPDATE. Browser database roles receive no access; DELETE is not granted. Defaults and historical product category keys are inserted without changing existing products. Applied ONLY to `bigk_staging` through a staging-only copy of this migration; canonical source includes both schemas for a later reviewed rollout. Rollback: switch `category_management` off and deploy the prior app. Retain registry and audit records; no tables/columns are dropped. Test against disposable PGlite schemas twice before staging.

Required environment variables: none new. `category_management` is a database feature switch, default off, changed by the existing owner under Operations without a redeploy. Existing DATABASE_SCHEMA and admin/MFA configuration still apply. In staging, enable it after the isolated preview credentials are configured. Production remains unchanged.

Click-by-click review:
1. Open the preview `/admin` and complete the existing owner MFA sign-in. Under Operations, enable category management.
2. Open Categories. Find Long sleeves and Thermal; both should exist with zero products and six labels.
3. Add Training tops, enter translated labels, save; edit its French label and save again. A missing label should be listed as missing, not called approved.
4. Under Products, add a draft or edit a colour/shared product; select the new category and save. Refresh and confirm the category persisted. Existing stock/price/image controls must still work.
5. Try removing this assigned category: it must be blocked without modifying any product. Move the draft to Other, then remove the category. Restore it and confirm the labels remain.
6. Check product import dry-run with a registered category, an unknown category and a removed category. Unknown/newly removed assignments must fail; export retains stable category keys. No dry-run changes persist.
7. Check EN/NL/FR public collection navigation and product breadcrumbs. Populated custom categories use their translated label; empty categories are hidden. Verify category URLs and reset filters. Check existing size/colour filters, cart restoration, checkout, account and printing again.
8. Open Edit shared product, choose each draft language and review source text, missing-field notice, care copy and technical blocks. Keep model names and verified measurements consistent. No external translation API is used.
9. Disable category management and confirm existing products/history remain, and the legacy category list returns. Check Operations audit for every category change. Staff accounts must receive 401 on owner category endpoints.

Cost: category reads reuse the existing server render; no extra client polling or external API. Enabled public rendering adds one small feature read and one category query (maximum 200 managed categories). Owner category count queries use the added products(category) index. The terminology dictionaries are small static data; category admin stays in a lazy admin-only chunk. Enabling Google crawling may increase ordinary public requests/bandwidth; there is no paid SEO service.

## Search Console robots warning: verified cause and release action

Verified live on 9 November 2026: `https://bigk.be/robots.txt` returns HTTP 200 with `User-Agent: * / Disallow: /`; `/nl` returns `noindex, nofollow`. Vercel production `INDEXING_ENABLED=false`, while `COMMERCE_MODE=live` and `LIVE_COMMERCE_APPROVED=true`. The launch switch causes both exclusions and an empty sitemap. It is not a broken product URL.

Smallest production remedy, after release review: change ONLY production `INDEXING_ENABLED` to `true`, then redeploy the reviewed production/main source. Merely editing robots.txt leaves metadata noindex. Do not publish the unfinished backoffice branch solely to change this setting. No database migration is needed for the existing production switch. Rollback: restore `INDEXING_ENABLED=false` and redeploy the preceding production deployment. No production configuration or deployment was changed in this increment.

New shared search guard explicitly keeps Vercel preview and `bigk_staging` excluded even if production indexing flags are accidentally copied. Owner Operations now displays the reason indexing is disabled. Its production-ready rules still exclude admin, staff, warehouse, APIs, accounts, checkout and order pages; access control continues to protect private data independently of robots.txt.

After an authorized indexing release: fetch `/robots.txt` (public Allow plus private exclusions), `/sitemap.xml` (only intended public pages), and EN/NL/FR home/product HTML (no noindex for valid public products, canonical links correct). Verify private endpoints still require authentication and send their existing noindex metadata. In Search Console, inspect a public homepage and product URL, run the live test, request indexing and validate the robots issue. Google controls recrawl/index timing; do not promise immediate inclusion. Search Console account validation is not yet completed here.

DONE: local categories/terminology implementation, SQLite and PGlite tests, migration on staging only, indexing cause verified. NEXT: latest preview CI/browser verification, isolated preview credential setup and review. BACKLOG: full six-language public rollout, remaining Phase 1 catalogue tools, production indexing release/validation, collections, feeds, consent-gated analytics and ads.
