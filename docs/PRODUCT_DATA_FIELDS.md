# Product identifiers, customs and SEO

The backoffice product editor now stores these optional fields in the existing versioned product-content record:

- SEO title and meta description, used by product metadata and Open Graph.
- Six-digit HS code, eight-digit EU CN code, manufacturing country and product weight in grams.
- SKU and EAN/GTIN for each exact product/colour/size variant. Leading zeroes are retained.

GTIN lengths 8, 12, 13 and 14 and GS1 modulo-10 check digits are validated. All-zero codes are rejected. Duplicate GTINs are compared using 14-digit normalization across products, so equivalent zero-padded codes cannot be assigned twice. SKUs must also be unique when supplied. Checks run inside the existing serialized write transaction; product version conflicts remain enforced. The CN prefix must match the HS code when both are supplied.

The existing product-content table is used; no remote schema change, inventory update, or catalogue import is required. Local source-content synchronization preserves the new trade fields.

GTIN formatting is not evidence of GS1 ownership. Codes must come from confirmed supplier/GS1 records. Customs field formatting does not verify classification. Composition alone is insufficient: construction, intended use and garment category can change the classification. Unknown identifiers and classifications remain blank. The country field checks uppercase two-letter format, not documentary proof of origin. Weight is a shared product value, not an individually measured size/package weight.

Variant GTINs are emitted on the respective size in product structured data, never as an arbitrary parent-product barcode. This does not yet implement a Google Merchant feed, cross-product colour families, per-market tax classification, carrier customs documents, or product-specific SEO copywriting. Indexing restrictions remain unchanged.

Verification: TypeScript, Next.js production build, authenticated backoffice persistence/validation tests and desktop/mobile browser checks. All browser fixtures and database tests are local and fictitious.
