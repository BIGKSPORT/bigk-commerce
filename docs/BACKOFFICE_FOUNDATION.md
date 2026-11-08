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

Both central database adapters remain unchanged; the new tables use a separate, narrowly scoped qualification helper. The new code is confined to private admin/staff routes and their server helpers, plus additive translation schemas. The public shop does not import the new staff/admin components. Static review builders now replace Node environment references with an empty browser-safe object; no host environment values are embedded.

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
