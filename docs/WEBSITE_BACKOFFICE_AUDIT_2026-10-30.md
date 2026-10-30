# BIG K ® — Website and Backoffice Audit
Date: 30 October 2026
Scope: Vercel production/preview, connected GitHub draft branch `fix/catalogue-colour-options`, Supabase `bigk` / `bigk_staging`, administrative API and UI source.
Status: **NO-GO for live checkout**. Read-only audit; no DNS or live-commerce changes.

## Executive finding
Production Vercel still serves GitHub `main` initial commit `35b1852dfd3d6c42a1deaeb4d38da35d581cc68a`. The current draft storefront on `fix/catalogue-colour-options` has a Vercel preview marked READY at commit `cd1127260212b7260f2b01e4159cb97febdcf676`, but a READY build does not prove end-to-end runtime functionality. Preview SSO is enabled, so unauthenticated browser testing is restricted.

## Evidence matrix (readbacks)
| Item | Production `bigk` | Staging `bigk_staging` |
|---|---:|---:|
| Product rows | 27 | 27 |
| Distinct 8-digit SKUs | 25 | 25 |
| Active products | 0 | 0 |
| Approved products | 0 | 0 |
| Missing price | 21 | 0 |
| Missing images | 10 | 6 |
| Variant rows | 131 | 131 |
| Total recorded stock | 0 | 5,824 |
| Variants with positive stock | 0 | 129 |
| Orders | 0 | 0 |

Do not copy the staging stock total automatically into production: supplier order, physical stock and variant mapping need reconciliation. The supplier file totals previously differed across sheets (5,610 vs subset figures), and SKU aliases can duplicate representations.

## Blockers

### P0 — Production storefront not deployed
Production Vercel remains initial main commit, while working storefront exists in preview/draft. `bigk.be` has had conflicting GoDaddy apex A records `185.158.133.1` and `216.198.79.1`; current DNS cannot be asserted from Vercel alone. Do not cut over until staged production build is validated.

### P0 — Missing secure production runtime configuration
Vercel Production currently has only `APP_URL`, `COMMERCE_MODE=demo`, `LIVE_COMMERCE_APPROVED=false`, `INDEXING_ENABLED=false` and `BIGK_CLUB_ENABLED=false`. Missing production `DATABASE_PROVIDER`, `DATABASE_SCHEMA`, `DATABASE_URL`, dedicated database credentials, `ADMIN_PASSWORD_HASH`, `RECEIPT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM`, plus durable media configuration. User reports Stripe checkout tested on the new website, but production webhook persistence cannot be independently verified; both Supabase schemas have zero order rows. Do not print or copy secret values into audit.

### P0 — Production catalogue unsellable
All 27 rows inactive/unapproved; all production stock zero; 21 prices null; 10 image galleries empty. Approval/inventory should be based on verified physical stock, photo-SKU match, pricing and sizes. Staging values are not automatically validated.

### P0 — Production schema incomplete for backoffice
`bigk.product_content` was restored in an earlier additive migration (27 matching rows, RLS on, no public SELECT). However `admin_returns`, `withdrawal_requests`, `media_assets` and club tables are present only in `bigk_staging`, not `bigk`. Draft backoffice API routes and media code reference these tables, so operations can error until migrations/access policies are deliberately prepared and validated. Do not move production orders or modify staging data to shortcut schema audit.

### P0 — Legal and customer service pages still draft
`app/info/[slug]/page.tsx` openly says privacy policy, terms, delivery/return rights, support email and carrier policies must be finalized. Live customers must not be shown development language. Confirm mandatory seller, tax, withdrawal and data-privacy disclosures with appropriate legal review.

### P1 — Europe coverage mismatch
User states BIG K ® sells across Europe; `checkoutSchema.country` in `lib/commerce.ts` and Stripe `shipping_address_collection.allowed_countries` in `app/api/checkout/route.ts` allow only BE, NL, FR, DE, LU. Shipping is flat €6.95 below €100 and free above €100; per-destination fulfillment, applicable VAT, and return costs are not approved. Do not claim all-European delivery until this is resolved.

