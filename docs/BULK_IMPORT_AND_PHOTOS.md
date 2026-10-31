# Bulk product data and photos

Development only: `fix/catalogue-colour-options`. Existing login and durable sessions are retained. No production release is authorized.

## Spreadsheet workflow

Backoffice → Products → Import CSV / Excel:

1. Choose a CSV or XLSX workbook (up to 3 MB).
2. Choose the worksheet and header row if needed, then match source columns to product fields. Common English and Dutch headings are suggested. Check the EUR-versus-cents price field.
3. Choose whether to add new private drafts or additional sizes/colours. Blank cells leave existing values unchanged by default. Publication changes for existing products are ignored unless explicitly enabled.
4. Review the complete proposal and affected sizes/EANs. Save all changes only when correct.

New products need an eight-digit product code (or supplier article number), product name and size. They always remain unapproved, inactive drafts even if the file contains publication flags. New product/variant IDs are allocated once and retained through preview/save. Existing variants match by explicit platform IDs, EAN, SKU, or an unambiguous product-code/size/colour combination. Names are never used as record identifiers. Conflicting identifiers are rejected. Changing a barcode clears its old verification marker unless the file explicitly confirms verification.

Supplier SKU values like `25302901-S` can supply the eight-digit product code and size. Common Dutch headings include `SKU incl maat`, `Productnaam website`, `Samenstelling`, `Wasvoorschrift`, `Bevestigde ontvangen voorraad` and `Verkoopprijs incl. btw (€)`. EUR amounts accept decimal dots or commas, e.g. `146.90`, `146,90`, `€ 146,90`. Common country names such as China map to their country code; this maps supplied data and does not establish manufacturing origin.

Download import template provides an empty Excel workbook. Export CSV / Export Excel remain available for existing data. Templates/export identifiers remain text cells in XLSX. Arbitrary formulas and links are rejected; use plain values. Other file formats (PDF, Word, old XLS), AI extraction and remote image URL downloading are not implemented.

Limits: at most 100 products, 2,000 variant rows, 128 source columns, 100 variants per product. Header rows 1–20 are supported. Duplicate EANs/SKUs, conflicting shared fields, duplicate colour/size combinations, stale versions, invalid codes, reserved-stock violations and invalid image paths block the entire batch. Preview executes inside a rolled-back transaction. The final save is atomic and records the existing change history.

## Photo workflow

Products or Media library → Bulk upload photos:

1. Select up to 100 JPEG/PNG/WebP files, within the host's per-photo limit (normally 3 MB on Vercel).
2. Each file uploads separately. Progress and errors are shown; failed files can be retried without re-uploading successful ones. Originals remain in the durable media library, and duplicate uploads are content-addressed.
3. Confirm the product for every uploaded image. An exact product code, EAN or SKU in the filename may suggest an assignment. Product names and partial numeric identifiers are not used. Ambiguous matches require manual selection. Photos left unassigned remain in the library.
4. Choose append (default) or replace, inspect the resulting galleries and cover image, then Save photo assignments.

Uploading alone does not change product galleries. Gallery assignment uses the existing version checks, validation, atomic batch saves and change history. Publication, prices, EANs and stock remain unchanged. Galleries retain the existing 30-image limit. Bulk ZIP-photo archives and original files above the host limit are not accepted by this workflow.

## Validation

SQLite and PostgreSQL tests cover Dutch mappings, EUR conversion, blank handling, new private drafts, size creation, repeat-import matching, conflicting identifiers, invalid EANs, preview rollback, explicit saving and exact photo matching. The built Next.js browser suite exercises column mapping, new draft/two-size creation, queued multi-photo upload and reviewed gallery assignment in addition to existing desktop/mobile product management and Excel round trips. All acceptance fixtures are temporary and fictional; no hosted stock or products are changed by these tests.

Prepared imports and gallery updates carry the inventory counts that were reviewed. If physical or reserved stock changes before save, the operation is rejected and must be reviewed again, even when the product's metadata version has not changed. This prevents an unrelated content import from overwriting later order movements.

Verified on the built application: desktop supplier-column mapping created one private draft with two sizes; a two-photo upload simulated a temporary failure on the second image, retried only that failure, then saved a reviewed gallery. Existing Nano editing, EAN linkage, bulk edits and Excel round trips also passed at 1440px and 390px. No hosted catalogue or production inventory was edited by these fixtures.
