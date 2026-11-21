# BIG K Sales CRM operations

The CRM is integrated into the existing seller workspace at `/staff/sales`. Sign in as the owner and open the **Sales CRM** tab. Salespeople see the same tab with a restricted view of their own assigned records.

## Owner workflow

1. Open **Verkopers** in the existing seller workspace and invite a salesperson by name and email.
2. The server creates a single-use activation link that expires after 30 minutes and sends it through the configured Resend transactional-email account.
3. If the provider is unavailable or delivery is blocked by the staging allowlist, the owner receives the activation link in the workspace and can copy it securely.
4. In **Sales CRM**, assign existing B2B accounts to an active salesperson. Accounts are deliberately unassigned after migration until the owner chooses a responsible person.
5. Assign prospects, review the six pipeline stages, inspect follow-up history, and convert a prospect by linking it to a B2B account.
6. Use the team overview to review assigned accounts, open prospects, paid orders and recorded revenue by salesperson.

## Salesperson workflow

- A salesperson can view and edit only their own assigned B2B accounts and prospects.
- They can update prospect stages, notes, contact details, schedule follow-ups and complete their own follow-ups.
- They cannot assign accounts, reassign prospects, convert prospects to another account, manage seller access or view another salesperson's pipeline.
- Reassigning an account or prospect transfers its follow-up history to the new owner; the owner always retains the complete history.

## Follow-ups and reminders

The existing protected `/api/jobs/email` cron runs every five minutes. At 08:00 Europe/Brussels, the job sends each active salesperson one idempotent digest of their open follow-ups due today or overdue. It uses the existing email-delivery policy; preview/staging sends remain restricted to the configured test recipient.

Transactional delivery requires the production environment to have `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DELIVERY_ENABLED=true` and an HTTPS `APP_URL`. If the provider key is empty, the cron reports delivery as blocked, leaves existing outbox jobs queued for a later retry, and skips sales reminders; it does not mark those messages as sent. Add the secret in Vercel Project Settings → Environment Variables (Production), then the next scheduled run can deliver them. Do not put provider credentials in source control or chat.

## Account and VAT checks

- The CRM displays B2B approval status, primary contact details, order history and follow-up history.
- Editing ordinary contact/address details does not log the B2B customer out.
- Changing the B2B login email increments the account version and revokes existing sessions and unused login links.
- Belgian VAT numbers are checked server-side for format and checksum. This local check is **not** a live VIES or KBO registration check.

## Access and database

CRM writes are server-validated and audited in `seller_events`. Seller list queries are scoped in SQL by the assigned seller, not just hidden in the interface. Production and staging CRM tables use server-only RLS policies. Internal agent/operations tables are explicitly default-deny for non-owner roles.
