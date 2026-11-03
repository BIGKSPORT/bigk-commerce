# BIG K — work report and remaining launch checklist

Prepared 3 November 2026. Source audit plus isolated regression tests; not a certification of legal compliance or commercial readiness. This is a durable handover, not a scheduled overnight job. Three parallel read-only reviews covered abandoned carts, traffic/privacy and remaining launch requirements.

## Completed in the working copy

- Redesigned checkout, with product photos, clear cost summary and mobile layout. Phone remains required for order/delivery contact; no SMS marketing enrollment.
- Explicit saved-account autofill that preserves typed fields and does not store contact data in the browser.
- Removed the Google Places integration after the owner rejected its cost. No Google scripts, lookup endpoint or key are needed.
- Added an **Unpaid checkouts** filter and explanatory overview to protected Orders. Counts apply to loaded order history only, not unique visitors or total abandoned bags. No reminder sending was introduced.
- Email outbox now rejects unsupported job kinds, confirmations without verified payment, shipment messages without recorded fulfilment and missing withdrawal records. This prevents a future abandoned-cart job falling through to a false order confirmation.
- Updated factual browser storage, session-cookie and phone-use disclosure in the development privacy page; corrected the stale support contact to team@bigk.be. Full legal policies are still drafts.

Validation: production build/typecheck, checkout at 390/1440 pixels, saved-details preservation, retry-to-receipt journey, 11 isolated PostgreSQL payment-journey checks, and unsupported/unpaid email job regression. These checks use disposable data and mocked delivery, not a real hosted Stripe payment. Repository-wide CI is not yet green; existing preview/admin test issues remain separate.

These changes are local, not published to production. Checkout approval remains off. No real order, charge, shipment, label, recovery email or analytics provider was activated.

## Abandoned checkout design

Today anonymous bags contain variant IDs/quantities only in browser storage. Contact details become known after a checkout form is submitted. Pending orders reserve stock for 35 minutes, then release it. There is no production recovery reminder feature.

Next: draft a purpose-specific recovery permission flow and message; create opaque expiring recovery links that restore a bag into a **new** checkout, with fresh price and stock checks. Recheck paid status and current permission immediately before every send; deduplicate and cap frequency. Do not reuse receipt tokens as recovery tokens, or blindly enable Stripe expired-session recovery against the current one-session-per-order reservation design. Newsletter permission for product news must not silently become abandoned-checkout reminder permission.

Unpaid contact-data retention needs a chosen policy before implementing deletion/anonymization. Never apply it to paid/accounting records indiscriminately.

## Traffic plan — not activated

Start with an admin-only aggregate report of page requests, checkout starts and paid orders. No cookies, visitor IDs, IP/email hashes, fingerprinting, recordings, full URLs, query strings or raw referrers. Normalize public paths and exclude private routes, assets, APIs, prefetches and obvious bots. Page requests are not unique visitors and aggregate ratios are not person-level funnels.

Choose retention and update the notice before enabling collection. If GA4, advertising attribution or remarketing is wanted later, design and verify consent-before-load, reject and withdrawal behavior separately. No fake consent banner is needed for trackers that are absent; legal applicability still needs review.

## GDPR and customer operations

Facts already present: verified seller identity, necessary HttpOnly sessions, double opt-in newsletter, opt-out precedence and pending-newsletter cleanup. Gaps: final privacy/terms/delivery/return policies, chosen retention for unpaid orders/auth/audit/outbox, a documented access/export/rectification/deletion request process, processor/transfer review, breach process, and backup deletion/restore policy. Customer archive is not erasure. Preserve legally retained paid-order records while assessing each request.

Do not claim GDPR compliance based on a cookie banner or this source audit. Publish approved support hours, delivery commitments and return/refund rules without inventing them.

## Full original 30-item coverage

Present means code evidence, not completed production validation.

