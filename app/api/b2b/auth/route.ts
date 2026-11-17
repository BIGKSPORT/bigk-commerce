import {z} from 'zod';
import {b2bActor,consumeB2BLink,requestB2BLink,requireB2BEnabled} from '@/lib/b2b-auth';
import {b2bDb} from '@/lib/b2b-db';
import {body,checkOrigin,cookieValue,failure,hash,HttpError,rateLimit,rateLimitVisitor,sessionCookie} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{return Response.json({id:await b2bActor(req)},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);requireB2BEnabled();await rateLimitVisitor(req,'b2b-login',10,300,500);const p=z.discriminatedUnion('action',[
 z.object({action:z.literal('request'),email:z.email().max(254).transform(v=>v.toLowerCase())}).strict(),z.object({action:z.literal('consume'),token:z.string().min(40).max(100)}).strict()
 ]).parse(await body(req));if(p.action==='request'){await rateLimit('b2b-email:'+hash(p.email),3,900);return Response.json(await requestB2BLink(p.email),{headers:{'Cache-Control':'no-store'}});}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':await consumeB2BLink(p.token),'Referrer-Policy':'no-referrer'}});
 }catch(e){return failure(e instanceof z.ZodError?new HttpError(400,'Controleer je e-mailadres of aanmeldlink.'):e);}}
export async function DELETE(req:Request){try{checkOrigin(req);requireB2BEnabled();const value=cookieValue(req,'bigk_b2b');if(value)await b2bDb().prepare('DELETE FROM b2b_sessions WHERE hash=?').run(hash('b2b-session:'+value));return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie('bigk_b2b','',0),'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
