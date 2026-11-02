# Alpin Fleece — multilingual preview review

Prepared 2 November 2026. Scope: P001 / 25303101 Black and P002 / 25303102 Dusty Blue only. Owner's newest brief supersedes the old Fleece Pro and Mist Blue / Emerald Green presentation. Alpin Vest Pro / Alpin Gillet records remain untouched.

## Identity, inventory and pricing

- Display name in every language: **Alpin Fleece**, exact unchanged spelling/case.
- One shared product group `ALPIN-FLEECE`, backed by the existing two colour article records, not duplicated per language. Twelve existing size-level IDs remain the purchase/inventory keys.
- GTINs are strings, mapped by article + normalized size. Backend 2XL/3XL are accepted as XXL/XXXL without making new variants. Existing unique SKUs are retained; missing SKUs use article + backend size. Conflicting identifiers, duplicate sizes/SKUs or pricing block the canonical page for review.
- Fresh read-only staging query: both prices **14690 cents**; six variants per colour. Black stock S/M/L/XL/XXL/XXXL = **20/60/60/50/25/9** (224). Dusty Blue = **20/60/62/50/30/10** (232). Reserved quantities were zero at read time. Runtime always reads the database and subtracts reservations; these documentation figures are not seeded into hosted inventory.
- No transactional price or hosted stock changes. Production pricing remains a separate launch blocker from the pre-launch audit; missing production prices are not replaced by display-only assumptions.
- Public selectors, charts, catalogue API and variant structured data exclude XS. Historical source/order records are not removed.
- Public copy is a reviewed presentation layer. Source admin records and legacy file names may retain historical wording; no claim is made that the editable database's old care/description fields have been migrated. The read-only query showed staging product names already corrected by the owner.

## Routes and SEO

The existing `/products/` segment is retained consistently:

| Language | Final canonical path | SEO title |
|---|---|---|
| EN | `/en/products/alpin-fleece-jacket` | Alpin Fleece Jacket \| CHILL FLEX & THERMAL \| Big K |
| NL | `/nl/products/alpin-fleecejas` | Alpin fleecejas \| CHILL FLEX & THERMAL \| Big K |
| FR | `/fr/products/veste-polaire-alpin` | Veste polaire Alpin \| CHILL FLEX & THERMAL \| Big K |

Meta descriptions and full supplied copy: `lib/i18n/alpin-fleece.json`. Language links retain colour and size. HTML lang is set from the URL using Next.js 16 proxy; there are no forced language/geographic redirects or required preference cookies.

Configured origin `lib/seller.ts` is `https://bigk.be`; the Vercel project domain listing confirms `bigk.be` is attached and verified. Attachment is not proof that the production application/DNS launch blockers are resolved.

Each page has a self canonical, reciprocal en/nl/fr links + English x-default, localized Open Graph and social metadata. Existing `/products/apline-fleece-p001` and `/products/alpine-fz-p002` redirect permanently (308) directly to the final English page with original colour and optional selected size. Equivalent prefixed language aliases redirect within that language. Updated card title/image/swatches link directly to canonical pages. Indexable sitemap uses the three canonical pages, omits the two legacy pages, and requires both source records to be active/approved with images. Staging remains noindex; anonymous users cannot see draft products. No feed integration was found; none was created.

One ProductGroup and one BreadcrumbList are emitted, with 12 Product/Offer variants, individual GTINs, unique SKUs, source-colour images, localized colour/description, exact invariant product name, stable parent ID, decimal `146.90`, EUR and database availability. Variant links preselect colour and size. No ratings, shipping promises or certifications are invented. Private authenticated draft previews omit merchant JSON-LD entirely.

Guidance consulted on this task:
- https://developers.google.com/search/docs/appearance/structured-data/product-variants
- https://developers.google.com/search/docs/specialty/international/localized-versions

Local structured-data assertions are not an external Google Rich Results Test or Search Console validation. External indexing validation must follow approved public publication.

## Source and assets

Re-read Drive folder `106AbX8Ci9zJlJ-8UUHI1_MF7103-F7Ln`; no nested folders or care document found by folder listing and scoped searches at review time. Re-fetched and visually read specifications, size chart, product hangtag, CHILL FLEX/THERMAL original graphics and washing footer. Existing approved crops and source-derived CHILL FLEX/THERMAL assets are reused; the earlier AI-generated transparent logo is not used.

