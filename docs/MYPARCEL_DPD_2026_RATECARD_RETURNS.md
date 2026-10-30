# BIG K ® — MyParcel DPD 2026 rate card and returns (primary-source audit)
Reviewed: 30 October 2026
Status: **reference-only; DO NOT auto-enable any destination, live rating, label or free return rule.**

## Primary source
Gmail 11 March 2026, subject `Prijzen`, sent to DPD account manager Maxim Vandenberghe. Attachment: **`DPD_Tarieven_2026_NL.pdf` (19 pages)**. The PDF is branded **MyParcel Belgium / sendmyparcel.be**, **not** the distinct direct-DPD signed commercial contract. The user explicitly confirms this is a usable reference for MyParcel rates and returns. Exact source table and page distinctions must be preserved.

- PDF p. 2: Belgium DPD Home/Pickup seven annual-volume bands, maximum standard 0–20kg and parcel size/insurance guidance.
- PDF pp. 3–9: Europe DPD Home, **seven volume bands**, 0–20kg, country lists.
- PDF pp. 10–16: Europe DPD Pickup, **seven volume bands**, 0–20kg, country lists.
- PDF p. 17: **DPD Shop Return** cross-border tariff table for 21 countries, 0–20kg.
- PDF p. 18: additional surcharges, pickup eligibility/fees, parcel limits.
- PDF p. 19: remote-area postal codes and surcharges. **Postcode validation is required before quoting**.

## DPD Shop Return tariffs (PDF p. 17)
The figures below are **EUR excluding VAT and variable fuel surcharge**, weight 0–20 kg; these are carrier costs, not the merchant's promised consumer return charges.

| Country | Return base € |
|---|---:|
| Luxembourg | 4.94 |
| Netherlands | 5.40 |
| Germany | 4.96 |
| Denmark | 4.96 |
| France | 6.21 |
| Czech Republic | 7.34 |
| Estonia | 7.34 |
| Hungary | 7.34 |
| Lithuania | 7.34 |
| Slovakia | 7.34 |
| Spain | 5.73 |
| Italy | 8.13 |
| Finland | 13.29 |
| Croatia | 10.43 |
| Ireland | 10.92 |
| Latvia | 13.24 |
| Slovenia | 8.87 |
| Austria | 7.91 |
| Poland | 7.91 |
| Portugal | 7.91 |
| Sweden | 7.91 |

**No Belgian domestic Shop Return rate is listed on p. 17.** Do not substitute Belgian outbound Pickup or assume free return.

## Selected outbound base prices from highest MyParcel bands (source PDF)
- Belgium p. 2: `DPD Home` 1000–1999 = €5.91; 2000–2999 = €5.77; 3000+ = €5.64. `DPD Pickup` 3000+ = **€4.12** (historically matched invoice 260138798).
- EU Home p. 9, annual volume **300+**: NL €7.07; DE €7.12; FR €8.66; ES €11.08; IT €11.19; AT €10.68; LU €8.26; PL €8.24.
- EU Pickup p. 16, volume **300+**: NL €5.84; DE €5.91; FR €7.16; ES €8.36; IT €8.92; LU €5.74; AT €8.71.
- **Volume thresholds differ for domestic Belgium (0–249, ... 3000+) and EU (0–49, ... 300+).** Do not treat them as same tier index/threshold in code.
- Caution: PDF p. 8 lists an anomalous Austrian Home price of €12.93 for staffel 6, higher than previous tier. Preserve source value and request MyParcel clarification; do not silently “correct” it.
- Some EU Pickup price rows include non-EU countries (Norway, Switzerland). Their presence in the brochure **does not establish current service or customs/return eligibility**.

## Additional charges (PDF p. 18, ex VAT unless specified)
- Undeliverable **domestic return**: €5.50.
- Undeliverable **international return**: €11.00.
- 20–31.5kg heavy package: €1.90.
- Irregular/oversized normal or shop package: €39.00.
- Non-belt-sortable: €2.30.
- Relabelling: €1.00 each for illegible barcode or label.
- Repacking: €10.00.
- Destruction: €15.00.
- Peak surcharge (17 Nov–31 Dec): €0.52 (p. 18; p. 2 says €0.50, **source inconsistency**).
- Fuel surcharge: **variable by month**; do not hardcode March historical percentage for October.
- Fixed pickup: free with **at least 5 parcels per pickup**. One-time pickup €7.17, requested before 14:00 for next working day collection between 09:00 and 17:00 (subject to provider confirmation).

## Source reconciliation
- Actual MyParcel invoice `260138798` recorded BE DPD Pickup **€4.12 + €0.55** fuel, and NL DPD Pickup **€5.84 + €0.79**. Both base prices match highest-tier rows in the PDF, but invoice alone does not prove the account still receives that tier in October 2026.
- Invoice `260158269`: Spain Home **€11.08 + €1.49** fuel, matching PDF Home highest-tier Spain €11.08.
- These billed lines strengthen the source attribution to **MyParcel Belgium highest tier**, not to direct DPD contract.
- For current tariffs, confirm account tier, current month fuel surcharge, postcode/remote areas, tax, eligible returns, live API status and payment arrangements with MyParcel.

## Proposed backoffice implementation
Keep `shippingProvider=myparcel_be`, `carrier=dpd`, `service=home|pickup|shop_return`, `source=pdf_2026_03`, effective dates and destination/weight/tier and surcharge types. Separate `return_to_sender_undeliverable` from a customer-requested `shop_return`. Do not make all returns free by default; merchant policy and consumer legal rights must be configured independently.

Use this together with:
- `docs/MYPARCEL_BELGIUM_PRICING_API_AUDIT.md`
- `docs/DPD_SHIPPING_RESEARCH_2026-10-30.md`
- `docs/DPD_X_INTERACTIVE_UNRESOLVED_TICKET_AUDIT.md`

Never reuse historical Shopify/X-Interactive single-global-HS-code integration. Do not publish these wholesale rates as customer checkout prices without approval.
