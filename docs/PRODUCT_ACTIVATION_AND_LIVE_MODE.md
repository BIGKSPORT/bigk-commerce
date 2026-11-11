# Product Activation & Live Mode — B2C Launch

**Goal:** Only sell products that have real stock, correct price, photos and approval.

---

## 1. What “live mode” requires (server side)

These environment variables must be set in **Vercel Production**:

| Variable | Required value |
|----------|----------------|
| `COMMERCE_MODE` | `live` |
| `LIVE_COMMERCE_APPROVED` | `true` |
| `APP_URL` | `https://bigk.be` |
| `STRIPE_SECRET_KEY` | Live key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Matching live webhook secret |
| `RECEIPT_SECRET` | Random string ≥ 32 characters |
| `DATABASE_PROVIDER` | `postgres` |
| `DATABASE_SCHEMA` | `bigk` |
| `DATABASE_URL` | Production Postgres connection |

If any of these are missing or wrong, checkout returns **503 – Live checkout is not configured and approved**.

---

## 2. When a product can be sold (live mode rules)

A product is only available for purchase when **all** of these are true:

1. `active = true`
2. `approved = true`
3. `priceCents` is set and > 0
4. At least one product image exists
5. The requested size has `stock - reserved >= quantity`
6. The variant is not archived

If any condition fails, the customer sees:  
`“{Product name} is not available in the requested quantity.”`

---

## 3. How to activate products (in Admin)

1. Go to **https://bigk.be/admin**
2. Open **Products**
3. For each product you want to sell tomorrow:
   - Set the correct **price**
   - Set correct **stock** per size (physical stock only)
   - Confirm **photos** are present
   - Set **Approved** = yes
   - Set **Active** = yes
   - Save

**Important rules:**
- Stock cannot be set lower than currently reserved units.
- Do not activate products that still have placeholder prices or missing photos.
- Prefer activating a small, reliable set of products first rather than everything at once.

---

## 4. Recommended launch order

**Day 1 (safe):**
- Activate only the products that have confirmed physical stock in the warehouse.
- Keep Club points disabled (`BIGK_CLUB_ENABLED=false`).
- Keep the number of active SKUs manageable for the warehouse worker.

**Later:**
- Activate remaining products after stock reconciliation.
- Turn on Club only after the first real orders work smoothly.

---

## 5. Quick pre-launch test (do this once)

1. Activate **one** product with known stock.
2. Place a real test order (small amount) or use Stripe test mode on staging first.
3. Confirm:
   - Order becomes `paid`
   - Stock decreases by the ordered quantity
   - Confirmation email is queued / sent
   - Order appears under **paid** in admin
4. Mark it fulfilled with a test tracking number.
5. Confirm the shipment email is queued.

Only after this test passes should you activate more products.

---

## 6. What the warehouse worker needs

- Access to `/admin`
- The process in `docs/WAREHOUSE_B2C_PROCESS.md`
- Clear knowledge of which sizes are actually in stock

---

## Summary checklist

- [ ] Vercel Production has `COMMERCE_MODE=live` and `LIVE_COMMERCE_APPROVED=true`
- [ ] Receipt secret, Stripe live keys and webhook are set
- [ ] At least one product is active + approved with real stock and photos
- [ ] One full test order completed successfully
- [ ] Warehouse worker knows how to process paid orders

Once the boxes above are checked, B2C can open safely.
