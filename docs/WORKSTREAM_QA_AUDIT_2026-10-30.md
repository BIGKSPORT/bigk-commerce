# BIGKSPORT — staging workstream audit (30 October 2026)

Status: **internal QA evidence only**. Based on existing draft PR #1 documentation; no hosted tests were run in this audit. No deployment, live inventory or customer contact.

## 1. Catalogue and inventory — issue #2
- Stock.xlsx **column E** is the authoritative order quantity, not column G. The received master seeded into `bigk_staging` has **5,824 units**, while the separate source order summary has **3,812 units** across 13 product families. **These totals are different datasets and must not be compared as a confirmed 2,012-unit discrepancy without row-by-row reconciliation.**
- The deployment document explicitly flags Alpin source/master mismatch. Reconcile per barcode and size before any import or product activation. XS not ordered.
- `docs/PRODUCT_IMAGE_REVIEW.md` flags duplicate source catalogue SKU records P012/P013 and P019/P020. Do not sum both as separate physical stock without verification.

## 2. Images and descriptions — issue #3
- Existing `docs/PRODUCT_IMAGE_REVIEW.md` maps 50 supplied image files to 17/27 original catalogue records; ten were unresolved at that review's time.
- The PR #1 description separately reports six Black and ten Emerald Alpin Fleece Pro gallery images, but the owner-confirmed six Black images are listed in `docs/ALPIN_FLEECE_PRO_IMAGE_MAPPING.md` on the QA branch. **Check that the implementation's exact six filenames match the owner-confirmed six; the PR summary alone cannot prove this.**
- The old image-review file calls P002 dusty-blue for SKU 25303102; the owner now identifies that Alpin Fleece Pro colour as Emerald Green. Treat this as a **catalogue-label conflict** requiring owner-approved correction in the actual application and source data.

## 3. Checkout and operations — issue #4
- `docs/DEPLOYMENT.md` reports staging schema `bigk_staging` applied with 20 RLS tables, zero active products/orders and staging-role isolation from production orders.
- Hosted Netlify runtime, dedicated staging database login, sandbox Checkout, signed webhook, emails, image persistence and returns **remain unverified**. Local tests claimed in PR are not hosted validation.
- Tax: domestic Belgian VAT and IOSS dispatch-origin decisions unresolved. Existing legal pages contain development notices. No live launch.

## 4. Marketing — issue #5
- Initial EN/NL/FR Alpin social captions and email announcement drafts saved in `docs/LAUNCH_MARKETING_DRAFT.md`. No customer contact or publication.
- Do not promise availability or use unsupported technical/performance claims.

## 5. Dashboard — issue #6
### KPI data contract (draft)
| KPI | Definition | Required source | Current state |
|---|---|---|---|
| Paid revenue | Sum of paid captured order totals less refunded amounts, currency EUR | Orders, payments, refunds | **Not verified** |
| Orders | Count of distinct completed paid orders | Orders, payment status | **Not verified** |
| Sellable units | Sum positive stock of approved, active colour-size variants | Variants, stock, approvals | **Not ready**; staging has zero active products |
| Low stock | Variants with available stock <= configurable threshold, excluding inactive products | Inventory and reservations | **Needs thresholds and reconciled stock** |
| Fulfilment backlog | Paid orders not yet dispatched | Orders and fulfilment records | **Not verified** |
| Return rate | Returned paid order lines / delivered order lines over matched cohort | Orders, deliveries, returns | **Not verified** |
| Gross margin | Net revenue minus landed COGS | Payments, refunds, per-SKU cost | **Blocked: verified costs not provided** |
| Conversion rate | Completed paid orders / qualified storefront sessions | Orders and consent-compliant session measurement | **Blocked: sessions not established** |

Never present staging seeded stock as live inventory, or missing metrics as zero. Scope dashboard reads to a dedicated least-privilege staging role; do not query production.

## Immediate QA acceptance gates
1. Barcode-level reconciliation and explicit owner review.
2. Owner-confirmed Alpin six-black gallery file parity; visual green gallery confirmation.
3. Hosted staging URL, secrets, dedicated database role and signed sandbox payment tests.
4. Reviewed brand/copy/legal claims and tax/shipping setup.
5. Dashboard data lineage and permissions reviewed before any production connection.

Tracking: GitHub issues #2–#6, draft PR #1.