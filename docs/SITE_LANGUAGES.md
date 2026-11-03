# Site languages and editing Dutch copy

Public interface languages are English (`/en`), Dutch (`/nl`) and French (`/fr`). On an unprefixed public URL, the saved `bigk_language` choice wins; otherwise quality-weighted browser language is used, falling back to English. IP country does not select a language. A visitor in Belgium can prefer Dutch, French or English. The language selector persists an explicit choice for up to one year. Invalid locale routes are not published.

Navigation, HTML lang, catalogue filters, cart, checkout, account, Club, static information pages, newsletter screens and receipt interface use this choice. Stripe receives the snapshotted checkout language; success/cancellation, confirmation and shipment messages preserve it. Customer magic links carry language without consuming the login token on GET. Private routes stay noindex and APIs stay under `/api`.

Product records are shared: source names, spelling/case, SKU/EAN, size identifiers, prices and inventory are unchanged. Existing ALPIN localized paths stay canonical. Source product descriptions/technical evidence and stored blog prose are not silently machine-translated. Blog pages identify source-English article content when appropriate. Withdrawal and Club reminder emails still use English; confirmation/shipment emails are localized.

## Change a Dutch phrase

Public copy is currently edited in the repository, not in Backoffice:

- Homepage, navigation, catalogue and cart: `lib/i18n/storefront-copy.ts`
- Shared header/footer/newsletter/Club: `lib/i18n/shared-copy.ts`
- Checkout/receipt: `lib/i18n/checkout-copy.ts`
- Account/profile: `lib/i18n/account-copy.ts`
- Blog/static information pages: `lib/i18n/content-copy.ts`
- Gallery/product help: `lib/i18n/product-ui-copy.ts`
- Order emails: `lib/i18n/order-email-copy.ts`

For each exact English source key, edit **only** its `nl` value to change Dutch wording. Preserve placeholders, IDs and English keys. Example: `Find your layers.` now displays **Vind jouw outfit.** and `YOUR LAYERS.` displays **JOUW STIJL.** Dutch marketing is adapted naturally rather than word-for-word: jackets/fleece/outfit/style replace awkward literal “lagen”. Technical construction language still follows product evidence.

Run `npm run typecheck`, `node --import tsx tests/site-language.test.ts`, a production build and `node tests/site-language-browser.mjs` before release. Browser tests use disposable data and no real payment/email provider.

Current activation remains gated by the existing commerce/indexing approvals. No Google lookup, analytics tracker, paid integration or live payment activation is added by language routing.
