import {z} from 'zod';
import {b2bInvitation,requireB2BEnabled} from '@/lib/b2b-auth';
import {b2bAdminData,b2bAdminInput,changeB2BOrder,saveB2BAccount} from '@/lib/b2b-service';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor,requireAdmin} from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const owner={id:'owner',name:'BIG K',role:'owner' as const},headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{await requireAdmin(req);requireB2BEnabled();return Response.json(await b2bAdminData(owner),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);requireB2BEnabled();await rateLimitVisitor(req,'b2b-admin',60,60,1000);const p=b2bAdminInput.parse(await body(req));
 if(p.action==='create')return Response.json(await saveB2BAccount(owner,p.data),{headers});
 if(p.action==='update')return Response.json(await saveB2BAccount(owner,p.data,{id:p.id,version:p.version,active:p.active}),{headers});
 if(p.action==='invite')return Response.json(await b2bInvitation(p.id),{headers});
 return Response.json(await changeB2BOrder(owner,p),{headers});
 }catch(e){return failure(e instanceof z.ZodError?new HttpError(400,e.issues[0]?.message||'Controleer de ingevulde gegevens.'):e);}}
