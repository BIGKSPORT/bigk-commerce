import {z} from 'zod';
import {productTranslationSchema} from './product-translation-schema';
export const translationFields=['description','details','composition','fit','care','seoTitle','seoDescription','presentation','features','sizingNote'] as const;
const hashes=z.object(Object.fromEntries(translationFields.map(key=>[key,z.string().regex(/^[a-f0-9]{64}$/).optional()])) as Record<typeof translationFields[number],z.ZodOptional<z.ZodString>>).strict();
export const translationPublicationSchema=z.object({sourceHashes:hashes,copy:productTranslationSchema,approvedAt:z.iso.datetime()}).strict();
export const translationPublicationsSchema=z.object({nl:translationPublicationSchema.optional(),fr:translationPublicationSchema.optional(),de:translationPublicationSchema.optional(),it:translationPublicationSchema.optional(),es:translationPublicationSchema.optional()}).strict();
export type TranslationPublication=z.infer<typeof translationPublicationSchema>;
