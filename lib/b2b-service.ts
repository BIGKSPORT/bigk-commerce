import {z} from 'zod';
import {db as storeDb,transaction} from './db';
import {salesDb} from './sales-db';
import {b2bDb as db} from './b2b-db';
import {b2bEvent} from './b2b-auth';
import {salesCatalogueData} from './sales-service';
import {b2bQuote} from './b2b-pricing';
import {salesRules} from './sales-pricing';
import {hash,HttpError} from './security';
import type {SalesActor} from './sales-types';
import type {B2BAccount,B2BOrder,B2BQuote} from './b2b-types';

export const b2bAccountInput=z.object({name:z.string().trim().min(2).max(150),vat:z.string().trim().regex(/^(?:BE)?[01][0-9]{9}$/i).transform(v=>v.toUpperCase().replace(/^BE/,'')).refine(v=>97-Number(v.slice(0,8))%97===Number(v.slice(8)),'Ongeldig Belgisch btw-nummer.'),email:z.email().max(254).transform(v=>v.toLowerCase()),contact:z.string().trim().min(2).max(100),phone:z.string().trim().min(6).max(50),address:z.string().trim().min(5).max(500),postal:z.string().regex(/^\d{4}$/),city:z.string().trim().min(2).max(100),verified:z.literal(true),directAccount:z.literal(true)}).strict();
export const b2bItems=z.array(z.object({variantId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(10000)}).strict()).min(1).max(250);
export const b2bOrderInput=z.object({items:b2bItems,quoteKey:z.string().regex(/^[a-f0-9]{64}$/),requestKey:z.string().uuid(),accepted:z.literal(true)}).strict();
export const b2bAdminInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),data:b2bAccountInput}).strict(),
 z.object({action:z.literal('update'),id:z.string().uuid(),version:z.number().int().positive(),data:b2bAccountInput,active:z.boolean()}).strict(),
 z.object({action:z.literal('invite'),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('confirm'),id:z.string().uuid(),version:z.number().int().positive(),invoiceReference:z.string().trim().min(2).max(150),paymentInstructions:z.string().trim().min(10).max(2000),paymentUrl:z.union([z.literal(''),z.url().max(2000).refine(v=>new URL(v).protocol==='https:','Gebruik een HTTPS-betaallink.')])}).strict(),
 z.object({action:z.literal('paid'),id:z.string().uuid(),version:z.number().int().positive(),reference:z.string().trim().min(4).max(150)}).strict(),
 z.object({action:z.literal('fulfil'),id:z.string().uuid(),version:z.number().int().positive(),tracking:z.string().trim().min(3).max(300)}).strict(),
 z.object({action:z.literal('cancel'),id:z.string().uuid(),version:z.number().int().positive()}).strict()
]);
function orderCommission(subtotal:number,rate:number,bonus:number){return Math.round(subtotal*rate)+bonus;}
function owner(actor:SalesActor){if(actor.role!=='owner')throw new HttpError(403,'Alleen BIG K kan B2B-klanten en betalingen beheren.');}
function accountRow(r:Record<string,unknown>):B2BAccount{return {id:String(r.id),name:String(r.name),vat:'BE'+r.vat,email:String(r.email),contact:String(r.contact),phone:String(r.phone),address:String(r.address),postal:String(r.postal),city:String(r.city),active:!!Number(r.active),version:Number(r.version),hasPaidOrder:Number(r.has_paid_order)>0};}
function orderRow(r:Record<string,unknown>):B2BOrder{return {id:String(r.id),accountId:String(r.account_id),version:Number(r.version),status:r.status as B2BOrder['status'],customer:JSON.parse(String(r.customer)),quote:JSON.parse(String(r.quote)),invoiceReference:String(r.invoice_reference),paymentInstructions:String(r.payment_instructions),paymentUrl:String(r.payment_url),paymentReference:String(r.payment_reference),tracking:String(r.tracking),createdAt:String(r.created_at),commissionSellerId:r.commission_seller_id?String(r.commission_seller_id):null};}
export async function b2bAccount(id:string){const r=await db().prepare("SELECT a.*,(SELECT COUNT(*) FROM b2b_orders o WHERE o.account_id=a.id AND o.status IN ('paid','fulfilled')) AS has_paid_order FROM b2b_accounts a WHERE a.id=?").get(id);if(!r)throw new HttpError(404,'B2B-account niet gevonden.');return accountRow(r);}
export async function b2bAdminData(actor:SalesActor){owner(actor);const [accounts,orders]=await Promise.all([db().prepare("SELECT a.*,(SELECT COUNT(*) FROM b2b_orders o WHERE o.account_id=a.id AND o.status IN ('paid','fulfilled')) AS has_paid_order FROM b2b_accounts a ORDER BY a.name").all(),db().prepare('SELECT * FROM b2b_orders ORDER BY created_at DESC LIMIT 200').all()]);return {accounts:accounts.map(accountRow),orders:orders.map(orderRow)};}
export async function saveB2BAccount(actor:SalesActor,data:z.infer<typeof b2bAccountInput>,update?:{id:string;version:number;active:boolean}){owner(actor);return transaction(async()=>{
 if(await db().prepare('SELECT id FROM b2b_accounts WHERE (email=? OR vat=?)'+(update?' AND id<>?':'')).get(data.email,data.vat,...(update?[update.id]:[])))throw new HttpError(409,'Dit e-mailadres of btw-nummer heeft al een B2B-account.');
 if(await salesDb().prepare('SELECT id FROM seller_customers WHERE vat=?').get(data.vat))throw new HttpError(409,'Deze winkel is al aan een verkoper gekoppeld. Controleer eerst de klanttoewijzing; maak geen dubbel rechtstreeks account.');
 const now=new Date().toISOString(),fields=[data.name,data.vat,data.email,data.contact,data.phone,data.address,data.postal,data.city];
 if(update){const current=await b2bAccount(update.id);if(current.version!==update.version)throw new HttpError(409,'Het account is gewijzigd. Vernieuw het overzicht.');if(current.vat!=='BE'+data.vat)throw new HttpError(409,'Het btw-nummer van een bestaand account kan niet worden gewijzigd.');
  await db().prepare('UPDATE b2b_accounts SET name=?,vat=?,email=?,contact=?,phone=?,address=?,postal=?,city=?,active=?,version=version+1,updated_at=? WHERE id=?').run(...fields,update.active?1:0,now,update.id);
  await db().prepare('DELETE FROM b2b_sessions WHERE account_id=?').run(update.id);await db().prepare('DELETE FROM b2b_links WHERE account_id=?').run(update.id);await b2bEvent(actor.id,'account.updated',update.id);return {id:update.id};
 }
 const id=crypto.randomUUID();await db().prepare('INSERT INTO b2b_accounts(id,name,vat,email,contact,phone,address,postal,city,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,...fields,now,now);await b2bEvent(actor.id,'account.approved_direct',id);return {id};
});}
export async function b2bWorkspace(accountId:string){const account=await b2bAccount(accountId);if(!account.active)throw new HttpError(403,'Dit B2B-account is uitgeschakeld.');const [catalogue,orders]=await Promise.all([salesCatalogueData(),db().prepare('SELECT * FROM b2b_orders WHERE account_id=? ORDER BY created_at DESC LIMIT 200').all(accountId)]);return {account,...catalogue,orders:orders.map(orderRow)};}
export async function calculateB2BQuote(accountId:string,items:z.infer<typeof b2bItems>){
 const account=await b2bAccount(accountId);if(!account.active)throw new HttpError(403,'Dit B2B-account is uitgeschakeld.');
 let quote:B2BQuote;try{quote=b2bQuote((await salesCatalogueData()).catalogue,items,account.hasPaidOrder);}catch(e){throw new HttpError(400,e instanceof Error?e.message:'Controleer de bestelling.');}
 for(const line of quote.lines)if(line.quantity>line.available)throw new HttpError(409,line.name+' '+line.colour+' '+line.size+': onvoldoende vrije voorraad.');
 if(!Number.isSafeInteger(quote.total))throw new HttpError(400,'Ongeldig orderbedrag.');
 const key=hash(JSON.stringify({accountId,version:account.version,lines:quote.lines.map(l=>({id:l.id,name:l.name,colour:l.colour,size:l.size,quantity:l.quantity,unitCents:l.unitCents})),subtotal:quote.subtotal,shipping:quote.shipping,vat:quote.vat,total:quote.total,minimum:quote.minimum}));
 return {quote,key};
}
export async function requestB2BOrder(accountId:string,input:z.infer<typeof b2bOrderInput>){return transaction(async()=>{
 const digest=hash(JSON.stringify(input)),old=await db().prepare('SELECT id,account_id,request_hash FROM b2b_orders WHERE request_key=?').get(input.requestKey);if(old){if(old.account_id!==accountId||old.request_hash!==digest)throw new HttpError(409,'Deze aanvraag is al gebruikt.');return {id:String(old.id)};}
 const account=await b2bAccount(accountId),{quote,key}=await calculateB2BQuote(accountId,input.items);
 if(key!==input.quoteKey)throw new HttpError(409,'Prijzen of voorwaarden zijn gewijzigd. Controleer de bestelling opnieuw.');if(!quote.minimumMet)throw new HttpError(409,'Minimum bestelbedrag nog niet bereikt.');
 const id=crypto.randomUUID(),now=new Date().toISOString(),assignment=await salesDb().prepare('SELECT seller_id FROM seller_b2b_assignments WHERE account_id=?').get(accountId),commissionSellerId=assignment?.seller_id?String(assignment.seller_id):null;await db().prepare('INSERT INTO b2b_orders(id,account_id,status,customer,quote,request_key,request_hash,agreement,commission_seller_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,accountId,'requested',JSON.stringify(account),JSON.stringify(quote),input.requestKey,digest,'b2b-stock-proforma-v1',commissionSellerId,now,now);await b2bEvent(accountId,'order.requested',id);return {id};
});}
export async function changeB2BOrder(actor:SalesActor,input:Extract<z.infer<typeof b2bAdminInput>,{action:'confirm'|'paid'|'fulfil'|'cancel'}>){owner(actor);return transaction(async()=>{
 const row=await db().prepare('SELECT * FROM b2b_orders WHERE id=?').get(input.id);if(!row)throw new HttpError(404,'Bestelling niet gevonden.');if(Number(row.version)!==input.version)throw new HttpError(409,'Deze bestelling is gewijzigd. Vernieuw het overzicht.');
 const order=orderRow(row);let status:B2BOrder['status'];
 if(input.action==='confirm'){
  if(order.status!=='requested')throw new HttpError(409,'Alleen een nieuwe aanvraag kan worden bevestigd.');if(!(await b2bAccount(order.accountId)).active)throw new HttpError(409,'Activeer het B2B-account voordat je een bestelling bevestigt.');
  for(const line of order.quote.lines){const result=await storeDb().prepare('UPDATE variants SET reserved=reserved+? WHERE id=? AND stock-reserved>=?').run(line.quantity,line.id,line.quantity);if(result.changes!==1)throw new HttpError(409,'Onvoldoende vrije voorraad voor '+line.name+' '+line.size+'.');}
  await db().prepare('UPDATE b2b_orders SET invoice_reference=?,payment_instructions=?,payment_url=? WHERE id=?').run(input.invoiceReference,input.paymentInstructions,input.paymentUrl,input.id);status='confirmed';
 }else if(input.action==='paid'){
  if(order.status!=='confirmed')throw new HttpError(409,'Bevestig de bestelling en proforma eerst.');if(await db().prepare("SELECT id FROM b2b_orders WHERE payment_reference=? AND status IN ('paid','fulfilled')").get(input.reference))throw new HttpError(409,'Deze betalingsreferentie is al gebruikt.');
  for(const line of order.quote.lines){const result=await storeDb().prepare('UPDATE variants SET stock=stock-?,reserved=reserved-? WHERE id=? AND stock>=? AND reserved>=?').run(line.quantity,line.quantity,line.id,line.quantity,line.quantity);if(result.changes!==1)throw new HttpError(409,'Controleer de voorraadreservering voor '+line.name+'.');}
  const prior=await db().prepare("SELECT id FROM b2b_orders WHERE account_id=? AND id<>? AND status IN ('paid','fulfilled') LIMIT 1").get(order.accountId,input.id),first=!prior,subtotal=Number(order.quote.subtotal||0),rate=first?salesRules.proformaRate:salesRules.reorderRate,bonus=first&&subtotal>=salesRules.firstMinimum?salesRules.openingBonus:0,commission=orderCommission(subtotal,rate,bonus);await db().prepare('UPDATE b2b_orders SET payment_reference=?,commission_rate=?,commission_bonus_cents=?,commission_cents=? WHERE id=?').run(input.reference,order.commissionSellerId?rate:0,order.commissionSellerId?bonus:0,order.commissionSellerId?commission:0,input.id);status='paid';
 }else if(input.action==='fulfil'){
  if(order.status!=='paid')throw new HttpError(409,'Verzending kan pas na geregistreerde volledige betaling.');await db().prepare('UPDATE b2b_orders SET tracking=? WHERE id=?').run(input.tracking,input.id);status='fulfilled';
 }else{
  if(!['requested','confirmed'].includes(order.status))throw new HttpError(409,'Betaalde of afgesloten orders kunnen hier niet worden geannuleerd.');
  if(order.status==='confirmed')for(const line of order.quote.lines){const result=await storeDb().prepare('UPDATE variants SET reserved=reserved-? WHERE id=? AND reserved>=?').run(line.quantity,line.id,line.quantity);if(result.changes!==1)throw new HttpError(409,'Controleer de voorraadreservering voor annulering.');}status='cancelled';
 }
 await db().prepare('UPDATE b2b_orders SET status=?,version=version+1,updated_at=? WHERE id=?').run(status,new Date().toISOString(),input.id);await b2bEvent(actor.id,'order.'+status,input.id);return {ok:true};
});}
export async function cancelB2BRequest(accountId:string,id:string,version:number){return transaction(async()=>{
 const row=await db().prepare('SELECT id,status,version FROM b2b_orders WHERE id=? AND account_id=?').get(id,accountId);if(!row)throw new HttpError(404,'Bestelling niet gevonden.');if(row.status!=='requested'||Number(row.version)!==version)throw new HttpError(409,'Vraag BIG K om deze bestelling aan te passen.');
 await db().prepare("UPDATE b2b_orders SET status='cancelled',version=version+1,updated_at=? WHERE id=?").run(new Date().toISOString(),id);await b2bEvent(accountId,'order.cancelled',id);return {ok:true};
});}
