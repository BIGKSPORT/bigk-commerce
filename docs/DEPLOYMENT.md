# BigK deployment — Netlify + Supabase

The private design previews are browser demonstrations. They do not run the payment/backend system. No hosted production checkout has been validated yet.

## Repository and host

Use the private `BIGKSPORT/bigk-commerce` repository, branch `setup/supabase-commerce`. `main` currently contains only the initial README; do not deploy it. The separate `agents/overnight-website-qa` branch contains the Alpin image review and must not replace unrelated source changes.

Import the application branch into Netlify as a Next.js application. `netlify.toml` uses Node 24, `npm run build`, and `.next`; Netlify detects its current Next.js adapter automatically. Do not configure a static export. Do not point bigk.be at a design preview.

## Durable runtime

Set these in Netlify's private environment settings, available to runtime functions:

| Setting | Staging | Production |
|---|---|---|
| DATABASE_PROVIDER | postgres | postgres |
| DATABASE_SCHEMA | bigk_staging | bigk |
| DATABASE_URL | dedicated staging login, transaction pooler | separate production login, transaction pooler |
| MEDIA_DRIVER | database | database |
| MEDIA_UPLOAD_LIMIT_BYTES | 3145728 | 3145728 |
| MEDIA_DATABASE_LIMIT_BYTES | 134217728 | 134217728 |
| APP_URL | actual HTTPS Netlify origin | https://bigk.be |
| INDEXING_ENABLED | false | true only at launch |
| STRIPE_SECRET_KEY | restricted sandbox key preferred | restricted live key preferred |
| STRIPE_WEBHOOK_SECRET | staging endpoint secret | separate live endpoint secret |
| RECEIPT_SECRET | random value of at least 32 characters | different random value |
| ADMIN_PASSWORD_HASH | generated with npm run admin:password | separate strong owner password |
| RESEND_API_KEY / EMAIL_FROM | verified test sender | verified business sender |
| BIGK_CLUB_ENABLED | false until tested | false until tested |
| BIGK_CLUB_WAIT_DAYS | 30 | 30 |

Begin with `COMMERCE_MODE=demo` and `LIVE_COMMERCE_APPROVED=false`. For Stripe sandbox checkout against the isolated staging database, both switches must be `live` / `true`; the staging schema requires a test key and displays a staging banner. This means the payment flow is enabled, not that real money is charged. Production rejects test keys. Keep all reviewed products inactive until ready to test; seed inventory is not a physical stock confirmation.

Never use the administrative `postgres` login or service-role browser key as the application runtime credential. Run migrations as the owner, then use the scoped server-role template and a dedicated login. The template grants only commerce tables, not unrelated project tables. The current Supabase project also has independently managed agent tables; do not overwrite them or grant this application access.

The staging SQL bundle in `supabase/staging` was locally verified and applied to the connected Supabase project on 30 October 2026 as `bigk_isolated_staging`. Readback verified 20 RLS tables, 5,824 staging units, zero active products/orders, denied browser-role access and no staging-role access to production orders. A dedicated staging LOGIN and private Netlify connection settings still need configuration. It creates a separate schema and seeds the received master. All seed products remain drafts. It is initial setup SQL, not a recurring stock importer. Read `docs/catalog-review/alpin-fleece-pro-stock.csv`: column E of Stock.xlsx differs from received counts; do not overwrite stock or import both sheets without reconciliation.

On serverless hosting, photo originals and optimized WebP copies use private PostgreSQL storage with a 128 MiB upload quota. The 3 MiB upload allowance fits the host's request envelope. Larger masters remain in Drive; prepare a web upload copy. SQLite and filesystem uploads are local-only and are rejected on Netlify. Back up both the database and original Drive photos; Free plans have quotas and are not unlimited.

## Payments and tax

Follow STRIPE_SETUP.md. The live BIGK BV Stripe account has payments/payouts enabled; cards and Bancontact are enabled. A pre-existing webhook points at another Supabase project and listens to PaymentIntent/subscription events. It is not this store's Checkout Session webhook; leave it untouched.

After the real Next.js staging URL exists, register its `/api/webhooks/stripe` as a Snapshot event destination for the four Checkout Session events documented in STRIPE_SETUP.md, with API version 2026-09-30.endive. Do not expose signing secrets in chat or source. Test provider success, decline, authentication, cancellation, duplicate events and expired checkout. Payment fulfillment follows the signed paid webhook, never the browser redirect.

Union OSS was recorded in live Stripe on 30 October 2026. A Belgium-to-France inclusive-price calculation returned standard-rated VAT. That is not a payment test and does not validate domestic Belgian VAT, IOSS, every product's tax category or a customer checkout. Belgian domestic registration and IOSS shipping-origin handling remain pending. Existing Stripe preset category differs from the application's generic goods code; confirm appropriate product categories before launch. No filings, payouts, refunds or customer charges were performed during this configuration.

## Scheduled maintenance

Netlify scheduled functions are supplied for expired reservations (every five minutes), queued emails (one job per minute), and enabled Club processing (hourly at minute 17 UTC). One email per invocation limits provider wait time. Schedules run automatically only for published deploys; branch previews need Netlify's manual Run now test. Confirm each appears as Scheduled and inspect its logs. These are not public HTTP cron endpoints.

For a persistent Node/Docker host, the existing bundled `.next/jobs` commands remain available. Do not schedule both mechanisms for the same host. Database leases and transactions protect concurrent workers, but provider failures still need monitoring.

## Verify before domain cutover

Run `npm run launch:check -- --staging` in an environment with the private staging settings (or `node --env-file=.env.local scripts/check-launch.mjs --staging` locally). This reads configuration and never prints secrets. It does not prove external connectivity or business readiness.

Validate on the hosted application: owner login, persistent product/photo edits across reload/deploy, stock reservation, hosted Stripe sandbox checkout, paid webhook, one inventory decrement, confirmation email, private customer account, delivery tracking and return request. Verify backups/restore and alerting for failed webhooks, failed email jobs and payment-review orders.

Before bigk.be cutover, confirm the monitored contact email, public business telephone, return address, delivery rates/time commitments and final policies. The current information pages still contain development notices. Customer-paid change-of-mind return postage is confirmed; statutory withdrawal and separate Club waiting periods must remain distinct, and event tickets must not inherit product returns automatically.

Switch to production credentials and the production database only after the hosted checks pass. Enable individual products after the SKU, price, colour, size, physical stock and photos are reviewed. Record any real refund in the backoffice only after it is completed in Stripe; the backoffice does not initiate money transfers.
