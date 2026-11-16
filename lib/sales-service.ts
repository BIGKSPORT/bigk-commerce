import {z} from 'zod';
import {products,transaction} from './db';
import {salesDb as db} from './sales-db';
import {salesEvent} from './sales-auth';
import {HttpError,hash} from './security';
import {salesQuote} from './sales-pricing';
import type {SalesActor,SalesCustomer,SalesOrder,SalesProduct,SalesQuote,SalesWorkspace} from './sales-types';
const coreCodes=new Set(['25302101','25000701','25000702','25000703','25000704','25303001','25302901','25303101','25303102','25303201','25303202','25301601','25301603','25301701','25301702','25301801','25301802','25301803','25301902','25301903','25302701','25300801']);
export const customerInput=z.object({name:z.string().trim().min(2).max(150),vat:z.string().trim().regex(/^(?:BE)?[01][0-9]{9}$/i).transform(v=>v.toUpperCase().replace(/^BE/,'')).refine(v=>97-Number(v.slice(0,8))%97===Number(v.slice(8)),'Ongeldig Belgisch btw-nummer.'),contact:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().trim().min(6).max(50),address:z.string().trim().min(8).max(500)}).strict();
export const orderInput=z.object({customerId:z.string().uuid(),items:z.array(z.object({variantId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(10000)}).strict()).min(1).max(250),factor:z.union([z.literal(2.5),z.literal(2.7)]),terms:z.enum(['proforma','net30']),submit:z.boolean(),requestKey:z.string().uuid(),draftId:z.string().uuid().optional(),version:z.number().int().positive().optional()}).strict();
export async function salesCatalogue():Promise<SalesProduct[]>{return (await products()).flatMap(p=>{
 if(!p.priceCents)return [];const trade=p.content?.trade,article=trade?.supplierArticle||p.code;
 return p.variants.filter(v=>!trade?.identifiers?.[v.id]?.archived).map(v=>{
 const identity=trade?.identifiers?.[v.id],image=identity?.images?.[0]||p.images[0]||'';
 return {id:v.id,name:p.name,code:identity?.supplierArticle||article,image,colour:identity?.colour||trade?.colour||'',size:v.size,available:Math.max(0,v.stock-v.reserved),retailCents:p.priceCents!,footwear:/footwear|shoe|sneaker/i.test(p.category)||/^B10/i.test(article),core:coreCodes.has(article.match(/\d{8}$/)?.[0]||article)};
 });
 });}
