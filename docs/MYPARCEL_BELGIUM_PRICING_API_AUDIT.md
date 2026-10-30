# BIG K ® — MyParcel / SendMyParcel Belgium pricing and API audit
Date: 30 October 2026
Status: **Internal historical rate evidence and integration planning only. NOT approved for live checkout.**

## Important finding
BIG K ® has an established MyParcel Belgium (SendMyParcel) account and actual dated shipment invoices. We recovered real historical billed line items from attached MyParcel PDF invoices in Gmail, rather than guessing from generic prices. **These are historical invoiced examples, not guaranteed current contract prices for every destination.**

## Actual invoice lines — verified
All line items below are **ex VAT** and invoice totals use Belgian VAT 21%.

| Invoice date | Invoice number | Destination | Carrier/service | Base charge | Surcharge | Ex VAT total | Incl VAT total |
|---|---|---|---|---:|---:|---:|---:|
| 9 Mar 2026 | 260138798 | Belgium | DPD Pickup | €4.12 | Fuel €0.55 | €4.67 | — |
| 9 Mar 2026 | 260138798 | Netherlands | DPD Pickup | €5.84 | Fuel €0.79 | €6.63 | — |
| 9 Mar 2026 | 260138798 | **both** | 2 shipments | €9.96 | Fuel €1.34 | **€11.30** | **€13.67** |
| 23 Mar 2026 | 260158269 | Spain | DPD Home | €11.08 | Fuel €1.49 | **€12.57** | **€15.21** |
| 7 Sep 2026 | 260495579 | Spain | PostNL | €11.83 | Energy €0.20 | **€12.03** | **€14.56** |

**Important accounting correction:** On 6 October 2026, SendMyParcel finance acknowledged the PostNL parcel behind invoice 260495579 was never handed over to the carrier; a mistaken destination scan had triggered billing. They credited the charge and applied credit against open balance; credit invoice 260555910 dated 6 October for **-€12.03 ex VAT / -€14.56 incl VAT**. Therefore that September amount is an **erroneous charge later reversed**, not evidence of a completed successful shipment.

Sources: Gmail original messages and PDF attachments:
- Message `19cd143fcc5b477b`, attachment `belgie-factuur-260138798-nl-BE.pdf` — invoice 9 Mar
- Message `19d195d4935cdc0b`, attachment `belgie-factuur-260158269-nl_BE.pdf` — invoice 23 Mar
- Message `1a07a4d613d86c07`, attachment `belgie-factuur-260495579-nl_BE.pdf` — invoice 7 Sep
- Message `1a11095b074af803` — finance correction; message `1a11091723804f26` — credit invoice 260555910.

## MyParcel services and API
- Documented unified platform 3 Belgium with endpoints for `GET /shipments`, `GET /shipments/{id}`, `POST /shipments`, `GET /shipment_labels/{ids}`, track-and-trace, returns, delivery options and webhooks.
- Official example for Belgium platform uses **https://api.sendmyparcel.be/shipments** and supports DPD carrier (example ID 4), alongside other carrier options.
- Authenticated shipment responses have a shipment `price.amount` in **integer euro cents**, useful for reviewing actual historical charges. This is **not necessarily a pre-purchase quote**. No verified public endpoint to retrieve the customer's full personalized prospective rate table was found.
- API key is generated inside MyParcel account under **Shop Settings → Integration**; no MyParcel API key was accessed or stored during this research.
- Official API documentation says **no test environment**: labels are generally billed only after actual shipment, digital stamps excepted. Never use billable services for speculative testing. The MyParcel backoffice can support rates directly, but account-specific rates require authentication.
- MyParcel supports DPD, PostNL and bpost on Belgium platform (specific carriers/routes and country coverage must be confirmed). MyParcel API documentation says **DPD via their platform is EU-only** for international shipments, although PostNL and bpost have broader reach. Verify carrier and destination eligibility with MyParcel before presenting.
- Important: MyParcel/SendMyParcel is **not the same financial account as BIG K ®'s direct DPD contract**; rates, pickups and credentials must be kept separately per provider.

### Public rate reference, not personal pricing
- https://sendmyparcel.be/prijzen/ includes 2026 listed rates for BE and NL by product, weight and account tier. Listed amounts vary by tier, timing and service; do not conflate with the historical invoices or direct DPD rates.
- Check every public quote's time effective date, applicable pickup/door-delivery service, business tier, VAT, fuel/energy surcharges, insurance and returns.

## Commercial/account cautions
- Onboarding message (24 Feb 2026, `19c8eeb0dc89e8fd`) says DPD fixed pickup is free from **five packages**, one-off DPD pickup €7.17, and a return service is available across Europe. These are historical onboarding claims and require rechecking.
- On **1 and 6 October 2026**, MyParcel sent overdue balance / possible payment-in-advance and external collection warnings. SendMyParcel later acknowledged the disputed unused shipment, issued a **€14.56 incl-VAT credit**, and stated it was reconciled against invoice balance. There is **no evidence of the entire account being cleared / fully active** from this specific correction alone.
- On 21 Oct, MyParcel reported an outage of the backoffice/API and later said service was restored. Platform restoration is not merchant billing/account confirmation.

## Backoffice architecture recommendation
1. Add **provider-neutral shipment model** with shipping_provider `dpd_direct | myparcel_be`, carrier `dpd | postnl | bpost`, destination, parcel weight, service, base charge, fuel/other surcharge, carrier response (redacted), tracking, label state.
2. Keep tariff records **source-dated, service-specific**, separating (a) public price, (b) historical billed price, (c) verified merchant-account current quote. Only (c) is eligible for a live pricing rule after operator approval.
3. Build **read-only shipment price reconciliation** from authenticated MyParcel `GET /shipments` after API key secure setup; calculate historical cost and compare with emailed invoice detail.
4. For dispatch, use per-SKU customs metadata and fail-closed preflight; check MyParcel's carrier-specific customs support. Do not assume DPD through MyParcel solves UK/NO/CH or the previously documented X-Interactive HS issue.
5. Use adapter-specific API credentials, idempotent order→label mapping, detailed error logging and actual production account permission confirmation.
6. No new shipping country or live label activated until full carrier/payment/stock and customs approval.

## Official references
- https://developer.myparcel.nl/api-reference/
- https://developer.myparcel.nl/api-reference/05.authentication.html
- https://developer.myparcel.nl/api-reference/06.shipments.html
- https://developer.myparcel.nl/api-reference/07.shipment-related-object-definitions.html
- https://developer.myparcel.nl/getting-started.html
- https://sendmyparcel.be/prijzen/

**Next dependency:** Access to current MyParcel merchant rates from its protected backoffice, or a securely configured MyParcel API key for read-only authenticated shipment-price history. No credential needs to be sent through chat.
