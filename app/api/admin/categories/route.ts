import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {catalogCategories,categoryWriteSchema,writeCategory} from '@/lib/catalog-categories';
import {shopFeatures} from '@/lib/shop-features';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const enabled=(await shopFeatures()).category_management;return Response.json({enabled,categories:await catalogCategories()},{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=categoryWriteSchema.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Check the category name and translated labels.');await writeCategory(parsed.data);return Response.json({ok:true});}catch(error){return failure(error);}}
