# Shop the experience — isolated preview

Branch: `feat/shop-the-experience`. Based on live release `940e1a65a1e51cef73d13096796f1a23865fdd03` from `main`, verified against the `bigk.be` production deployment before branching. No merge or production deployment is part of this work.

## Open the Vercel preview

1. Open Vercel → **bigk-commerce** → **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED=true`, selecting **Preview only**, ideally restricted to branch `feat/shop-the-experience`. **Do not select Production.** Leave it unset or false in Production.
3. Leave `EXPERIENCE_STAGING_DATA` unset. Add no database credentials or payment keys for this preview. The seven-style local fixture catalogue works without them.
4. Open **Deployments**, select the latest deployment for `feat/shop-the-experience`, and **Redeploy**. The public feature flag is compiled into the client, so changing it requires a new build.
5. Use that deployment's **Visit** link, then append `/en/experience`, `/nl/experience` or `/fr/experience`. `/experience` redirects using the existing language cookie/header rules. ES/IT URLs keep working but use the English experience copy.
6. If Vercel asks you to sign in, use your existing Vercel account. Do not remove deployment protection. A 404 before enabling the flag is expected.

The conditional footer link appears only in the flag-enabled build. Production routes are additionally closed when `VERCEL_ENV=production`, even if this experimental flag is copied accidentally. Enabling this feature on production would be a separate reviewed change.

## Isolation and checkout

- Fixture prices and stock are clearly marked as sample data; photos and product names are from BIG K. Fixture variant IDs start with `EXPERIENCE-`; no catalogue rows are seeded or written.
- Fixture bag key: `bigk-experience-fixture-bag-v1`. It never writes or clears the normal `bigk-bag-v2` cart.
- The approved guard in `components/saved-cart-sync.tsx` suppresses all cart backup requests on a fixture experience page, including when a normal cart already exists. Ordinary storefront navigation retains the existing sync behaviour. Crossing the experience boundary cancels the previous sync effect.
- No experience API endpoint is added. In fixture mode, browsing, adding, removing and reviewing the bag make no `/api/*` requests and create no database file in the browser test.
- Fixture “Review preview bag” shows a local summary only. It does not enter checkout, create an order, send email, reserve stock or contact Stripe. This is intentional: sending fictional variant IDs into real checkout would violate isolation.
- Real staging mode is an explicit future opt-in: `EXPERIENCE_STAGING_DATA=true` **plus** `DATABASE_PROVIDER=postgres`, `DATABASE_SCHEMA=bigk_staging`, and a separately provisioned staging-only `DATABASE_URL`. Do not reuse a production database or production credentials. Live Stripe keys are rejected; existing checkout readiness checks still apply. The experience never provisions a database or copies keys itself.
- In staging mode, the existing `bigk-bag-v2`, cart sync and localised checkout are reused. Prices and stock are still recalculated/validated by the existing checkout; client totals are not trusted.
- Free-delivery progress is derived server-side from the existing `shipping()` function. There is no second €100 threshold in experience code. The indicator uses the product subtotal, matching the current shipping calculation before Club discounts.

## Change positions or replace photos

Edit only `lib/experience/placements.json`:

- `slots`: stable product ID, percentage centre `x/y`, percentage `width/height`, and `zIndex`. Percentages are relative to the uncropped 16:9 scene, so mobile panning preserves alignment.
- `bag`: percentage drop-target rectangle over the physical duffel.
- `images`: optional image overrides. Keys can be a variant ID, `productId:Colour`, or a product ID. The more specific key wins. Example: `"P017:Black": "/experience/cutouts/velvet-black.webp"`. Place the approved image at that public path; no component change is needed. A product-level override applies to every colour, so prefer colour-specific keys when swapping cutouts.
- `desktop/tablet/mobile`: scene asset paths and dimensions.

Normal photos remain `object-fit: contain`, with a soft shadow. Product photos are never generated or altered using AI.

### Cutout improvement list

| Product | Current default photo | Recommended improvement |
| --- | --- | --- |
| ALPIN FLEECE | `/products/web/alpin-fleece-pro-25303101-3.webp` | Real garment-only hanging/flat photo, then transparent background; current image contains a model. Do the same for Dusty Blue. |
| ALPIN VEST | `/products/web/alpin-vest-pro-bigk-alpin-vest00009.webp` | Real vest-only hanging photo; current Beige/Black photo includes a person and other clothing. |
| VELVET WMS HOOD | `/products/web/velvet-black-front-flat.webp` | Transparent cutout of the existing garment photo; obtain a matching Cream product-only image. |
| CORE.2 | `/products/web/core2-1u129560.webp` | Real garment-only Dusty Blue photo; background removal alone would retain the model. |
| NANO DOWN JACKET | `/products/web/nano-down-jacket-1u103263.webp` | Real jacket-only photo instead of the current on-model shot. |
| B10 SNEAKERS | `/products/b10/black-profile.webp` | Transparent cutout of this profile photo, plus matching Green profile. |
| RIBS LOW SOCKS | `/products/ribs/low-white.webp` | Product-only transparent image from the original photograph; avoid the surrounding promotional graphic. |

## Responsive images and motion

- Scene: desktop **1600×900**, tablet/smaller desktop **1360×765**, mobile **1120×630**, each AVIF with WebP fallback. Desktop uses a responsive srcset. Mobile uses the complete scene at a lower resolution, rather than cropping away lockers.
- Rebuild from an approved scene: `node scripts/optimise-experience-scene.mjs /path/to/scene.png`.
- Scene products use Next Image with lazy loading and responsive `sizes` calculated from their slot width and the phone canvas height. Picker/bag thumbnails request only their displayed dimensions.
- At phone widths the room pans horizontally and the bag stays fixed above the bottom safe area. At very small widths (320px and below), the simple product grid is available instead. The server-rendered grid also remains available if JS is disabled or hydration fails.
- Dragging uses native pointer events and CSS transforms. Keyboard/tap opens the same picker. Reduced-motion removes transitions and animations.

## SEO

The experimental page is `noindex,follow`; it does not emit competing Product/ProductGroup structured data. Its own locale URLs have canonical/hreflang metadata. Product links continue to point to the established product URLs. Fixture-mode catalogue/product links lead to the normal public shop, keeping fictional cart IDs out of it.

## Verification and measurements

`Experience isolation and performance` runs only on the feature branch/relevant PR paths. It installs Lighthouse **as a test tool outside the application**, not as a production dependency. No package or lockfile changes are needed.

Commands:

```sh
node --import tsx --test tests/experience.test.ts
NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED=true npm run build
node tests/experience-browser.mjs
LIGHTHOUSE_CLI=/path/to/lighthouse/cli/index.js node scripts/experience-audit.mjs
```

The workflow's `experience-review` artifact contains desktop, emulated iPhone/Android and no-JS screenshots, mobile/desktop Lighthouse JSON, and `experience-measurements.json`. Logs print the measured route-specific raw/gzip JavaScript and total initial JS gzip sizes. Route-specific JS excludes chunks used by existing routes. Lighthouse is a single lab run per profile, not a real-user performance guarantee; preview noindex intentionally affects the SEO score.

### Test checklist

- [ ] Desktop: drag to the physical duffel; dropping elsewhere leaves the bag unchanged.
- [ ] iPhone/Android emulation: pan the room, tap a product, fixed bag stays visible, no page-wide horizontal overflow.
- [ ] Picker: correct colour → size → image/price; no add until a size is selected; zero-stock sizes disabled.
- [ ] Cart: quantity limits, duplicate variants, remove, totals and free-delivery progress; reload retains the fixture bag.
- [ ] Isolation: pre-existing normal cart unchanged; zero `/api/*` calls; no database creation or payments.
- [ ] Languages: NL/FR/EN, ES/IT English fallback, language switch retains the fixture bag.
- [ ] Keyboard: focus item, Enter, select size, add, Escape/close and focus return.
- [ ] Reduced motion: no transitions/animations.
- [ ] JS off/failed: seven server-rendered product cards with normal product links.
- [ ] Fixture checkout: local review only. Later staging checkout: supported countries, shipping, VAT, stock validation and test payments need a separately configured staging environment.
- [ ] Feature off: no footer link; experience returns 404. Existing shop/checkout regression suite passes.

Physical-device testing is still recommended before any later public launch. Staging checkout/payment testing is deliberately unavailable in the credential-free fixture preview.
