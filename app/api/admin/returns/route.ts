import {body,checkOrigin,requireAdmin,failure,HttpError} from '@/lib/security';
import {db} from '@/lib/db';
import {returnSchema,recordCompletedReturn,returnLines} from '@/lib/admin-returns';
export async function GET(req:Request){try{await requireAdmin(req);const id=new URL(req.url).searchParams.get('orderId');if(!id||id.length>100)throw new HttpError(400,'Choose an order.');return Response.json({lines:await returnLines(id),history:await db().prepare('SELECT * FROM admin_returns WHERE order_id=? ORDER BY created_at DESC').all(id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const d=returnSchema.safeParse(await body(req));if(!d.success)throw new HttpError(400,'Provide cumulative refund amounts, a unique provider reference and the completed-refund confirmation.');return Response.json(await recordCompletedReturn(d.data))}catch(e){return failure(e)}}
