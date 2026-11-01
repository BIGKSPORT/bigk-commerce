import {visibleProducts} from '@/lib/catalog-view';
import {products} from '@/lib/db';
import {expireReservations} from '@/lib/commerce';
import {body,boundedText,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {editProductSchema,newProductSchema,updateProduct,createProduct,productWarnings} from '@/lib/admin-catalog';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);await expireReservations();const catalog=visibleProducts(await products());return Response.json({products:catalog,warnings:catalog.map(p=>({id:p.id,warnings:productWarnings(p)}))},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function PATCH(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=editProductSchema.safeParse(JSON.parse(await boundedText(req,262144)));if(!parsed.success){const issue=parsed.error.issues.find(issue=>issue.path.includes('trade')||issue.path.includes('presentation'));throw new HttpError(400,issue?'Product data: '+issue.message:'Invalid product values.');}await updateProduct(parsed.data);return Response.json({ok:true})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=newProductSchema.safeParse(JSON.parse(await boundedText(req,262144)));if(!parsed.success)throw new HttpError(400,'Check product name, eight-digit code, photos and sizes.');return Response.json({id:await createProduct(parsed.data)},{status:201})}catch(e){return failure(e)}}
