# Admin authentication and MyParcel BE staging repair

Scope: `fix/catalogue-colour-options` only. Stable admin origin:
https://bigk-commerce-git-fix-catalogue-colour-options-hello-35126091.vercel.app/admin

## Root cause and authentication

The previous branch used `DATABASE_PROVIDER=sqlite` and a `/tmp` database on Vercel.
Admin sessions and rate limits were therefore local to a disposable function instance.
A stable hostname alone did not fix missing server-side sessions. Cookies are also
host-only: cookies from an immutable deployment URL are not shared with its branch alias.

The branch now uses the existing isolated `bigk_staging` PostgreSQL schema, through
an independent `bigk_preview_web` LOGIN with membership in `bigk_staging_server`.
Production schema access is denied. The database URL is a branch-only Vercel secret.
Do not rotate this credential or the admin password on routine deployment.
Serverless SQLite and preview connections targeting production schema fail closed.

Admin page requests redirect to the configured stable origin. CSRF origins come
only from configured environment values, never a request-supplied Host.
Existing scrypt credentials are retained; the stored encoding is trimmed, validated
and compared in constant time. A malformed hash reports a configuration failure,
not an incorrect-password error. Passwords themselves are never trimmed.
Sessions remain random, hashed server-side, expire after 8 hours, and are revoked on logout.
Cookies remain host-only, HttpOnly, Secure and SameSite=Strict.

## Documented DPD contract

- `POST https://api.sendmyparcel.be/shipments`
- Authorization: bearer + base64 of server-side API key; `User-Agent: CustomApiCall/2`
- Content-Type: `application/vnd.shipment+json;charset=utf-8`
- Accept: `application/json;charset=utf-8`
- Payload:

```json
{"data":{"shipments":[{"carrier":4,"recipient":{"cc":"BE","postal_code":"2990","city":"Wuustwezel","street":"Theo Verellenlaan","number":"27","person":"BIGK BV"},"options":{"package_type":1},"reference_identifier":"BIGK-TEST-NIET-VERZENDEN"}]}}
```

This is the minimal Belgian domestic DPD parcel example. Extra `delivery_type`
is omitted. No pickup object, guessed weight, sender override, customer email,
notification flag or collection request is sent. The sender/shop remains the
configuration attached to the API key. That account configuration still requires
provider verification; do not fabricate sender permissions or a validation result.

Label retrieval: `GET /shipment_labels/{id}` with JSON Accept. Availability requires
the documented `data.pdfs.url` shape on the Belgian API's `/pdfs/` origin. A bare 200
is insufficient. The label URL/content is never returned to the browser or printed.

## Duplicate prevention and diagnostics

Apply `supabase/staging/admin-shipping.sql` to staging only. The persistent unique
reference claims a single attempt, including across deployments/concurrent requests.
Before POST, query existing shipments using `reference_identifier` and verify the
carrier and fixed destination. Reuse an existing valid shipment; do not create another.
Timeout, malformed success, 5xx, rejection or failed pre-check leaves a durable block.
There is no automatic reset or POST retry. Investigate MyParcel before resetting anything.

Provider codes/field paths are traversed through nested responses. Human text is
translated using a closed validation vocabulary; arbitrary external prose, PII,
credentials and label URLs are never exposed. The GET status endpoint is admin-only
and never creates a shipment. Both paths require isolated staging; POST also requires
same-origin validation and explicit confirmation.

The exact historical 422 cause is not proven from source alone. Previous handling
missed nested validation fields and treated HTTP success as label availability.
Do not claim the previous 422 is resolved until a genuine authenticated provider
response confirms it.

## Verification

`npm run test:auth-shipping` uses a disposable PostgreSQL-compatible database and
mocked provider responses: correct/incorrect password, fresh connection/deployment
hostname, session navigation, logout, CSRF, staging guard, nested 422, previous
shipment reuse, concurrency and ambiguous timeouts. No external shipment is created.
`npm run test:auth-browser` drives the actual built Next.js application at 390px and
1440px, including login rejection/success and navigation between both admin pages.
It uses an isolated local fixture; it does not assert the owner's deployed password.

The Vercel admin password hash and MyParcel key are non-readable Secrets. Never
replace the owner's password or add an alternate test-login bypass. Hosted positive
login and the single authorized external shipment require a genuine admin session.
