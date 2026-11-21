import {z} from 'zod';
import {salesDb} from './sales-db';
import {transaction} from './db';
import {b2bDb} from './b2b-db';
import {HttpError} from './security';
import {salesEvent} from './sales-auth';
import {commissionMonth} from './sales-commissions';
import {salesRules} from './sales-pricing';
import type {SalesActor} from './sales-types';

export const prospectStages=['prospect','contacted','interested','negotiation','converted','lost'] as const;
export const prospectInput=z.object({
 companyName:z.string().trim().min(2).max(150),
 vat:z.string().trim().max(20).default(''),
 contact:z.string().trim().min(2).max(100),
 email:z.email().max(254),
 phone:z.string().trim().max(50).default(''),
 notes:z.string().trim().max(4000).default(''),
 sellerId:z.string().uuid().nullable().optional()
}).strict();
export const prospectUpdate=z.object({
 id:z.string().uuid(),
 stage:z.enum(['prospect','contacted','interested','negotiation','lost']).optional(),
 notes:z.string().trim().max(4000).optional(),
 sellerId:z.string().uuid().nullable().optional()
}).strict();
export const crmAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('prospect.create'),data:prospectInput}).strict(),
 z.object({action:z.literal('prospect.update'),data:prospectUpdate}).strict(),
 z.object({action:z.literal('account.assign'),accountId:z.string().uuid(),sellerId:z.string().uuid().nullable()}).strict(),
 z.object({action:z.literal('account.contact'),accountId:z.string().uuid(),contact:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().trim().min(6).max(50),address:z.string().trim().min(5).max(500),postal:z.string().regex(/^\d{4}$/),city:z.string().trim().min(2).max(100)}).strict(),
 z.object({action:z.literal('prospect.convert'),prospectId:z.string().uuid(),accountId:z.string().uuid()}).strict(),
 z.object({action:z.literal('followup.create'),prospectId:z.string().uuid().optional(),accountId:z.string().uuid().optional(),sellerId:z.string().uuid().optional(),dueAt:z.string().datetime(),note:z.string().trim().min(2).max(2000)}).strict().refine(v=>!!(v.prospectId||v.accountId)&&!(v.prospectId&&v.accountId),'Kies één prospect of account.'),
 z.object({action:z.literal('followup.complete'),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('customer.activity'),customerId:z.string().uuid(),note:z.string().trim().min(2).max(2000)}).strict()
]);
function validBelgianVat(value:string){const vat=value.toUpperCase().replace(/^BE/,'');return /^[01]\d{9}$/.test(vat)&&97-Number(vat.slice(0,8))%97===Number(vat.slice(8));}
const ownerOnly=(actor:SalesActor)=>{if(actor.role!=='owner')throw new HttpError(403,'Alleen BIG K kan deze wijziging uitvoeren.');};
async function sellerExists(id:string){if(!await salesDb().prepare('SELECT id FROM seller_accounts WHERE id=? AND active=1').get(id))throw new HttpError(404,'Actieve verkoper niet gevonden.');}
async function ownedProspect(actor:SalesActor,id:string){const row=await salesDb().prepare('SELECT * FROM seller_prospects WHERE id=?'+(actor.role==='seller'?' AND seller_id=?':'')).get(id,...(actor.role==='seller'?[actor.id]:[]));if(!row)throw new HttpError(404,'Prospect niet gevonden.');return row;}
async function canAccessAccount(actor:SalesActor,id:string){
 if(actor.role==='owner')return;
 const a=await salesDb().prepare('SELECT account_id FROM seller_b2b_assignments WHERE account_id=? AND seller_id=?').get(id,actor.id);
 if(!a)throw new HttpError(404,'B2B-account niet gevonden.');
}
export async function salesCrmData(actor:SalesActor){
 b2bDb();
 const [allAccounts,assignments,prospects,followups,sellers,sellerCustomers,sellerOrders,b2bOrders,paidHistory,paidB2BHistory]=await Promise.all([
  actor.role==='owner'?b2bDb().prepare("SELECT a.*,(SELECT COUNT(*) FROM b2b_orders o WHERE o.account_id=a.id AND o.status IN ('paid','fulfilled')) AS paid_orders FROM b2b_accounts a ORDER BY a.name").all():salesDb().prepare("SELECT a.*,(SELECT COUNT(*) FROM b2b_orders o WHERE o.account_id=a.id AND o.status IN ('paid','fulfilled')) AS paid_orders FROM b2b_accounts a JOIN seller_b2b_assignments x ON x.account_id=a.id WHERE x.seller_id=? ORDER BY a.name").all(actor.id),
  salesDb().prepare('SELECT x.account_id,x.seller_id,a.name AS seller_name FROM seller_b2b_assignments x JOIN seller_accounts a ON a.id=x.seller_id'+(actor.role==='seller'?' WHERE x.seller_id=?':'')).all(...(actor.role==='seller'?[actor.id]:[])),
  salesDb().prepare('SELECT p.*,a.name AS seller_name FROM seller_prospects p LEFT JOIN seller_accounts a ON a.id=p.seller_id'+(actor.role==='seller'?' WHERE p.seller_id=?':'')+' ORDER BY p.updated_at DESC').all(...(actor.role==='seller'?[actor.id]:[])),
  salesDb().prepare('SELECT f.*,p.company_name AS prospect_name,b.name AS account_name FROM seller_followups f LEFT JOIN seller_prospects p ON p.id=f.prospect_id LEFT JOIN seller_b2b_assignments x ON x.account_id=f.account_id LEFT JOIN seller_accounts a ON a.id=f.seller_id LEFT JOIN b2b_accounts b ON b.id=f.account_id'+(actor.role==='seller'?' WHERE f.seller_id=? AND (p.seller_id=f.seller_id OR x.seller_id=f.seller_id)':'')+' ORDER BY f.completed_at IS NOT NULL,f.due_at ASC LIMIT 500').all(...(actor.role==='seller'?[actor.id]:[])),
  actor.role==='owner'?salesDb().prepare('SELECT id,name,email,active FROM seller_accounts ORDER BY name').all():Promise.resolve([]),
  salesDb().prepare('SELECT c.*,a.name AS seller_name,(SELECT MAX(x.activity_at) FROM seller_customer_activities x WHERE x.customer_id=c.id AND x.seller_id=c.seller_id) AS last_activity_at FROM seller_customers c JOIN seller_accounts a ON a.id=c.seller_id'+(actor.role==='seller'?' WHERE c.seller_id=?':'')+' ORDER BY c.name').all(...(actor.role==='seller'?[actor.id]:[])),
  salesDb().prepare('SELECT o.*,c.name AS customer_name,a.name AS seller_name FROM seller_orders o JOIN seller_customers c ON c.id=o.customer_id JOIN seller_accounts a ON a.id=o.seller_id'+(actor.role==='seller'?' WHERE o.seller_id=?':'')+' ORDER BY o.created_at DESC LIMIT 500').all(...(actor.role==='seller'?[actor.id]:[])),
  actor.role==='owner'?b2bDb().prepare('SELECT * FROM b2b_orders ORDER BY created_at DESC LIMIT 500').all():salesDb().prepare('SELECT o.* FROM b2b_orders o JOIN seller_b2b_assignments x ON x.account_id=o.account_id WHERE x.seller_id=? ORDER BY o.created_at DESC LIMIT 500').all(actor.id),
  salesDb().prepare('SELECT customer_id,seller_id,quote,updated_at FROM seller_orders WHERE status=\'paid\''+(actor.role==='seller'?' AND seller_id=?':'')+' ORDER BY updated_at ASC').all(...(actor.role==='seller'?[actor.id]:[])),
  salesDb().prepare("SELECT account_id AS customer_id,commission_seller_id AS seller_id,commission_bonus_cents,COALESCE(commission_paid_at,updated_at) AS updated_at FROM b2b_orders WHERE status IN ('paid','fulfilled') AND commission_seller_id IS NOT NULL AND commission_bonus_cents>0"+(actor.role==='seller'?' AND commission_seller_id=?':'')+' ORDER BY COALESCE(commission_paid_at,updated_at) ASC').all(...(actor.role==='seller'?[actor.id]:[]))
 ]);
 const assignmentById=new Map(assignments.map((x:any)=>[String(x.account_id),x]));
 const visibleAccounts=allAccounts.filter((a:any)=>actor.role==='owner'||String((assignmentById.get(String(a.id)) as any)?.seller_id||'')===actor.id);
 const accountIds=new Set(visibleAccounts.map((a:any)=>String(a.id)));
 const visibleB2BOrders=b2bOrders.filter((o:any)=>accountIds.has(String(o.account_id)));
 const paidB2B=visibleB2BOrders.filter((o:any)=>['paid','fulfilled'].includes(String(o.status)));
 const paidSeller=sellerOrders.filter((o:any)=>['paid'].includes(String(o.status)));
 const revenue=[...paidB2B.map((o:any)=>Number(JSON.parse(String(o.quote)).total||0)),...paidSeller.map((o:any)=>Number(JSON.parse(String(o.quote)).total||0))].reduce((a,b)=>a+b,0);
 const pipeline=prospects.reduce((acc:any,p:any)=>(acc[String(p.stage)]=(acc[String(p.stage)]||0)+1,acc),{});
 const currentMonth=commissionMonth(new Date()),firstPaidByCustomer=new Map<string,{sellerId:string;updatedAt:string;quote:any}>();
 for(const row of paidHistory){const customerId=String(row.customer_id);if(!firstPaidByCustomer.has(customerId))firstPaidByCustomer.set(customerId,{sellerId:String(row.seller_id),updatedAt:String(row.updated_at),quote:JSON.parse(String(row.quote))});}
 const newStoresBySeller=new Map<string,number>();for(const first of firstPaidByCustomer.values())if(commissionMonth(new Date(first.updatedAt))===currentMonth&&Number(first.quote.subtotal)>=salesRules.firstMinimum)newStoresBySeller.set(first.sellerId,(newStoresBySeller.get(first.sellerId)||0)+1);for(const row of paidB2BHistory)if(commissionMonth(new Date(String(row.updated_at)))===currentMonth)newStoresBySeller.set(String(row.seller_id),(newStoresBySeller.get(String(row.seller_id))||0)+1);
 const performance=(actor.role==='owner'?sellers:[{id:actor.id,name:actor.name,email:'',active:1}]).map((s:any)=>{
  const ownedP=prospects.filter((p:any)=>String(p.seller_id||'')===String(s.id));
  const ownedAccountIds=new Set(assignments.filter((a:any)=>String(a.seller_id)===String(s.id)).map((a:any)=>String(a.account_id)));
  const accountOrders=visibleB2BOrders.filter((o:any)=>ownedAccountIds.has(String(o.account_id))&&['paid','fulfilled'].includes(String(o.status)));
  const salesOrders=sellerOrders.filter((o:any)=>String(o.seller_id)===String(s.id)&&o.status==='paid');
  const amount=[...accountOrders.map((o:any)=>Number(JSON.parse(String(o.quote)).total||0)),...salesOrders.map((o:any)=>Number(JSON.parse(String(o.quote)).total||0))].reduce((a,b)=>a+b,0);
  return {id:String(s.id),name:String(s.name),active:Number(s.active),prospects:ownedP.length,open:ownedP.filter((p:any)=>!['converted','lost'].includes(String(p.stage))).length,accounts:ownedAccountIds.size+sellerCustomers.filter((c:any)=>String(c.seller_id)===String(s.id)).length,orders:accountOrders.length+salesOrders.length,revenueCents:amount,newStoresThisMonth:newStoresBySeller.get(String(s.id))||0,monthlyTarget:salesRules.monthlyNewStoreTarget};
 });
 return {
  actor,
  emailDeliveryConfigured:actor.role==='owner'?Boolean(process.env.RESEND_API_KEY?.trim()&&process.env.EMAIL_FROM?.trim()&&process.env.APP_URL?.startsWith('https://')&&process.env.EMAIL_DELIVERY_ENABLED!=='false'):undefined,
  metrics:{prospects:prospects.length,openProspects:prospects.filter((p:any)=>!['converted','lost'].includes(String(p.stage))).length,followupsDue:followups.filter((f:any)=>!f.completed_at&&String(f.due_at)<=new Date().toISOString()).length,accounts:visibleAccounts.length+sellerCustomers.length,revenueCents:revenue,newStoresThisMonth:actor.role==='owner'?[...newStoresBySeller.values()].reduce((a,b)=>a+b,0):newStoresBySeller.get(actor.id)||0,monthlyTarget:actor.role==='owner'?performance.filter((s:any)=>s.active).length*salesRules.monthlyNewStoreTarget:salesRules.monthlyNewStoreTarget},
  pipeline,
  sellers:performance,
  prospects:prospects.map((p:any)=>({...p,id:String(p.id),sellerId:p.seller_id?String(p.seller_id):null,sellerName:p.seller_name||'Niet toegewezen',vatValid:!p.vat||validBelgianVat(String(p.vat)),stage:String(p.stage),createdAt:String(p.created_at),updatedAt:String(p.updated_at)})),
  followups:followups.map((f:any)=>({...f,id:String(f.id),sellerId:String(f.seller_id),prospectId:f.prospect_id?String(f.prospect_id):null,accountId:f.account_id?String(f.account_id):null,dueAt:String(f.due_at),completedAt:f.completed_at?String(f.completed_at):null})),
  accounts:visibleAccounts.map((a:any)=>{const assigned=assignmentById.get(String(a.id));return {id:String(a.id),name:String(a.name),vat:'BE'+String(a.vat),vatValid:validBelgianVat(String(a.vat)),email:String(a.email),contact:String(a.contact),phone:String(a.phone),address:String(a.address),postal:String(a.postal),city:String(a.city),active:!!Number(a.active),hasPaidOrder:Number(a.paid_orders)>0,sellerId:assigned?String(assigned.seller_id):null,sellerName:assigned?String(assigned.seller_name):'Niet toegewezen',orders:visibleB2BOrders.filter((o:any)=>String(o.account_id)===String(a.id)).length};}),
  sellerCustomers:sellerCustomers.map((c:any)=>{const lastActivityAt=c.last_activity_at?String(c.last_activity_at):null;return {id:String(c.id),name:String(c.name),vat:'BE'+String(c.vat),contact:String(c.contact),email:String(c.email),phone:String(c.phone),creditApproved:!!Number(c.credit_approved),sellerName:String(c.seller_name),lastActivityAt};}),
  orders:visibleB2BOrders.map((o:any)=>({id:String(o.id),accountId:String(o.account_id),status:String(o.status),totalCents:Number(JSON.parse(String(o.quote)).total||0),createdAt:String(o.created_at),customer:JSON.parse(String(o.customer))})),
  salesOrders:sellerOrders.map((o:any)=>({id:String(o.id),sellerId:String(o.seller_id),sellerName:String(o.seller_name),customerName:String(o.customer_name),status:String(o.status),totalCents:Number(JSON.parse(String(o.quote)).total||0),createdAt:String(o.created_at)}))
 };
}
export async function mutateSalesCrm(actor:SalesActor,action:z.infer<typeof crmAction>){
 const now=new Date().toISOString();
 if(action.action==='prospect.create')return transaction(async()=>{
  const data=action.data,sellerId=actor.role==='seller'?actor.id:(data.sellerId||null);
  if(sellerId)await sellerExists(sellerId);
  const vat=data.vat.toUpperCase().replace(/^BE/,'');
  if(data.vat){if(!/^[01]\d{9}$/.test(vat)||97-Number(vat.slice(0,8))%97!==Number(vat.slice(8)))throw new HttpError(400,'Ongeldig Belgisch btw-nummer.');if(await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE vat=?').get(vat))throw new HttpError(409,'Dit btw-nummer bestaat al als B2B-account. Koppel de bestaande klant.');if(await salesDb().prepare('SELECT id FROM seller_prospects WHERE vat=?').get(vat))throw new HttpError(409,'Dit btw-nummer staat al in de prospectpipeline.');}
  const id=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_prospects(id,seller_id,company_name,vat,contact,email,phone,stage,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,sellerId,data.companyName,vat,data.contact,data.email.toLowerCase(),data.phone,'prospect',data.notes,now,now);await salesEvent(actor,'crm.prospect_created',id);return {id};
 });
 if(action.action==='prospect.update')return transaction(async()=>{
  const row=await ownedProspect(actor,action.data.id),d=action.data;
  if(actor.role==='seller'&&d.sellerId!==undefined)throw new HttpError(403,'Alleen BIG K kan prospects opnieuw toewijzen.');
  if(d.sellerId!==undefined&&d.sellerId)await sellerExists(d.sellerId);
  const nextSeller=d.sellerId===undefined?row.seller_id:d.sellerId;
  await salesDb().prepare('UPDATE seller_prospects SET stage=?,notes=?,seller_id=?,updated_at=? WHERE id=?').run(d.stage||row.stage,d.notes===undefined?row.notes:d.notes,nextSeller,now,d.id);
  if(d.sellerId!==undefined&&d.sellerId)await salesDb().prepare('UPDATE seller_followups SET seller_id=? WHERE prospect_id=?').run(d.sellerId,d.id);
  await salesEvent(actor,'crm.prospect_updated',d.id);return {ok:true};
 });
 if(action.action==='account.assign')return transaction(async()=>{
  ownerOnly(actor);if(action.sellerId)await sellerExists(action.sellerId);
  if(!await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE id=?').get(action.accountId))throw new HttpError(404,'B2B-account niet gevonden.');
  if(action.sellerId){await salesDb().prepare('INSERT INTO seller_b2b_assignments(account_id,seller_id,assigned_at) VALUES(?,?,?) ON CONFLICT(account_id) DO UPDATE SET seller_id=excluded.seller_id,assigned_at=excluded.assigned_at').run(action.accountId,action.sellerId,now);await salesDb().prepare('UPDATE seller_followups SET seller_id=? WHERE account_id=?').run(action.sellerId,action.accountId);}
  else await salesDb().prepare('DELETE FROM seller_b2b_assignments WHERE account_id=?').run(action.accountId);
  await salesEvent(actor,'crm.account_assigned',action.accountId);return {ok:true};
 });
 if(action.action==='account.contact')return transaction(async()=>{
  await canAccessAccount(actor,action.accountId);
  const account=await b2bDb().prepare('SELECT id,email FROM b2b_accounts WHERE id=?').get(action.accountId);if(!account)throw new HttpError(404,'B2B-account niet gevonden.');
  const email=action.email.toLowerCase().trim(),emailChanged=email!==String(account.email).toLowerCase();
  if(await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE email=? AND id<>?').get(email,action.accountId))throw new HttpError(409,'Dit e-mailadres is al aan een ander B2B-account gekoppeld.');
  if(emailChanged)await b2bDb().prepare('UPDATE b2b_accounts SET contact=?,email=?,phone=?,address=?,postal=?,city=?,version=version+1,updated_at=? WHERE id=?').run(action.contact,email,action.phone,action.address,action.postal,action.city,now,action.accountId);
  else await b2bDb().prepare('UPDATE b2b_accounts SET contact=?,phone=?,address=?,postal=?,city=?,updated_at=? WHERE id=?').run(action.contact,action.phone,action.address,action.postal,action.city,now,action.accountId);
  if(emailChanged){await b2bDb().prepare('DELETE FROM b2b_sessions WHERE account_id=?').run(action.accountId);await b2bDb().prepare('DELETE FROM b2b_links WHERE account_id=?').run(action.accountId);}
  await salesEvent(actor,'b2b.account_contact_updated',action.accountId);return {ok:true,sessionsRevoked:emailChanged};
 });
 if(action.action==='prospect.convert')return transaction(async()=>{
  ownerOnly(actor);const p=await ownedProspect(actor,action.prospectId);
  if(!await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE id=?').get(action.accountId))throw new HttpError(404,'B2B-account niet gevonden.');
  if(p.seller_id){const current=await salesDb().prepare('SELECT seller_id FROM seller_b2b_assignments WHERE account_id=?').get(action.accountId);if(current&&String(current.seller_id)!==String(p.seller_id))throw new HttpError(409,'Dit B2B-account is al aan een andere verkoper toegewezen. Controleer de klantverantwoordelijke.');if(!current)await salesDb().prepare('INSERT INTO seller_b2b_assignments(account_id,seller_id,assigned_at) VALUES(?,?,?)').run(action.accountId,p.seller_id,now);}
  await salesDb().prepare("UPDATE seller_prospects SET stage='converted',converted_account_id=?,updated_at=? WHERE id=?").run(action.accountId,now,action.prospectId);
  await salesEvent(actor,'crm.prospect_converted',action.prospectId);return {ok:true};
 });
 if(action.action==='followup.create')return transaction(async()=>{
  const sellerId=actor.role==='seller'?actor.id:(action.sellerId||'');if(!sellerId)throw new HttpError(400,'Wijs de opvolging eerst aan een verkoper toe.');await sellerExists(sellerId);
  if(actor.role==='seller'&&action.sellerId&&action.sellerId!==actor.id)throw new HttpError(403,'Je kunt alleen je eigen opvolgingen aanmaken.');
  if(action.prospectId){const p=await ownedProspect(actor,action.prospectId);if(String(p.seller_id||'')!==sellerId)throw new HttpError(409,'Wijs de prospect eerst aan deze verkoper toe.');}
  if(action.accountId){await canAccessAccount(actor,action.accountId);const assigned=await salesDb().prepare('SELECT seller_id FROM seller_b2b_assignments WHERE account_id=?').get(action.accountId);if(!assigned||String(assigned.seller_id)!==sellerId)throw new HttpError(409,'Wijs het B2B-account eerst toe aan deze verkoper.');}
  const id=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_followups(id,seller_id,prospect_id,account_id,due_at,note,created_at) VALUES(?,?,?,?,?,?,?)').run(id,sellerId,action.prospectId||null,action.accountId||null,action.dueAt,action.note,now);await salesEvent(actor,'crm.followup_created',id);return {id};
 });
 if(action.action==='customer.activity')return transaction(async()=>{
  const customer=await salesDb().prepare('SELECT id,seller_id FROM seller_customers WHERE id=?'+(actor.role==='seller'?' AND seller_id=?':'')).get(action.customerId,...(actor.role==='seller'?[actor.id]:[]));if(!customer)throw new HttpError(404,'Winkel niet gevonden.');
  const id=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_customer_activities(id,seller_id,customer_id,activity_at,note,created_at) VALUES(?,?,?,?,?,?)').run(id,String(customer.seller_id),action.customerId,now,action.note,now);await salesEvent(actor,'crm.customer_activity',action.customerId);return {id};
 });
 if(action.action==='followup.complete')return transaction(async()=>{
  const row=await salesDb().prepare('SELECT id,prospect_id,account_id FROM seller_followups WHERE id=?'+(actor.role==='seller'?' AND seller_id=?':'')).get(action.id,...(actor.role==='seller'?[actor.id]:[]));if(!row)throw new HttpError(404,'Opvolging niet gevonden.');if(row.prospect_id)await ownedProspect(actor,String(row.prospect_id));if(row.account_id)await canAccessAccount(actor,String(row.account_id));
  await salesDb().prepare('UPDATE seller_followups SET completed_at=? WHERE id=?').run(now,action.id);await salesEvent(actor,'crm.followup_completed',action.id);return {ok:true};
 });
}
