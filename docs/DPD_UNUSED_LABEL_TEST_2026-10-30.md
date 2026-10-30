# BIG K ® — DPD label test

Verified physical test destination: BIGK BV, Theo Verellenlaan 27, 2990 Wuustwezel, BE.

The private Vercel preview branch has the MyParcel Belgium API key and a branch-only test-label feature flag. The feature is disabled in production. The action requires an authenticated admin session, same-origin request, explicit confirmation, and rate limiting, and it does not book pickup, message a customer, or edit an order.

Open `/admin/shipping-test` on the preview deployment and click **Maak één DPD-testlabel aan** once. Do not hand the label to DPD, print it onto a parcel, or request pickup. The response returns the MyParcel shipment ID and label availability; inspect that ID in MyParcel. A failed or timed-out response could still mean shipment creation succeeded: inspect dashboard before retrying.

This integration test has not yet been executed against the live MyParcel account. A successful Vercel build only checks compilation, not the carrier API. Weekly invoicing was confirmed by the merchant. The official API documentation says unused normal parcel labels are not invoiced; special digital stamps are different.

After the test, remove the preview-only feature flag so no further test labels can be created inadvertently.
