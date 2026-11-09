# Admin pages waiting indefinitely

Observed in production: authenticated /api/admin/categories, /customers, /marketing and /email requests hit the 300-second Vercel runtime limit. The database showed old session-lookup statements waiting on ClientRead, rather than database locks. Actual production-login SELECT grants on feature, staff and audit tables are present. The original screens rendered empty feature lists and a false category-disabled message while those requests were still unresolved.

The documented serverless stale-socket failure mode is a likely cause, rather than a proven diagnosis of every timeout: https://supabase.com/kb/troubleshooting/troubleshooting-connect_timeout-or-hanging-queries-in-vercel-serverless-functions-775f92 . Fresh server-side connections remove cross-request socket reuse from this path without another dependency or service. Existing Supavisor backend pooling remains in use.

Changes:
- Keep the existing postgres driver, SQL qualification, TLS verification, RLS, advisory transaction lock, bound parameters and MFA/session checks.
- In Vercel/Netlify, use a short-lived client per standalone SQL operation or complete transaction, closing it in finally. Transactions retain their one bound client until commit/rollback. Writes and transactions are never automatically replayed.
- Persistent local/server deployments retain the pooled client. Optional DATABASE_CONNECTION_MODE=isolated or pooled overrides the default for validation/rollback. No required configuration changes, migration or password reset.
- PGlite can emulate only one transaction backend: isolated-mode tests serialize emulator clients as the previous local pool max=1 did. The test socket accepts transient overlapping closing/opening sockets. Hosted PostgreSQL remains concurrent.
- Operations and Categories show loading/error/retry states, bounded 15-second reads and response validation. They no longer present missing data as disabled features. Other backoffice reads have a 20-second client deadline; mutations retain their original behavior.
- Category management can be enabled directly from its page through the existing authenticated, audited owner API.

Validation: full pooled and isolated PostgreSQL/PGlite commerce, stock races, idempotent settlement, session/privacy and rollback tests; TypeScript; Chromium delayed Operations response with no empty controls, all seven controls after loading, direct category enable and existing staff/category workflows. Full CI and connected preview must pass before release.

Cost: no new dependency, service, API call or storage. TLS/client setup per operation adds connection work and may increase short-request latency compared with a healthy warm pool. It avoids retaining frozen sockets across requests and their five-minute waits. Supavisor still reuses backend connections. This is a conservative reliability tradeoff for the current shop; any later new pooling package requires the owner's approval.

Rollback: DATABASE_CONNECTION_MODE=pooled and redeploy restores previous connection reuse; or revert this application change. Saved products, categories, orders, stock, passwords and MFA records are untouched. This flag does not turn off authentication or row-level security.
