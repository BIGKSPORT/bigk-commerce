import {body,checkOrigin,failure,HttpError,rateLimit,requireAdmin} from '@/lib/security';
import {customerMessageSchema,sendCustomerMessage} from '@/lib/customer-messages';
import {db} from '@/lib/db';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const id=new URL(req.url).searchParams.get('customerId')||'';if(!id||id.length>100)throw new HttpError(400,'Choose a customer.');const messages=await db().prepare('SELECT id,email,subject,status,created_at FROM customer_messages WHERE customer_id=? ORDER BY created_at DESC LIMIT 30').all(id);return Response.json({messages},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);await rateLimit('customer-service-email',20,3600);const p=customerMessageSchema.safeParse(await body(req));if(!p.success)throw new HttpError(400,'Enter a subject and customer-service message.');return Response.json(await sendCustomerMessage(p.data),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