- Main fabric only: 100% polyester; does not certify contrast composition.
- Supplier body measurements: S–XXXL shoulders 41.5/44/46.5/49/51.5/54 cm; chest 100/106/112/118/124/130 cm. The Chinese footnote explicitly says body measurements. XS column omitted. No jin weight ranges or ambiguous garment dimensions displayed.
- Model: 185 cm, 78 kg, XL. No vest chart used.
- Four features retained in approved order: CHILL FLEX, THERMAL, SECURE POCKETS, THUMB LOOP. First two are supplier material labels; last two describe functions, not patent/certification claims. FLEX is not advertised as stretch.
- Public gallery/detail/model images were inspected together in `asset-review.jpg`: no Chinese visible. HTML/attributes are separately tested for Chinese. Original Chinese documents remain internal and are not linked to customers.
- 0.7 kg omitted because reference size is unknown. No customer-facing internal design year or unnecessary year in titles/slugs.

## Historical care-source conflict — superseded by owner policy below

`1OW9L7pTPEXl8GIMsrSk61ORfh04qCw_c` (`尾巴.jpg`) still gives cold gentle washing in prose but 30°C elsewhere, and medium-temperature ironing while also specifying max 110°C and a different iron symbol. It is a generic retail footer rather than a current sewn-in garment label. The hangtag establishes main fabric, not the disputed care instructions.

The EN/NL/FR pages therefore say to follow the sewn-in care label. To add specific temperatures, drying and ironing advice, provide **a readable current sewn-in ALPIN FLEECE care label or manufacturer-approved unambiguous care specification**. This is the only unresolved source fact for the requested page copy; it does not block independent page preparation.

## Scope boundaries

This delivers localized ALPIN product pages and their local bag controls. The existing site-wide checkout/account/emails/legal pages have not been translated by this product-only task. The checkout link uses the existing checkout; no external payment/email/shipment was triggered. No Brevo change, new translation service, database schema migration, production deployment or other product rollout.

## Validation

See `/workspace/alpin-fleece-preview/validation.json` and local test logs. Re-run `npm run test:alpin` after a fresh build; full product tests use disposable local SQLite and a random local admin password, not real orders or hosted inventory. Screenshots are captured at 1440 and 390 px in EN/NL/FR. Existing commerce integrity, B10, Nano and vest checks verify shared-component compatibility where run. Final recorded results are appended after completion.

### Completed local checks

- PASS: production build and TypeScript.
- PASS: 25 commerce integrity checks, eight launch-safety checks, five new ALPIN mapping/SEO/isolation tests and a dedicated historical-XS/immutable-order/sitemap integration test.
- PASS: EN/NL/FR at 1440 and 390 px, image decoding, no Chinese in HTML/attributes, no XS or old display name, no horizontal overflow, gallery keyboard controls, same-product language switch retaining colour/size, actual demo-bag persistence, 308 redirects and authenticated draft visibility/purchase blocking.
- PASS: shared-component regressions for B10 (33 identifiers, 4,000 draft stock units), Nano (including real demo-bag persistence and mobile overflow), and Alpin vest (separate source specs and bag flow).
- PASS: manual contact-sheet review of all 16 gallery images plus four detail crops and model crop; approved logo assets inspected separately. Screenshots viewed on desktop and mobile.
- NOT VERIFIED: external Google Rich Results Test / Search Console; no public indexability claimed for staging.

A hydration regression found during shared-component tests was corrected by keeping the normalized catalogue reference stable; the affected Nano and vest tests were rerun and passed. Existing unrelated working-tree files were preserved.

## Owner care policy update

The owner subsequently supplied explicit universal care wording for all BIG K product pages and approved corrected symbols: one-dot iron for maximum 110°C, and crossed square-with-circle for no tumble drying. This supersedes the previous label-only page copy and pending care decision. `components/care-instructions.tsx` now provides one shared section with EN/NL/FR/DE descriptions, identical language-independent black/white SVG pictograms, five columns on desktop and a responsive two-column mobile grid. Existing fleece/vest/Nano/editable care blocks were replaced to avoid conflicting rendered advice. Product names, prices, variants, stock and editable source records are unchanged by the care component.

Care translations and final build/TypeScript passed. New browser assertions cover five icons, one iron dot, a dryer square, locale selection and desktop/mobile arrangement; their final CI execution is recorded separately from the earlier ALPIN browser proof.
