# Warehouse Process — B2C Orders (Launch Version)

**For:** Warehouse worker  
**Platform:** www.bigk.be (admin)  
**Status:** Manual labels for day 1 — automatic labels come later

---

## Every morning / several times per day

1. Go to **https://bigk.be/admin** and log in
2. Open **Orders**
3. Look for orders with status **paid**

---

## For each paid order

### Step 1 — Open the order
- Click the order
- Check customer name, address, phone, email
- Check the products and sizes

### Step 2 — Packing slip
- Open the packing slip page for that order
- Print it (or keep it open on a second screen)

### Step 3 — Pick & pack
- Take the correct items from stock
- Double-check size and colour
- Put the packing slip in the box

### Step 4 — Create shipping label (manual for now)
- Open MyParcel or DPD portal
- Create a new shipment with the customer address
- Print the label and stick it on the box

### Step 5 — Update the order in admin
- Go back to the order in `/admin`
- Enter the **tracking number**
- Change status to **fulfilled**

### Step 6 — Hand over to carrier
- Give the package to the courier / drop-off point

---

## Priority rules (when B2B also starts)

- **B2C paid orders** → process same day if possible (especially before 14:00)
- **B2B orders** → follow the quantity and delivery date agreed by the sales team

---

## What to do if something is wrong

- Wrong size / out of stock → do **not** ship. Contact Nicky or the sales team immediately.
- Address looks incomplete → check with the customer or escalate.
- Customer asks for change after payment → escalate (do not change the order yourself).

---

## Important notes

- Stock is already reserved when the order is paid. When you mark it fulfilled, the system records the shipment.
- Never ship an order that is not in status **paid**.
- Keep packing slips and tracking numbers for at least 30 days.

This process is intentionally simple so we can launch tomorrow. Automation of labels will be added as the next improvement.
