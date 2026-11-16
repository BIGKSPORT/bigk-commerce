import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {changeSeller,changeSellerEmail,inviteSeller,salesActor} from '@/lib/sales-auth';
import {changeSalesOrder,setSalesCredit} from '@/lib/sales-service';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);const actor=await salesActor(req,true);await rateLimitVisitor(req,'seller-admin',40,60,1000);const p=z.discriminatedUnion('action',[
 z.object({action:z.literal('invite'),name:z.string().trim().min(2).max(80),email:z.email().max(254)}).strict(),
 z.object({action:z.enum(['disable','reset']),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('email'),id:z.string().uuid(),email:z.email().max(254)}).strict(),
 z.object({action:z.literal('credit'),id:z.string().uuid(),approved:z.boolean()}).strict(),
 z.object({action:z.literal('paid'),id:z.string().uuid(),reference:z.string().trim().min(4).max(150)}).strict()
 ]).safeParse(await body(req));if(!p.success)throw new HttpError(400,'Controleer de ingevulde gegevens.');const v=p.data;
 const result=v.action==='invite'?await inviteSeller(actor,v.name,v.email):v.action==='email'?await changeSellerEmail(actor,v.id,v.email):v.action==='credit'?await setSalesCredit(actor,v.id,v.approved):v.action==='paid'?await changeSalesOrder(actor,v.id,'paid',v.reference):await changeSeller(actor,v.id,v.action);
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}
