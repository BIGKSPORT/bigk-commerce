import {db} from '@/lib/db';
import {failure,HttpError} from '@/lib/security';
import {requireOperator} from '@/lib/staff-access';
import {requireFeature} from '@/lib/shop-features';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireFeature('staff_portal');await requireOperator(req,'warehouse_manager');const page=Number(new URL(req.url).searchParams.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>100000)throw new HttpError(400,'Invalid page.');const [rows,total]=await Promise.all([db().prepare("SELECT id,customer,created_at FROM orders WHERE status='paid' ORDER BY created_at,id LIMIT 25 OFFSET ?").all((page-1)*25),db().prepare("SELECT count(*) AS n FROM orders WHERE status='paid'").get()]);return Response.json({page,pageSize:25,total:Number(total?.n||0),orders:rows.map(r=>{const c=JSON.parse(String(r.customer));return {id:r.id,name:c.name||[c.firstName,c.lastName].filter(Boolean).join(' '),country:c.country,createdAt:r.created_at};})},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
