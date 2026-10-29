# BigK Commerce

A custom full-stack commerce application rebuilt from the supplied BigK preview. It includes an actual server/database implementation, not just simulated screens. It starts in **demo mode** and is **not cleared for live sales**.

## Supabase preparation

Supabase PostgreSQL support is implemented and tested locally. **The remote project has not been migrated and the website is not deployed.** Follow [the setup guide](docs/SUPABASE_SETUP.md). The publishable key cannot install the database; a server-only connection string is required when configuring hosting. Customer sign-in continues to use the existing Resend magic-link flow; Supabase Auth and Storage are not yet integrated.

## Approved design

The approved white-led preview is now implemented in the working application, including the original slogan SVG, diagonal red photo accent, compact categories and matching product/bag/checkout/account styling. Current screenshots are in `docs/previews/`. This remains a local review build; no live deployment has occurred.

## Official branding

The application now follows the supplied BigK Corporate Identity Manual: official SVG wordmarks and symbol, red `#E4002B`, black `#2D2926`, white and “LOOKING GOOD / MOVING FAST.” Read `docs/BRAND_IMPLEMENTATION.md` for sources, clear-space choices and the typography limitation. Updated captures are in `docs/previews/`.

## Product photography from Drive

32 original Drive photos are now mapped to 12 catalogue records, with responsive Next.js image optimisation. The other 15 records still need confident image/SKU matches. Read `docs/PRODUCT_IMAGE_REVIEW.md` for the review, source links, unresolved colours/styles and the existing-database image sync task. Source photographs are unchanged; no Drive sharing or file organization was altered.

## Start locally

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The database is created automatically at `data/bigk.sqlite`, using the 27 original product groups. All imported stock starts at zero; all products start unapproved and inactive. Only the original illustrative Alpin Hood and scarf prices are seeded. No personal data from the previous demo is imported.

To access `/admin`, generate a unique password hash with `npm run admin:password` and put the returned hash in `ADMIN_PASSWORD_HASH` in `.env.local`. Restart the app after changing configuration. There is no default admin password. Do not share or commit `.env.local`.

For a local production build:

```sh
npm run build
npm start
```

## What works

- Responsive storefront, original imagery, category navigation, search, size/photo filters, sorting, saved products, comparison and a category-based style finder.
- Keyboard-accessible native dialogs, clear focus states, product detail routes, metadata and a web app manifest.
- Shopping bag persistence; server-side validation; integer-cent prices; immutable order-line snapshots; exact shipping thresholds.
- SQLite WAL for local review or Supabase PostgreSQL for server hosting, with atomic inventory reservations, reservation expiry and duplicate checkout protection.
- Stripe hosted checkout adapter, signed webhook verification, duplicate event handling, amount/currency checks and exception review for late or mismatched payments.
- Private bearer receipt links; passwordless customer email login; account order history scoped to the verified email.
- Authenticated admin, HttpOnly sessions, same-origin mutation checks, login throttling, verified stock editing, optimistic catalogue updates, order fulfillment and audit history.
- Durable email outbox for paid orders and shipments, provider idempotency keys, leases, backoff and retries.
- Security headers, bounded request bodies, no client-supplied price authority, server-only provider credentials and no bundled analytics/tracking.

**Provider integrations need your accounts.** Stripe and Resend code is implemented but no real provider account was connected or tested. Sign-in clearly reports that it is unavailable when email configuration is missing. Demo orders do not reserve inventory, charge, ship or enqueue purchase emails.

## Stack

Versions resolved from npm on 29 October 2026 and pinned in the lockfile: Next.js 16.4.3, React 19.3.1, TypeScript 7.0.2, Stripe SDK 23.0.1, Zod 4.6.7, Lucide icons, Node.js 24 and its built-in SQLite driver, plus postgres.js for Supabase PostgreSQL. Embedded PostgreSQL and its socket server are development-only test dependencies. CSS is local; no remote font or image service is required.

## Validation

```sh
npm run typecheck
npm test
npm run test:postgres
npm run build
npm run test:http
# Optional component interaction checks:
npx playwright install chromium
npm run test:browser
# Or use a locally installed Chromium:
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

See `docs/VERIFICATION.md` for evidence and limits. The browser fixture tests isolated components; it is not a Next.js end-to-end purchase test. Production dependency audit reported no known advisories at the time checked; that is not a security certification.

## Operational tasks

The web server loads `.env.local`. Standalone Node task scripts should receive configuration from your scheduler/secret manager, or use Node's `--env-file=.env.local` locally:

```sh
node --env-file=.env.local --import tsx scripts/expire-reservations.ts
node --env-file=.env.local --import tsx scripts/deliver-emails.ts
```

Run reservation cleanup and email delivery every minute in a persistent deployment. The outbox stops retrying a job after ten attempts; monitor and investigate these jobs. `npm run inventory:expire` and `npm run email:deliver` are equivalent when the environment has already been supplied.

Read `docs/DEPLOYMENT.md` and `docs/ARCHITECTURE.md` before operating this application. Nothing has been deployed to bigk.world or bigk.be.