| # | Item | Current evidence/status | Next priority |
|---|---|---|---|
| 1 | Webhook idempotency | Event primary key and transactional effects present | Preserve; hosted verification |
| 2 | Atomic inventory | Shared advisory transaction lock and DB checks present | Verify concurrency and all writers |
| 3 | Open-session reservations | 35-minute holds and release present | Hosted expiry check |
| 4 | Order state machine | Signed server events settle; frontend cannot mark paid | Preserve |
| 5 | Integer cents/currency | Present | Preserve |
| 6 | Variant SKU and stock | Present; final approved production quantities unverified | Before live sales |
| 7 | RLS/server-only secrets | Schema policies present | Verify actual grants/private isolation |
| 8 | Admin protection | Server requireAdmin present | Regression-test |
| 9 | Stripe signature verification | Raw-body constructEvent present | Hosted delivery test |
| 10 | Auth/checkout limits | Visitor/global limits present | Preserve |
| 11 | Refund webhook/restock | Manual refund recording only; no automatic restock | 48h with staffed manual reconciliation |
| 12 | Dispute event/review | No durable automated intake | 48h; manually monitor Stripe |
| 13 | Tax/invoice | Automatic Tax configured; invoice workflow unverified | Resolve before live sale |
| 14 | Shipping/tracking | Rates and manual carrier/tracking present | Approve service commitments |
| 15 | Cancellation/refund/notify | Unpaid cancellation present; paid workflow manual | 48h with written operator procedure |
| 16 | Guest/account linking | Order email plus verified email account access present | Hosted regression |
| 17 | Address book/validation | Profile and new saved-details fill; no Google lookup | Check manual and browser autofill |
| 18 | Password/email verification | Customer magic links and admin password/TOTP present | Keep hosted verification evidence |
| 19 | Transactional email/DNS | Resend integrated; actual preview messages received | Verify DNS and real order acceptance/delivery |
| 20 | Abandoned carts | Browser bag; new unpaid checkout review; no reminders | Consent-aware recovery design, first 2 weeks |
| 21 | GA4 purchase event | Not installed | Decide traffic approach; not a payment blocker |
| 22 | UTM to Stripe/order | Not implemented | First 2 weeks, after privacy design |
| 23 | SEO/sitemap/schema | Canonical/product schema and gated indexing present; Breadcrumb schema gap | First 2 weeks |
| 24 | ISR/images/isolation | Dynamic catalogue, some plain images, isolated webhook | Measure first; optimize with traffic |
| 25 | Monitoring/dead letter | Email retries/review present; webhook dead letter/error service absent | First 48h |
| 26 | Backup restore drill | No completed drill evidence | Verify recovery before accepting money |
| 27 | Legal/GDPR/rights | Development legal pages remain; factual disclosure updated | Final policies before launch; rights runbook |
| 28 | Minimal admin | Product/order/stock present; records completed refunds only | Verify persistence; no pretend refund button |
| 29 | Collections/tags/search | Present | Preserve |
| 30 | Moderated reviews | Not present | Defer until real review volume |

## Safe continuation order

1. Finish existing CI corrections and obtain a green run; distinguish READY deployment from passing tests.
2. Publish tested checkout/admin fixes while keeping payments disabled.
3. Run a complete hosted Stripe sandbox purchase, webhook, confirmation and refund reconciliation; do not claim a live refund test from mocked tests.
4. Approve sellable prices/stock, actual delivery/returns/support commitments, legal documents and invoice workflow.
5. Perform a restore into an isolated database and record evidence. Never overwrite production for a drill.
6. Add signed refund/dispute **review intake** with provider identity checks and idempotency. Refund does not mean goods returned; restock only through the physical inspection workflow.
7. Implement chosen traffic reporting and consent-aware recovery drafts; enable tracking or reminder sending only after the concrete setup is reviewed.

Actions intentionally not taken: paid services, live payment approval, real customer emails, automatic tracking, destructive cleanup, production migrations or publication of legal compliance claims. No background job will keep making changes after this session stops.
