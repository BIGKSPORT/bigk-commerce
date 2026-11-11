# Winter shipment — physical stock reconciliation

**Source:** `STOCK_ WINTER (2).xlsx` (complete shipping / arrival list)  
**Date reviewed:** 11 November 2026  
**Status:** Physical stock confirmed present. **Not yet written as sellable stock.**

---

## Important rules

1. This file is a **reconciliation aid**, not an automatic stock import.
2. The system never turns reported / workbook quantities into sellable stock by itself.
3. Some rows in the sheet are **mixed-size boxes** (one TOTAAL for several sizes). Those need a second human check before final numbers are entered in Admin.
4. Do not activate products until the size quantities below are confirmed against the physical boxes.

---

## Product codes found in the shipment (25 styles)

| Code | Shipping name (as on list) | Approx. total units* |
|------|----------------------------|----------------------|
| 25000701 | Velvet WMS hood | ~220 |
| 25000702 | Velvet WMS hood | ~310 |
| 25000703 | Velvet WMS hood | ~256 |
| 25000704 | Velvet WMS hood | ~231 |
| 25300801 | Neofit pants | ~210 |
| 25301601 | Alpine FZ Hood | ~217 |
| 25301603 | Alpine FZ hood | ~237 |
| 25301701 | Alpine hood gillet | ~310 |
| 25301702 | Alpine hood gillet | ~305 |
| 25301801 | Core.2 | ~370 |
| 25301802 | Core.2 | ~370 |
| 25301803 | Core.2 | ~390 |
| 25301902 | Coreloose.2 | ~340 |
| 25301903 | Coreloose.2 | ~370 |
| 25302101 | Summit | ~112 |
| 25302401 | Snake scarf | 50 |
| 25302402 | Snake scarf | 50 |
| 25302403 | Snake scarf | 50 |
| 25302701 | Core-pants | ~178 |
| 25302901 | Nandown Jacket | ~148 |
| 25303001 | Nandown Gillet | ~206 |
| 25303101 | Alpine Fleece | ~240 |
| 25303102 | Alpine Fleece | ~232 |
| 25303201 | Alpine Gillet | ~236 |
| 25303202 | Alpine Gillet | ~252 |

\*Totals are **preliminary**. Mixed boxes (one carton with several sizes) mean some lines share a TOTAAL. Final per-size counts must be confirmed in the warehouse before Admin entry.

**Rough grand total on the list:** ~5,800–5,900 units across 25 style codes.

---

## Name mapping notes (possible confusion)

Shipping list name → likely website / catalogue name:

| Shipping list | Likely catalogue name |
|---------------|------------------------|
| Velvet WMS hood | Velvet / WMS hood family |
| Alpine Fleece | ALPIN fleece / Alpin Fleece |
| Alpine Gillet | ALPIN vest / Alpin Gillet |
| Alpine hood gillet | ALPIN hood gillet |
| Alpine FZ hood | ALPIN FZ hood |
| Core.2 | Core.2 / Core 2 |
| Coreloose.2 | Coreloose.2 |
| Core-pants | Core pants |
| Neofit pants | Neofit pants |
| Nandown Jacket / Gillet | Nandown jacket / gillet |
| Snake scarf | Snake scarf |
| Summit | Summit |

Colour variants are often separate codes (e.g. 25000701 / 02 / 03 / 04). Match by **8-digit code**, not only by the English name.

---

## What to do next (warehouse + admin)

### Step 1 — Confirm mixed boxes
For styles that had multi-size cartons on the list, count the real pieces per size once more in the warehouse.

### Step 2 — Enter sellable stock in Admin
For each style code that should be sold on day 1:
1. Open the product in `/admin`
2. Enter confirmed stock per size
3. Confirm price + photos
4. Set **Approved** = yes
5. Set **Active** = yes

### Step 3 — Start small
Recommended for tomorrow:
- Activate only styles that are fully counted and photographed
- Keep the rest as draft until counts are double-checked

---

## Not done automatically

- No database stock update was performed from this file
- No products were activated
- No prices were changed

Owner / warehouse must confirm final per-size numbers before they become sellable.
