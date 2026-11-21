# Monthly seller commission statements

Location: `/staff/sales` → **Commissies**, for the owner and each seller. Owner seller-preview remains read-only and seller-scoped.

## Current supported flow

- Only existing in-stock seller orders are included. BIGK BV must register the **full customer payment** with its existing order-payment action. Draft, submitted and cancelled orders do not earn commission here.
- Existing order commission and opening-bonus snapshots are authoritative. Historical pricing, rates and bonus qualification are not recalculated by the statement feature.
- Statements include all fully paid seller orders, not just the dashboard's latest 200. The month is determined by the stored customer-payment registration timestamp (`updated_at` on finalised paid orders), in Europe/Brussels.
- The current month is accruing. A closed month's planned payment date is the tenth of the following month. No scheduler or bank transfer is performed.
- The owner checks the statement and agent invoice, makes the actual bank transfer, then records its reference under **Uitgevoerde betaling registreren**. The confirmation and CSV state the remuneration excluding any applicable VAT on the agent's invoice. Invoice VAT is handled separately in accounting.
- A recorded payout is distinct from an earned commission and is visible to the seller. CSV includes order IDs, net sales, commission, bonus and payout status.

## Controls and storage

No schema migration is needed. Payout snapshots are audit entries in the existing private `seller_events` table, action `commission.paid`. Their deterministic IDs prevent duplicate settlement of a seller/month. The existing database transaction lock serialises concurrent attempts. The server recomputes the complete statement and checks its fingerprint and total; it rejects stale requests, open months, reused references, unauthorised actors and preview writes. Session, origin and rate-limit checks remain in place.

The feature cannot move money or create an agent invoice, Peppol invoice, payment link or customer invoice. No live test payments or payout records are seeded. Existing webshop checkout, stock and product records are unaffected.

## Preconditions and limits

- This is an operational accounting overview, not a replacement for an agent agreement or legal determination of commission entitlement. Mandatory statutory rights prevail.
- The new March 2027 pre-order catalogue, deposits, balance collection and partial commission are **not** implemented by this change. Do not register a deposit as full payment of an existing seller order. Agree the legal rules and add a separate deposit/order flow first.
- Customer payment date is the date the owner registers payment, not an independently verified bank value date. Record receipts promptly; backdating is not supported.
- Historical earned commission is not evidence that the agent has already been paid. Before using this feature for existing business, reconcile any earlier external agent payments. Never transfer money just because a historical statement shows open.
- Recorded payout snapshots are immutable through this UI. Credit notes, refunds, disputes, correction payouts and commission clawbacks require a separately documented owner/accountant reconciliation; do not edit paid-order snapshots to make them match. The system rejects a changed paid statement instead of silently hiding the mismatch.
- Rates, volume-tier thresholds, freight, credit limits and future pre-order rules are unchanged. This release only adds monthly statements and explicit payout recording to the existing in-stock flow.

## Validation

`npm run typecheck`

`node --import tsx --test tests/sales-portal.test.ts tests/sales-postgres.test.ts tests/sales-commissions.test.ts`

`node --import tsx tests/sales-browser.mjs`

Integration coverage includes more than 200 paid orders, seller isolation, owner preview, Belgian month boundaries, December rollover, current-month blocking, stale fingerprints/amounts, duplicate references, concurrent duplicate requests, CSRF, authentication and input validation. Browser coverage exercises statements, CSV downloads and owner payout recording at desktop, iPhone-width and Android-width layouts.
