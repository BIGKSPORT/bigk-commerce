import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
import {salesActor} from '@/lib/sales-auth';
import {crmAction,mutateSalesCrm,salesCrmData} from '@/lib/sales-crm';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{return Response.json(await salesCrmData(await salesActor(req)),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);const actor=await salesActor(req);await rateLimitVisitor(req,'sales-crm-write',60,60,1000);const parsed=crmAction.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,parsed.error.issues[0]?.message||'Controleer de ingevulde gegevens.');return Response.json(await mutateSalesCrm(actor,parsed.data),{headers});}catch(e){return failure(e);}}
