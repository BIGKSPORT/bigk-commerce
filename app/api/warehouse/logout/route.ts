import {checkOrigin,failure} from '@/lib/security';
import {warehouseCookie,revokeWarehouseSession} from '@/lib/warehouse-auth';
export async function POST(req:Request){try{checkOrigin(req);await revokeWarehouseSession(req);return Response.json({ok:true},{headers:{'Set-Cookie':warehouseCookie('',0),'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
