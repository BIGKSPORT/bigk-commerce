# Checkout and order journey verification

Scope: development branch `fix/catalogue-colour-options`; production remains untouched.

## Changes

- The browser retains the checkout idempotency key across reloads of the same bag/contact details. Session storage contains only a SHA-256 fingerprint and UUID, not the entered name, email or address. Changed details generate a new attempt. Storage failures retain the existing in-memory retry behavior.
- A paid receipt clears the stored checkout attempt. A browser storage failure does not hide the receipt.
- Stripe's official SDK uses native fetch with a bounded timeout and its existing retry/idempotency behavior. The API host is not configurable. Live/test key and webhook checks remain enforced.
- Preview/staging blocks outbox delivery and customer login emails by default. Explicit test delivery requires `EMAIL_DELIVERY_ENABLED=true` and an exact `EMAIL_TEST_RECIPIENT` match. Blocked outbox jobs are not leased, marked sent or retried. Production behavior is preserved; `EMAIL_DELIVERY_ENABLED=false` also disables production delivery if explicitly configured.
- Confirmation emails include product lines, subtotal, delivery and total.

## Isolated server-side journey

`npm run test:payment-journey` uses a disposable loopback PostgreSQL-compatible database with the staging migrations. No test can connect to a remote database. The actual Stripe SDK transport and email provider transport are fixtures; no real payment or email occurs.

Verified: admin authentication; client price injection rejection; server-side line prices; Checkout Session creation and reuse; persistent request keys; exactly one inventory reservation; signed paid and unpaid events; duplicate/reordered paid notifications; private receipts; backoffice order visibility; cancellation and expiration; amount mismatches held for review; exactly one confirmation job; staging email and magic-link blocking; confirmation content through a mocked approved inbox.

## Browser journey

`npm run test:checkout-browser` starts the actual built Next.js app with an isolated local demo database. At 390px and 1440px it submits the checkout, simulates one connection/provider failure, reloads and retries using the same request key, then reaches the private demo receipt. No real Stripe payment occurs.

Existing commerce, Club and withdrawal suites pass. Next.js build and TypeScript checks pass. CI runs both new journey suites on this branch.

## Hosted Stripe test-mode journey: verified

A genuine Stripe test-mode Checkout payment succeeded through the hosted preview,
not through the fixture transport. The merchant explicitly selected the existing
BIGK test mode (`acct_1TAFB8IxNZ1o82uS`, livemode false). Live mode was not used.

- Staging order: `de17bec9-7db8-4f3c-a66f-16a130fe4a05` (backoffice short reference `DE17BEC9`).
- Product: Alpin Fleece Pro, size S, one unit, EUR 146.90.
- French test shipping address: 20% inclusive VAT, EUR 24.48. Test calculation reason `standard_rated`.
- The previously confirmed Belgian Union OSS configuration was mirrored only in test mode. No live tax registration was changed by this test.
- Stripe returned Checkout status `complete`, payment status `paid`, currency `eur`, livemode false.
- Stripe payment intent: `pi_3UWPZaIxNZ1o82uS1AMVr0Um`.
- The signed webhook changed the real staging database order to `paid`; the browser returned to its private receipt showing “You’re all set”.
- Stripe event `evt_1UWPZcIxNZ1o82uSnZ4w7h2M` had no pending webhook deliveries.
- Stock changed from 20 / reserved 0 to 19 / reserved 0 after payment.
- A controlled signed replay of the same event returned HTTP 200. Stock remained 19, with exactly one payment confirmation audit record and one confirmation email job.
- No email was sent or attempted. Staging email delivery remains disabled.
- The temporary approval/activation of P001 was reverted to draft. The one simulated stock deduction was restored, with an idempotent `qa.test_stock_restored` audit entry. The paid test order remains available for owner review.
- Production order count remained zero and the production inventory fingerprint stayed unchanged.

The Stripe test webhook is configured at `/api/webhooks/stripe` using API version
`2026-09-30.endive` and the four Checkout Session completion/failure/expiry events.
Vercel’s documented automation authentication permits third-party webhook delivery;
Stripe signature verification and application admin authentication remain required.
The transport credential and signing secret are private configuration and are not
included in this document, logs, source or browser responses.

Hosted testing also exposed automatic currency conversion in Stripe Checkout.
New sessions explicitly disable Adaptive Pricing so EUR order totals remain EUR.
The SDK request is covered by the isolated payment-journey regression suite.

This verifies the hosted test payment, webhook, inventory and receipt path. It does
not authorise live checkout, prove production tax coverage, deliver an actual email,
create a shipment, resolve MyParcel 422 or approve the product catalogue for sale.
