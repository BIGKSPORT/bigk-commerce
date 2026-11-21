import {db,transaction,audit} from './db';
import {hash,HttpError,token} from './security';
import {upsertDiscountCode,setDiscountActive} from './discounts';
import {z} from 'zod';

export const applicationSchema=z.object({
 fullName:z.string().trim().min(2).max(120),
 email:z.email().max(254),
 socialUrl:z.string().trim().url().max(500),
 audienceNote:z.string().trim().min(10).max(1200),
 motivation:z.string().trim().min(20).max(2000),
 privacyAccepted:z.literal(true)
}).strict();
export type ApplicationInput=z.infer<typeof applicationSchema>;
const emailOf=(v:string)=>v.trim().toLowerCase();
const codeOf=(v:string)=>v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20);
export async function submitAmbassadorApplication(input:ApplicationInput){
 const v=applicationSchema.parse(input),email=emailOf(v.email),now=new Date().toISOString();
 return transaction(async()=>{
  const existing=await db().prepare("SELECT id,status FROM ambassador_applications WHERE lower(email)=? ORDER BY created_at DESC LIMIT 1").get(email) as {id:string;status:string}|undefined;
  if(existing?.status==='pending')throw new HttpError(409,'Er is al een open aanvraag met dit e-mailadres.');
  const id=crypto.randomUUID();
  await db().prepare("INSERT INTO ambassador_applications(id,email,full_name,social_url,audience_note,motivation,privacy_accepted_at,privacy_notice_version,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'2026-11-21','pending',?,?)").run(id,email,v.fullName,v.socialUrl,v.audienceNote,v.motivation,now,now,now);
  return {id,status:'pending' as const};
 });
}
export async function ambassadorWorkspace(){
 const [applications,ambassadors,commissions,payouts]=await Promise.all([
  db().prepare("SELECT id,email,full_name,social_url,audience_note,motivation,status,reviewed_at,review_note,created_at FROM ambassador_applications ORDER BY created_at DESC LIMIT 300").all(),
  db().prepare("SELECT * FROM ambassadors ORDER BY created_at DESC LIMIT 500").all(),
  db().prepare("SELECT c.*,a.display_name,a.email AS ambassador_email FROM ambassador_commissions c JOIN ambassadors a ON a.id=c.ambassador_id ORDER BY c.created_at DESC LIMIT 1000").all(),
  db().prepare("SELECT p.*,a.display_name,a.email AS ambassador_email FROM ambassador_payouts p JOIN ambassadors a ON a.id=p.ambassador_id ORDER BY p.created_at DESC LIMIT 500").all()
 ]);
 return {applications,ambassadors,commissions,payouts};
}
export async function reviewAmbassadorApplication(id:string,decision:'approve'|'reject',admin:string,note:string){
 return transaction(async()=>{
  const a=await db().prepare("SELECT * FROM ambassador_applications WHERE id=?").get(id) as Record<string,unknown>|undefined;
  if(!a||a.status!=='pending')throw new HttpError(409,'Deze aanvraag is niet meer open.');
  const now=new Date().toISOString();
  if(decision==='reject'){
   await db().prepare("UPDATE ambassador_applications SET status='rejected',reviewed_by=?,reviewed_at=?,review_note=?,updated_at=? WHERE id=? AND status='pending'").run(admin,now,note,now,id);
   await audit('ambassador.application.rejected',id);return {status:'rejected'};
  }
  const email=emailOf(String(a.email)),base=codeOf(String(a.full_name))||'AMBASSADOR';
  let referral='',discount='';
  for(let i=0;i<8;i++){
   const suffix=token().replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,6);
   const candidate=(base.slice(0,12)+'-'+suffix).slice(0,24);
   if(!await db().prepare("SELECT id FROM ambassadors WHERE referral_code=? OR discount_code=?").get(candidate,candidate)){referral=candidate;discount=candidate;break}
  }
  if(!referral)throw new HttpError(503,'Kon geen unieke ambassadeurscode aanmaken. Probeer opnieuw.');
  await upsertDiscountCode({code:discount,type:'percent',value:10,minSubtotalCents:0,maxRedemptions:null,perCustomerLimit:1,active:true,note:'BIG K Ambassador — '+String(a.full_name)});
  const ambassadorId=crypto.randomUUID();
  await db().prepare("INSERT INTO ambassadors(id,application_id,email,display_name,referral_code,discount_code,customer_discount_percent,commission_percent,status,approved_by,approved_at,created_at) VALUES(?,?,?,?,?,?,10,10,'active',?,?,?)").run(ambassadorId,id,email,String(a.full_name),referral,discount,admin,now,now);
  await db().prepare("UPDATE ambassador_applications SET status='approved',reviewed_by=?,reviewed_at=?,review_note=?,updated_at=? WHERE id=? AND status='pending'").run(admin,now,note,now,id);
  await audit('ambassador.application.approved',id);
  return {status:'approved',ambassadorId,referralCode:referral,discountCode:discount};
 });
}
export async function setAmbassadorStatus(id:string,status:'active'|'paused'|'terminated',reason:string,admin:string){
 return transaction(async()=>{
  const row=await db().prepare("SELECT discount_code FROM ambassadors WHERE id=?").get(id) as {discount_code:string}|undefined;
  if(!row)throw new HttpError(404,'Ambassadeur niet gevonden.');
  await db().prepare("UPDATE ambassadors SET status=?,terminated_at=?,termination_reason=? WHERE id=?").run(status,status==='terminated'?new Date().toISOString():null,reason,id);
  await setDiscountActive(row.discount_code,status==='active');
  await audit('ambassador.status.'+status,id);
 });
}
export async function attributeAmbassadorOrder(orderId:string,code:string,email:string,subtotalCents:number,discountCents:number){
 const normalized=code.trim().toUpperCase();
 const a=await db().prepare("SELECT id,discount_code,status FROM ambassadors WHERE upper(discount_code)=?").get(normalized) as {id:string;discount_code:string;status:string}|undefined;
 if(!a)return false;
 if(a.status!=='active')throw new HttpError(400,'Deze ambassadeurscode is niet actief.');
 if(!Number.isSafeInteger(subtotalCents)||!Number.isSafeInteger(discountCents)||subtotalCents<=0||discountCents<0||discountCents>subtotalCents)throw new HttpError(400,'Ongeldige bestelbasis voor ambassadeurscode.');
 const customerHash=hash(emailOf(email));
 const own=await db().prepare("SELECT id FROM ambassadors WHERE id=? AND lower(email)=?").get(a.id,emailOf(email));
 if(own)throw new HttpError(400,'Een ambassadeur kan de eigen code niet gebruiken.');
 const id=crypto.randomUUID();
 await db().prepare("INSERT INTO ambassador_attributions(id,ambassador_id,order_id,customer_email_hash,discount_code,product_subtotal_cents,discount_cents) VALUES(?,?,?,?,?,?,?)").run(id,a.id,orderId,customerHash,a.discount_code,subtotalCents,discountCents);
 const net=0;
 const commission=0;
 await db().prepare("INSERT INTO ambassador_commissions(id,attribution_id,ambassador_id,order_id,eligible_product_net_cents,commission_percent,commission_cents,status,hold_reason) VALUES(?,?,?,?,?,10,?,'pending','delivery_and_returns_pending')").run(crypto.randomUUID(),id,a.id,orderId,net,commission);
 return true;
}
export async function updateAmbassadorRefund(orderId:string,refundedProductNetCents:number,reference:string){
 if(!Number.isSafeInteger(refundedProductNetCents)||refundedProductNetCents<0)throw new HttpError(400,'Ongeldig terugbetaald bedrag.');
 return transaction(async()=>{
  const c=await db().prepare("SELECT * FROM ambassador_commissions WHERE order_id=?").get(orderId) as Record<string,unknown>|undefined;
  if(!c)return;
  const original=Number(c.eligible_product_net_cents),remaining=Math.max(0,original-refundedProductNetCents),commission=Math.floor(remaining*Number(c.commission_percent)/100);
  const status=remaining===0?'reversed':'held';
  await db().prepare("UPDATE ambassador_commissions SET eligible_product_net_cents=?,commission_cents=?,status=?,hold_reason=?,updated_at=? WHERE order_id=? AND status<>'paid'").run(remaining,commission,status,'refund_review:'+reference,new Date().toISOString(),orderId);
  await audit('ambassador.commission.refund_review',orderId);
 });
}
export async function markAmbassadorCommissionEligible(orderId:string,reviewedBy:string,deliveredAt:string,returnsClosedAt:string,verifiedNetCents:number){
 const latest=Math.max(Date.parse(deliveredAt),Date.parse(returnsClosedAt));
 if(!Number.isFinite(latest)||latest>Date.now()||Date.parse(returnsClosedAt)<Date.parse(deliveredAt))throw new HttpError(400,'Levering en retourcontrole moeten in de juiste volgorde bevestigd zijn.');
 if(!Number.isSafeInteger(verifiedNetCents)||verifiedNetCents<0)throw new HttpError(400,'Vul de geverifieerde productbasis exclusief btw in.');
 return transaction(async()=>{
  const c=await db().prepare("SELECT c.*,t.product_subtotal_cents,t.discount_cents FROM ambassador_commissions c JOIN ambassador_attributions t ON t.id=c.attribution_id WHERE c.order_id=?").get(orderId) as Record<string,unknown>|undefined;
  if(!c||c.status!=='pending')throw new HttpError(409,'Commissie is niet meer in afwachting.');
  const paid=await db().prepare("SELECT status FROM orders WHERE id=?").get(orderId);
  if(!paid||!['paid','fulfilled'].includes(String(paid.status)))throw new HttpError(409,'Bestelling is niet betaald.');
  if(verifiedNetCents>Math.max(0,Number(c.product_subtotal_cents)-Number(c.discount_cents)))throw new HttpError(400,'De btw-exclusieve productbasis kan niet hoger zijn dan de netto orderbasis.');
  await db().prepare("UPDATE ambassador_commissions SET eligible_product_net_cents=?,commission_cents=?,status='eligible',hold_reason='',eligible_at=?,updated_at=? WHERE order_id=? AND status='pending'").run(verifiedNetCents,Math.floor(verifiedNetCents*Number(c.commission_percent)/100),new Date(latest).toISOString(),new Date().toISOString(),orderId);
  await audit('ambassador.commission.eligible',orderId);
 });
}
export async function approveAmbassadorCommission(orderId:string,admin:string){
 return transaction(async()=>{
  const c=await db().prepare("SELECT * FROM ambassador_commissions WHERE order_id=?").get(orderId) as Record<string,unknown>|undefined;
  if(!c||c.status!=='eligible')throw new HttpError(409,'Alleen een eligible commissie kan worden goedgekeurd.');
  await db().prepare("UPDATE ambassador_commissions SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE order_id=? AND status='eligible'").run(admin,new Date().toISOString(),new Date().toISOString(),orderId);
  await audit('ambassador.commission.approved',orderId);
 });
}
export async function createAmbassadorPayout(ambassadorId:string,start:string,end:string,admin:string,invoiceReference:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start||!invoiceReference.trim())throw new HttpError(400,'Periode en factuurreferentie zijn verplicht.');
 return transaction(async()=>{
  const rows=await db().prepare("SELECT id,commission_cents FROM ambassador_commissions WHERE ambassador_id=? AND status='approved' AND payout_id IS NULL AND created_at>=? AND created_at<?").all(ambassadorId,start+'T00:00:00.000Z',new Date(Date.parse(end+'T00:00:00.000Z')+86400000).toISOString());
  const amount=rows.reduce((n,r)=>n+Number(r.commission_cents),0);
  if(amount<=0)throw new HttpError(409,'Geen goedgekeurde commissies in deze periode.');
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db().prepare("INSERT INTO ambassador_payouts(id,ambassador_id,period_start,period_end,amount_cents,status,invoice_reference,created_by,created_at) VALUES(?,?,?,?,?,'draft',?,?,?)").run(id,ambassadorId,start,end,amount,invoiceReference,admin,now);
  await db().prepare("UPDATE ambassador_commissions SET payout_id=? WHERE ambassador_id=? AND status='approved' AND payout_id IS NULL AND created_at>=? AND created_at<?").run(id,ambassadorId,start+'T00:00:00.000Z',new Date(Date.parse(end+'T00:00:00.000Z')+86400000).toISOString());
  await audit('ambassador.payout.draft',id);return {id,amountCents:amount,commissionIds:rows.map(r=>String(r.id))};
 });
}
export async function updateAmbassadorPayout(id:string,action:'approve'|'paid'|'cancel',admin:string,reference:string){
 return transaction(async()=>{
  const p=await db().prepare("SELECT * FROM ambassador_payouts WHERE id=?").get(id) as Record<string,unknown>|undefined;
  if(!p)throw new HttpError(404,'Uitbetaling niet gevonden.');
  const now=new Date().toISOString();
  if(action==='approve'&&p.status==='draft'){
   await db().prepare("UPDATE ambassador_payouts SET status='approved',approved_by=?,approved_at=? WHERE id=? AND status='draft'").run(admin,now,id);
  }else if(action==='paid'&&p.status==='approved'&&reference.trim()){
   await db().prepare("UPDATE ambassador_payouts SET status='paid',paid_by=?,paid_at=?,reference=? WHERE id=? AND status='approved'").run(admin,now,reference,id);
   await db().prepare("UPDATE ambassador_commissions SET status='paid',paid_at=?,updated_at=? WHERE payout_id=? AND status='approved'").run(now,now,id);
  }else if(action==='cancel'&&p.status==='draft'){
   await db().prepare("UPDATE ambassador_payouts SET status='cancelled' WHERE id=? AND status='draft'").run(id);
   await db().prepare("UPDATE ambassador_commissions SET payout_id=NULL WHERE payout_id=? AND status='approved'").run(id);
  }else throw new HttpError(409,'Deze uitbetalingsstatus kan niet worden gewijzigd.');
  await audit('ambassador.payout.'+action,id);
 });
}
export async function ambassadorPortal(email:string){
 const a=await db().prepare("SELECT id,display_name,referral_code,discount_code,status,approved_at FROM ambassadors WHERE lower(email)=?").get(emailOf(email)) as Record<string,unknown>|undefined;
 if(!a)return {ambassador:false};
 const [summary,commissions,payouts]=await Promise.all([
  db().prepare("SELECT status,COUNT(*) AS orders,COALESCE(SUM(commission_cents),0) AS cents FROM ambassador_commissions WHERE ambassador_id=? GROUP BY status").all(a.id),
  db().prepare("SELECT order_id,eligible_product_net_cents,commission_cents,status,created_at,eligible_at,paid_at FROM ambassador_commissions WHERE ambassador_id=? ORDER BY created_at DESC LIMIT 200").all(a.id),
  db().prepare("SELECT period_start,period_end,amount_cents,status,reference,paid_at FROM ambassador_payouts WHERE ambassador_id=? ORDER BY created_at DESC LIMIT 100").all(a.id)
 ]);
 return {ambassador:true,profile:a,summary,commissions,payouts};
}
