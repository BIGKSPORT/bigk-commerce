import {accountProfile,accountUpdate,requireCustomer,updateAccount} from '@/lib/customer-account';
import {body,checkOrigin,failure,HttpError} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{return Response.json(await accountProfile(await requireCustomer(req)),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function PATCH(req:Request){try{checkOrigin(req);const email=await requireCustomer(req),parsed=accountUpdate.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Check your contact details and address.');return Response.json(await updateAccount(email,parsed.data),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