function customerRow(r:Record<string,unknown>):SalesCustomer{return {id:String(r.id),name:String(r.name),vat:'BE'+r.vat,contact:String(r.contact),email:String(r.email),phone:String(r.phone),address:String(r.address),creditApproved:!!Number(r.credit_approved),hasPaidOrder:Number(r.has_paid_order)>0};}
function orderRow(r:Record<string,unknown>):SalesOrder{return {id:String(r.id),version:Number(r.version),customerId:String(r.customer_id),customerName:String(r.customer_name),sellerId:String(r.seller_id),sellerName:String(r.seller_name),status:r.status as SalesOrder['status'],terms:r.terms as SalesOrder['terms'],quote:JSON.parse(String(r.quote)),earnedCents:Number(r.earned_cents),createdAt:String(r.created_at),paymentReference:String(r.payment_reference)};}
export async function salesWorkspace(actor:SalesActor):Promise<SalesWorkspace>{
 const filter=actor.role==='owner'?'':' WHERE seller_id=?',params=actor.role==='owner'?[]:[actor.id];
 const [catalogue,customers,orders,accounts]=await Promise.all([salesCatalogue(),db().prepare('SELECT c.*,(SELECT COUNT(*) FROM seller_orders o WHERE o.customer_id=c.id AND o.status=\'paid\') AS has_paid_order FROM seller_customers c'+(actor.role==='owner'?'':' WHERE c.seller_id=?')+' ORDER BY c.name').all(...params),db().prepare('SELECT o.*,c.name AS customer_name,a.name AS seller_name FROM seller_orders o JOIN seller_customers c ON c.id=o.customer_id JOIN seller_accounts a ON a.id=o.seller_id'+(actor.role==='owner'?'':' WHERE o.seller_id=?')+' ORDER BY o.created_at DESC LIMIT 200').all(...params),actor.role==='owner'?db().prepare('SELECT id,name,email,active FROM seller_accounts ORDER BY name').all():Promise.resolve(undefined)]);
 return {actor,catalogue,customers:customers.map(customerRow),orders:orders.map(orderRow),accounts:accounts?.map(r=>({id:String(r.id),name:String(r.name),email:String(r.email),active:Number(r.active)}))};
}
export async function createSalesCustomer(actor:SalesActor,input:z.infer<typeof customerInput>){if(actor.role!=='seller')throw new HttpError(403,'Klanten worden aangemaakt vanuit een verkopersaccount.');return transaction(async()=>{
 if(await db().prepare('SELECT id FROM seller_customers WHERE vat=?').get(input.vat))throw new HttpError(409,'Dit btw-nummer is al geregistreerd. Vraag BIG K om de klanttoewijzing te controleren.');
 const id=crypto.randomUUID();await db().prepare('INSERT INTO seller_customers(id,seller_id,name,vat,contact,email,phone,address,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,actor.id,input.name,input.vat,input.contact,input.email,input.phone,input.address,new Date().toISOString());await salesEvent(actor,'customer.created',id);return {id};
});}
async function ownedCustomer(actor:SalesActor,id:string){const row=await db().prepare('SELECT * FROM seller_customers WHERE id=?'+(actor.role==='seller'?' AND seller_id=?':'')).get(id,...(actor.role==='seller'?[actor.id]:[]));if(!row)throw new HttpError(404,'Klant niet gevonden.');return row;}
async function firstOrder(customerId:string){return !await db().prepare("SELECT id FROM seller_orders WHERE customer_id=? AND status='paid'").get(customerId);}
export async function calculateSalesQuote(actor:SalesActor,input:z.infer<typeof orderInput>):Promise<SalesQuote>{
 const c=await ownedCustomer(actor,input.customerId),first=await firstOrder(input.customerId);
 if(input.terms==='net30'&&(!Number(c.credit_approved)||first))throw new HttpError(409,'30 dagen is alleen beschikbaar voor goedgekeurde klanten met een betaalde eerdere bestelling.');
 let quote:SalesQuote;try{quote=salesQuote(await salesCatalogue(),input.items,input.factor,input.terms,first);}catch(e){throw new HttpError(400,e instanceof Error?e.message:'Ongeldige bestelling.');}
 if(input.factor===2.7&&!quote.factorEligible)throw new HttpError(409,'Factor 2,7 vereist €2.000 core-kleding, berekend aan factor 2,5.');
 for(const line of quote.lines)if(line.quantity>line.available)throw new HttpError(409,line.name+' '+line.colour+' '+line.size+': onvoldoende beschikbare voorraad.');
 return quote;
}
export async function saveSalesOrder(actor:SalesActor,input:z.infer<typeof orderInput>){if(actor.role!=='seller')throw new HttpError(403,'Gebruik een verkopersaccount om bestellingen in te voeren.');return transaction(async()=>{
 const digest=hash(JSON.stringify(input)),old=await db().prepare('SELECT id,seller_id,request_hash FROM seller_orders WHERE request_key=?').get(input.requestKey);
 if(old){if(old.seller_id!==actor.id||old.request_hash!==digest)throw new HttpError(409,'Deze aanvraag is al gebruikt.');return {id:String(old.id)};}
 const quote=await calculateSalesQuote(actor,input);if(input.submit&&!quote.minimumMet)throw new HttpError(409,'Minimum bestelbedrag nog niet bereikt. Bewaar als concept.');
 if(input.draftId){const draft=await db().prepare('SELECT * FROM seller_orders WHERE id=? AND seller_id=?').get(input.draftId,actor.id);if(!draft)throw new HttpError(404,'Concept niet gevonden.');if(draft.status!=='draft'||Number(draft.version)!==input.version)throw new HttpError(409,'Dit concept is gewijzigd. Herlaad het overzicht.');await db().prepare('UPDATE seller_orders SET customer_id=?,status=?,terms=?,quote=?,request_key=?,request_hash=?,version=version+1,updated_at=? WHERE id=?').run(input.customerId,input.submit?'submitted':'draft',input.terms,JSON.stringify(quote),input.requestKey,digest,new Date().toISOString(),input.draftId);await salesEvent(actor,'order.updated',input.draftId);return {id:input.draftId};}
 const id=crypto.randomUUID(),now=new Date().toISOString();await db().prepare('INSERT INTO seller_orders(id,seller_id,customer_id,status,terms,quote,request_key,request_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,actor.id,input.customerId,input.submit?'submitted':'draft',input.terms,JSON.stringify(quote),input.requestKey,digest,now,now);
 await salesEvent(actor,input.submit?'order.submitted':'order.drafted',id);return {id};
});}
export async function setSalesCredit(actor:SalesActor,customerId:string,approved:boolean){if(actor.role!=='owner')throw new HttpError(403,'Alleen BIG K kan krediet goedkeuren.');return transaction(async()=>{await ownedCustomer(actor,customerId);await db().prepare('UPDATE seller_customers SET credit_approved=? WHERE id=?').run(approved?1:0,customerId);await salesEvent(actor,approved?'credit.approved':'credit.revoked',customerId);return {ok:true};});}
export async function changeSalesOrder(actor:SalesActor,id:string,action:'submit'|'paid'|'cancel',reference=''){return transaction(async()=>{
 const row=await db().prepare('SELECT * FROM seller_orders WHERE id=?'+(actor.role==='seller'?' AND seller_id=?':'')).get(id,...(actor.role==='seller'?[actor.id]:[]));if(!row)throw new HttpError(404,'Bestelling niet gevonden.');
 if(row.status==='paid'||row.status==='cancelled')throw new HttpError(409,'Deze bestelling is afgesloten.');
 let quote=JSON.parse(String(row.quote)) as SalesQuote;
 if(action==='paid'){
 if(actor.role!=='owner')throw new HttpError(403,'Alleen BIG K kan ontvangen betalingen registreren.');
 if(row.status!=='submitted'||reference.trim().length<4)throw new HttpError(409,'Dien de bestelling eerst in en geef de betalingsreferentie op.');
 if(await db().prepare("SELECT id FROM seller_orders WHERE payment_reference=? AND status='paid'").get(reference.trim()))throw new HttpError(409,'Deze betalingsreferentie is al gebruikt.');
 const first=await firstOrder(String(row.customer_id));quote={...quote,bonus:first&&row.terms==='proforma'&&quote.subtotal>=120000?10000:0};quote.commission=Math.round(quote.subtotal*quote.rate)+quote.bonus;
 }else if(action==='submit'){
 if(row.status!=='draft')throw new HttpError(409,'Deze bestelling is al ingediend.');
 quote=await calculateSalesQuote(actor,{customerId:String(row.customer_id),items:quote.lines.map(l=>({variantId:l.id,quantity:l.quantity})),factor:quote.factor,terms:row.terms as 'proforma'|'net30',submit:true,requestKey:crypto.randomUUID()});if(!quote.minimumMet)throw new HttpError(409,'Minimum bestelbedrag nog niet bereikt.');
 }
 await db().prepare('UPDATE seller_orders SET version=version+1,status=?,quote=?,earned_cents=?,payment_reference=?,updated_at=? WHERE id=?').run(action==='paid'?'paid':action==='submit'?'submitted':'cancelled',JSON.stringify(quote),action==='paid'?quote.commission:0,action==='paid'?reference.trim():'',new Date().toISOString(),id);
 await salesEvent(actor,'order.'+action,id);return {ok:true};
});}
