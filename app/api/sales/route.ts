import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {salesActor} from '@/lib/sales-auth';
import {calculateSalesQuote,changeSalesOrder,createSalesCustomer,customerInput,orderInput,salesWorkspace,saveSalesOrder} from '@/lib/sales-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{return Response.json(await salesWorkspace(await salesActor(req)),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);const actor=await salesActor(req);await rateLimitVisitor(req,'sales-write',90,60,1000);const raw=await body(req),envelope=z.object({action:z.enum(['customer','quote','order','status']),data:z.unknown()}).strict().parse(raw);
 if(envelope.action==='customer')return Response.json(await createSalesCustomer(actor,customerInput.parse(envelope.data)),{headers});
 if(envelope.action==='status'){const p=z.object({id:z.string().uuid(),action:z.enum(['submit','cancel'])}).strict().parse(envelope.data);return Response.json(await changeSalesOrder(actor,p.id,p.action),{headers});}
 const input=orderInput.parse(envelope.data);return Response.json(envelope.action==='quote'?await calculateSalesQuote(actor,input):await saveSalesOrder(actor,input),{headers});
 }catch(e){return failure(e instanceof z.ZodError?new HttpError(400,e.issues[0]?.message||'Controleer de ingevulde gegevens.'):e);}}
