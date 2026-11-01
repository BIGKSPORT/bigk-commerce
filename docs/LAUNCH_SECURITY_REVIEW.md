# Launch security review — development only

Confirmed fixes:

- Verified payments can settle after the reservation deadline. Released reservations only reacquire free stock, never another shopper's reservation. Missing stock or released Club points require manual refund review, displayed in the backoffice. No automatic refund is issued.
- Login, checkout and sign-in requests use visitor budgets plus higher global caps. Forwarded IPs are trusted only on the configured Vercel/Netlify platform; stored keys are hashes.
- Email-link GET requests never consume a token. A confirmation form performs an origin-checked, single-use POST. Its same-origin referrer policy preserves browser Origin checking without leaking the token to external sites.
- Warehouse sessions are recorded durably, revoked on logout and invalidated by password changes. Existing warehouse cookies require a fresh login.
- Signed webhook environment mismatches are acknowledged without payment mutation. Invalid signatures still fail.
- HSTS is enabled. Product content uses a product-id lookup.

Validation: production build, TypeScript, existing commerce suite (25), launch regression suite (8), PostgreSQL authentication/shipping suite (11), PostgreSQL payment journey (11), and browser scanner/confirmation/session flow passed locally using disposable data. No live charges, email or shipment requests.

Outstanding: replace inline-script CSP with a tested nonce strategy; broad formatting cleanup; re-audit current catalogue grouping, photography and customer wording against the current storefront. The external review includes stale observations (the hero already precedes the collection). Do not merge products or change EANs from name similarity alone. Missing care-label values must not be invented. No production launch or live payment approval is implied.
