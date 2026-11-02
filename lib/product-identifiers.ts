import { z } from 'zod';

// Keep identifiers as strings: leading zeroes are significant.
export function validGtin(value: string): boolean {
  if (/^0+$/.test(value) || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === check;
}
export function canonicalGtin(value: string) { return value.padStart(14, '0'); }
const optionalCode = (pattern: RegExp, message: string) => z.string().trim().regex(pattern, message).optional();
export const tradeSchema = z.object({
  pendingColours: z.array(z.object({article:z.string().max(100),colour:z.string().max(80),reason:z.string().max(500)}).strict()).max(30).optional(),
  parentProductId: z.string().min(1).max(100).optional(),
  sharedOverrides: z.array(z.enum(['description','category','composition','care','fit','details','presentation','seo','translations'])).optional(),
  officialName: z.string().trim().max(150).optional(),
  supplierArticle: z.string().trim().max(100).optional(),
  colour: z.string().trim().max(80).optional(),
  customsDescription: z.string().trim().max(500).optional(),
  packageLengthCm: z.number().positive().max(300).optional(),
  packageWidthCm: z.number().positive().max(300).optional(),
  packageHeightCm: z.number().positive().max(300).optional(),
  previousSlugs: z.array(z.string().max(180)).max(100).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  hsCode: optionalCode(/^(?:\d{6})?$/, 'HS code must contain exactly six digits, or be blank.'),
  cnCode: optionalCode(/^(?:\d{8})?$/, 'CN code must contain exactly eight digits, or be blank.'),
  originCountry: optionalCode(/^(?:[A-Z]{2})?$/, 'Use an uppercase two-letter country code, for example CN.'),
  weightGrams: z.number().int().min(1).max(1000000).optional(),
  identifiers: z.record(z.string().min(1).max(100), z.object({
    images: z.array(z.string().max(250)).max(30).optional(),
    colourId: z.string().min(1).max(100).optional(),
    colour: z.string().trim().max(80).optional(),
    supplierArticle: z.string().trim().max(100).optional(),
    archived: z.boolean().optional(),
    verified: z.boolean().optional(),
    sku: z.string().trim().max(100),
    gtin: z.string().trim().refine(value => !value || validGtin(value), 'Invalid GTIN check digit or length.'),
  }).strict().refine(value=>!value.verified||Boolean(value.gtin),'A verified variant requires an EAN / GTIN.')).optional(),
}).strict().refine(value => !value.hsCode || !value.cnCode || value.cnCode.startsWith(value.hsCode), 'CN code must start with the HS code.');
export type ProductTrade = z.infer<typeof tradeSchema>;