### P1 — Backoffice media storage
`lib/media.ts` defaults to filesystem storage outside Netlify, and current Vercel production env does not set `MEDIA_DRIVER=database` or upload limit. Serverless filesystem is not durable for permanent product uploads. Configure persistent media storage before allowing backoffice uploads.

### P1 — Backoffice auth and dependency
Admin login correctly checks session cookie and hash, same-origin mutation checks, and bounded rate limits in source code. However admin requires `ADMIN_PASSWORD_HASH` and a working database in production, both not configured. No authenticated end-to-end admin session test was performed. Backoffice loads catalog first, then orders/overview/club/master; failure in any ancillary endpoint can show partial-data warnings.

### P1 — Brand cleanup
Customer-facing storefront, product schema, manifest and top-level SEO metadata were updated toward **BIG K ®**, but `components/backoffice.tsx` still contains `BigK Club`, `Let's move BigK forward`, and `The look of BigK`; `app/info/[slug]/page.tsx` includes `BigK` and `BIGK`. Complete brand audit throughout public and admin UI. GitHub organization and repo identifiers need not be renamed.

### P2 — Indexing and SEO
Draft includes dynamic robots and sitemap, product canonical and Open Graph metadata. Indexing is intentionally off until launch. Only approved, active products with images should be in sitemap. Language-specific hreflang requires real translations; avoid invented translations and false shipping claims.

## Things that passed source-level inspection
- Preview deploy at commit `cd112726...` returned Vercel READY.
- Admin catalog, order, media and overview routes call `requireAdmin`; mutation paths check origin.
- Admin catalog source checks version concurrency, reservation-safe inventory, approval+photo+price requirements and alias edits.
- Order fulfillment route only fulfills paid orders and checks pending withdrawals.
- `bigk.product_content` restored and checked private.
- Previously flagged seven internal `bigk` agent/settings tables have RLS disabled; explicit privilege checks found no `anon`/`authenticated` SELECT and no anonymous schema USAGE. RLS defense-in-depth finding remains for policy review; no changes made.

## Important verification limitations
- Could not perform full unauthenticated visual UI crawl of `bigk.be` or protected Vercel preview via available browser; no mobile/browser E2E claims.
- No admin login, image upload, live payment, webhook, refund, warehouse picking, customer email or tax transaction was executed.
- Vercel runtime errors reported a historical serverless filesystem error `ENOENT mkdir '/var/task/data'` (4 instances) on an earlier preview deployment; current latest preview reports READY, not a proof of resolved runtime persistence.
- Current status is based on connected account inspection, not a claim that the existing Lovable homepage looks a certain way.

## Ordered remediation and release gate
1. Keep current site / DNS unchanged. Prepare reviewed production commit and staged production URL.
2. Apply required production schema migrations, least-privilege role/RLS policies, persistent media driver; configure secrets directly in Vercel.
3. Reconcile catalogue (25 SKUs, 27 records) with owner-verified stock, product names, images, variant sizes and prices, then approve sellable products.
4. Finalize policies, contact and Europe-wide delivery matrix; check payment tax, shipping and returns across actual countries.
5. Test production-like admin login, product edit, stock save, image upload, order flow, webhook, email, fulfillment and refunds in an isolated environment. Run automated tests and manually verify desktop/mobile.
6. Only with explicit owner release approval: staged production promotion, domain DNS cutover, indexing activation and monitoring.

Decision: **Not ready for paid launch**. No configuration/production change made by this audit.

## DPD evidence update — 30 October 2026

Internal source: [DPD shipping research, 2026 quoted rate matrices](./DPD_SHIPPING_RESEARCH_2026-10-30.md).
- DPD onboarding, signed offer, 32 B2C destination quotes and B2B quotes found in connected Gmail.
- Carrier account status must be reverified: correspondence from August–October includes service suspension/collection notices; latest tariff message is **not** proof that collection/label services are currently active.
- July customer shipment evidence documents non-EU HS classification and label failures; block non-EU shipping until customs and carrier workflows are tested.
- DPD onboarding credentials were present in historical mail; rotate rather than reuse.
- Do not use the emailed rate grid for customer checkout until signed contractual prices, VAT/surcharges, package weights and active destination eligibility are confirmed.
