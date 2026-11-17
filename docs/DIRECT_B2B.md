# Direct Belgian B2B customer portal

Customer URL: `/b2b`. Owner management: `/admin` → **B2B**. The public retail checkout and seller commission records are separate.

## What is supported

1. Owner verifies the legal entity, Belgian VAT/KBO details, address and any agent rights. Create the account in B2B management and confirm both verification checkboxes. There is no self-approval or automatic credit grant.
2. Generate a personal single-use 30-minute login link and share it with the approved contact. This owner action does not send email. Approved customers can request a fresh 15-minute email link on `/b2b`, using the existing configured Resend sender and environment delivery policy.
3. Customer confirms the login link, views the existing shared product catalogue, chooses real colours/sizes and quantities, and reviews a server-calculated quote before submitting an order request. The fragment token is cleared from the address bar. Link GETs do not consume access.
4. Owner reviews the request, creates the actual proforma/invoice in the external invoicing package, and records its reference, payment/delivery instructions and optionally its HTTPS payment link. Confirmation checks and reserves stock atomically. The customer sees these instructions in their portal.
5. After verifying full payment outside the portal, owner records the bank/payment reference. This atomically deducts sold stock and releases that order's reservation, exactly once. The owner then records carrier/tracking after dispatch; customer sees the status.

The owner must use real invoice/payment instructions, not placeholder bank details. Creating a request, confirming one, or recording payment in this portal does not generate an invoice, transfer money, send a shipment, create a shipping label or emit a Peppol message.

## Commercial rules

- Direct BIG K accounts only. No automatic seller commission or opening bounty is generated. Existing agent rights must be assessed before owner approval. VAT numbers already assigned in the seller portal cannot be recreated as direct accounts; the reverse duplication is also rejected while B2B is enabled.
- Initial version is Belgian domestic in-stock proforma business, at 21% VAT. Approved billing/delivery address is the same Belgian address.
- Merchandise wholesale prices follow the current factor convention: consumer MSRP incl. VAT / 2.50 apparel, / 2.20 footwear = wholesale ex. VAT, rounded per unit.
- First order minimum EUR 1,200 ex. VAT. After a fully paid B2B order, reorder minimum EUR 300 ex. VAT. B2B access and paid history do **not** enable Net 30 in this release.
- Free shipping at EUR 500 merchandise ex. VAT or more. Below that: EUR 12.50 ex. VAT, subject to the order minimum. Freight attracts 21% VAT.
- Volume tier 2.70 and future pre-order deposits are not selectable in this release. No agent commission schedule is changed.
- Customer review and order requests are not stock reservations. Owner confirmations reserve stock; cancellation releases only that order's reservation. Full customer payment consumes stock once. No fulfilment before payment.
- Confirmed unpaid proformas require active owner follow-up and manual cancellation. There is no automatic reservation expiry yet. Paid orders cannot be cancelled through this UI; handle refunds/returns and financial corrections through a separately agreed process before adjusting inventory.
- Prices, product descriptions, category groupings, colours, sizes and images use the existing backoffice source. Historical customer and quote snapshots remain stable when account details or catalogue data change.

## Access and data security

Dedicated B2B cookies, sessions and single-use login links follow the existing server-side auth pattern. Tokens are hashed at rest; sessions are HttpOnly, SameSite=Strict, Secure in production. Only the current active approved account/version authorises access. Updating or deactivating an account revokes its sessions and links. A retail login, seller login or owner login does not automatically become a buyer login.

All buyer endpoints scope orders to the account resolved from the server session. Admin endpoints require the existing owner session, origin checks and rate limits. Prices, amounts, customer identity and status are never accepted from the buyer. Order submissions use a server quote fingerprint and idempotency key. All write transitions run in the existing database transaction/lock mechanism. Snapshots and audit events preserve attribution.

Private tables: `b2b_accounts`, `b2b_links`, `b2b_sessions`, `b2b_orders`, `b2b_events`. No production schema or live customer data has been changed while preparing this branch. No public Supabase grants are added. Generated SQL is private to the matching existing server role, with RLS enabled and anon/authenticated/PUBLIC privileges revoked.

## Activation and release

The default is **off**: `B2B_PORTAL_ENABLED` must equal `true` for buyer/admin APIs and buyer UI to operate. Do not enable it before provisioning its schema.

1. Review/test the branch. Provision `supabase/b2b/bigk_staging.sql` against `bigk_staging` only. Keep Preview on staging credentials and no live payment/email keys; the existing database guard rejects Preview using `bigk`.
2. For a protected Vercel Preview, enable `B2B_PORTAL_ENABLED=true` only for this branch/environment after staging is ready. Existing `bigk_staging_server` needs its existing product/variant and seller-table access; generated B2B SQL adds only B2B table grants. Preview email remains test-recipient-only under `email-policy.ts`.
3. After explicit owner approval for production publication and schema provisioning, run `supabase/b2b/bigk.sql` on the existing production `bigk` schema. It adds only the five B2B tables/indexes/policies. Verify table RLS and role isolation. Do not run staging SQL in production or create permissive browser policies.
4. Merge/deploy the reviewed commit. Enable `B2B_PORTAL_ENABLED=true` in Production and redeploy. Leave `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL` on their existing verified configuration. Never expose them as NEXT_PUBLIC values. Login by owner-generated invitation works without sending email.
5. Owner opens `/admin` → B2B; approves the first real store after validation, generates a link and verifies that it reaches the intended contact. Never seed test buyers, payment references, orders or stock adjustments in production.

Operational rollback: switch `B2B_PORTAL_ENABLED=false` and redeploy. Keep tables and audit history. Reconcile any existing confirmed reservations in B2B management before disabling/reverting the implementation; do not delete reservation records or blindly reset shared `variants.reserved`.

## Validation

`npm run typecheck`

`node --import tsx --test tests/b2b-portal.test.ts tests/b2b-postgres.test.ts tests/sales-portal.test.ts tests/sales-commissions.test.ts`

`node --import tsx tests/b2b-browser.mjs`

Disposable-database tests cover approval/role checks, VAT validation, duplicate/assigned accounts, scanner-safe and single-use links, session revocation, buyer isolation, exact server prices, stale quotes, CSRF, idempotency, freight/VAT, reservation rollback, payment double-submit and fulfilment stock protection. PostgreSQL provisioning is applied twice to both disposable schemas and tested under anon/authenticated/staging roles. Browser tests exercise the real component and actual backend handlers from account approval through login, quote, order request, proforma confirmation, payment registration and dispatch at 1440/390/412 widths. They never contact production or send real emails/payments.
