# BigK Supabase Free setup

Status: PostgreSQL code and SQL migration prepared. No tables have been installed in the remote project, no production data has been transferred, no hosting has been configured, and checkout stays in demo mode. The supplied public key was accepted by the Auth settings endpoint; that does not prove schema or database access.

## 1. Install the schema in your Supabase dashboard

Open your BigK Supabase project → SQL Editor → New query. Copy the entire contents of `supabase/migrations/202610290001_bigk_private_commerce.sql`, paste it into the editor, and run it as the default postgres role. The script creates a private `bigk` schema, 11 tables, indexes, and 27 catalogue records and their variants. All imported stock is zero and all products are inactive/unapproved. It can be rerun without replacing existing catalogue values, stock or orders.

This initializes a fresh catalogue. It does not copy local demo orders, sessions, customers, or inventory edits into Supabase. If real operational records are ever added locally, export/reconcile them before switching databases.

Verify with:

```sql
SELECT count(*) AS products FROM bigk.products;
SELECT sum(stock) AS confirmed_stock FROM bigk.variants;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='bigk';
```

Expected initially: 27 products, 0 confirmed stock, all 11 tables with rowsecurity true. The schema is deliberately private and has no public policies. Do not add `bigk` to Data API exposed schemas or grant browser roles access. The catalogue and receipts are served through the application's validated API routes.

## 2. Configure the server connection privately

In Supabase click Connect → Transaction pooler. Copy the PostgreSQL connection URI into the hosting platform's **secret environment variable** named `DATABASE_URL`. Replace the password placeholder in the platform, using URL encoding for password special characters. Do not paste this URI or the database password into chat, a README, or GitHub. Prepared statements are disabled in the driver to support transaction pooling. TLS certificate verification stays enabled; if your project needs its downloaded CA certificate, put the PEM in `DATABASE_CA_CERT`.

Required server settings:

```dotenv
DATABASE_PROVIDER=postgres
DATABASE_URL=<set privately in hosting settings>
COMMERCE_MODE=demo
LIVE_COMMERCE_APPROVED=false
APP_URL=<the actual preview origin>
RECEIPT_SECRET=<unique random value of at least 32 characters>
```

Optional public settings: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Neither gives permission to administer the database. Never prefix DATABASE_URL or provider secret keys with NEXT_PUBLIC_. The current server database integration uses the connection URI, not the publishable key.

The server must be restarted/redeployed when changing the database provider. A missing PostgreSQL connection URI fails closed; the application does not silently fall back to SQLite when postgres is selected.

## 3. Validate before live sales

Test the catalogue, demo checkout, private receipts, admin edits, and account isolation on staging. The application retains its custom HttpOnly account/admin sessions and Resend email flow. Supabase Auth, Supabase Storage, and browser access to tables are not implemented in this change. Keep original photographs in Drive; the source includes original files and Next.js optimizes delivery.

Local checks:

```sh
npm ci
npm run typecheck
npm test
npm run test:postgres
npm run build
npm run test:http
```

The PostgreSQL suite uses embedded PostgreSQL (PGlite) through the same postgres.js wire driver and checks migration reruns, RLS/role denial, rollback, and the commerce suite. It is not a substitute for staging tests against the actual Supabase service or concurrent multi-instance PostgreSQL load tests.

Short write transactions use a database advisory lock shared across instances to preserve inventory and payment idempotency. The pool is limited to three connections per Node instance. This intentionally favors correctness for an early small store; monitor latency before increasing traffic. Run inventory expiry and email delivery jobs with the same secret environment as the server.

## Hosting status

Supabase supplies the database, not this Next.js frontend. GitHub stores the code. The current application is a Node.js 24 Next.js server; uploading it to Cloudflare Pages as static files will not provide checkout/account APIs. A Cloudflare Workers/OpenNext adaptation and deployment verification are still required for that free hosting route. Do not select Vercel Hobby for a commercial store. No paid plan is required or purchased by this source change.

Before live sales: confirm catalogue prices, available stock, missing photos, legal details, Stripe and email configuration; test a real provider sandbox flow, backups and scheduled jobs. Payment collection remains blocked until explicitly configured and approved.
