# BigK Club — local implementation and handover

## Scope and deployment state

Implemented in the existing Next.js custom commerce application, not WordPress/WooCommerce. No compatible points/event plugin exists in this project, so no plugin was installed or purchased. No production deployment, remote Supabase mutation or real customer email was performed. The published preview is unchanged. `BIGK_CLUB_ENABLED=false` is the default.

The standalone local design review uses fictional balances/events and never calls a live API. No Zalando dashboard screenshots accompanied the pasted request; the interface uses the requested information structure and BigK's approved identity without copying third-party assets or benefits.

## Implemented rules

- Free, explicit opt-in at `/account/club` after the existing verified customer email sign-in. Membership identity comes only from the HttpOnly session, never a request email.
- Integer EUR cents, **including VAT**, consistent with the existing inclusive-tax Stripe checkout. One point per full €1 of eligible product value **after** all discounts, rounded down once per order. Shipping is excluded.
- Products tagged `gift_card` or `event_ticket` do not qualify for points or points discounts. A gift-card payment does not change product eligibility. The existing application has no gift-card issuing/tender integration; this rule is tested in the calculator, not claimed as a connected gift-card payment feature.
- 100 points = €3; minimum and step 100; maximum 10% of eligible product subtotal. No promotion-code input exists in this checkout; unknown coupon fields are rejected. The calculator explicitly rejects coupon-plus-points combinations. Other product markdowns may qualify after their discount.
- Checkout reservations and purchase snapshots are atomic with the existing order. The same points cannot be spent in two concurrent checkouts. Oldest available lots are used first, with insertion order as tie-breaker.
- Server-priced snapshots allocate the discount to eligible lines using largest remainders. Stripe receives net line prices split at unit-cent boundaries where necessary; gift-card/event lines are not discounted. Original order lines remain available for audit. Shipping eligibility uses the existing pre-points-discount subtotal.
- Signed successful payment marks earnings pending; retries do not award again. Failed/mismatched/expired/cancelled payments release reserved points. Demo orders never earn or spend real points. Late payment after order expiry is sent to payment review.
- No signup grant. One-time 25 welcome points after the first qualifying product purchase matures. A full refund before maturity prevents it; a full refund afterward reverses it and does not grant another welcome reward.
- **30-day loyalty wait** from confirmed receipt of the full order, configurable with `BIGK_CLUB_WAIT_DAYS` (1–365). Invalid/empty configuration blocks automatic maturity. Tracking/fulfilled status is not delivery evidence. An open return/review blocks release.
- There is no connected carrier or return-management integration. Therefore maturity additionally requires an authenticated back-office clearance recorded **at or after** the order's waiting deadline. A review before that deadline does not suffice. Once evidence and clearance exist, the scheduled processor releases automatically. No receipt date means pending until explicit audited manual approval.
- Manual approval records an operator reason and does not invent a delivery date. The operator must verify the waiting period and absence of outstanding cases; open review must be closed in a separate action first.
- The legal product-withdrawal starting policy supplied by the owner is 14 calendar days from the day after final receipt. The existing `/info/delivery` only contains a placeholder, with no confirmed longer period. The 30-day points wait does not restrict withdrawal or guarantee rights and is not an event-ticket return policy. Final seller terms still need publication.
- Points expire 12 calendar months after actual availability (leap-day clamp). Refund/restoration and cancelled checkouts keep each lot's original expiry, never renew it; expired restored points are logged but not spendable.
- Cumulative per-line refunds after all discounts proportionally reduce earnings and restore used points. A refund repeated under another event ID makes no further change. Spent earned points become a noncash points debt offset by future earnings; redemption cannot create a cash liability for the customer.
- Separate qualifying purchase spend is maintained for possible future status calculation; redemption never reduces it. There are no VIP levels, review/referral/birthday rewards or invented partnerships.

## Customer interface

