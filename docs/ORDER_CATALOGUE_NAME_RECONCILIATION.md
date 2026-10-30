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

## Alpine Gillet Black physical package label
- STYLE **ALPINE GILLET**, NAME **GILLET**, COLOR **BLACK**, RRP **€133.90**, SIZE **L**. Printed code is partly covered, consistent with order SKU **25303201**; last digits not independently legible.
- EAN barcode is partly obscured; **do not invent or mark as physically verified**. Black draft display name aligned to Alpine Gillet; product image still missing.
- Both Alpine Gillet colours now identified, Dusty Blue 25303202 and Black 25303201; barcode for Black L remains pending.

## Alpine Gillet Hood Dusty Blue physical label
- **25301702**: STYLE **ALPINE GILLET HOOD**, NAME **ALPIN VEST**, COLOR **DUSTY BLUE**, RRP **€66.90**, SIZE **XXL**, EAN **6957919562812**.
- Previous supplier-order and catalogue descriptions said cream. The physical label confirms Dusty Blue; draft catalogue corrected. Original supplier order remains unchanged.
- Hooded garment is a distinct family from Alpine Gillet (25303201/25303202). Existing P014 photos require colour verification before approval.

## Alpine FZ Hood Cream — physical label verified
- STYLE **ALPINE FZ HOOD**, NAME **ALPIN**, COLOR **CREAM**, CODE **25301603**, RRP **€93.90**, SIZE **XL**, EAN **6957919562669**.
- Draft catalogue display family updated to Alpine FZ Hood; supplier name ALPIN retained here as label evidence. Original order and quantities unchanged.

## Nandown Jacket Black — physical label verified
- STYLE **NANDOWN JKT**, NAME **NAND DOWN**, COLOR **BLACK**, CODE **25302901**, RRP **€186.90**, SIZE **L**, EAN **6957919564564**.
- Draft catalogue display name changed from Nano Down Jacket to Nandown Jacket for both P019 and alias P020. Size L EAN added only to variant-bearing P019. Duplicate alias P020 remains pending safe deduplication.
- Supplier order, stock quantities and other size barcodes unchanged.

## Velvet WMS — owner-confirmed distinct structures
- Owner confirms Velvet garments are **different products with different structures**, not interchangeable colour variants. Do **not** group SKUs 25000701/02/03/04 into a single selectable-colour product merely because their first six SKU digits match.
- **25000702 physical label:** STYLE VELVET WMS HOOD, NAME VELVET, COLOR EMERALD, CODE 25000702, RRP €79.90, SIZE XXL, EAN 6957919563758.
- Keep each Velvet SKU a separate draft product until its construction and naming are individually verified. Shared supplier style text is insufficient to infer same structure.

## Velvet Emerald garment tag (second independent label)
- **25000702**, STYLE VELVET WMS HOOD, NAME VELVET, EMERALD, SIZE 2XL/XXL, composition **30% RAYON / 70% POLYESTER**, MSRP €79.90, EAN **6957919563758**.
- Same SKU and EAN as packaging label, not an additional product. Composition and XXL EAN recorded in draft catalogue. Velvet styles remain separate products.

## Velvet WMS Hood Cream/Black — garment hangtag verified
- STYLE **VELVET WMS HOOD**, NAME **VELVET**, COLOR **CREAM/BLACK**, CODE **25000701**, SIZE **L**, COMPOSITION **30% RAYON / 70% POLYESTER**, MSRP **€79.90**, EAN **6957919563673**.
- Supplier order uses black-cream, whereas physical hangtag uses cream/black. Use hangtag spelling in draft display. SKU-specific product remains distinct from other Velvet garments/structures; no automatic colourway merging.

## Catalogue + Website agent kickoff audit — 2026-10-30

- **Scope:** draft branch `fix/catalogue-colour-options` only. No production deployments, payments, stock adjustments, order-file modifications, or customer communications authorized.
- **Catalogue:** 27 entries, **25 unique supplier SKUs**; duplicate/alias entries `P012/P013` for `25301701`, and `P019/P020` for `25302901`. Do not double count these.
- **Physically photographed:** 9 unique SKUs: `25303101`, `25303102`, `25303201` (last SKU digits / EAN partly occluded), `25303202`, `25301603`, `25301702`, `25302901`, `25000701`, `25000702`. Hence **16 additional unique SKUs not yet label-verified**; physical verification is not equivalent to a full size-level barcode audit.
- **High-confidence mismatch:** original order `25303202` says cream-black but physical tag says **Dusty Blue**. `25301702` order says cream but physical tag says **Dusty Blue**. Trust tag; preserve original order unchanged.
- **Order-aligned name corrections in this audit (still NOT physical-label verified):** `25301601` -> Alpine FZ Hood; `25301701` -> Alpine Gillet Hood (both alias entries); `25301902` and `25301903` -> Coreloose.2; `25303001` -> Nandown FZ Gillet. These were normalized from order only, and should not be marked physical-label approved.
- **Structure safeguard:** `lib/product-family.ts` treats each `250007xx` Velvet product separately as explicitly directed by owner; do not expose those as automatic swatch-colour variants based on numeric prefix.
- **Remaining website QA:** confirm merchandise images match tag colours for P007 (`25303202`), P014 (`25301702`), check swatches & duplicate listing behavior, verify page rendering and preview-only environment before deployment. No deployment in this audit.
- **Remaining catalogue QA:** confirm 16 unverified SKUs; check size-level barcodes, photographs, supplier descriptions, and disputed structure differences before approval.

