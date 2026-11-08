import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,requireAdmin,rateLimit} from '@/lib/security';
import {issueInvoice} from '@/lib/order-invoices';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);await rateLimit('invoice-issue',30,3600);const p=z.object({orderId:z.uuid()}).strict().safeParse(await body(req));if(!p.success)throw new HttpError(400,'Choose a valid paid order.');const invoice=await issueInvoice(p.data.orderId);return Response.json({number:invoice.number,path:'/admin/orders/'+p.data.orderId+'/invoice'},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