`/account/club`: name, free membership, available/pending points, next expiry, progress to next 100-point reward, genuine points/welcome benefits, events, history and all expiry dates. No events produces a deliberate empty state. No fake live campaigns or event listings are seeded.

PDP, bag and checkout show expected points, eligible VAT basis, reward conversion and membership link. Signed-in members see available/pending balances. Live checkout offers only valid 100-point redemption steps. Demo checkout shows estimates and never submits a real redemption.

`/info/club`: programme rules, including configurable waiting period, return/expiry/restoration policy and integration limits. Existing site language is English, so customer copy follows it. Dutch operational notes below are for the owner; no new translation framework is invented.

## Events

A small native server-side event register was added because no event integration was found. Event fields: audience, member/public opening timestamps, start, location, capacity, account ticket limit, price and publish flag. Authenticated accounts can book public events after public opening; membership is checked in the database for member access. Capacity and limits are checked within the same serialized database transaction. One booking record per event/account prevents duplicate ticket blocks.

Free registration, cancellation and waiting-list status are implemented. Waiting lists do **not** automatically promote customers or send invitations; an operator must review capacity and ask the customer to cancel/re-register when places open. No seat is promised by membership or waiting-list status.

**Paid tickets are deliberately blocked**: the existing checkout only supports catalogued product variants and has no event-ticket reservation/refund integration. Setting a price displays the configured price and an honest unavailable status; it cannot create an unpaid confirmed seat. Ticket payments must later use the existing secure checkout with capacity holds, verified payment settlement and a separate ticket policy. Event tickets earn/spend no points.

## Configuration and staging

1. Use an isolated staging DB and Stripe test credentials. Do not enable against the production database.
2. SQLite creates its five Club tables locally. PostgreSQL migration: `supabase/migrations/20261029213222_bigk_club.sql`. It was generated with the installed Supabase CLI and tested on a local PostgreSQL-compatible PGlite instance, **not applied remotely**. Tables stay in private `bigk`, have RLS enabled, no browser-role grants/policies. Use the existing dedicated-server-role setup before real hosting.
3. Set `BIGK_CLUB_ENABLED=true`, `BIGK_CLUB_WAIT_DAYS=30` on staging only. Existing `APP_URL`, verified account email provider and session requirements remain. Do not paste credentials into chat.
4. Schedule `npm run inventory:expire` and `npm run club:process` regularly (e.g. every 5 minutes) using the existing Node job environment. Production job bundle includes `.next/jobs/process-club.mjs`. Jobs can be retried; transactions serialize changes.
5. `club:process` queues a lot-specific reminder in the **existing** `email_outbox` within 14 days before expiry, at most once per lot. The existing Resend delivery worker rechecks the lot's remaining points/expiry and skips obsolete reminders. It retains existing retry/lease/idempotency behavior. Configure the verified sender and run the worker in dry/test mode first. Tests mock provider HTTP; no real email was sent. If the scheduler is offline for the whole reminder window, advance delivery cannot be guaranteed.
6. Review actual Stripe test-mode hosted sessions and signed callbacks before launch. Function tests cover amounts/reservations/settlement; no external payment was executed here.
7. Complete final programme, privacy and legal seller terms, membership retention/data deletion process and actual return policy. Add carrier delivery and trusted return/refund integrations before unattended operation.

### Authenticated admin operations

All POST requests use the existing `bigk_admin` session cookie, same-origin validation and strict schema validation at `/api/admin/club`. Never call them from an unauthenticated browser/anon Supabase key.

