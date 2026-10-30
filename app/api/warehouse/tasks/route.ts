import {requireWarehouse} from '@/lib/warehouse-auth';
import {failure} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{const account=await requireWarehouse(req);return Response.json({account,picking:[],returns:[],readOnly:true},{headers:{'Cache-Control':'private, no-store'}})}catch(error){return failure(error)}}
