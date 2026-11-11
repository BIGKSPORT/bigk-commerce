# MyParcel order labels

Paid orders now have an optional DPD label panel in the existing order dialog.
The warehouse reviews street/house number, enters measured parcel weight in grams,
creates a label, prints the PDF and refreshes tracking. Tracking fills the existing
dispatch form. Mark fulfilled remains a separate packing/dispatch confirmation.
No pickup, stock adjustment or customer email happens when a label is created.

## Configuration and account verification

- Existing server-only key: `MYPARCEL_BE_API_KEY`.
- Label creation is off unless `MYPARCEL_ORDER_LABELS_ENABLED=true`.
- Preview deployments always refuse real carrier shipment creation.
- Admin Orders → **Check MyParcel connection** is read-only. Only HTTP 200 with
  a documented shipment-list response counts as authenticated account access.
  HTTP 404/422 are not accepted as connection success.
- Keep creation disabled until account access and the merchant's DPD service have
  been verified. An authenticated list response does not prove label acceptance.

## Carrier workflow

Only paid orders with no open withdrawal request qualify. Destinations remain
BE/NL/FR/DE/LU. DPD normal parcel (`carrier=4`, `package_type=1`, home delivery)
is used; digital stamps, pickup bookings and delivery extras are excluded.
No customer email/phone is sent to the carrier by this initial integration.

The existing `shipping_test_attempts` table stores a durable entry for
`BIGK-ORDER-<order UUID>`. No new table or migration is required. An atomic claim
prevents concurrent duplicate POSTs. The table records a hash of the reviewed
recipient so status recovery cannot silently adopt a different shipment.

If a connection preflight fails before POST, the operator may retry after fixing
the connection. Once a POST has been attempted, failed/ambiguous requests block
creation and offer status reconciliation instead. Never delete the attempt to
retry an uncertain request: inspect its exact reference in MyParcel first.

The authenticated print endpoint fetches only the provider's approved HTTPS PDF
origin, verifies MIME/PDF signature and size, and returns a private no-store PDF.
Tracking refresh fills DPD/tracking/link in the normal fulfillment form. Printing
or refreshing never marks an order fulfilled or queues an email.

## Validation

`node --import tsx tests/myparcel-orders.test.ts` tests eligibility, connection
results, duplicate/concurrent calls, address identity, timeout recovery, PDF
origin checks, authorization and preservation of order/stock/email state.
`node tests/myparcel-orders-browser.mjs` tests the actual order component at
1440px and 390px with simulated carrier responses and no real labels or charges.
The dedicated Shipping label checks workflow runs both and retains screenshots.

## Provider references

- https://developer.myparcel.nl/api-reference/06.shipments.html
- https://developer.myparcel.nl/api-reference/07.shipment-related-object-definitions.html
- https://developer.myparcel.nl/api-reference/

MyParcel documents no sandbox. Normal unused parcel labels are billed when
shipped; digital stamps differ. A live account test must be clearly separated
from simulated tests, and must not dispatch, book pickup or mark an order shipped.
