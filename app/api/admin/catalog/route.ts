import {CategoryValidationError} from '@/lib/catalog-categories';
import {sharedProducts} from '@/lib/product-groups';
import {invalidProductResponse} from '@/lib/product-validation';
import {visibleProducts} from '@/lib/catalog-view';
import {products} from '@/lib/db';
import {expireReservations} from '@/lib/commerce';
import {body,boundedText,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {editProductSchema,newProductSchema,updateProduct,createProduct,productWarnings} from '@/lib/admin-catalog';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);await expireReservations();const catalog=visibleProducts(sharedProducts(await products()));return Response.json({products:catalog,warnings:catalog.map(p=>({id:p.id,warnings:productWarnings(p)}))},{headers:{'Cache-Control':'no-store'}})}catch(e){return catalogFailure(e)}}
export async function PATCH(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=editProductSchema.safeParse(JSON.parse(await boundedText(req,262144)));if(!parsed.success)return invalidProductResponse(parsed.error);await updateProduct(parsed.data);return Response.json({ok:true})}catch(e){return catalogFailure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=newProductSchema.safeParse(JSON.parse(await boundedText(req,262144)));if(!parsed.success)return invalidProductResponse(parsed.error);return Response.json({id:await createProduct(parsed.data)},{status:201})}catch(e){return catalogFailure(e)}}


function catalogFailure(error:unknown){return error instanceof CategoryValidationError?Response.json({error:error.message,fields:error.fields},{status:400,headers:{'Cache-Control':'no-store'}}):failure(error)}
