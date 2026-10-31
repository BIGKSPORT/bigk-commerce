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
const optionalCode = (pattern: RegExp) => z.string().trim().regex(pattern).optional();
export const tradeSchema = z.object({
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  hsCode: optionalCode(/^(?:\d{6})?$/),
  cnCode: optionalCode(/^(?:\d{8})?$/),
  originCountry: optionalCode(/^(?:[A-Z]{2})?$/),
  weightGrams: z.number().int().min(1).max(1000000).optional(),
  identifiers: z.record(z.string().min(1).max(100), z.object({
    sku: z.string().trim().max(100),
    gtin: z.string().trim().refine(value => !value || validGtin(value), 'Invalid GTIN check digit or length.'),
  }).strict()).optional(),
}).strict().refine(value => !value.hsCode || !value.cnCode || value.cnCode.startsWith(value.hsCode), 'CN code must start with the HS code.');
export type ProductTrade = z.infer<typeof tradeSchema>;
