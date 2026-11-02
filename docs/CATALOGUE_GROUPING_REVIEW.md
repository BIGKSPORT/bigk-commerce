# Catalogue grouping — development review, 2 November 2026

Project: **BIGKSPORT/bigk-commerce**, development branch **fix/catalogue-colour-options**. `website-review` is a separate site and is not used. Production `main` and production data are not release targets for this change.

## Confirmed groups

Existing article records remain the inventory owners. A reviewed parent ID owns shared prose; child records inherit it through `product_content.trade.parentProductId`. Per-colour price, gallery, identifiers, publication status, physical stock and reservations remain separate. Historical aliases are retained. B10's existing 33 variants remain in their original record.

| Parent | Exact approved name | Articles / records |
| --- | --- | --- |
| P001 | Alpin Fleece | 25303101 Black / P001; 25303102 Dusty Blue / P002 |
| P003 | Core.2 | 25301801 Black / P003; 25301802 Dusty Blue / P004; 25301803 Cream / P005 |
| P006 | ALPIN VEST | 25303201 Black / P006; 25303202 Beige/Black / P007 |
| P008 | Alpin | 25301601 Black / P008; 25301603 Cream / P009 |
| P012 | ALPIN HOOD GILLET | 25301701 Black / P012; 25301702 Cream / P014; 25301703 Dusty Blue / P028 |
| P015 | Corelosse.2 | 25301902 Emerald / P015; 25301903 Cream / P016 |
| P023 | Snake Scarf | 25302401 Black / P023; 25302402 Cream / P024; 25302403 Emerald / P025 |
| B10 | B10 Sneakers | Existing Black, White, Green; EU 36–46; original 33 IDs / EANs |
| RIBS-LOW-WHITE | RIBS LOW SOCKS | 24309000 White; 24309001 Black; 24309002 Red |
| RIBS-MEDIUM-WHITE | RIBS MEDIUM SOCKS | 24309100 White; 24309101 Black; 24309102 Red |
| RIBS-LONG-WHITE | RIBS LONG SOCKS | 24309200 White; 24309201 Black; 24309202 Red |

Standalone styles: Core Pants / P010, Neofit Pants / P011, Nano Down Jacket / P019, Nano Down Gillet / P021, Summit / P022. Velvet records P017, P018, P026 and P027 remain four separate styles because their different constructions were previously confirmed; similar names do not justify merging them. P013 remains a historical alias of P012; P020 remains a historical alias of P019.

**Latest owner instructions supersede earlier names:** stand-collar 253032xx is ALPIN VEST (€133.90), while hooded 253017xx is ALPIN HOOD GILLET (€66.90). They are never combined. The owner screenshots confirm all 14 stand-collar size/EAN rows, including XS, and all 18 hooded rows. The fleece's separate S–XXXL restriction is unchanged.

## RIBS sources and availability

