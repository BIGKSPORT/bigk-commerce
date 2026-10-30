import {z} from 'zod';
import {getOrder} from '@/lib/commerce';
import {products} from '@/lib/db';
import {inspectSizeExchange} from '@/lib/customer-service-order-review';
import {body,checkOrigin,requireAdmin,rateLimit,failure,HttpError} from '@/lib/security';
export const runtime='nodejs';
const input=z.object({
 orderId:z.uuid(),
 originalVariantId:z.string().min(1).max(100),
 requestedVariantId:z.string().min(1).max(100),
}).strict();
/**
 * Authenticated merchant-only lookup. Does not trust client-side order,
 * payment, SKU, availability or customer information. Never mutates state.
 */
export async function POST(req:Request){
 try{
  checkOrigin(req);
  await requireAdmin(req);
  await rateLimit('admin-support-order-inspection',20,300);
  const parsed=input.safeParse(await body(req));
  if(!parsed.success)throw new HttpError(400,'Provide order and original/requested variant IDs.');
  const order=await getOrder(parsed.data.orderId);
  if(!order)throw new HttpError(404,'Order not found in this commerce database.');
  const catalog=await products();
  let review;
  try{review=inspectSizeExchange(order,parsed.data.originalVariantId,parsed.data.requestedVariantId,catalog)}
  catch{throw new HttpError(409,'Original variant is not part of this order.');}
  return Response.json({source:'verified_backoffice_snapshot',readOnly:true,
   orderAndStockVerifiedAgainstDatabase:true,
   shipmentCarrierAndDeliveryUnverified:true,review},{
    headers:{'Cache-Control':'private, no-store'},
  });
 }catch(e){return failure(e)}
}
