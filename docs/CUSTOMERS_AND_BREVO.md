# Customers, accounts and marketing — development preview

Open `/admin`, then **Customers** or **Marketing**. Your existing admin login is retained.

Customers: search by name, email, company or tag; create/edit contact details, language, company/VAT fields, shipping and billing addresses, internal notes and tags; inspect order history; archive a profile without deleting orders. Marketing permission is separate, with source, evidence and date. Concurrent changes are rejected rather than overwritten.

Customer account: `/account` retains the existing single-use email login. After signing in, customers can save their own contact details, addresses and marketing preference. They cannot edit internal notes/tags or another customer's identity. Saving a profile does not rewrite historical order addresses. Actual login emails still require the existing email-delivery configuration; this work does not activate delivery.

Marketing: create, edit, preview and archive campaign concepts. Audiences include opted-in customers, purchasers, repeat purchasers, Club members and tags. Archived, unknown and unsubscribed contacts are excluded. Audience eligibility is recalculated for export. Planning a date does not schedule delivery.

## Brevo handoff

Brevo account checked read-only: BIG K, hello@bigk.be. The owner requested preparation only: no Brevo contacts, lists, templates, campaigns, configuration or messages were changed. No credentials are requested or stored here.

1. Prepare a campaign in BIG K and export its content and consented audience CSV (`EMAIL`, `FIRSTNAME`, `LASTNAME`, `BIGK_CONSENT_AT`).
2. Review in Brevo. Map consent metadata if needed. Preserve Brevo suppression/unsubscribe blocks; never re-subscribe an existing blocked contact through import.
3. Create and review the final email design and sender in Brevo. Sending remains a separate owner decision.

Automatic contact sync, Brevo-to-store unsubscribe callbacks, branded HTML campaign export, delivery statistics and automation are **not connected**. A store opt-in records a local preference; it does not create a Brevo contact. Before future automatic sending, implement reconciliation in both directions and verify unsubscribe handling. Do not claim marketing delivery is operational from a saved draft or CSV alone.

## Verification

Disposable SQLite and PostgreSQL tests cover access control, customer persistence, duplicate emails and stale edits, self-service isolation, evidence history, opt-out precedence and draft-only campaigns. Browser tests cover admin save/reload, mobile account save/reload, opt-in/export/opt-out, private notes and mobile layouts. Staging infrastructure is isolated to `bigk_staging`; production remains unchanged. No live mail, payment or shipment requests are part of these tests.

The older v0 catalogue list is historical context. This change does not delete P013/P020, merge garments, change EANs or promise free returns. Those actions require checking the current catalogue and approved policies first.
