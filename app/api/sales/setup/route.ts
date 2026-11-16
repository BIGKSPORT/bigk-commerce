import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {beginSellerSetup,finishSellerSetup,requireSalesEnabled} from '@/lib/sales-auth';
export const runtime='nodejs';
export async function POST(req:Request){try{requireSalesEnabled();checkOrigin(req);await rateLimitVisitor(req,'seller-setup',12,300,1000);const p=z.discriminatedUnion('action',[z.object({action:z.literal('begin'),token:z.string().max(100)}).strict(),z.object({action:z.literal('finish'),token:z.string().max(100),password:z.string().min(16).max(256),code:z.string().max(100)}).strict()]).safeParse(await body(req));if(!p.success)throw new HttpError(400,'Controleer je wachtwoord en code.');return Response.json(p.data.action==='begin'?await beginSellerSetup(p.data.token):await finishSellerSetup(p.data.token,p.data.password,p.data.code),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
