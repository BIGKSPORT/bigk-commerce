# Order ↔ catalogue naming reconciliation (DRAFT — approval required)

Source: Stock.xlsx, first sheet (国外订单), **Quantity** column E (not stock column F or production column G). Source has additional sheets and totals that must not be added together. Catalogue: lib/catalog.json on setup/supabase-commerce.

## Critical conflict
- **25303102** order says **Alpine FZ — dusty-blue FZ fleece**. Website catalogue says **Alpin Fleece Pro — Emerald Green FZ stand-collar fleece**. The owner previously described Emerald Green. **Do not auto-overwrite either**: confirm actual garment colour using supplier label and physical product/photo, then update order/catalogue mapping by SKU.
- **25303101** order says **Apline Fleece — black FZ fleece**, website says **Alpin Fleece Pro — Black FZ stand-collar fleece**. Name spelling differs; SKU matches.

## Proposed website names (not yet approved)
| SKU(s) | Supplier/order wording | Website product family | Colours | Status |
|---|---|---|---|---|
| 25303101, 25303102 | Apline Fleece / Alpine FZ | Alpin Fleece Pro | Black; **Dusty Blue vs Emerald Green conflict** | BLOCKED colour |
| 25301801, 25301802, 25301803 | Core.2 | Core.2 | Black, Dusty Blue, Cream | Match |
| 25303201, 25303202 | Alpine Gillet | Alpin Vest Pro | Black, Cream-Black | Rename alias |
| 25301601, 25301603 | Alpine FZ hood | Alpin Hood | Black, Cream | Rename website from ambiguous Alpin |
| 25302701 | Core-pants | Core Pants | Black | Match |
| 25300801 | Neofit pants | Neofit Pants | Black | Match |
| 25301701, 25301702 | Alpine gillet hood / Alpine hood gillet | Alpin Hooded Vest | Black, Cream | Rename website from Alpin Vest; duplicate P013 |
| 25301902, 25301903 | Coreloose.2 | Coreloose.2 | Emerald, Cream | Website currently Corelosse.2 typo |
| 25000701, 25000702, 25000703, 25000704 | Velvet WMS hood | Velvet WMS Hood | Black-Cream, Emerald, Black, Cream | Match |
| 25302901 | Nandown JKT | Nano Down Jacket | Black | Alias; duplicate P020 |
| 25303001 | Nandown FZ Gillet | Nano Down Vest | Black | Alias |
| 25302101 | Summit | Summit | Black | Match |
| 25302401, 25302402, 25302403 | Snake scarf | Snake Scarf | Black, Cream, Emerald | Match |

## Reconciliation rules
1. SKU is the immutable match key; never match inventory by approximate name.
2. Display family name may be customer-friendly, but retain the exact supplier name in a separate field.
3. Order quantities come from Stock.xlsx first sheet **column E**; do not treat column F (stock) or G (production) as purchased quantity.
4. Normalize size labels (e.g. Xl → XL), without adding XS or inventing quantities.
5. Resolve 25303102 colour conflict with the owner before editing authoritative order/catalogue data or product imagery.
6. Remove duplicate catalogue records only after verifying all variant and URL references.
7. This file is a draft audit, not an approved catalogue import or production change.
