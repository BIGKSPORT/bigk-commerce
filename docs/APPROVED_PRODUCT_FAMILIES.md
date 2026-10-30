# Approved product-family list — owner screenshot (2026-10-30)

The owner specified that **only these 12 product families** should appear as distinct storefront products:

1. Alpin Hood
2. Alpin Vest
3. Alpin Vest Pro
4. Core Pants
5. Core.2
6. Corelosse.2
7. Nano Down Jacket
8. Nano Down Vest
9. Neofit Pants
10. Snake Scarf
11. Summit
12. Velvet WMS Hood

The database currently contains 27 colourway/SKU records. This is not authorization to delete them: retain original SKU IDs, inventory, order references, photo mappings, and variant-level attributes. The storefront should display one family card per family and colour/size selectors inside the product detail page. Do not simply hide records based on duplicate display names.

## Proposed source-record mapping (review required)

| Family | Existing records | Notes |
| --- | --- | --- |
| Alpin Hood | P008, P009 | Alpine FZ hood colourways |
| Alpin Vest | P012, P013, P014 | Hooded-gillet naming is ambiguous; confirm mapping |
| Alpin Vest Pro | P006, P007 | Alpine Gillet colourways; confirm Pro naming |
| Core Pants | P010 | |
| Core.2 | P003, P004, P005 | |
| Corelosse.2 | P015, P016 | Existing name Coreloose.2 |
| Nano Down Jacket | P019, P020 | Exact duplicate SKU 25302901; do not double-count stock |
| Nano Down Vest | P021 | |
| Neofit Pants | P011 | |
| Snake Scarf | P023, P024, P025 | |
| Summit | P022 | |
| Velvet WMS Hood | P017, P018, P026, P027 | Four distinct colour SKUs |

**Unresolved records:** P001 (Apline Fleece) and P002 (Alpine FZ) are not confidently mapped to the 12 named families. Do not automatically reclassify or delete them. **P012/P013** also have the same SKU 25301701, and the P012–P014 family assignment needs owner confirmation because the naming overlaps Alpin Vest / Alpin Hood.

## Implementation acceptance criteria

- Exactly 12 distinct family cards when all approved families are eligible for display; never silently publish unapproved products.
- Correct family names and one card per family in search, category listings, homepage, pagination and recommendations.
- Variant selectors retain colour-specific photos, supplier SKU, size and stock. Never aggregate duplicated SKU inventory twice.
- Preserve existing detail links until redirects and canonical URLs are reviewed.
- No destructive data migration; no prices, inventory, approval flags, orders, or website deployment changed.
- Run typecheck, unit tests, browser tests and review visual screenshots before merging.

**Status:** approved target list recorded; code implementation and browser verification not yet complete.
