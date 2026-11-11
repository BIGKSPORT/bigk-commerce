# BigK B2C Launch Checklist — bigk.be
**Date:** 11 November 2026  
**Goal:** Open real B2C orders on www.bigk.be as soon as possible while keeping the warehouse and sales team operational.

Stripe is already working. The remaining work is configuration, stock activation, email delivery, and a clear warehouse process.

---

## 1. Vercel Environment Variables (Production)

These must be set in the Vercel project for the production domain `bigk.be`:

| Variable | Required value / notes |
|----------|------------------------|
| `APP_URL` | `https://bigk.be` |
| `COMMERCE_MODE` | `live` |
| `LIVE_COMMERCE_APPROVED` | `true` |
| `DATABASE_PROVIDER` | `postgres` |
| `DATABASE_SCHEMA` | `bigk` |
| `DATABASE_URL` | Production Postgres connection (transaction pooler preferred) |
| `MEDIA_DRIVER` | `database` |
| `STRIPE_SECRET_KEY` | Live key (`sk_live_...` or restricted) |
| `STRIPE_WEBHOOK_SECRET` | Matching live webhook secret (`whsec_...`) |
| `RECEIPT_SECRET` | Random string ≥ 32 characters |
| `ADMIN_PASSWORD_HASH` | Generated with `npm run admin:password` |
| `RESEND_API_KEY` | Real Resend key |
| `EMAIL_FROM` | Verified sender (e.g. `orders@bigk.be` or `hello@bigk.be`) |
| `EMAIL_DELIVERY_ENABLED` | `true` (or leave empty if default is on) |
| `INDEXING_ENABLED` | `true` only when ready for search engines |
| `BIGK_CLUB_ENABLED` | `false` for first days |

**Important:** Never put test Stripe keys on the production schema.

---

## 2. Stripe Webhook

Confirm the live webhook endpoint points to:
```
https://bigk.be/api/webhooks/stripe
```
Events needed (Checkout Session):
- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

---

## 3. Products & Stock (Critical)

Before going live:
- Review every product that should be sellable
- Set correct **physical stock** quantities
- Mark products as **active** + **approved**
- Confirm images exist
- Confirm prices are correct (cents)

Only active + approved products with stock > 0 can be purchased in live mode.

---

## 4. Email

- Resend domain verified
- `EMAIL_FROM` uses a verified address
- Test one confirmation email after a real (or test) paid order

Scheduled job `deliver-emails` must run (Vercel cron or external).

---

## 5. Warehouse / Fulfillment Process (B2C)

**Daily flow for the warehouse worker:**

1. Log into `/admin`
2. Open **Orders** → filter status `paid`
3. Open each paid order
4. Print packing slip (or use the packing-slip page)
5. Pick & pack the items
6. Create shipping label in MyParcel / DPD portal (manual for now)
7. Enter tracking number in the admin order page
8. Mark order as **fulfilled**

This is the minimum viable process for launch. Automatic label generation can be added later.

---

## 6. Pre-launch Test (do this once)

1. Place one real test order with a small amount (or use Stripe test mode on staging first)
2. Confirm webhook marks it `paid`
3. Confirm stock is decremented
4. Confirm confirmation email arrives
5. Confirm the order appears correctly in admin
6. Mark it fulfilled and add a fake tracking number

---

## 7. After Launch

- Monitor `/admin` for new paid orders several times per day
- Keep the warehouse worker informed of the process above
- Sales guys focus on B2B preparation (they start next week)
- Collect any customer questions about size / delivery so we can improve the Customer Service Agent

---

## What is NOT ready yet (and is acceptable for day 1)

- Automatic MyParcel / DPD label creation
- Customer self-service returns
- Full multi-language customer service agent live
- BigK Club points
- Advanced B2B quoting tools

These can be built in the days after launch.

---

**Owner actions needed from Nicky:**
1. Set the Vercel environment variables listed in section 1
2. Confirm the live Stripe webhook URL
3. Activate the products that have real stock
4. Give the warehouse worker access to `/admin` and the process in section 5

I will continue improving the admin order screens and documentation in the repository.
