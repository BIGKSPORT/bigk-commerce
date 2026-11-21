# BIG K® seller portal

New, private route: `/staff/sales`. Existing consumer routes, checkout, stock quantities and payment integration are unchanged. The only existing component changed is the backoffice: it shows a conditional Verkopersplatform link for the authenticated owner.

## Naamgebruik

**BIG K®** is het merk. **BIGK BV** is de juridische onderneming achter het merk. Gebruik BIGK BV voor bedrijfsverantwoordelijkheden, klanttoewijzingen, goedkeuringen, betalingen en formele communicatie; behoud BIG K® voor merkidentiteit en commerciële branding.

## First version

- Owner signs into the existing `/admin` and opens `/staff/sales` in the same browser.
- Under **Verkopers**, create a personal invitation with the real seller's name and email. Share the link privately yourself; the application does not send mail.
- Invitation expires after 30 minutes and is single use. Seller chooses a 16+ character password and enrolls an authenticator app. Owner can revoke or reset access immediately.
- Seller sees only their assigned customers and orders. Owner sees all sellers, credit approvals and order payments. Warehouse/staff credentials do not confer seller access.
- Catalogue reads existing products and variant identifiers, colours, size, retail price, images, stock less reservations. Draft products are included for offline selling; archived variants and products without an EUR price are excluded. No supplier cost fields are sent.
- Create Belgian shop/customer; select quantities by real variant. Save, reopen and edit drafts; submit orders reaching the minimum. Every save is server priced, stock checked, authenticated and idempotent. Conflicting draft changes are rejected.
- Drafts and submitted orders are sales proposals. They do not reserve inventory, alter consumer orders or charge customers. BIGK BV confirms availability, invoicing and fulfilment separately.
- Register a fully received payment as owner, with its unique bank/invoice payment reference. This records earned commission; it does not create an invoice, payment or shipment, or record commission payout. No automated commission transfers.

## Agreed commercial rules

All calculations use integer EUR cents. RRP includes 21% Belgian VAT. Wholesale unit price excludes VAT and is RRP divided by factor, rounded once per unit.

| Rule | Value |
|---|---|
| Apparel factor | 2.5; optionally 2.7 once core apparel at factor 2.5 reaches EUR 2,000 |
| Footwear factor | 2.2 |
| Proforma minimum | EUR 1,200 excl. VAT |
| Net 30 reorder minimum | EUR 300 excl. VAT; owner credit approval plus a prior paid seller order required |
| Proforma commission | 12% of wholesale excl. VAT |
| Net 30 commission | 8% of wholesale excl. VAT |
| Opening bonus | EUR 100 once per customer, on first paid qualifying proforma order |

The 2.7 eligibility threshold follows the supplied calculator: core apparel is valued at 2.5 for eligibility. The payable total can therefore be lower than EUR 2,000 after applying 2.7. Core SKU membership is explicitly listed in `lib/sales-service.ts`. The bonus is finalized inside a transaction when payment is recorded, so simultaneous first orders cannot both earn it. Paid orders are immutable in this first version; refunds/commission corrections require a later audited workflow.

## Preview deployment

1. Branch: `feat/seller-portal`. Keep `main` and production unchanged while reviewing.
2. Configure **only this Vercel Preview branch** with `SELLER_PORTAL_ENABLED=true`, `DATABASE_PROVIDER=postgres`, `DATABASE_SCHEMA=bigk_staging`, an isolated staging `DATABASE_URL`/CA certificate, and a staging-only `ADMIN_MFA_KEY` (64 hexadecimal characters). Never copy production database credentials, MFA key or live payment keys.
3. Prepare the additive SQL using `node --import tsx scripts/prepare-sales-schema.ts`. Review and apply `supabase/sales/bigk_staging.sql` to staging. It adds five seller tables, indexes, RLS and narrowly scoped grants to the existing staging server role. It does not modify existing tables or data. `supabase/sales/bigk.sql` is for a separately reviewed production rollout; do not apply it during preview review.
4. Deploy this branch on Vercel. Open its deployment URL followed by `/staff/sales`.
5. For owner controls, use an existing staging owner login on the same preview origin; production cookies/credentials must not be copied. Set staging owner authentication/email configuration using the existing project process.
6. Use a test seller account and fixture shops in staging. Check the staging banner and verify the database schema before testing.
7. Production remains off because `SELLER_PORTAL_ENABLED` is absent by default. Enabling it and applying production SQL are separate release steps after validation.

## Verification

```
npm run typecheck
node --import tsx --test tests/sales-portal.test.ts tests/sales-postgres.test.ts
CHROMIUM_PATH=/usr/bin/google-chrome node --import tsx tests/sales-browser.mjs
```

CI `Seller portal checks` runs the same tests without secrets and uploads desktop/iPhone/Android screenshots plus an indicative standalone bundle size. API tests exercise actual route handlers and a disposable SQLite database; PostgreSQL tests exercise the generated DDL, RLS and schema isolation in PGlite. Browser UI tests simulate HTTP responses and do not claim hosted end-to-end integration.

Manual hosted checklist: invitation expiry/reuse, authenticator login, disable/reset, real product names/colours/sizes/prices, stock exhaustion, reload persistence, draft edit conflicts, first order/reorder, credit approval, commission/one-time bonus, presentation mode, desktop/iPhone/Android, owner payment reference, two different sellers' data isolation. Verify consumer checkout remains unchanged. Offline here means physical selling: a network connection is needed to log in, refresh or save; there is no service worker or durable offline draft storage.

Limitations: Belgium/21% VAT only; latest 200 orders in dashboard summaries; no invoicing, shipping, stock allocation, commission payout or returns integration; no store visit CRM. A loaded catalogue is a snapshot until refreshed. Keep access limited to approved sellers.

## Owner access and seller email changes

The existing owner admin session opens `/staff/sales` on the same origin. The authenticated backoffice shows a **Verkopersplatform** link only when the portal authentication endpoint is enabled. No production cookies are copied to preview. Each seller has a separate password and authenticator; no owner rights are shared. The owner can edit a seller login email without losing that seller's assigned customers or order history. Editing the login revokes current seller sessions.

## Activation status

The owner requested access through their existing bigk.be backoffice, and a separate seller account for Kenny Endels using team@bigk.be temporarily. Production activation is pending explicit authorization: automatic approval review rejected production DDL/RLS/grants as beyond the earlier staging-only scope. No live seller tables or account were created, no production feature flag was set, and this branch remains unmerged. After approval, apply reviewed production DDL, enable the production flag, release the reviewed commit, verify owner access on the same origin, and issue Kenny a single-use enrollment link. Do not copy production sessions or credentials to preview.
