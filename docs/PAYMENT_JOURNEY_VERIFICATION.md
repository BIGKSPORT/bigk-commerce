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

## Real Stripe sandbox: not yet end-to-end verified

The connector now has access to `BIGK® BV sandbox` (`acct_1TAFBLI4tul0HJHg`, livemode false). Its confirmed BIGK business address has been set in sandbox Tax Settings, whose status is active. Its tax registration list was empty; no registration has been created or expired by this work. Sandbox defaults/product tax classification have not been guessed or overwritten.

The connected plugin does not supply a server API key to Vercel. The branch still needs its private restricted sandbox key in `STRIPE_SECRET_KEY`, webhook credentials, and a reachable signature-verified webhook endpoint. Vercel Authentication protects this preview and must be accounted for before claiming Stripe deliveries succeed. Do not disable admin authentication or switch to a live Stripe key.

Do not claim a genuine hosted Stripe payment, automatic tax collection or actual email delivery has been verified from the fixture tests. Complete the hosted sandbox round-trip once its runtime credentials, registrations and webhook reachability are ready. Leave public checkout in demo mode until then.
