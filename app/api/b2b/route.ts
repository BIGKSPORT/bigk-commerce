import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {b2bActor} from '@/lib/b2b-auth';
import {b2bItems,b2bOrderInput,b2bWorkspace,calculateB2BQuote,cancelB2BRequest,requestB2BOrder} from '@/lib/b2b-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{return Response.json(await b2bWorkspace(await b2bActor(req)),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);const id=await b2bActor(req);await rateLimitVisitor(req,'b2b-write',40,60,500);const p=z.discriminatedUnion('action',[
 z.object({action:z.literal('quote'),items:b2bItems}).strict(),z.object({action:z.literal('order'),data:b2bOrderInput}).strict(),z.object({action:z.literal('cancel'),id:z.string().uuid(),version:z.number().int().positive()}).strict()
 ]).parse(await body(req));return Response.json(p.action==='quote'?await calculateB2BQuote(id,p.items):p.action==='order'?await requestB2BOrder(id,p.data):await cancelB2BRequest(id,p.id,p.version),{headers});}catch(e){return failure(e instanceof z.ZodError?new HttpError(400,e.issues[0]?.message||'Controleer de bestelling.'):e);}}