- [RIBS order](https://drive.google.com/file/d/1lWC-tcSEy3OZRJyXr-ySnsx_QGEqrjYZ/view): 17 ordered variants, 100 each. `Qty` is an order quantity, not a current physical count.
- [BigKPRICING](https://docs.google.com/spreadsheets/d/1oJ42bGMg4GdAfij2DdEdVBHuplSxEkKXZs0s_X_Lyls/edit): matching article / colour / EAN rows; documented MSRP €9.90 Low, €13.90 Medium, €14.90 Long. Only the necessary RIBS fields are retained in `docs/catalog-review/ribs-pricing-source.json`; costs/margins and historical supplier stock are not copied to the storefront.
- All three heights have White, Black and Red in 35–39 / 40–43. Long Black 35–39 (6957919554381) is documented in pricing but absent from the submitted order. It remains an unavailable variant.
- All nine colour records are unapproved, unpublished drafts at zero physical and reserved stock. None of the 1,700 ordered units has been assumed received.
- Low / Medium galleries use visually inspected source photos without Chinese text, optimized to 31–52 KB WebP files. Long has no verified photos and remains a draft. Fibre percentages are not documented by these files and remain blank.

## Checks

| Check | Status | Evidence / limit |
| --- | --- | --- |
| Actual project / development branch identified | PASS | bigk-commerce branch; no changes to website-review or production branch |
| Reviewed explicit grouping, no prefix/name heuristic | PASS | `lib/product-groups.ts`, owner-corrected source JSONs, complete map above |
| Existing variant IDs, physical / reserved stock and prices preserved | PASS | Transactional staging guard and snapshots; only documented new size records start at zero |
| Historical product aliases, order and customer relationships preserved | PASS | No variants moved/deleted; aliases unchanged; no order/customer writes |
| One expandable parent row, colour stock / EAN / SKU details | PASS | `components/admin-product-groups.tsx`; desktop/mobile browser screenshots |
| Shared description / composition / fit / technical page / SEO editor | PASS | `components/shared-product-editor.tsx`; version checked shared save, child override tests |
| Add colour / size, choose/upload/reorder photos, identifiers, archive | PASS | New draft colour API plus existing article editor; existing media management checks retained |
| Stale edits and specific field errors | PASS | Group member version checks; structured validation; no inventory reset |
| Colour cards, horizontal swatches and correct destination | PASS | Dedicated colour-card component; browser test changes B10 card image/href without navigation |
| One parent PDP, colour/size direct links, redirects, Back and refresh | PASS | `lib/product-group-routing.ts`; desktop/mobile browser test |
| Exact variant in bag / checkout | PASS | Existing commerce and ALPIN tests; no remapping of transactional variant IDs |
| ALPIN EN / NL / FR, immutable names, care pictograms | PASS | Existing six browser combinations retained; shared translation whitelist extended |
| Full storefront / checkout / legal / email translation for Europe | NOT VERIFIED | Existing prepared locale architecture retained; this grouping release does not activate an incomplete multilingual journey |
| Canonicals, sitemap deduplication and ProductGroup | PASS | One parent canonical; legacy direct redirects; public child-only structured-data isolation browser test |
| Private previews, draft isolation and noindex | PASS | Anonymous draft URLs 404; authenticated preview; no shared catalogue/stock cache |
| Performance / request-scoped deduplication retained | PASS | Existing React request cache, parallel DB reads, Paris function region and prefetch=false retained; real local navigation checked |
| Real-European-order launch readiness | NOT VERIFIED | Original launch audit blockers remain separate; no production release authorized |

## Unresolved exceptions

1. Confirm current physical inventory before selling. The owner explicitly said not every listed colour/size is in stock. Existing received/transactional quantities were preserved, not re-certified. New ALPIN XS rows, new hooded Dusty Blue rows and all RIBS rows remain zero.
2. Missing verified colour photos: Black Core.2 / P003; Cream Core.2 / P005; Black ALPIN VEST / P006; Black full-zip hooded Alpin / P008; Black ALPIN HOOD GILLET / P012; new Dusty Blue hooded gillet / P028; all RIBS Long colours. Existing images are retained; no other colour's gallery is substituted.
3. Unentered EANs / source SKUs on other historical apparel remain visibly flagged, not fabricated. The new owner screenshots only settle the two vest/gillet families; ALPIN Fleece and B10 mappings remain unchanged.
4. Corelosse source folder includes a Brown image folder without a verified article/variant match. No Brown product was invented.
5. Neofit remains without XS. Missing source material/fit data are not inferred from another garment.
6. Full multilingual interface, checkout, legal/safety and email approval remains a separate launch requirement. The complete existing EN/NL/FR fleece experience and universal EN/NL/FR/DE care content are preserved.
7. No production merge, domain change, live payment, customer email, shipment or new external feed/integration was performed.

## Recovery / migration

`lib/product-group-migration.ts` is a pure reviewed plan; running it against an already migrated snapshot yields no changes. `scripts/prepare-product-grouping.ts` produces **bigk_staging-only** SQL with a global transaction lock, expected product versions, an existing-variant inventory fingerprint and recoverable pre-change revisions. Capture a new snapshot and fingerprint if concurrent edits invalidate the plan. No DDL or variant reassignment is required.

The new RIBS import (`lib/ribs-import.ts`) is development-only and repeatable: it inserts absent drafts and refuses identity/EAN collisions without overwriting existing data. Preserve current stock when importing. Existing edits and orders must never be undone by re-running an import.

To undo a shared-content change, use its product revision and preserve current inventory. Archive new colours/variants rather than deleting them. Review the before/after snapshots before any production migration; production remains an explicit separate approval.
