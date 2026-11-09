# Reviewed product translations

Branch: feat/product-translations. Extends the existing shared product editor, product_content JSON, version checks, MFA sessions, revisions and operations audit. No replacement catalogue or dependencies.

## Scope
All six editor languages (English, Dutch, French, German, Italian, Spanish) are available. English remains the shared source and product/model names remain unchanged. Reviewed Dutch/French copy can appear on the existing public routes. German/Italian/Spanish approval prepares content only: their public routes and full UI translations are a separate release. No automatic translation or external translation service.

Saved drafts stay private. Approval stores an independent snapshot; later drafts do not change live copy. Source fingerprints invalidate changed fields individually, falling back to existing English/canonical product copy. Identity, GTIN, URLs, prices, inventory and checkout handlers stay shared. Public projections exclude private drafts, other languages and approval records. ALPIN canonical source normalization runs before translation matching. Existing grouped colour inheritance is reused.

## Owner checklist
1. Open Admin → Products → Edit shared product.
2. Select Nederlands or Français; compare wording against the English source and sportswear terminology guide. Keep unverified claims blank.
3. Save shared content and reopen the editor.
4. Enable translation publishing if the review panel offers this button (or enable Product translations: edit, review and publish in Operations).
5. Approve saved translation. Check the matching public product URL, title, description, material, care and technology sections on mobile and desktop.
6. Change a saved translation draft; verify the previously approved copy stays public until approved again.
7. Change an English source field; verify its translated field falls back and the review panel marks Source changed. Review and approve again.
8. Withdraw approval; verify source fallback and that the draft remains editable. This works with the master feature switched off.
9. Confirm English product identity, colour/size selection, prices, cart quantities, stock controls and checkout still work. Confirm anonymous admin API access returns 401.
10. DE/IT/ES panels explicitly state that public routes are not active yet; do not advertise those routes as launched.

## Storage, security and rollback
No migration and no new environment variables. Uses existing product_content JSON and server-only publication metadata, existing RLS/grants and transactional audit/revision records. POST requires owner MFA session, matching Origin, strict locale/input validation and current product version. Ordinary CRUD cannot forge publication metadata. No real owner sessions are minted by tests.

Disable the existing catalog_translation_drafts feature in Operations to fall back immediately on the next server request. Stored drafts and approvals remain intact. Withdraw an individual approval to remove just that language. Code rollback to the prior deployment is additive-data safe; do not remove JSON data or downgrade database columns.

## Verification and costs
Unit/API coverage runs against SQLite and PGlite/Postgres protocol, plus Chromium with an isolated fake owner fixture and actual Next build. CI also runs existing commerce, stock, checkout and admin suites. Preview uses bigk_staging, demo commerce, no delivery email and no indexing; no live draft is approved automatically.

No new package, paid service or tracking. Public English requests or catalogues without approval records need no feature lookup. Other translated requests read the existing settings once per React server render and hash a small fixed set of product fields in memory. Existing no-store catalogue behaviour is preserved; approval is explicit, low-volume admin work. No per-field/per-product database queries or added polling.
