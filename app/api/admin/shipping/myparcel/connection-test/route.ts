import {requireAdmin,rateLimit,failure} from '@/lib/security';
import {checkMyParcelConnection} from '@/lib/myparcel-orders';
export const runtime='nodejs';
export const dynamic='force-dynamic';
/** Only an authenticated 200 shipment response proves account access. */
export async function GET(req:Request){try{await requireAdmin(req);await rateLimit('admin-myparcel-connection-test',5,300);return Response.json(await checkMyParcelConnection(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e)}}
