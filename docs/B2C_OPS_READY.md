# BigK B2C — Ops Ready Summary

**Date:** 11 November 2026  
**Site:** https://bigk.be  
**Focus:** First real B2C orders tomorrow

---

## Already completed in the repository

### Stripe
- Live B2C webhook configured and labelled:
  - URL: `https://bigk.be/api/webhooks/stripe`
  - Description: `B2C – bigk.be Checkout Session events only`
  - Events: completed, async success, async fail, expired
- B2B webhook left untouched

### Warehouse / Fulfillment
- Admin Orders view defaults to **paid** orders
- Clear “Ready to ship” section with paid count
- Dispatch form has step-by-step instructions
- Packing slip page exists and is printable
- Fulfillment API:
  - Only `paid` → `fulfilled`
  - Requires packing confirmation + carrier + tracking
  - Queues shipment email automatically
  - Blocks fulfillment if an open withdrawal request exists

### Documentation created
- `docs/B2C_LAUNCH_CHECKLIST_2026-11-11.md`
- `docs/WAREHOUSE_B2C_PROCESS.md`
- `docs/PRODUCT_ACTIVATION_AND_LIVE_MODE.md`
- This file

### Email system (code)
- Outbox + retries + Resend integration ready
- Confirmation email on paid
- Shipment email on fulfilled
- Staging protection in place

### Stock status (owner confirmed)
- **Physical stock is present** in the warehouse.
- System rule: reported / workbook quantities do **not** become sellable automatically.
- Sellable stock must still be entered per size in Admin, then products set to Approved + Active.

---

## Still required from owner (Nicky)

These cannot be done from GitHub alone:

### 1. Vercel Production environment
Set at minimum:

```
COMMERCE_MODE=live
LIVE_COMMERCE_APPROVED=true
APP_URL=https://bigk.be
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RECEIPT_SECRET=<random ≥32 chars>
DATABASE_PROVIDER=postgres
DATABASE_SCHEMA=bigk
DATABASE_URL=<production connection>
RESEND_API_KEY=re_...
EMAIL_FROM=BigK <orders@bigk.be>
EMAIL_DELIVERY_ENABLED=true
```

### 2. Resend
- Domain `bigk.be` verified
- Sender address matches `EMAIL_FROM`

### 3. Make stock sellable + activate products
In `/admin` → Products (for each product to sell tomorrow):
1. Enter real stock numbers per size
2. Confirm price + photos
3. Set **Approved** = yes
4. Set **Active** = yes
5. Save

Start with a small reliable set. Physical stock is already there — this step only publishes it for sale.

### 4. One full test order
Before opening fully:
1. Place one real (or controlled) order
2. Confirm status becomes `paid`
3. Confirm stock decreases
4. Confirm confirmation email
5. Mark fulfilled with tracking
6. Confirm shipment email

---

## Daily B2C flow (once live)

**Warehouse**
1. Open https://bigk.be/admin
2. See paid orders (default filter)
3. Open order → Print packing slip
4. Pack → Create label in MyParcel/DPD
5. Enter carrier + tracking → Mark fulfilled

**Sales (Belgium)**
- Focus on B2B preparation (starts next week)
- B2C questions can be escalated to Nicky / support process

---

## What is intentionally not automated yet

- Automatic MyParcel / DPD label creation (manual is fine for day 1)
- Customer self-service returns
- BigK Club points (keep disabled at launch)
- Full AI customer service agent live

These can be added after the first real orders work smoothly.

---

## Status overview

| Area | Status |
|------|--------|
| Stripe B2C webhook | Ready |
| Order → paid → stock | Ready |
| Admin fulfillment UI | Ready |
| Packing slip | Ready |
| Warehouse process | Documented |
| Email code | Ready |
| Physical stock | Confirmed by owner |
| Sellable stock + Active products | Owner action in Admin |
| Vercel live config | Owner action |
| Resend config | Owner action |
| First test order | Owner action |

Once the owner actions above are done, B2C can open.
