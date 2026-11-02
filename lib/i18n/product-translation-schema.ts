import {z} from 'zod';
const text=(max:number)=>z.string().max(max).refine(value=>!/[\u3400-\u9fff]/u.test(value),'Use translated customer-facing text without Chinese characters.').optional();
/** Names, identifiers, prices, inventory and image assignments are not translation fields. */
export const productTranslationSchema=z.object({features:z.array(z.string().max(3000).refine(value=>!/[\u3400-\u9fff]/u.test(value),'Use translated customer-facing text.')).max(30).optional(),care:text(2000),sizingNote:text(2000),description:text(5000),details:text(5000),composition:text(2000),fit:text(2000),seoTitle:text(70),seoDescription:text(320)}).strict();
export const productTranslationsSchema=z.object({en:productTranslationSchema.optional(),nl:productTranslationSchema.optional(),fr:productTranslationSchema.optional(),de:productTranslationSchema.optional()}).strict();
