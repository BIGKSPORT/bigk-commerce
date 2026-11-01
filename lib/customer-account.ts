import {z} from 'zod';
import {db,transaction} from './db';
import {cookieValue,hash,HttpError} from './security';
import {customers,customerFields,saveCustomer,recordConsent} from './customer-management';

export async function requireCustomer(req:Request){
 const value=cookieValue(req,'bigk_customer');
 const row=value?await db().prepare('SELECT email FROM customer_sessions WHERE hash=? AND expires_at>?').get(hash(value),new Date().toISOString()):undefined;
 if(!row)throw new HttpError(401,'Sign in to manage your account.');
 return String(row.email).trim().toLowerCase();
}
export const accountProfileSchema=customerFields.pick({firstName:true,lastName:true,phone:true,company:true,vatNumber:true,language:true,shippingAddress:true,billingAddress:true,postal:true,city:true,country:true});
export const accountUpdate=z.object({version:z.number().int().min(0),profile:accountProfileSchema,marketingSubscribed:z.boolean().optional()}).strict();
export async function accountProfile(email:string){
 const customer=(await customers()).find(c=>c.email===email);
 const profile=accountProfileSchema.strip().parse(customer||{firstName:'',lastName:'',phone:'',company:'',vatNumber:'',language:'en',shippingAddress:'',billingAddress:'',postal:'',city:'',country:''});
 return {profile,version:customer?.version||0,marketingStatus:customer?.marketingStatus||'unknown'};
}
export async function updateAccount(email:string,input:z.infer<typeof accountUpdate>){
 return transaction(async()=>{
  const current=(await customers()).find(c=>c.email===email);
  // Account email is session-owned. Internal notes, tags and historical orders never come from this request.
  const id=await saveCustomer({id:current?.id,version:input.version,email,fields:{...input.profile,tags:current?.tags||[],notes:current?.notes||'',archived:current?.archived||false}});
  if(input.marketingSubscribed!==undefined){
   const wanted=input.marketingSubscribed?'subscribed':'unsubscribed';
   if(wanted!==current?.marketingStatus)await recordConsent({customerId:id,status:wanted,source:'account_preferences',evidence:'Authenticated customer explicitly saved email marketing preference in their account.',occurredAt:new Date().toISOString()});
  }
  return accountProfile(email);
 });
}
