import {customerEmail} from '@/lib/club';
import {ambassadorPortal} from '@/lib/ambassadors';
import {failure} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{const email=await customerEmail(req);return Response.json(await ambassadorPortal(email),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}