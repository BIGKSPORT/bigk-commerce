import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {beginStaffSetup,finishStaffSetup} from '@/lib/staff-access';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);await rateLimitVisitor(req,'staff-setup',10,300,1000);const p=z.discriminatedUnion('action',[
 z.object({action:z.literal('begin'),token:z.string().max(100)}).strict(),
 z.object({action:z.literal('finish'),token:z.string().max(100),password:z.string().min(16).max(256),code:z.string().max(100)}).strict(),
]).safeParse(await body(req));if(!p.success)throw new HttpError(400,'Check your setup details.');const d=p.data;return Response.json(d.action==='begin'?await beginStaffSetup(d.token):await finishStaffSetup(d.token,d.password,d.code),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
