# BIGKSPORT — SEO launch audit (draft)

Date: 30 October 2026. Branch: `fix/catalogue-colour-options`. No public launch.

## Implemented

- `app/robots.ts`: dynamic robots.txt; block all crawling until all three launch flags match (`INDEXING_ENABLED=true`, `COMMERCE_MODE=live`, `LIVE_COMMERCE_APPROVED=true`). Once enabled, disallow admin, account, checkout, order and API routes; advertise the sitemap.
- `app/sitemap.ts`: dynamic XML sitemap; empty before public launch, thereafter only homepage and approved, active products with images, with deduplicated slugs.
- `app/layout.tsx`: global noindex/no-follow until live approval and indexing enabled.
- `app/products/[slug]/page.tsx`: noindex unapproved or inactive product pages, even once the site opens to search; preserve canonical product URL; provide product Open Graph image/title/description.

## Quality and launch blockers

- **Do not enable search indexing yet:** main production deployment not updated; Vercel production secrets, durable database login, Stripe webhook and confirmed order storage remain unverified.
- Catalogue currently has 27 database records for 25 unique supplier SKUs and verified physical-label gaps; publishing must not infer prices, stock or photos for unverified products.
- Before indexing, confirm full storefront crawls successfully, aliases redirect to canonical products, SEO titles are nonduplicated, robots and sitemap return intended results, and any Product structured data does not imply inventory/offer availability inaccurately.
- Check that origin is always `https://bigk.be` at release time; also configure `www` redirect / canonical host, Google Search Console ownership, submitted sitemap and Merchant Center after launch.
- **Market scope: Europe-wide, not Belgium-only.** Begin with a strong English-language storefront for European visitors, then add validated translations based on actual demand (e.g., Dutch, French, German, Spanish, Italian). Every hreflang entry must refer to a real translated URL with reciprocal links; do not fabricate hreflang for untranslated content.
- Build country/language-specific Search Console analysis and Merchant Center feeds only for markets BIGKSPORT actually serves, with accurate currency, shipping, returns and tax information.
- **Commercial blocker:** the current checkout backend and Stripe shipping form both restrict delivery countries to **BE, NL, FR, DE, LU**, not all Europe. Do not advertise Europe-wide delivery or change the allowed list until logistics, shipping fees, VAT/tax handling, returns, and checkout UX have been checked. Broader European SEO audience does not mean checkout already supports Europe-wide fulfillment.
- Monitor Search Console indexing, performance and Merchant Center disapprovals after release.

## Publication policy

These are draft branch changes only. A successful preview build validates compilation, not live SEO crawl behavior. DNS and live commerce remain untouched.
