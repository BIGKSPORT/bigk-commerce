# Duplicate catalogue SKU audit (read-only)

Confirmed against the BIG K private catalogue on 2026-10-30:

| SKU | IDs | Name | Decision |
| --- | --- | --- | --- |
| 25301701 | P012, P013 | Alpine gillet hood | Review before consolidating |
| 25302901 | P019, P020 | Nandown JKT | Review before consolidating |

All four records are currently inactive and unapproved, with no prices. P012/P013 have no images. P019/P020 contain identical image lists. No records were deleted, prices changed, inventory merged, or website deployed.

**Suggested storefront fix (requires validation):** on read-only catalogue list endpoints, group by normalized supplier SKU and show one canonical card per group. Keep both records in storage until the owner confirms whether colour/size variants are actually distinct. Do not hide records from administration or orders, and do not deduplicate by name alone. Ensure search results, category listings, featured lists and pagination use consistent grouping. Existing product detail URLs should remain stable pending a redirect decision.

**Verification checklist:** check counts and product cards for both pairs; compare images and variant stock; confirm canonical SKU with supplier; ensure order references remain unchanged; run typecheck, tests, and preview browser checks before any merge.

This document is a proposal, not a deployed storefront fix.
