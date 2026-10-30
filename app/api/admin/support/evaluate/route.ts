import {z} from 'zod';
import {evaluateSupportCase} from '@/lib/customer-service-policy';
import {body,checkOrigin,requireAdmin,rateLimit,failure,HttpError} from '@/lib/security';

export const runtime='nodejs';
const schema=z.object({
 kind:z.enum(['size_exchange','withdrawal','wrong_item','defect','lost_delivery','other']),
 orderPaymentStatus:z.enum(['paid','fulfilled','pending','demo','cancelled','other']),
 daysSinceReceived:z.number().int().min(0).max(10000).nullable(),
 country:z.string().length(2),
 remoteArea:z.enum(['yes','no','unknown']),
 sameProductAndColor:z.boolean(),
 replacementAvailable:z.boolean(),
 priorFreeSizeExchange:z.boolean(),
}).strict();
/** Agent policy preview; intentionally NO database changes, emails or carrier calls. */
export async function POST(req:Request){
 try {
  checkOrigin(req);
  await requireAdmin(req);
  await rateLimit('admin-support-policy-preview',30,300);
  const parsed=schema.safeParse(await body(req));
  if(!parsed.success)throw new HttpError(400,'Provide valid support case inputs.');
  const result=evaluateSupportCase(parsed.data);
  return Response.json({policyOnly:true,orderAndStockNotVerified:true,result},{
   headers:{'Cache-Control':'no-store'}
  });
 }catch(e){return failure(e)}
}
