# BIG K ® — X-Interactive / DPD Connect case review
Date: 30 October 2026
Scope: connected Gmail messages from/to support@x-interactive.nl, ticket notifications, related DPD customs correspondence, later order 2831 payment notices.
Status: **No verified resolution in available correspondence.** This is an evidence-based assessment, not a legal finding of liability or proof of all support work.

## Tickets reviewed
- **#T11603**, opened 4 June 2026: DPD eCom/Shopify label-generation problems, missing location to attach customs invoice, integration setup.
- **#T11683**, opened 15 June 2026: non-EU deliveries (UK, NO, CH), customs information, wrong HS codes, label failures and returns; reopened by merchant 6 July after auto-closure on 19 June.

## Timeline — original message evidence
- **4 June** (#T11603): user reported error screenshot and inability to print label or attach invoice. Mike Veen asked whether using Shopify eCom app versus customer portal; user confirmed Shopify.
- **5 June** (#T11603): support requested Shopify store URL and collaborator code. **8 June:** ticket auto-closed without recorded fix. **10 June:** user supplied requested details, and Mike Veen confirmed collaborator access request. No working customs-label test is documented.
- **15–16 June** (#T11683): DPD IT confirmed API configuration/registration complete, directed X-Interactive to contact merchant. Mike Veen asked for issue details again. **19 June:** second ticket auto-closed due to inactivity, without resolution.
- **6 July** (#T11683): user reopened, reporting returned shipments to UK, NO, CH, absent or intermittent fields for HS/invoice and recurring label errors; requested alternate DPD portal if eCom connector limits could not be solved. Patrick Gierveld said a morning server problem was fixed and requested a retest; this was **not** confirmation of the customs problem being fixed.
- **7 July:** Max Stuiver requested collaborator access and specific problem orders; user provided access and examples #2876, #2831. Max reproduced **order #2876** label-generation failure for a customs destination. Max confirmed **#2831** generated a label but the integration sent `62019300` from shop settings **for all products**; merchant argued the product code should be `62014010`. Exact legally correct classification needs independent product-specific verification.
- **7 July later:** user reported **order #2780** also could not generate a label and reiterated willingness to work directly in DPD portal.
- **8 July, 09:50 local time:** Patrick Gierveld replied that they contacted DPD Belgium, awaited feedback and would respond afterward. **No subsequent message confirming fix, solution, test results, correct HS mapping, or refund/credit was located** in Gmail by sender, recipient, ticket IDs, issue order IDs or support names through 30 October.
- **24 June:** separate DPD customer IT response referred connector/software questions to m.veen@x-interactive.nl, corroborating support responsibility for the Shopify plugin, not necessarily for all customs compliance.
- **15 July–4 August:** Shopify chargeback for **order #2831** opened for product not received; customer won by 4 August. €47.82 chargeback + €15 fee = €62.82. **Evidence does not establish that the chargeback was caused solely by X-Interactive's defect**, but the same order was specifically raised as a customs-code issue in the support ticket.

## Confirmed defect classes and user impact
1. Reproduced label generation failure (#2876); reported additional case #2780.
2. Non-product-specific HS assignment; product-specific customs classification not validated.
3. No clear user workflow for commercial invoice, EORI, product origin, gross/net weight and non-EU export declarations.
4. Support ticket closures not contingent on working merchant-side validation.
5. Failure to communicate final DPD response or tested remediation in available record.
6. Reported customer returns and costs; at least one linked order (#2831) subsequently had an unfavorable chargeback, but direct causation remains unproven.

## What the team did do
- Responded to tickets and sought reproduction steps, Shopify collaborator access and affected orders.
- Acknowledged/reproduced a customs label error for #2876.
- Disclosed the globally configured HS code behaviour.
- Contacted DPD Belgium for additional information on 8 July.
- Reported resolution of a temporary server issue on 6 July, distinct from international customs integration fixes.

## Missing evidence for calling this resolved
- Written incident root-cause analysis, exact code/config changes and rollout dates.
- Correct country-specific customs documentation flow for UK, NO and CH.
- Demonstration that different products send **different verified HS codes**.
- Successful label+invoice generation and DPD validation for sample orders and destinations.
- Merchant-confirmed test consignments and proof of successful international delivery.
- Explanation and outcome for #2780, #2876, #2831, plus any unused/failed-label charges.

## BIG K ® new website/backoffice non-EU acceptance criteria
1. Store validated commodity code **per SKU**, material composition, origin, item weight, net/gross package weight, quantity, value/currency, exporter EORI and recipient data. Do not assume `62014010` valid for all products.
2. Separate EU and non-EU fulfilment paths; non-EU requires comprehensive preflight checks and visible admin errors if documents are incomplete.
3. Make commercial invoice/return or pro forma documents available to DPD service as required for destination; UK digital customs submission must be validated before creating label.
4. No label billed until full payload is validated and DPD returns a confirmed label response. Avoid double billing / duplicate labels with idempotency rules.
5. Persist request status, DPD errors (redacted), label ID, parcel ID, printable invoice, tracking events, destination, package attributes, costs and audit log.
6. Stage test separate scenarios: BE/NL/FR/DE/LU; GB wrong/missing HS; NO missing POA/document; CH international invoices; 2 SKUs with different HS codes; retry, cancellation, returns, delivery confirmation.
7. Do not enable UK/NO/CH or promise Europe-wide shipping until carriers/contracts/customs and actual staging tests pass.
8. Rotate DPD passwords once copied in historical email; do not commit or re-transmit secrets.

## Support correspondence pointers (Gmail message IDs)
- #T11603 open: `19e931318cbdcf06`, followup: `19e96f3f764964c4`, 10 June: `19eb2132b2e51e5e`.
- #T11683 reopen: `19f366748c883261`, 6 July: `19f376da3189f114`, 7 July: `19f3ba042752d074`, `19f3caf9fd6164fb`, 8 July: `19f40b4e7cc76598`.
- Related DPD customer IT referral to X-Interactive: `19ef91a20d5bb0cd`.
- Shopify #2831 chargeback: `19f682f400bb20a1`, final result: `19fccb06e2dfca00`.

## Escalation
Request a technical postmortem, list of delivered fixes, signed evidence of integration test results, official DPD answer, carrier label reconciliation, and merchant support resolution. Withhold any statement that this incident was solved without those artifacts. Avoid accusations of intentional misconduct; the evidence supports an unresolved support case, not intent.
