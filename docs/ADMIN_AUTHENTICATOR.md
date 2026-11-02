# Admin password + authenticator

Production uses `ADMIN_MFA_REQUIRED=true`, a fixed `ADMIN_OWNER_EMAIL`, and a sensitive 32-byte hexadecimal `ADMIN_MFA_KEY`. The additive SQL in `supabase/production/admin-authenticator.sql` creates private RLS-enabled MFA storage in production and staging, with access only for the existing server roles. The current sandbox cannot run the Supabase migration generator, so this is an explicit operational SQL script, not an invented migration-history entry.

The existing owner requests a setup email from `/admin`. The private link carries its token in the fragment. Opening the link does not consume it: an explicit POST starts enrolment, and a valid authenticator code plus a new 16-character password must be confirmed before activation. Setup is disabled once enrolled. Customer sign-in tokens cannot enrol an admin.

Secrets are generated server-side, QR codes are generated locally (no third-party QR service), and stored secrets use AES-256-GCM encryption. TOTP is SHA-1, six digits, thirty seconds, with a one-step clock allowance. Accepted counters cannot be reused. Ten 64-bit one-use recovery codes are returned only at setup and stored as purpose-separated hashes. A recovery code still requires the admin password. Passwords retain the existing salted scrypt scheme.

Enrolment invalidates every existing admin session. MFA sessions use a distinct hash domain so legacy sessions cannot bypass MFA. Admin login verifies password then the second factor inside the session transaction. Existing visitor/global rate limits apply. Password-only development recovery is unavailable when MFA is required. Authenticator recovery after losing both phone and codes requires owner verification and operator-assisted reset; email setup cannot silently disable an enrolled second factor.

Preserve `ADMIN_MFA_KEY`: changing it without re-encrypting stored secrets locks access. Never place QR secrets, setup links, passwords or recovery codes in logs, screenshots or source control.

Verification: RFC 6238 vectors, encrypted-secret tampering, code replay, setup link replay, old session rejection, password reset, recovery-code consumption and a browser enrolment/login journey. Real owner enrolment must be completed by the owner on their own device.
