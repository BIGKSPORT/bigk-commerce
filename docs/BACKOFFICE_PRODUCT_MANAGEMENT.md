# BIG K backoffice — product management

Development branch: `fix/catalogue-colour-options`. No production release is authorized.

## Access

Use the stable development URL `/admin`. Existing administrator authentication, durable sessions, origin validation, secure HttpOnly/SameSite cookies and login rate limits are retained. Customer sessions do not grant administrator access.

If the owner does not know the password, `/admin/access` offers development-only recovery:

1. In Vercel project Settings → Environment Variables, save a password-manager-generated code (at least 24 characters) as `ADMIN_RECOVERY_CODE`, type Secret, scoped only to Preview → `fix/catalogue-colour-options`.
2. Redeploy that branch preview to load the code.
3. Open `/admin/access`, enter that code and choose a new administrator password of at least 16 characters.
4. Recovery records a salted scrypt password hash in private staging storage, consumes that code and invalidates previous administrator sessions. It signs the owner in using the normal secure session cookie.

No password, recovery code or session value needs to be sent through chat. The code can be removed from Vercel after use. Reusing it is rejected even after deployments. Recovery is disabled against the production PostgreSQL schema. This is an owner-controlled access step; deploying the form alone does not establish that the owner has signed in.

## Edit products

Products → Edit product supports the existing images, stock, price, specifications and SEO fields, plus:

- Commercial name (`Product name`) and separate official product name.
- Product and variant supplier article numbers; SKU and checked EAN/GTIN by permanent variant ID.
- Colours, size edits, additional colour/size variants, archiving and source-verification markers. Referenced variants are never deleted.
- Manufacturing country (China / CN default in the editor), English customs description, HS/CN codes, weight and packaging dimensions in centimetres.
- Editable URL slug. Previous URLs remain associated with the same product and redirect after publication. URLs used by other products are rejected.
- A list of all sizes/EANs affected by shared composition and customs edits.

Compositions support percentages and separate shell/filling descriptions as text. No invented supplier identifiers or classifications are automatically filled. Check-digit verification does not establish GS1 ownership; `verified` is an administrator assertion of source review.

Save Changes writes directly to the database with optimistic version checking. Save with Publish product unchecked to retain a private draft; check product approval and Publish product to publish on that environment. Unapproved/inactive products are excluded from the public catalogue and public product routes. This is immediate draft/public status, not a second pending draft alongside a still-live published version.

Preview saved product opens an authenticated, noindex customer-layout preview of saved data. Purchasing is disabled. Unsaved form changes must be saved before previewing.

Removing a product image unlinks it; original media remains in the library. Replace by uploading/selecting a new image, reorder, and save. Serverless uploads now default to durable database storage rather than ephemeral filesystem storage.

## Bulk editing and files

Select products using the table checkboxes, then Bulk Edit. Review the exact affected sizes/EANs and old/new values before Save all changes. Any invalid operation or stale version rolls back the whole batch.

Export CSV or Excel produces one row per variant, with IDs, versions, EAN, SKU, variant attributes, shared product content, price, stock and publication status. Excel keeps identifiers as string cells. CSV protects spreadsheet formula prefixes. Preserve EAN text formatting when manually editing CSV in spreadsheet software.

Import CSV / Excel accepts the exported template up to 3 MB, 2,000 rows and 100 distinct products. The import wizard supports source-column mapping and optional creation of new private drafts and variants. It never matches records by a mutable product name. See [Bulk data and photos](BULK_IMPORT_AND_PHOTOS.md) for identifiers, mappings and limits.

In the import wizard, blank cells leave existing values unchanged by default; this can be changed explicitly. The original fixed-template API keeps its previous clearing semantics. Missing columns leave fields unchanged. Rows repeating the same product must agree on shared fields. Duplicate rows, EAN/SKU collisions, conflicting colour/size combinations and stale versions are rejected. Importing first validates the entire proposal inside a rolled-back transaction; the administrator explicitly applies it afterwards. Review publication status in the proposal because imports may publish or unpublish products when those columns are provided.

## History and restoration

Load change history shows prior snapshots, actor, date and version. The first tracked edit captures the pre-edit baseline; earlier unrecorded changes cannot be reconstructed.

Restore creates a new revision as a draft; it does not silently republish. Existing variant IDs remain; variants added since the chosen revision are retained and archived. By default current physical stock is preserved. An explicit optional checkbox restores historical stock too; reserved quantities remain protected. Existing order lines retain their original names, quantities and prices.

## Validation and tests

New automated tests cover real route authorization/CSRF, Nano identity/specification persistence, GTIN links through renaming, private draft visibility, publication, archive/add variant conflicts, CSV/XLSX round trips, dry-run rollback, atomic batch failure, stale files, history restoration and one-time password recovery.

The browser acceptance script starts the actual built Next.js app with a disposable database and fictional Nano fixtures. It logs in, edits/upload/saves/reloads, opens the private preview, publishes, checks all prior variant/EAN links, performs bulk edits and exports/imports Excel at 1440px and 390px. It does not contact Stripe/MyParcel or send mail. The full script is also included in GitHub Actions on a standard runner. Browser checks use the standard Chromium arguments and localhost, consistent with the existing authentication checks. Results must be reported from the actual successful run, not inferred from compilation.

Owner acceptance remains open until the owner has recovered/signed into the hosted preview and can execute the workflow themselves. The implementation and test fixtures must not be reported as completed owner acceptance.

Validated locally: the actual built Next.js browser workflow passed at both 1440px and 390px, including correct login, Nano name/composition/package edits, image upload, save/reload persistence, private preview, publication, original EAN/variant links, bulk care edits and a genuine Excel export/import round trip. Unauthenticated preview access redirects to sign-in and history API access is denied. All fixtures were disposable; no hosted product data was edited by these tests.
