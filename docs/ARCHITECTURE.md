# Architecture and boundaries

## Request flow

The Next.js App Router serves the storefront and product pages. React components keep only product IDs, variant IDs and quantities in browser storage. Server routes validate requests with Zod and compute totals from persisted catalogue values. Each order snapshots item names, sizes and prices, so later catalogue changes do not rewrite the receipt.

`lib/db.ts` creates a versioned SQLite schema with foreign keys, WAL and immediate write transactions. `lib/commerce.ts` owns stock, order and payment transitions. A variant's available quantity is physical stock minus reserved quantity. Reported workbook quantities never become sellable stock automatically.

```
Browser → server validation → order + atomic reservation
                           → Stripe hosted payment
Signed Stripe webhook → total/session checks → paid + stock decrement
                                           → email outbox
Admin → paid order → fulfillment + tracking → email outbox
Email worker → Resend → sent / backoff and retry
```

## State transitions

- Demo mode: `demo`; no inventory mutation and no real payment.
- Live checkout: `pending`, with a 35-minute local reservation and a matching Stripe session expiry. Payment sessions are created with a stable order-derived idempotency key and expiry.
- Valid signed paid event: `paid`; stock and reservation decrease once; confirmation job is queued once.
- Expired or failed checkout: `expired` / `cancelled`; held stock is released once.
- A late payment after stock release or an amount/currency mismatch: `payment_review`; do not fulfill automatically. Investigate and refund manually if appropriate.
- Only `paid` orders can become `fulfilled`; shipment tracking is recorded and a notification is queued.
- Duplicate signed events are recorded and safely ignored. A success redirect is never payment authority.

A Stripe session that was created but could not be persisted locally is retried with its original idempotency key and stable parameters. If a checkout creation failure persists, stock is held until cleanup; investigate payment-provider state before encouraging a second payment.

## Identity and access

Admin passwords are scrypt-hashed; session secrets are random and stored hashed. The admin cookie is HttpOnly, SameSite=Strict and Secure in production. Admin mutations check the configured Origin. Catalogue writes require a matching revision, preventing silent overwrites from stale forms. All admin changes are audited; this version has one administrator role, not a multi-user permission system.

Customer sign-in tokens expire after 15 minutes and are consumed once. The email address verified by the link scopes order history. Customer sessions last seven days. There is no password database, account registration password, or simulated login. Customer emails use Resend only after configuration. Link-scanning behavior and delivery must be tested with your email provider before launch.

Receipt secrets stay in URL fragments, avoiding normal server access logs and referrer headers. The server stores a hash and verifies the bearer token. Do not publish receipt links. Customer and order data is stored in the server database, so it needs access restrictions, backups and a retention/deletion policy.

## Storage and scale

This release targets **one Node.js application instance with a persistent local volume**. SQLite is transactional and useful for a small store, but this is not a globally replicated Shopify infrastructure replacement. Do not place the database on ephemeral serverless disk, object storage or a shared network filesystem, and do not run independent app instances with separate copies of the database.

For multiple regions or horizontally scaled workers, migrate the repository layer to managed PostgreSQL, retain the same transaction/state-machine tests, and add distributed rate limiting, job infrastructure and migrations. Test concurrency with the intended production database and load profile before scaling. `CREATE TABLE IF NOT EXISTS` is initialization for this release, not a complete future schema migration framework.

## Explicit exclusions and limits

- No multi-vendor marketplace, POS, multi-warehouse routing, subscriptions, multi-currency pricing, gift cards, promotion engine, carrier labels or automated returns/refunds.
- Refunds and chargebacks must be handled in Stripe and reconciled manually; refund/dispute webhook automation is not implemented.
- Email confirmations and shipments use an outbox; sign-in links are sent synchronously. Full provider delivery and bounce monitoring are not implemented.
- Style finder is deterministic category matching, not an AI model. No fabricated reviews, delivery promises, sustainability claims or material specifications are generated.
- No customer support inbox or live chat is connected.
- Account history currently lists matching orders; customers cannot edit addresses or initiate returns in the app.
- Inline framework bootstrapping requires the current CSP allowances. Add a nonce-based policy, HSTS at the HTTPS edge and defense-in-depth review before public launch.
- No MFA, managed WAF, external penetration test or compliance certification is supplied.

Prioritize reliable checkout, verified catalogue data, customer support and measurable conversion before expanding these modules.
