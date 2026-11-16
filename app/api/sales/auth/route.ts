import {z} from 'zod';
import {body,checkOrigin,cookieValue,failure,hash,HttpError,rateLimitVisitor,sessionCookie} from '@/lib/security';
import {requireSalesEnabled,salesActor,sellerLogin} from '@/lib/sales-auth';
import {salesDb} from '@/lib/sales-db';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{return Response.json({actor:await salesActor(req)},{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{requireSalesEnabled();checkOrigin(req);await rateLimitVisitor(req,'seller-login',6,300,1000);const p=z.object({email:z.email().max(254),password:z.string().max(256),code:z.string().max(100)}).strict().safeParse(await body(req));if(!p.success)throw new HttpError(400,'Vul e-mail, wachtwoord en authenticatorcode in.');return Response.json({ok:true},{headers:{...headers,'Set-Cookie':await sellerLogin(p.data.email,p.data.password,p.data.code)}});}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{requireSalesEnabled();checkOrigin(req);const value=cookieValue(req,'bigk_seller');if(value)await salesDb().prepare('DELETE FROM seller_sessions WHERE hash=?').run(hash('seller:'+value));return Response.json({ok:true},{headers:{...headers,'Set-Cookie':sessionCookie('bigk_seller','',0)}});}catch(e){return failure(e);}}
