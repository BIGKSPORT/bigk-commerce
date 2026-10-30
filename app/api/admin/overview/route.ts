import {requireAdmin,failure} from '@/lib/security';
import {backofficeOverview} from '@/lib/admin-overview';
export async function GET(req:Request){try{await requireAdmin(req);return Response.json(await backofficeOverview(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
