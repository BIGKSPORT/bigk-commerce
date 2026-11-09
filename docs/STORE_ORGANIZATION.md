# Store organization and category assignment

Branch: feat/store-organization. This extends the existing category editor, product families, storefront draft/publish document and public catalogue. Existing banners, looks, selected shelves, URLs, translations, checkout, stock and scripts remain in place.

## Owner workflow

1. Open Admin → Categories. Enable category management if needed. Add a category or edit its labels in the existing six language fields. Empty categories remain available to the editor and are hidden publicly.
2. Under Organize products by category, find a style and choose an active destination. Review category change shows the whole style and number of variants before anything is written. Move style applies to all its colour records, clearing only category overrides. Other overrides and all commercial data remain unchanged. Moves take effect immediately; this panel is not a private layout draft.
3. Open Admin → Storefront → Category and product display order. Clothing leads by default; accessories follow. Move categories up/down and choose the style order within each category. Changing an order or display option automatically switches the custom order on. Use Apply display settings to live shop to apply only these settings immediately, without publishing banner/announcement/outfit drafts. Unsaved local campaign edits stay in the editor; saved campaign drafts stay private. All colour cards for a style follow that style's position. Newly published styles follow the chosen ones.
4. Show visual category links adds up to six non-empty categories using existing product photos; no new photos or claims are invented. Categories without a photo stay available through the existing catalogue navigation. Hide the fixed B10 feature is optional and affects only that homepage feature.
5. Use the existing Create an organized draft from my categories button to generate initial selected shelves, or keep/edit existing shelves. Banner and Shop the look tools are unchanged. Use curated layout if the full catalogue should sit behind Browse all products.
6. The full campaign still uses Save draft, inspect it, then Publish saved draft. For category/style order and category links, the separate Apply display settings to live shop button is sufficient. Unsaved layout changes do not affect the shop. Verify category order, style order and NL/FR labels on the public homepage. Category links preserve the chosen category in the URL.
7. Test a product's colour and size selection, saved items, bag and checkout. Check an old product URL. Category moves do not redirect or rename product pages.

## Safety and rollback

No migration, dependency, tracking service, CSP change or new environment variable. Organization settings are an optional additive property of the existing storefront JSON. Older documents parse unchanged. Existing database privileges/RLS remain applicable; no table is exposed to the browser.

Category moves require the existing owner MFA session, same-origin POST, enabled category_management, strict input validation, an active category and exact versions for every member. A short existing database transaction/advisory lock prevents partial family moves. Dry-run writes nothing. Each changed record gets a revision and the operation is audited. The endpoint accepts no client price, content, inventory or publication values.

Turn Use my category and product order off, save and publish to restore the original order while keeping the other campaign blocks. Switch off custom homepage restores the original homepage. For a category move, move the style back through the same review flow. Previously overridden categories must be restored individually if desired; their previous values are in revisions/audit. No product is deleted.

An approved human product translation is retained during category movement. This release does not activate German, Italian or Spanish public routes. Translated labels use the existing English fallback.

## Tests and cost

SQLite and PGlite tests cover authorization, dry-run isolation, exact family versions, atomic moves, audit/history, field preservation, stable ordering, compatibility and layout rollback. Chromium tests cover the actual category move and layout publication, public links, manual order, empty-category hiding, mobile width and the off switch. Existing commerce/auth/shipping tests continue to run in CI.

No new public database query or polling. Ordering and grouping reuse the catalogue already loaded by the page. At most six extra category images use the existing image pipeline and responsive sizes, adding some image bandwidth. Assignment lists show 50 matching styles at a time and can be narrowed by category/search; full server-side catalogue pagination is future work.

For a rollback to code predating this optional JSON field, first use the current authenticated storefront API to save and publish a document with organization omitted; older strict parsers do not accept new JSON keys. Prefer the existing feature/off controls for immediate operational rollback without removing saved settings.

The isolated browser review fixtures now declare HTML5 doctype and assert CSS1Compat, matching the existing deployed HTML. Without doctype, quirks mode matches CSS classes case-insensitively; minified pairs such as .g/.G and .a/.A collided and produced false layout overflow. Width assertions remain strict and retain diagnostic screenshots. Reference: https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-and-string-comparison

New homepage layout settings remain a private draft until the owner publishes them through the existing MFA-protected admin. Code deployment does not move live products or overwrite the owner's existing campaign choices.

## Clothing-first ordering correction

The previous fallback used the alphabetical category query, so Accessories could lead when no homepage document had been published. Public navigation, catalogue sections, the organizer and the category starter now use a shared clothing-first fallback. Unrecognized/custom categories precede the fallback buckets; Accessories follows Other unless explicitly reordered. Explicit owner ordering still takes precedence. This is a presentation default, not a hero-product selection.

The new organization action uses the same owner MFA, Origin, rate limit and optimistic version checks. It patches only display settings into the saved draft and live document. Live campaigns stay as published; disabled old campaigns are retained with their section switches off, and unreviewed campaign drafts are never published by this action. The existing off switch remains available. No database migration, new service or dependency.

Removed categories that still contain styles stay available in the display-order editor, marked Not in menu. Their products remain ordered in All products; the category stays excluded from public navigation and category tiles. The catalogue's full category union uses the same clothing-first fallback, so an archived Fleece category cannot push its garments below accessories.

## Compact homepage overview
The unfiltered homepage introduces at most four different styles per category, using the existing owner order and public catalogue. One colour introduces each style. Category links, the all-styles link, and direct #catalog links reveal the complete catalogue. Search, size, colour, series, saved items and price/name sorting always use all matching entries.
Turn this off under Storefront → Category and product display order → Keep the homepage compact, then Apply display settings to live shop. This stores optional organization.compactCatalog in the existing versioned, audited JSON document. Missing values and false show the full grid. Compact mode is opt-in (true) while the catalogue is small. Existing category order, campaign drafts and live campaigns are preserved.
No migrations, environment variables, dependencies, provider calls or new services. Fewer initial product images and cards; no increase in database queries. Roll back with the checkbox. Before reverting code to a parser predating compactCatalog, remove that optional property from saved and published documents through a compatible authenticated admin release; do not drop tables or edit production data directly.
