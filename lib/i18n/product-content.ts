import type {Locale} from './config';
import {productTranslationSchema} from './product-translation-schema';
import type {z} from 'zod';
/** One shared whitelist for prepared translations, persistence and admin validation. */
export type ProductTranslation=z.infer<typeof productTranslationSchema>;
const allowedFields=new Set(Object.keys(productTranslationSchema.shape));
export function validateProductTranslation(value:unknown):ProductTranslation{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid translation');
 for(const key of Object.keys(value))if(!allowedFields.has(key))throw new Error('Translation field is forbidden: '+key);
 const parsed=productTranslationSchema.safeParse(value);if(!parsed.success)throw new Error('Invalid translation: '+parsed.error.issues.map(issue=>issue.message).join('; '));return parsed.data;
}
/** Source name remains byte-for-byte identical, including accents, spelling and case. */
export function productCopy(
  source: {id: string; name: string; description: string},
  locale: Locale,
  translations: Partial<Record<Locale, ProductTranslation>>,
) {
  const copy = translations[locale] ? validateProductTranslation(translations[locale]) : undefined;
  return {
    id: source.id,
    name: source.name,
    description: copy?.description ?? source.description,
    features: copy?.features,
    care: copy?.care,
    sizingNote: copy?.sizingNote,
    descriptionTranslated: locale === 'en' || copy?.description !== undefined,
  };
}
