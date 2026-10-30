# BigK Stripe setup

The application already uses Stripe-hosted Checkout. The live BIGK BV account is connected. Payments and payouts are enabled; cards and Bancontact are active. Union OSS has been recorded in live Stripe and one France-bound tax calculation verified standard-rated VAT. No real customer payment or hosted checkout has been verified. Domestic Belgian VAT and IOSS configuration are still pending.

## Account owner steps

Open https://dashboard.stripe.com/register if there is no account, otherwise sign in. Set the business country to Belgium and use the verified seller details:

- Legal company: BIGK BV
- Registered address: Theo Verellenlaan 27, 2990 Wuustwezel, Belgium
- VAT: BE1034.189.749; enterprise number: 1034.189.749
- Website domain: bigk.be
- Product activity: sale of clothing and accessories

Enter the legal representative, ownership details, identity documents, business telephone and payout bank details directly in Stripe. Follow the account's actual verification prompts. Do not send those documents, bank details or secret API keys in chat. An account may require Stripe review; code cannot bypass that review. Confirm both payments and payouts are enabled rather than assuming an account login means activation.

For in-chat account inspection, connect the Stripe plugin using the earlier connection card or ChatGPT's Apps settings. A plugin connection does not automatically set secrets in Netlify.

## Payment methods

Use Stripe-hosted Checkout, EUR and the supported delivery countries BE/NL/FR/DE/LU. Enable cards and Bancontact where Stripe makes them available. Apple Pay / Google Pay are displayed by Stripe only when eligible for the customer's device, currency and account. Do not advertise methods until tested. Dashboard-managed methods are used; the application does not force every payment method on.

## Test environment before live

1. Use an isolated Stripe sandbox and `DATABASE_SCHEMA=bigk_staging`.
2. Configure server-only `STRIPE_SECRET_KEY` with a restricted sandbox key (`rk_test_`, preferred) or sandbox secret key in Netlify, never GitHub or browser variables.
3. Publish the server application to a Netlify staging HTTPS origin before registering its webhook. The private static design preview cannot receive payment webhooks.
4. In Stripe Workbench, create an event destination for **your account**, **Snapshot** payloads, using the installed SDK API version **2026-09-30.endive**. The application reads full Checkout Session objects; thin notifications are not supported by this handler.
5. Endpoint: the actual staging origin plus `/api/webhooks/stripe`. Listen for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, and `checkout.session.async_payment_failed`.
6. Save that endpoint's signing secret privately as `STRIPE_WEBHOOK_SECRET` in Netlify and redeploy. Sandbox and live endpoint secrets are different.
7. Test successful checkout, decline, 3-D Secure, cancellation, retry/duplicate events, expired session and payment-method redirect return. Confirm one order, one stock decrement and one queued confirmation. A redirect to the receipt alone is not proof of payment; a verified signed paid event is required.
8. Test the configured Stripe Tax registrations and inclusive EUR totals. Automatic Tax is currently enabled; it needs account setup and verified VAT treatment before sales. No tax setup has been made by this application.

## Live switch

Use a separate live endpoint/secret, restricted live key (`rk_live_`, preferred) or live secret key, `DATABASE_SCHEMA=bigk` and canonical `APP_URL=https://bigk.be`. Production refuses test keys. The webhook rejects events from the wrong Stripe mode. Only enable `COMMERCE_MODE=live` and `LIVE_COMMERCE_APPROVED=true` after hosted checks, confirmed stock, seller/contact/delivery/return information, and an end-to-end provider test pass. Keep individual products inactive until reviewed.

Refunds in the backoffice currently record a refund already completed in Stripe; they do not initiate a money transfer. Verify the Stripe refund before recording it. Do not claim automated refunds are implemented.