## Launch gate — 31 October 2026

**Release decision: NOT READY for live orders until checked.** Read-only inspection on 30 Oct confirmed latest catalogue preview deployment READY at commit `64e9f0ab4ffe606e15cfb95097a050e80ab4ebab`, but production is still the initial `main` commit `35b1852dfd3d6c42a1deaeb4d38da35d581cc68a`. Production Vercel environment currently has **zero configured secrets/variables**. All six known demo variables belong only to preview branch `setup/supabase-commerce`, not production or the catalogue-fix branch.

- [ ] **Secure production configuration:** configure persistent PostgreSQL database (including `DATABASE_PROVIDER=postgres`, `DATABASE_URL`, `DATABASE_SCHEMA=bigk`), production application URL `https://bigk.be`, admin password hash and signing secrets, Stripe live secret + webhook signing secret, and order email provider settings. Keep values in provider secret manager; never commit secrets.
- [ ] **Commerce activation:** independently verify live Stripe account/key mode, webhook delivery, tax/shipping correctness, one real persisted order, inventory reservations/fulfilment and customer email. Owner reports successful Stripe checkout on **new** BIGKSPORT site, but account/environment mode and production persistence not independently verified. Explicit approval required before turning live mode on.
- [ ] **Catalogue acceptance:** 25 unique SKUs; confirm sizes, approved stock, prices and product images; check physical label disputes (`25303202` and `25301702` Dusty Blue), Velvet structures, and two duplicate alias records. Do not assume all size barcodes known.
- [ ] **Preview QA:** test PDP / colour option selections and images, cart, mobile, order flow without live payment, accessibility, links and policy pages on a protected preview with safe demo settings.
- [ ] **Promotion:** deploy a reviewed commit to a staged production URL; validate before promotion to live custom domain.
- [ ] **DNS cutover:** GoDaddy apex `@` currently has both old `185.158.133.1` and Vercel `216.198.79.1`. At cutover remove obsolete apex A record and retain Vercel A record; protect mail DNS (MX/SPF/DKIM/DMARC). Verify `www` handling and TLS.
- [ ] **Rollback:** retain previous production deployment and record DNS rollback steps before cutover.

**No live deployment, checkout activation or DNS change was performed by this audit.**

## Production Supabase schema preparation — 30 October 2026

- **Completed, verified in remote Supabase project `tvlfpxlfuatvtuiyrcam`:** production schema `bigk` was missing table `product_content`, which `lib/db.ts` queries on every catalogue load. Applied additive migration `add_private_production_product_content_from_staging`: create table with product FK, enable RLS, insert 27 matching content rows from existing `bigk_staging.product_content`, `ON CONFLICT DO NOTHING`. No existing product, stock, order, or customer rows were altered.
- **Readback:** `bigk.product_content` = **27 rows, all 27 matching production products**, RLS enabled, `anon` SELECT **false**, `authenticated` SELECT **false**. The new table is intentionally private.
- **Still blocked:** no production `DATABASE_URL` secret or dedicated production database login / scoped RLS access has been configured in Vercel. Never put a database password into GitHub/chat. Connect using Supabase transaction pooler and a least-privilege login; confirm actual runtime catalogue/API access before sales.
- **Outstanding security finding, NOT changed:** Supabase reported seven internal `bigk` agent/settings tables with RLS disabled (`agents`, `tasks`, `approvals`, `runs`, `artifacts`, `settings`, `preview_checks`). Audit exposure and permissions; do not blindly toggle RLS, which can break agent access. This must be resolved prior to a public launch.
- **Checkout guard stays active:** Vercel production `COMMERCE_MODE=demo`, `LIVE_COMMERCE_APPROVED=false`; no production deployment, domain DNS changes or Stripe activation performed.

- **Follow-up permissions check:** for all seven flagged internal tables, direct privilege checks returned `anon SELECT=false`, `authenticated SELECT=false`, and `anon USAGE on schema bigk=false`. Thus the linter's RLS-disabled warning remains valid as a defense-in-depth issue, **but these checks did not find public read privileges**. Reassess before assigning direct-public-exposure severity or altering policies; no access changes made.
