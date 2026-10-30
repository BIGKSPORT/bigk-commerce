import {visibleProducts} from '@/lib/catalog-view';
import {products} from '@/lib/db';
import {expireReservations} from '@/lib/commerce';
import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {editProductSchema,newProductSchema,updateProduct,createProduct} from '@/lib/admin-catalog';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);await expireReservations();return Response.json({products:visibleProducts(await products())},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function PATCH(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=editProductSchema.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Invalid product values.');await updateProduct(parsed.data);return Response.json({ok:true})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=newProductSchema.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Check product name, eight-digit code, photos and sizes.');return Response.json({id:await createProduct(parsed.data)},{status:201})}catch(e){return failure(e)}}
