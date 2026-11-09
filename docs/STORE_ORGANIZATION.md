# Store organization and category assignment

Branch: feat/store-organization. This extends the existing category editor, product families, storefront draft/publish document and public catalogue. Existing banners, looks, selected shelves, URLs, translations, checkout, stock and scripts remain in place.

## Owner workflow

1. Open Admin → Categories. Enable category management if needed. Add a category or edit its labels in the existing six language fields. Empty categories remain available to the editor and are hidden publicly.
2. Under Organize products by category, find a style and choose an active destination. Review category change shows the whole style and number of variants before anything is written. Move style applies to all its colour records, clearing only category overrides. Other overrides and all commercial data remain unchanged. Moves take effect immediately; this panel is not a private layout draft.
3. Open Admin → Storefront → Category and product display order. Switch on Use my category and product order. Move categories up/down and choose the style order within each category. All colour cards for a style follow that style's position. Newly published styles follow the chosen ones.
4. Show visual category links adds up to six non-empty categories using existing product photos; no new photos or claims are invented. Categories without a photo stay available through the existing catalogue navigation. Hide the fixed B10 feature is optional and affects only that homepage feature.
5. Use the existing Create an organized draft from my categories button to generate initial selected shelves, or keep/edit existing shelves. Banner and Shop the look tools are unchanged. Use curated layout if the full catalogue should sit behind Browse all products.
6. Save draft, inspect it, then Publish saved draft. Unsaved layout changes do not affect the shop. Verify category order, style order and NL/FR labels on the public homepage. Category links preserve the chosen category in the URL.
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

New homepage layout settings remain a private draft until the owner publishes them through the existing MFA-protected admin. Code deployment does not move live products or overwrite the owner's existing campaign choices.
