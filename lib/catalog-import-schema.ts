import {z} from 'zod';
import {editProductSchema} from './admin-catalog';
export const importOperationSchema=editProductSchema.extend({createCode:z.string().regex(/^\d{8}$/).optional()}).refine(value=>!value.createCode||(!value.active&&!value.approved&&value.version===0&&Boolean(value.name&&value.slug)&&value.variants.every(v=>Boolean(v.size)&&/^V-[0-9a-f-]{36}$/.test(v.id))&&/^P-[0-9a-f-]{36}$/.test(value.id)),'New imported products must be unapproved drafts.');
export type ImportOperation=z.infer<typeof importOperationSchema>;
