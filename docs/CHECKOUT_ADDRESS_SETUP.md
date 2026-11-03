# Checkout details and faster payment

Google Maps address search was cancelled by the owner because of cost. No Google lookup, Maps script or paid address service is included in this checkout. Manual address entry and browser autofill remain available.

Signed-in customers can explicitly fill empty fields from their BIG K profile. Existing typed fields are preserved. Contact data remains in memory and is not written to browser storage. Country values are limited to supported delivery destinations. Phone remains required in international format on the frontend and backend.

The existing Stripe-hosted payment page uses dynamic payment methods. Apple Pay, Google Pay and Link are enabled in the account configuration; display depends on Stripe, device, browser, currency and customer eligibility. There are no imitation wallet buttons. Embedded one-click wallet buttons would require a separate Elements integration and domain setup.

Checks: `npm run test:checkout-browser` (isolated saved-details and checkout retry fixtures), `npm run test:payment-journey`. No real Google requests, payment or email is needed for these tests.

Do not enable LIVE_COMMERCE_APPROVED as part of this change. An authenticated Stripe sandbox journey and outstanding launch blockers remain separate.
