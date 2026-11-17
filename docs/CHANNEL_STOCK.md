# Channel stock control: EAN-first preparation

Owner location: Backoffice → **Voorraad & kanalen**. This is a preparation/control module, not a live marketplace integration.

## Identity and content

- The stable internal `variantId` is the stock identity. EAN/GTIN matches a platform article to that exact size/colour. Names, descriptions and SEO wording are never matching keys.
- EAN/GTIN remains text; leading zeroes are preserved. The existing check-digit validator supports GTIN-8/12/13/14; comparisons use the existing 14-digit canonical normalisation. This does not rewrite source identifiers.
- Missing, invalid, duplicate, unverified and archived EANs block new mappings. Duplicate detection includes all non-archived variants with a valid canonical GTIN, regardless of verification status. Archived variants remain visible for inspection but cannot be mapped.
- A mapping requires the exact current variant, the external EAN, true platform article ID, channel/account key and explicit owner confirmation of size/colour/identity. One external ID and one variant per channel/account key. Use distinct account keys for separate accounts/markets, particularly Amazon markets; future API authorisation must verify that identity again.
- External title is optional local recognition metadata. No title, description, price, listing or product content is changed locally or remotely. A changed central product name leaves identity intact; a changed source EAN makes the mapping stale until reviewed.

## Stock interpretation

The overview uses existing `variants.stock` and `variants.reserved`. These are system book quantities, not a new warehouse count; current sales flows can book sold units before physical dispatch.

`available = max(0, stock - reserved)`

`plannedChannelAvailable = max(0, available - plannedBuffer)`

The planned buffer is not a physical reservation and is **not yet enforced** in retail checkout, B2B or any marketplace. These quantities describe one shared pool, not extra stock per platform. No stock mutation, reservation or movement ledger is created by this module. Existing stock adjustments remain in the existing stock-management flow.

The seller portal currently checks availability but does not automatically book/reserve its orders. This module therefore reports submitted and paid seller-order units separately. It cannot know whether those orders have already been manually booked. It does not subtract them again. Reconcile this flow and manual adjustments before enabling future marketplace inventory writes. Deleted/unmatched historical variant IDs require separate reconciliation; this overview is based on current catalogue variants.

All four external channels explicitly show **not connected**, unknown platform quantities and no successful sync time. A locally saved or paused mapping is not evidence that the external listing exists, is updated or is paused. Local removal does not delete the remote offer. No platform credentials are collected and no external HTTP calls are made.

## Controls and persistence

Owner session, same-origin checks, bounded validated input, write rate limiting and private/no-store responses protect `/api/admin/channels`. New mappings reject ambiguous/stale EANs and inconsistent stock. Buffer changes and pause/removal use optimistic versions and the existing transaction lock. Database unique constraints back up mapping checks. Each local change writes the existing operations audit, including its prior state/reason as appropriate.

Two additive private tables: `channel_variant_links`, `channel_stock_policies`. They reference stable variant IDs. Product editing uses existing variant updates/archiving; remove local mappings/policies deliberately before any exceptional hard deletion of referenced variants. No orders, prices, product names, descriptions, identifiers or live stock are modified by channel actions.

## Release

Default off unless `CHANNEL_STOCK_ENABLED=true`. Production schema/activation requires explicit owner approval. During preparation, no production tables, flags, links, buffers or stock were changed. A read-only initial catalogue audit found 190 variants, 2 missing EANs, 34 populated identifiers not marked verified and no duplicate canonical EAN groups; the new runtime module also checks validity/archive state.

1. Test the reviewed branch and `supabase/channels/bigk_staging.sql` in staging, with Preview restricted to staging credentials. No production platform keys in Preview.
2. After owner approval, provision `supabase/channels/bigk.sql`. It creates only the two tables/indexes, enables RLS, revokes PUBLIC/anon/authenticated privileges and grants the existing matching server role. Existing operations/seller/product tables are reused, not migrated.
3. Merge the tested code, set `CHANNEL_STOCK_ENABLED=true` in Production and redeploy. Open Backoffice → Voorraad & kanalen. Inspect EAN issues before saving any links.
4. Existing Producten tools remain responsible for verified source EAN corrections. Do not mark an EAN verified merely because its check digit passes.

Rollback: disable the flag and redeploy; retain saved links/policies and audit history. Because there are no external writes or stock changes, rollback does not require a stock reset.

## Next phases, not included

Read-only account authorisation and offer/order imports for bol first, then Ankorstore/Faire/Amazon; per-channel reconciliation and stock movement ledger; seller-order stock posting; idempotent external order reservations; retry/outbox and failure monitoring; shared-pool allocations and buffers enforced in actual publishing; tracking and return reconciliation. Actual platform writes must remain off until those flows and the relevant credentials are verified.

## Validation

`npm run typecheck`

`node --import tsx --test tests/channel-stock.test.ts tests/channel-postgres.test.ts tests/b2b-portal.test.ts tests/sales-portal.test.ts tests/sales-commissions.test.ts`

`node --import tsx tests/channel-browser.mjs`

The tests use disposable databases. They cover owner/CSRF/feature checks, check digits and leading zeroes, duplicate/archive/verification guards, version conflicts/concurrent linking, stale EAN detection, independence of SEO content, unchanged stock/prices, seller-order warnings and repeatable private PostgreSQL provisioning. Browser tests use real components and actual API handlers at 1440/390/412 widths for searching, mapping, buffer planning, pause/removal and blocked EAN actions. An external-call guard rejects any attempted platform HTTP request.
