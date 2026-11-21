import {transaction} from './db';
import {salesDb} from './sales-db';
import {b2bDb} from './b2b-db';
import {hash,HttpError} from './security';
import type {SalesActor} from './sales-types';

export type CommissionLine={orderId:string;customerName:string;paidAt:string;netCents:number;commissionCents:number;bonusCents:number};
export type CommissionStatement={sellerId:string;sellerName:string;month:string;dueDate:string;closed:boolean;lines:CommissionLine[];totalCents:number;key:string;payout?:{reference:string;recordedAt:string}};
export function commissionMonth(date:Date){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit'}).formatToParts(date);
 return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value;
}
function dueDate(month:string){const [y,m]=month.split('-').map(Number);return `${m===12?y+1:y}-${String(m===12?1:m+1).padStart(2,'0')}-10`;}
type PaymentRecord={sellerId:string;month:string;key:string;totalCents:number;reference:string};
function paymentRecord(entity:unknown):PaymentRecord{
 const value=JSON.parse(String(entity));
 if(typeof value.sellerId!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value.month)||typeof value.key!=='string'||!Number.isSafeInteger(value.totalCents)||typeof value.reference!=='string')throw Error('Ongeldige commissiebetalingsregistratie.');
 return value;
}
// Read the complete paid-order history, independently of the dashboard's last 200 orders.
// Existing finalised earned_cents/bonus snapshots remain authoritative; never reprice history.
export async function commissionStatements(actor:SalesActor,now=new Date()):Promise<CommissionStatement[]>{
 b2bDb();
 const rows=await salesDb().prepare("SELECT o.id,o.seller_id,o.earned_cents,o.quote,o.updated_at,c.name AS customer_name,a.name AS seller_name FROM seller_orders o JOIN seller_customers c ON c.id=o.customer_id JOIN seller_accounts a ON a.id=o.seller_id WHERE o.status='paid'"+(actor.role==='seller'?' AND o.seller_id=?':'')+' ORDER BY o.updated_at,o.id').all(...(actor.role==='seller'?[actor.id]:[]));
 const b2bRows=await salesDb().prepare("SELECT o.id,o.commission_seller_id AS seller_id,o.commission_cents AS earned_cents,o.commission_bonus_cents AS bonus_cents,o.quote,COALESCE(o.commission_paid_at,o.updated_at) AS updated_at,a.name AS customer_name,s.name AS seller_name FROM b2b_orders o JOIN b2b_accounts a ON a.id=o.account_id JOIN seller_accounts s ON s.id=o.commission_seller_id WHERE o.status IN ('paid','fulfilled') AND o.commission_seller_id IS NOT NULL AND o.commission_cents>0"+(actor.role==='seller'?' AND o.commission_seller_id=?':'')+' ORDER BY o.updated_at,o.id').all(...(actor.role==='seller'?[actor.id]:[]));
 const groups=new Map<string,CommissionStatement>(),currentMonth=commissionMonth(now);
 for(const r of [...rows,...b2bRows]){
  const month=commissionMonth(new Date(String(r.updated_at))),sellerId=String(r.seller_id),id=sellerId+':'+month;
  let statement=groups.get(id);
  if(!statement){statement={sellerId,sellerName:String(r.seller_name),month,dueDate:dueDate(month),closed:month<currentMonth,lines:[],totalCents:0,key:''};groups.set(id,statement);}
  const quote=JSON.parse(String(r.quote)),earned=Number(r.earned_cents),bonus=Number(r.bonus_cents??quote.bonus??0);
  statement.lines.push({orderId:String(r.id),customerName:String(r.customer_name),paidAt:String(r.updated_at),netCents:Number(quote.subtotal),commissionCents:earned-bonus,bonusCents:bonus});statement.totalCents+=earned;
 }
 for(const s of groups.values())s.key=hash(JSON.stringify({sellerId:s.sellerId,month:s.month,lines:s.lines.map(l=>({orderId:l.orderId,paidAt:l.paidAt,netCents:l.netCents,commissionCents:l.commissionCents,bonusCents:l.bonusCents}))}));
 const payments=await salesDb().prepare("SELECT entity,created_at FROM seller_events WHERE action='commission.paid' ORDER BY created_at").all();
 for(const row of payments){const p=paymentRecord(row.entity),s=groups.get(p.sellerId+':'+p.month);if(!s)continue;if(s.key!==p.key||s.totalCents!==p.totalCents)throw Error('De betaalde commissieafrekening wijkt af van de orderhistoriek. Neem contact op met BIG K.');s.payout={reference:p.reference,recordedAt:String(row.created_at)};}
 return [...groups.values()].sort((a,b)=>b.month.localeCompare(a.month)||a.sellerName.localeCompare(b.sellerName));
}
export async function recordCommissionPayout(actor:SalesActor,input:{sellerId:string;month:string;key:string;totalCents:number;reference:string}){
 if(actor.role!=='owner')throw new HttpError(403,'Alleen BIG K kan een commissiebetaling registreren.');
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)||!input.reference.trim()||input.reference.trim().length>150)throw new HttpError(400,'Controleer maand en betalingsreferentie.');
 return transaction(async()=>{
  const s=(await commissionStatements(actor)).find(s=>s.sellerId===input.sellerId&&s.month===input.month);
  if(!s)throw new HttpError(404,'Commissieafrekening niet gevonden.');
  if(s.payout)throw new HttpError(409,'Deze commissieafrekening is al betaald.');
  if(!s.closed)throw new HttpError(409,'De lopende maand kan nog niet worden afgesloten.');
  if(s.key!==input.key||s.totalCents!==input.totalCents||s.totalCents<=0)throw new HttpError(409,'De afrekening is gewijzigd. Vernieuw het overzicht.');
  const payments=await salesDb().prepare("SELECT entity FROM seller_events WHERE action='commission.paid'").all();
  if(payments.some(r=>paymentRecord(r.entity).reference===input.reference.trim()))throw new HttpError(409,'Deze commissiebetalingsreferentie is al gebruikt.');
  await salesDb().prepare('INSERT INTO seller_events(id,actor_id,action,entity,created_at) VALUES(?,?,?,?,?)').run(hash('commission.paid:'+s.sellerId+':'+s.month),actor.id,'commission.paid',JSON.stringify({sellerId:s.sellerId,month:s.month,key:s.key,totalCents:s.totalCents,reference:input.reference.trim()}),new Date().toISOString());
  return {ok:true};
 });
}
