import {z} from 'zod';
import {transaction} from './db';
import {operationsDb as db} from './operations-db';
import {customerDetail} from './customer-management';
import {emailDeliveryAllowed} from './email-policy';
import {hash,HttpError} from './security';
import {requireFeature} from './shop-features';
import {operationAudit,ownerActor} from './operations-audit';
export const customerMessageSchema=z.object({id:z.uuid(),customerId:z.string().min(1).max(100),subject:z.string().trim().min(3).max(200).refine(v=>!/[\r\n]/.test(v)),message:z.string().trim().min(10).max(10000),purpose:z.literal('customer_service')}).strict();
export async function sendCustomerMessage(input:z.infer<typeof customerMessageSchema>){
 await requireFeature('customer_email');const {customer}=await customerDetail(input.customerId);
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM||!emailDeliveryAllowed(customer.email))throw new HttpError(409,'Email delivery is disabled for this recipient in this environment.');
 const digest=hash(JSON.stringify([customer.id,customer.email,input.subject,input.message]));
 const existing=await transaction(async()=>{
  const previous=await db().prepare('SELECT request_hash,status,created_at FROM customer_messages WHERE id=?').get(input.id);
  if(previous){if(previous.request_hash!==digest)throw new HttpError(409,'This send request belongs to different content. Start a new message.');if(Date.now()-Date.parse(String(previous.created_at))>23*3600000&&previous.status!=='accepted')throw new HttpError(409,'This send request expired. Check the email provider before composing another message.');return previous;}
  await db().prepare('INSERT INTO customer_messages(id,customer_id,email,subject,body,request_hash,actor_id,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(input.id,customer.id,customer.email,input.subject,input.message,digest,ownerActor.id,'prepared',new Date().toISOString());
  await operationAudit(ownerActor,'customer.email_prepared',customer.id,{messageId:input.id});return null;
 });
 if(existing?.status==='accepted')return {ok:true,reused:true};
 let accepted=false;
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'bigk-customer-message-'+input.id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:customer.email,subject:input.subject,text:input.message}),signal:AbortSignal.timeout(10000)});accepted=response.ok;}catch{ /* An ambiguous attempt is retried only with the same provider key. */ }
 await transaction(async()=>{const row=await db().prepare('SELECT status FROM customer_messages WHERE id=?').get(input.id);if(row?.status==='accepted')return;await db().prepare('UPDATE customer_messages SET status=? WHERE id=?').run(accepted?'accepted':'failed',input.id);await operationAudit(ownerActor,accepted?'customer.email_accepted':'customer.email_failed',customer.id,{messageId:input.id});});
 if(!accepted)throw new HttpError(502,'The provider did not confirm acceptance. Retry this unchanged message to avoid duplicate delivery.');return {ok:true};
}
