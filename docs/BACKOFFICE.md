# BigK backoffice

## What works

The actual Next.js app at `/admin` uses protected server endpoints and persists changes to the configured database. It supports product creation as drafts; names, descriptions, categories, prices and inventory; photos uploaded, selected, reordered and removed; English materials/care/fit/details; order review and fulfillment; completed-refund records; Club members and delivery/return review; event drafts/publication/capacity/times; media and audit history. The layout works on desktop and mobile, with mobile sign-out and keyboard-accessible dialogs.

The separate private review website demonstrates the same UI with a browser-memory transport. Its sample order is fictional, and edits do not change the store database. “View storefront” opens the updated product preview. The existing hosted storefront and remote Supabase database were not modified. This review is not an authenticated production commerce backend.

## Open a real local backoffice

Use Node 24 and the supplied source directory:

```
npm ci
npm run backoffice:staging
```

Choose your own password when prompted. Open `http://localhost:3000/admin`. No password is committed or printed; the hash exists only in the running process. This local launcher forces SQLite, demo checkout and disabled payment/email credentials. It binds only to the local machine. On first launch it imports the owner-confirmed master into a new local database; subsequent launches preserve saved edits. Stock/prices are not reimported automatically on each launch. A changed receipt secret on each launcher run invalidates prior local demo receipts; production needs a stable secret.

Product edits persist in `data/bigk.sqlite`; uploaded web copies and private originals persist in `data/uploads`. Back up both before real hosting. Removing a product image unlinks it without deleting the source master. New products begin as inactive, unapproved drafts with zero stock. To stop selling an existing product, uncheck “Available for sale”; existing orders and URLs remain.

## Supplied data now applied locally

- 27 product records use the names from the master, with stable IDs and URLs.
- All 129 owner-confirmed size SKUs were mapped exactly once to their existing variant IDs, totaling 5,824 units. The two pairs of repeated base codes split sizes across records, rather than doubling the same size stock. The two Summit sizes absent from the master remain at zero. Neofit has no XS.
- VAT-inclusive master prices are applied to the local database and source catalogue. All products remain inactive/unapproved after the staging master import; nothing was enabled for real sales.
- Material composition, care and available descriptions have been translated to English from the provided workbook and populated in the local product-content table. Source Dutch rows and translations are retained in `docs/catalog-review/translated-product-specifications.json`.
- Neofit composition is genuinely absent from that workbook; its known care text is populated. No composition, fit measurement or waterproof rating was guessed.
- Six selected Core.2 images were inspected from 11 representative views in its 46-file folder. They are provisionally matched to P004/25301802, the existing blue/teal quarter-zip. The label/SKU is not readable; confirm the colour-code mapping before sales approval.
- Four inspected images from Corelosse.2/Brown were added to P016, the existing cream/brown round-neck record, using folder/construction/colour evidence. Exact colour-code approval remains pending.
- There are now 60 distinct web image derivatives across 19 product records. Original masters are retained outside the deployable source; originals in Drive are unchanged. JPEG WebP conversion is high quality, not mathematically lossless. No fabricated photo was assigned to a missing colourway.

Review/load master values in each product editor, then save. The import script `npm run catalog:import-master-staging` is restricted to local SQLite/demo use. It rejects unmatched/duplicated SKU mappings, counts other than 129/5,824 and quantities below reserved stock. It deliberately resets active/approved flags; it is not an ordinary ongoing stock-sync job.

## Safety and limitations

All protected API reads require the existing admin session. Writes check origin and authentication; product revisions prevent stale overwrites, and inventory cannot fall below reserved quantities. Uploaded content is decoded, size/pixel-bounded, restricted to still JPEG/PNG/WebP, converted to WebP and served with a fixed content type. Files cannot select arbitrary filesystem paths. Uploaded masters are not publicly served. The source is retained for later reprocessing.

Refund management records refunds **already completed in the payment provider**. It requires an explicit confirmation and provider reference, validates cumulative net line/shipping limits and reference reuse, and adjusts related Club points atomically. It does not send money, restock items or rewrite original order totals. Revenue is labelled gross paid value before recorded refunds. Review the external provider and return evidence before recording or clearing a hold.

Paid event checkout, carrier label purchase, multi-staff roles, automatic provider refund reconciliation and unattended carrier/return evidence are not connected. Membership does not guarantee an event seat. Review/close Club holds after the waiting period, or document a privileged manual release. See `BIGK_CLUB.md`.

The production app needs Node-compatible hosting and durable media storage. This static Sites review cannot run Node SQLite, local uploads or the PostgreSQL server adapter. Before a real deployment, configure the server runtime, stable session/receipt secrets, storage/backup, least-privileged database role, verified account email and payment callbacks. Never paste database passwords or secret keys into chat.

## Database changes

`supabase/migrations/20261029233425_bigk_backoffice.sql` adds private RLS-enabled `product_content` and `admin_returns`, with browser roles denied. It seeds supplied English content without overwriting subsequent admin edits. This migration has been tested twice on an isolated PostgreSQL-compatible PGlite database through postgres.js; it was not applied to remote Supabase.

## Verification

Passed: TypeScript; Next.js production build; 22 existing commerce tests; 12 Club tests; nine protected backoffice tests, including upload validation, originals, path rejection, stock guards, stale writes, product creation and idempotent refund records. PostgreSQL/PGlite runs all three suites and verifies all 18 private tables have RLS and no anonymous access. Browser tests exercise the actual backoffice component on desktop/mobile with a clearly fictional review transport; database assertions are covered separately by the protected API tests. No real email or payment was performed.

Screenshots: `/workspace/bigk-backoffice-desktop.png`, `/workspace/bigk-backoffice-mobile.png`. Review entry: `preview/backoffice-review.tsx`. Real app entry: `app/admin/page.tsx`.
