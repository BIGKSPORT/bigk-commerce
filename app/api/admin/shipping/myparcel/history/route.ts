import {readMyParcelCost} from '@/lib/myparcel-costs';
import {requireAdmin,rateLimit,failure,HttpError} from '@/lib/security';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/**
 * Read-only accounting lookup. No shipment creation, labels, or carrier billing.
 * Includes no recipient names, addresses, tracking URLs, or secret credentials.
 */
export async function GET(req:Request) {
  try {
    await requireAdmin(req);
    await rateLimit('admin-myparcel-history',15,300);
    const url=new URL(req.url);
    const id=url.searchParams.get('shipmentId')||'';
    if(!/^[0-9]{1,16}$/.test(id))
      throw new HttpError(400,'Enter a valid numeric MyParcel shipment ID.');
    if(!process.env.MYPARCEL_BE_API_KEY)
      throw new HttpError(503,'MyParcel account API access is not configured.');
    const costs=await readMyParcelCost(id);
    return Response.json({source:'myparcel_historical_shipment',notLiveQuote:true,costs},{
      headers:{'Cache-Control':'no-store'}
    });
  } catch(error) { return failure(error); }
}
