import {body,checkOrigin,failure,HttpError,requireAdmin,rateLimit} from '@/lib/security';
import {moveCategorySchema,moveProductCategory} from '@/lib/move-product-category';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);await rateLimit('admin-category-move',90,300);const parsed=moveCategorySchema.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Check the style, category and product versions.');return Response.json(await moveProductCategory(parsed.data),{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
