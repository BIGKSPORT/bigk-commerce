/**
 * BIG K ® DPD customs preflight. Purely local validation: NO API calls, labels or charges.
 * A passing result means fields are present, NOT that the shipment is approved by
 * customs, DPD, the destination country, or the merchant's carrier contract.
 */
export type DpdShipmentDraft = {
  destinationCountry: string;
  destinationCity: string;
  recipientName: string;
  recipientAddress: string;
  recipientPostalCode: string;
  recipientEmail?: string;
  recipientPhone?: string;
  parcelGrossGrams: number | null;
  exporterEori?: string;
  invoiceNumber?: string;
  invoiceCurrency?: string;
  invoiceIncoterm?: string;
  invoiceDocumentReady?: boolean;
  items: Array<{
    sku: string;
    description: string;
    quantity: number;
    unitValueCents: number;
    commodityCode?: string;
    originCountry?: string;
    unitNetGrams?: number;
  }>;
};
export type DpdPreflightIssue = { field: string; code: string; message: string };
export type DpdPreflightResult = {
  canGenerateLiveLabel: false;
  destinationRequiresCustomsReview: boolean;
  completeForManualReview: boolean;
  issues: DpdPreflightIssue[];
};
const EU = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);
const iso = (s: string | undefined) => /^[A-Z]{2}$/.test((s || '').trim().toUpperCase());
const isPositiveSafeInt = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n > 0;

export function dpdPreflight(input: DpdShipmentDraft): DpdPreflightResult {
  const issues: DpdPreflightIssue[] = [];
  const put = (field: string, code: string, message: string) => issues.push({field, code, message});
  const country = input.destinationCountry?.trim().toUpperCase() || '';
  if (!iso(country)) put('destinationCountry','COUNTRY_INVALID','Destination country must be a two-letter ISO code.');
  const customs = !EU.has(country);
  if (!input.destinationCity?.trim()) put('destinationCity','CITY_MISSING','Destination city is required.');
  if (!input.recipientName?.trim()) put('recipientName','NAME_MISSING','Recipient name is required.');
  if (!input.recipientAddress?.trim()) put('recipientAddress','ADDRESS_MISSING','Street address is required.');
  if (!input.recipientPostalCode?.trim()) put('recipientPostalCode','POSTCODE_MISSING','Postal code is required.');
  if (!isPositiveSafeInt(input.parcelGrossGrams)) put('parcelGrossGrams','GROSS_WEIGHT_MISSING','Measured package gross weight in grams is required.');
  if (!input.items?.length) put('items','ITEMS_MISSING','At least one physical product line is required.');
  input.items?.forEach((item, i) => {
    const prefix = 'items.'+i+'.';
    if (!item.sku?.trim()) put(prefix+'sku','SKU_MISSING','SKU is required.');
    if (!item.description?.trim()) put(prefix+'description','DESCRIPTION_MISSING','Description is required.');
    if (!isPositiveSafeInt(item.quantity)) put(prefix+'quantity','QUANTITY_INVALID','Quantity must be a positive integer.');
    if (!isPositiveSafeInt(item.unitValueCents)) put(prefix+'unitValueCents','VALUE_INVALID','Unit value in cents must be positive.');
    if (customs) {
      if (!/^\d{6,10}$/.test(item.commodityCode?.trim() || ''))
        put(prefix+'commodityCode','HS_CODE_INVALID','A validated item-specific 6–10 digit tariff code is required.');
      if (!iso(item.originCountry))
        put(prefix+'originCountry','ORIGIN_MISSING','Origin country is required for each product.');
      if (!isPositiveSafeInt(item.unitNetGrams))
        put(prefix+'unitNetGrams','NET_WEIGHT_MISSING','Net weight in grams is required for each product.');
    }
  });
  if (customs) {
    if (!input.exporterEori?.trim()) put('exporterEori','EORI_MISSING','Exporter EORI must be verified.');
    if (!input.recipientEmail?.trim()) put('recipientEmail','EMAIL_MISSING','Recipient email is required for manual export review.');
    if (!input.recipientPhone?.trim()) put('recipientPhone','PHONE_MISSING','Recipient phone is required for manual export review.');
    if (!input.invoiceNumber?.trim()) put('invoiceNumber','INVOICE_NUMBER_MISSING','Commercial invoice number is required.');
    if (!/^[A-Z]{3}$/.test(input.invoiceCurrency?.trim().toUpperCase() || ''))
      put('invoiceCurrency','CURRENCY_MISSING','Invoice currency must be ISO 4217.');
    if (!input.invoiceIncoterm?.trim()) put('invoiceIncoterm','INCOTERM_MISSING','Export Incoterm must be reviewed.');
    if (input.invoiceDocumentReady !== true)
      put('invoiceDocumentReady','EXPORT_DOCUMENT_MISSING','Required customs documentation must be reviewed.');
  }
  // Never grant label creation here. Carrier account, commercial rates, destination
  // availability, service eligibility and API validation are separate launch gates.
  return { canGenerateLiveLabel: false, destinationRequiresCustomsReview: customs,
    completeForManualReview: issues.length === 0, issues };
}
