# BIG K Backoffice V2 — Phase 1

## Scope

This increment extends the existing Next.js backoffice. It does not replace the commerce APIs, product editor, order fulfilment, MyParcel integration, customer CRM, marketing/discounts, B2B, storefront editor, category tools, media library, Club, event management, staff controls, audit log or connection settings.

The new experience is selected only when `BACKOFFICE_V2_ENABLED=true`. The default is off (unset/false), which retains the existing backoffice navigation and dashboard.

## What is included

- Grouped navigation for Home, Orders, Products, Customers, Marketing, Discounts, Content, Markets, Analytics, Sales channels and Settings.
- Existing screens remain reachable through the new menu, including categories, inventory, B2B, Storefront, Blog, Media library, BIG K Club, Events, Activity, Operations, Connections, TikTok catalogue, Access/Security and shipping test tools.
- Orders has working entry points for all orders, existing MyParcel label/fulfilment workflow and saved/possibly abandoned carts. Draft orders are not implemented yet and are marked as planned.
- Discounts links to the existing promo-code manager within the existing marketing tools.
- Global search opens with Cmd+K or Ctrl+K and searches loaded products and orders plus authenticated customer records. Selecting a result opens the existing editor/detail workflow.
- Home dashboard compares paid/fulfilled sales and order counts with the previous matching period; shows shipping, unpaid/payment-review, abandoned-cart and low-stock attention counts.
- Sessions, live visitor count and a complete session-to-purchase conversion rate are explicitly marked unavailable because the current app does not record those analytics events. The funnel shows only available saved-cart and paid-order signals.
- The dashboard states that order-based comparisons use the 200 most recent orders returned by the existing admin API. It does not invent lifetime totals or analytics data.

## Existing functions and limits

All existing management actions continue to use the current authenticated API endpoints. No new payment, email, fulfilment, label-purchase or customer-data mutation endpoint was added. Search uses the existing customer list endpoint and the data already loaded by the backoffice.

The Markets page and Draft orders workflow do not currently exist in the legacy backoffice. They are visibly marked as not yet available/planned rather than presenting fake screens. The current order page includes the saved-cart overview and MyParcel controls; Phase 2 will make the order filters, saved views, bulk actions and order timeline more complete.

## Files added/changed

- Added `components/backoffice-v2-navigation.tsx` and its CSS module.
- Added `components/backoffice-v2-shell.module.css`.
- Added `components/backoffice-v2-dashboard.tsx` and its CSS module.
- Updated `app/admin/page.tsx` to pass the server-side feature flag.
- Updated `components/backoffice.tsx` to switch between the legacy and V2 shell/dashboard while reusing existing screens.
- Updated `components/admin-orders.tsx` and `components/admin-customers.tsx` so global-search selections open the existing record detail.
- Updated `components/admin-saved-carts.tsx` to provide a focused abandoned-checkouts view.

No database migration, new dependency, Stripe change or production configuration change is part of this phase.

## Preview requirements

Before enabling V2 on a Vercel preview, configure preview-only environment variables for this branch:

- `BACKOFFICE_V2_ENABLED=true`
- `DATABASE_SCHEMA=bigk_staging` (and the project's existing staging database connection variables)
- Stripe test-mode credentials only
- Existing preview-safe admin/session secrets and any other required application configuration
- Keep production indexing disabled in preview and do not configure live customer email delivery.

Do not copy production database credentials, Stripe live keys or production email credentials into preview. Add values directly in Vercel's project settings; do not put them in Git, this document or chat.

## Verification

After the staging-only preview variables are configured:

1. Confirm Vercel identifies branch `feat/backoffice-v2-phase-1` as a Preview deployment.
2. Confirm the application reports `STAGING` in the admin header after login.
3. Open every menu group and check each existing screen.
4. Use Cmd+K and Ctrl+K to find a product code, an order number/email and a customer email/name. Confirm each opens the matching existing record.
5. Check dashboard date ranges and compare-to-previous-period calculations using known staging test orders. Confirm sessions/live visitors/conversion are clearly marked unavailable.
6. Check MyParcel connection status only; do not create a paid label unless using a designated staging test shipment and explicitly intending the carrier test.
7. Check desktop and mobile widths, keyboard navigation, sign-out, order packing slip and customer editor.
8. Run `npm run typecheck`, `npm run test:backoffice`, `npm run test:backoffice-browser` and the existing order/customer tests in the staging test environment.

## Rollback

Set `BACKOFFICE_V2_ENABLED=false` (or remove it) from the Preview environment and redeploy that preview. The legacy backoffice remains the default. Revert the branch commits if needed. No data rollback is required because this phase adds no database changes.