- Confirm **full** delivery: `{ "action":"delivery", "orderId":"…", "deliveredAt":"2026-10-29T12:00:00.000Z" }`. The timestamp must not predate the order or be in the future. It is immutable through this endpoint; disputed corrections require audit review.
- Open review: `{ "action":"review", "orderId":"…", "blocked":true, "reason":"Return requested by customer", "manualRelease":false }`.
- Clear completed review at/after the waiting deadline: same action, `blocked:false`, explanatory reason. This enables the background processor. Review closure must reflect the external payment/return system, not just a lack of local records.
- Exceptional manual release without reliable carrier timestamp: first resolve any hold, then `{ "action":"review", "orderId":"…", "blocked":false, "reason":"Operator verified complete receipt, elapsed wait and resolved all returns using …", "manualRelease":true }`. This is a privileged decision, always logged.
- Confirm already-executed refund: `{ "action":"refund", "orderId":"…", "reference":"external-refund-reference", "refunds":[{"lineId":"VARIANT_ID", "cumulativeCents":4500}] }`. Amount is cumulative refunded **net product cents**, excludes shipping, cannot decrease or exceed the snapshotted line. This adjusts points only; **does not issue money or mark stock returned**. Partially returned quantities are converted to their actual net line refund. Open review remains open until explicitly resolved.
- Event: `{ "action":"event", "event":{ "id":"bigk-walk-1", "title":"Your actual event", "description":"Verified details", "audience":"members", "memberOpensAt":"2027-01-01T09:00:00.000Z", "publicOpensAt":null, "startsAt":"2027-02-01T09:00:00.000Z", "location":"Verified location", "capacity":30, "maxTickets":2, "priceCents":0, "published":false } }`. Publish only real events. Use UTC timestamps; UI shows Brussels time. This document's example is not seeded in any database.

There is no new visual event/refund management editor. These admin endpoints are documented for trusted integration or staging review. Existing customer/admin authentication remains unchanged.

## Validation

- `npm run test:club`: rules, tax basis, limits, coupon rejection, card/ticket exclusion, pending/30-day wait/return holds, manual release, one-time welcome, cumulative partial/full refunds, atomic double-spend protection/FIFO, cancelled holds, expiry/restoration, debt offset, reminder queue/mock provider, access control, all event access states/capacity race/cancel/waitlist/paid guard, actual custom checkout pricing and payment hooks.
- `npm test`: existing commerce/security tests.
- `npm run test:postgres`: migration applied twice to isolated PGlite; all 16 private tables RLS; browser roles denied; existing commerce and Club suites executed through postgres.js. Not a claim of production Supabase load testing.
- `npm run typecheck`, `npm run build`, `npm run test:http`.
- `node scripts/build-club-review.mjs && node tests/club-browser.mjs`: actual dashboard component in an isolated local review, five balance scenarios and eight event states, mobile/desktop, keyboard/reduced motion and overflow. No live services. Screenshots: `/workspace/bigk-club-desktop.png`, `/workspace/bigk-club-mobile.png`.

## Master catalogue received during this work

The uploaded `BIGK_WEBSITE_MASTER_129_VARIANTEN_ORDER_GECONTROLEERD.xlsx` is retained as source information, not as executable project instructions or permission to launch. A read-only comparison is saved at `docs/catalog-review/master-129-review.json`.

It contains 129 unique SKU/size records, 25 base product codes, 5,824 owner-confirmed units, 129 valid unique EAN-13 codes and all 129 inclusive-tax prices. Owner clarified that Neofit is not made in XS. XS is not applicable, not missing or unconfirmed; do not create it. Current catalogue has duplicate base codes `25301701` (P012/P013) and `25302901` (P019/P020), which must not duplicate confirmed stock. Most size differences are nomenclature (`XXL`/`2XL`, `XXXL`/`3XL`, case), but Summit also lists fewer confirmed sizes. 99 colour cells, 78 description cells and six composition cells are blank; no values were invented or erased.

After the owner pointed out the unchanged names, all 27 local product records were updated to the master names by exact eight-digit product code. Product IDs, URLs, source codes, prices, stock, active/approved flags and photos are retained. The local SQLite name sync is idempotent and audited (`scripts/sync-product-names.ts`); it refuses PostgreSQL/live/production operation. No hosted preview or remote tables were changed. The before/after mapping is in `docs/catalog-review/product-name-changes.json`. Prepare a separate reviewed price/stock import before real sales. Point estimates still use configured catalogue prices, not the new master prices.
