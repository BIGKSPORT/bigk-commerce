# BIG K Ambassador Programme — implementation specification

## Approved commercial settings
- Admission: open applications; BIGK BV approval is mandatory before activation.
- Customer benefit: 10% off eligible product subtotal through one unique ambassador code.
- Ambassador reward: 10% of eligible net product sales after the customer discount, excluding VAT, shipping, gift cards, refunded/cancelled value and non-commissionable items.
- One code per active ambassador; one ambassador attribution per order.
- The exact ambassador email is blocked from using its own code. Payment-instrument, household and coordinated-account matching are not automated yet; suspicious patterns require manual review. One attribution per order is enforced.
- No stacking with BIG K Club Points or any other promotional code.
- B2B orders and seller/channel commissions are excluded unless a separately approved written agreement says otherwise.

## Customer and ambassador journey
1. Public application collects name, email, public social/profile URL, audience description and motivation. It must show a privacy notice and consent appropriate to the purpose.
2. Application enters pending state. Submission does not grant a code, discount or commission.
3. BIGK BV reviews and approves/rejects. Approval creates an active ambassador record and a unique 10% discount code. Code collisions must be retried; never overwrite an existing code.
4. The customer enters the code at checkout. Checkout revalidates the active ambassador/code server-side and records attribution once per order.
5. Commission is recorded as pending, never payable at checkout.
6. It becomes eligible only after successful payment, confirmed delivery, the configured return/withdrawal review period, and reconciliation of all refunds/chargebacks. The waiting period must be aligned with BIGK's legal withdrawal/returns process; it must not be shorter than the applicable customer rights period.
7. BIGK BV reviews a period statement, confirms the ambassador's invoicing/tax details, approves a payout batch, and separately records payment reference and paid date. No automatic transfers.

## Commission calculation
- Basis: eligible product net sales excluding VAT after discount.
- Shipping, VAT, gift cards, refunded amounts, cancelled orders, unpaid orders, fraud/abuse, own purchases and B2B/seller orders are excluded.
- Partial refunds reduce eligible basis and commission proportionally. Full refunds/chargebacks reverse the commission.
- Store money as integer cents. Calculate commission with deterministic rounding down to cents.
- Immutable order attribution and a unique commission per order prevent duplicate awards.
- Never recalculate historical commission from mutable product prices; persist the qualifying basis and rate snapshot.

## Controls and privacy
- Normalize email/code; hash customer email in attribution records. Do not expose customer personal details in ambassador-facing views.
- Public endpoints require rate limiting, bounded request bodies, strict schemas, origin checks where applicable, and duplicate-pending-application protection.
- Admin actions require the existing admin authentication/MFA guard and audit events.
- RLS enabled; revoke direct access from PUBLIC/anon/authenticated. All writes occur server-side with the restricted BIGK database role.
- Pausing/terminating an ambassador disables future code use. Existing earned/eligible amounts remain reviewable; suspected abuse may be held with an audited reason.
- Keep payout approval separate from payment recording. Require invoice/tax details and legal/accounting review before first payout.

## Launch sequence
1. Apply the additive migration to isolated staging only; update the restricted server-role grants and policies.
2. Implement and test application, admin review, unique code issuance, checkout attribution, commission ledger, returns integration, ambassador dashboard and payout workspace.
3. Run tests for duplicate requests, concurrent code use, self-referral, coupon/points stacking, expiry, partial/full refunds, chargebacks, delivery gating, payout double-approval and termination.
4. Validate legal text, GDPR privacy notice/retention, Belgian/EU consumer withdrawal handling, VAT and ambassador invoicing with the accountant/legal adviser.
5. Production migration and feature activation are separate release approvals. Keep the programme disabled until all gates pass.

## Current implementation status — 22 November 2026
The branch contains the public partner landing page and application form, admin review and code issuance, checkout attribution, manual commission review, refund holds, payout workflow, and authenticated partner dashboard.

- Production Supabase: the additive partner tables and columns are installed in schema `bigk`. Row-level security is enabled; browser roles have no table grants; the restricted `bigk_production_web` role has server access. The six partner tables were verified empty immediately after migration.
- Staging: partner tables are included in the isolated staging bundle. `bigk_staging_server` has the intended server-only access, and the staging schema test checks all six partner tables and anonymous denial.
- Commercial copy: public rates are Starter 10%, Active 15%, Top 18%, Elite 20%; the community discount is 10%. The public legal pages now match those rates and clearly identify the terms and privacy notice as drafts.
- Safety: no partner code is automatically issued until admin approval. Commissions start pending and are not payable until delivery, return review, VAT-exclusive basis verification and explicit approval. Team bonuses remain disabled. No payout is sent automatically.
- Local verification on the current branch: typecheck, staging schema test, partner application/rate tests, auth/shipping tests, payment-journey tests, Alpin commerce test and production build passed. GitHub Actions for the latest commit are still running/queued; merge and production deployment are not yet complete.

Remaining launch gates: legal/accounting approval of the partner terms and invoicing/tax flow; confirmation of privacy suppliers, transfer locations and retention schedule; an end-to-end partner attribution/refund/chargeback test; and completion of GitHub Actions before merge. Stripe chargeback handling remains manual. Club Points remain independently controlled by BIGK_CLUB_ENABLED and cannot stack with ambassador discounts.
