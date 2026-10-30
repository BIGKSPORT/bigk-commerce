# Order ↔ catalogue naming reconciliation (DRAFT — approval required)

Source: Stock.xlsx, first sheet (国外订单), **Quantity** column E (not stock column F or production column G). Source has additional sheets and totals that must not be added together. Catalogue: lib/catalog.json on setup/supabase-commerce.

## Critical conflict
- **25303102 VERIFIED from physical package label (30 October 2026): STYLE ALPINE FLEECE, NAME FLEECE, COLOR DUSTY BLUE, CODE 25303102, RRP €146.9, SIZE L, EAN 6957919564847.** Supplier order dusty-blue is correct; website Emerald Green is wrong. Only this size barcode has been physically verified. Update draft catalogue after preserving other sizes and mapping photographs.
- **25303101** order says **Apline Fleece — black FZ fleece**, website says **Alpine Fleece — Black FZ stand-collar fleece**. Name spelling differs; SKU matches.

## Proposed website names (not yet approved)
| SKU(s) | Supplier/order wording | Website product family | Colours | Status |
|---|---|---|---|---|
| 25303101, 25303102 | Apline Fleece / Alpine FZ | Alpine Fleece | Black; **Dusty Blue (physical label verified for 25303102)** | Confirmed 25303102; Black label pending |
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
5. 25303102 colour resolved by physical package label: Dusty Blue. Preserve label evidence and verify other SKU labels before changing the authoritative order.
6. Remove duplicate catalogue records only after verifying all variant and URL references.
7. This file is a draft audit, not an approved catalogue import or production change.

## Applied to draft catalogue
- P001 and P002 display family name **Alpine Fleece**.
- P002 uses **Dusty Blue**; supplier SKU **25303102**, price **€146.90**, size L EAN **6957919564847** physically verified.
- P001 black name aligned to family for display only; its physical label is not yet verified.
- All other size barcodes remain unverified from physical labels. No order quantities, stock, prices or live approvals were changed.

## Second physical label verified — Alpine Fleece Black
- STYLE **ALPINE FLEECE**, NAME **FLEECE**, COLOR **BLACK**, CODE **25303101**, RRP **€146.90**, SIZE **3XL**, EAN **6957919564809**.
- Website variant size is stored as XXXL, equivalent to label 3XL; no size quantity changed.
- Both Alpine Fleece colours (25303101 Black, 25303102 Dusty Blue) now have physical label confirmation, but only one size-specific EAN per colour is verified.

## Third physical colour label — Alpine Gillet Dusty Blue
- **25303202** physical packaging: STYLE ALPINE GILLET, NAME GILLET, COLOR DUSTY BLUE, RRP €133.90, SIZE L, EAN **6957919564984**.
- Supplier order and previous catalogue incorrectly said **cream-black** for this SKU. Draft catalogue colour, display name and size-L barcode corrected. Supplier order retained unchanged as evidence.
- **Photo review required**: existing P007 image files were previously mapped as cream/black; do not assume they show the verified Dusty Blue garment. No images changed or approved.
