# BIG K ® DPD shipping preflight — draft implementation

Implemented 30 October 2026 on branch `fix/catalogue-colour-options`.

## Files
- `lib/dpd-preflight.ts`: pure, fail-closed shipment draft validation. Does not contact DPD, buy labels, place orders, or modify inventory.
- `app/api/admin/shipping/preflight/route.ts`: authenticated, same-origin, rate-limited admin-only POST returning missing fields and an explicit `canGenerateLiveLabel:false`.
- `tests/dpd-preflight.test.ts`: six executable tests on EU shipments, UK/Norway missing documentation, multiple SKU-specific HS codes, invalid classifications and missing package weights.
- `package.json`: `npm run test:dpd`.

## Deliberate safety boundary
Every response includes `canGenerateLiveLabel:false`, even when data passes local checks. `completeForManualReview` only means the draft contains the required fields—not that customs, delivery eligibility, VAT, quoted rates, API credentials, account status, or codes have been verified.

The preflight **does not** silently reuse a generic HS code for multiple SKUs. It requires a tariff code per item on non-EU shipments, as well as origin, weight, invoice, currency, exporter EORI, incoterm, package gross weight and contact details.

## Next implementation gates
1. Finalize product-level validated customs data in dedicated schema, migration, and backoffice editor (current Product type does not yet persist these fields).
2. Authenticate with DPD Shipper/Connect via a **rotated**, privately stored secret; verify current service account status before integration tests.
3. Add a separate test-only DPD adapter for label requests, invoice/doc upload and returned errors. No billable production labels in tests.
4. Confirm country/service availability, quoted rates and surcharges, and destination-specific rules with DPD.
5. Implement idempotent production label creation, persisting tracking references and shipment audit logs only after successful sandbox tests.
6. Keep UK, NO, CH and other non-EU checkout destinations disabled until demonstrated functional end-to-end shipping.
7. Run `npm run test:dpd` plus Vercel build and protected admin-flow test; a READY preview build alone does not prove the new endpoint functions.

Evidence: `docs/DPD_X_INTERACTIVE_UNRESOLVED_TICKET_AUDIT.md` and `docs/DPD_SHIPPING_RESEARCH_2026-10-30.md`.
