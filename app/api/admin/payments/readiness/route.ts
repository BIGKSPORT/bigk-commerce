import {requireAdmin,failure} from '@/lib/security';
import {directRevolutReadiness} from '@/lib/revolut-preparation';
export const runtime='nodejs';
export async function GET(req:Request){try{
 await requireAdmin(req);
 return Response.json({directRevolut:directRevolutReadiness(),display:{reviewedAt:'2026-11-10',source:'BIGK live default Stripe payment method configuration',note:'A reviewed snapshot, not an automatic settings sync. Stripe determines eligibility at checkout.'}},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
