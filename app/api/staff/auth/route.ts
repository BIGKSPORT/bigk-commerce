import {z} from 'zod';
import {operationsDb as db} from '@/lib/operations-db';
import {body,checkOrigin,cookieValue,failure,hash,HttpError,rateLimitVisitor,sessionCookie} from '@/lib/security';
import {requireStaff,staffLogin} from '@/lib/staff-access';
export const runtime='nodejs';
export async function GET(req:Request){try{return Response.json({actor:await requireStaff(req)},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);await rateLimitVisitor(req,'staff-login',6,300,1000);const p=z.object({email:z.email().max(254),password:z.string().max(256),code:z.string().max(100)}).strict().safeParse(await body(req));if(!p.success)throw new HttpError(400,'Enter your email, password and authenticator code.');return Response.json({ok:true},{headers:{'Set-Cookie':await staffLogin(p.data.email,p.data.password,p.data.code),'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{checkOrigin(req);const value=cookieValue(req,'bigk_staff');if(value)await db().prepare('DELETE FROM staff_sessions WHERE hash=?').run(hash('staff:'+value));return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie('bigk_staff','',0),'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
