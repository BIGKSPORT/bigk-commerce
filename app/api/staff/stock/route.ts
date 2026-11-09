import {body,checkOrigin,failure,HttpError} from '@/lib/security';
import {requireOperator} from '@/lib/staff-access';
import {adjustStock,stockAdjustment,stockPage} from '@/lib/stock-operations';
import {requireFeature} from '@/lib/shop-features';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireFeature('staff_portal');await requireOperator(req,'stock_manager');const params=new URL(req.url).searchParams,page=Number(params.get('page')||1),q=params.get('q')||'';if(!Number.isSafeInteger(page)||page<1||page>100000||q.length>100)throw new HttpError(400,'Invalid stock search.');return Response.json(await stockPage(q,page),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function PATCH(req:Request){try{checkOrigin(req);await requireFeature('staff_portal');const actor=await requireOperator(req,'stock_manager'),p=stockAdjustment.safeParse(await body(req));if(!p.success)throw new HttpError(400,'Enter a whole stock quantity and a reason of at least 10 characters.');return Response.json(await adjustStock(p.data,actor));}catch(e){return failure(e);}}
