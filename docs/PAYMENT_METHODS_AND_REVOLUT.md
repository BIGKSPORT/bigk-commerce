# Payment methods and direct Revolut preparation

## Current state, checked 10 November 2026

BIGK BV's live default Stripe configuration has cards, Bancontact, Apple Pay, Google Pay, Revolut Pay, Link, Klarna and Amazon Pay available and enabled. Other enabled regional methods include EPS and Przelewy24. Some enabled methods only support currencies or countries outside the current EUR storefront. iDEAL and PayPal are unavailable/off and are not advertised.

The storefront row shows Visa, Mastercard, Bancontact, Apple Pay, Google Pay, Revolut Pay, Klarna, Amazon Pay and Link. Visa/Mastercard are supported through enabled card payments. These are informational badges; Stripe chooses the eligible methods based on customer/device/currency/order. The row is a reviewed snapshot, not a promise that every method appears for every order. Recheck it after changing Stripe settings. No Stripe API calls occur when a customer opens a page.

The current checkout already supports Revolut Pay through Stripe. This release does not change payment processing, settlement or fees. Direct Revolut merchant processing remains a separate, unfinished connection.

## Files and switch

- components/payment-methods.tsx and its CSS module: accessible, wrapping badges in EN/NL/FR.
- public/payments/: local SVG artwork from Shopify's activemerchant/payment_icons; MIT license included. Link is a plain text label.
- Footer and live checkout payment section reuse the same component.
- PAYMENT_METHOD_BADGES_ENABLED=false hides the row through the server-rendered root attribute. Remove or set true to restore; deployment refresh applies environment configuration. No new code is needed.
- Existing preview build scripts copy the same local assets.

No dependencies, external client requests, tracking, databases or CSP changes were added.

## Prepared direct Revolut foundation

lib/revolut-preparation.ts provides raw-body signature verification with five-minute timestamp tolerance and rotating-secret support, strict completed-payment/reference/amount/currency validation, safe checkout URL validation and an order payload builder using server-priced EUR totals. It makes no API calls, sends no customer data and cannot mark orders paid.

GET /api/admin/payments/readiness requires the existing admin session and MFA and returns only setup booleans and remaining work. It never returns credentials.

Reserved environment variables, to be set privately in Vercel when the full integration is ready for testing:
- REVOLUT_MERCHANT_ENABLED=false (keep false for now)
- REVOLUT_MERCHANT_MODE=sandbox
- REVOLUT_MERCHANT_SECRET_KEY (server only)
- REVOLUT_MERCHANT_WEBHOOK_SECRET (server only)

No credentials are currently connected. Do not paste them in chat. A hosted redirect integration does not need a client secret, SDK dependency or broader CSP. The documented API version used for the prepared payload is 2024-09-01; check support before wiring live requests.

## Required before direct payments can launch

1. Add NEW idempotent migrations for provider/order bindings, immutable payment attempts and webhook deduplication, considering RLS and server-role-only grants. Preserve all existing Stripe columns. Bind each order before redirect; never use an arbitrary provider ID received from a browser.
2. Reuse server stock/pricing and reservation logic; guard cross-provider duplicate payments and late/expired payments. Do not put a Revolut ID into stripe_session. A timeout after order creation needs reconciliation; never blindly retry creation.
3. Use signed webhooks plus server-side order retrieval. Only a completed captured payment can trigger settlement; authorised or a successful browser redirect is insufficient.
4. Keep Stripe Tax's current behaviour for Stripe orders. Direct Revolut needs verified VAT/tax evidence and a corresponding invoice source. The current invoice code explicitly requires a Stripe session, so direct orders must not use it unchanged. Have the accountant confirm the tax/invoice treatment before launch.
5. Implement refund/dispute reconciliation and preserve customer data, Club and future ambassador accounting. Never invent a refund result or silently mark a payment refunded.
6. Sandbox-test success, failure, tampering, replay, double submission, expiry, partial refunds, mobile return and unchanged Stripe checkout. Test a Vercel preview before any live activation.

This is preparation, not a second functioning payment gateway. Setting a flag or adding keys does not expose direct Revolut checkout. The existing Stripe route remains the only customer payment route.

## Validation and rollback

Tests cover local badge assets, responsive layout and translations; preparation tests cover signature tampering/replay tolerance, amount/reference/currency checks and unsafe redirect URLs. Existing commerce/browser suites remain required.

Rollback: set PAYMENT_METHOD_BADGES_ENABLED=false or revert the display commit. No orders, stock, prices, provider settings, keys or migrations are changed by this release. Preparation helpers are unconnected; removing them has no effect on payment settlement.

## Official references

- https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods
- https://docs.stripe.com/payments/cards
- https://docs.stripe.com/payments/revolut-pay
- https://developer.revolut.com/docs/guides/merchant/accept-payments/online-payments/hosted-checkout-page/api
- https://developer.revolut.com/docs/guides/merchant/monitor-and-observe/webhooks/verify-the-payload-signature
- https://developer.revolut.com/docs/api/merchant/2024-09-01
- https://github.com/activemerchant/payment_icons
