import {z} from 'zod';
import {productHistory,restoreProduct} from '@/lib/admin-catalog';
import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const id=new URL(req.url).searchParams.get('id');if(!id)throw new HttpError(400,'Choose a product.');return Response.json({history:await productHistory(id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const result=z.object({id:z.string().max(100),version:z.number().int().min(0),revisionId:z.string().max(150),restoreInventory:z.boolean().default(false)}).strict().safeParse(await body(req));if(!result.success)throw new HttpError(400,'Invalid restore request.');const p=result.data;await restoreProduct(p.id,p.version,p.revisionId,p.restoreInventory);return Response.json({ok:true,notice:'Revision restored as a draft. Review before publishing.'})}catch(e){return failure(e)}}
