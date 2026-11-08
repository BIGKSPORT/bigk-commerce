import type Stripe from 'stripe';
import {transaction} from './db';
import {operationsDb as db} from './operations-db';
import {getOrder} from './commerce';
import {stripeClient} from './stripe-client';
import {databaseSchema} from './database';
import {HttpError} from './security';
import {seller} from './seller';
import {requireFeature} from './shop-features';
import {operationAudit,ownerActor} from './operations-audit';
export type InvoiceSnapshot={number:string;issuedAt:string;orderId:string;orderDate:string;test:boolean;seller:typeof seller;buyer:{name:string;address:string;postal:string;city:string;country:string;email:string};lines:{description:string;quantity:number;gross:number;tax:number}[];shipping:number;shippingTax:number;taxes:{percentage:number;amount:number;taxableAmount:number;country:string|null}[];total:number;tax:number;net:number;stripeSession:string};
/** Pure validation: no country VAT percentages or customer billing details are guessed. */
export function invoiceData(order:NonNullable<Awaited<ReturnType<typeof getOrder>>>,session:Stripe.Checkout.Session,lines:Stripe.LineItem[]){
 if(!['paid','fulfilled'].includes(order.status)||session.id!==order.stripeSession||session.metadata?.orderId!==order.id||session.client_reference_id!==order.id||session.payment_status!=='paid'||session.status!=='complete'||session.currency!=='eur'||session.amount_total!==order.total)throw new HttpError(409,'The verified payment does not match this paid order.');
 if(session.automatic_tax.status!=='complete'||!session.total_details)throw new HttpError(409,'A completed tax calculation is required before issuing an invoice.');
 const customer=session.customer_details,address=customer?.address;
 if(!customer?.name||!address?.line1||!address.country||!address.postal_code||!address.city)throw new HttpError(409,'The payment is missing a complete billing address.');
 // This initial print workflow is for consumer sales. Business invoices need the accountant-approved workflow.
 if(customer.business_name||customer.tax_ids?.length)throw new HttpError(409,'Business billing needs accountant review before an invoice is issued.');
 const shipping=session.shipping_cost?.amount_total||0,shippingTax=session.shipping_cost?.amount_tax||0,tax=session.total_details.amount_tax,breakdown=session.total_details.breakdown?.taxes;
 if(!Number.isSafeInteger(tax)||tax<0||tax>order.total||!lines.length||lines.some(l=>l.currency!=='eur'||!l.quantity||l.quantity<1||!Number.isSafeInteger(l.amount_total)||l.amount_total<0||!Number.isSafeInteger(l.amount_tax)||l.amount_tax<0||l.amount_tax>l.amount_total)||lines.reduce((n,l)=>n+l.amount_total,shipping)!==order.total||lines.reduce((n,l)=>n+l.amount_tax,shippingTax)!==tax)throw new HttpError(409,'Payment line amounts or tax totals do not reconcile.');
 if(!breakdown?.length||breakdown.some(t=>t.taxability_reason!=='standard_rated'&&t.taxability_reason!=='reduced_rated'||!t.rate.inclusive||t.rate.tax_type!=='vat'||t.taxable_amount===null||t.rate.percentage<=0)||breakdown.reduce((n,t)=>n+t.amount,0)!==tax)throw new HttpError(409,'The VAT breakdown needs accountant review. No invoice number has been allocated.');
 return {orderId:order.id,orderDate:order.createdAt,test:!session.livemode,seller:{...seller},buyer:{name:customer.name,address:[address.line1,address.line2].filter(Boolean).join(', '),postal:address.postal_code,city:address.city,country:address.country,email:order.email},lines:lines.map(l=>({description:l.description||'Product',quantity:l.quantity!,gross:l.amount_total,tax:l.amount_tax})),shipping,shippingTax,taxes:breakdown.map(t=>({percentage:t.rate.percentage,amount:t.amount,taxableAmount:t.taxable_amount!,country:t.rate.country})),total:order.total,tax,net:order.total-tax,stripeSession:session.id};
}
export async function savedInvoice(orderId:string):Promise<InvoiceSnapshot|null>{const row=await db().prepare('SELECT snapshot FROM order_invoices WHERE order_id=?').get(orderId);return row?JSON.parse(String(row.snapshot)) as InvoiceSnapshot:null;}
export async function issueInvoice(orderId:string){
 await requireFeature('invoice_printing');const existing=await savedInvoice(orderId);if(existing)return existing;
 const order=await getOrder(orderId);if(!order||!['paid','fulfilled'].includes(order.status)||!order.stripeSession)throw new HttpError(409,'Only verified paid orders can be invoiced.');
 const stripe=stripeClient(),[session,linePage]=await Promise.all([stripe.checkout.sessions.retrieve(order.stripeSession,{expand:['total_details.breakdown']}),stripe.checkout.sessions.listLineItems(order.stripeSession,{limit:100})]);
 if(linePage.has_more)throw new HttpError(409,'This order needs manual invoice review.');const data=invoiceData(order,session,linePage.data);
 if((databaseSchema()==='bigk_staging'||process.env.VERCEL_ENV==='preview')===session.livemode)throw new HttpError(409,'The payment mode does not match this environment.');
 return transaction(async()=>{const previous=await savedInvoice(orderId);if(previous)return previous;const current=await getOrder(orderId);if(!current||current.total!==order.total||!['paid','fulfilled'].includes(current.status))throw new HttpError(409,'The order changed before the invoice was issued.');
 const issuedAt=new Date().toISOString(),year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Europe/Brussels'}).format(new Date(issuedAt))),row=await db().prepare('SELECT last_number FROM invoice_counters WHERE year=?').get(year),next=Number(row?.last_number||0)+1;
 await db().prepare('INSERT INTO invoice_counters(year,last_number) VALUES(?,?) ON CONFLICT(year) DO UPDATE SET last_number=excluded.last_number').run(year,next);
 const snapshot:InvoiceSnapshot={...data,number:(data.test?'TEST-':'')+'BIGK-'+year+'-'+String(next).padStart(6,'0'),issuedAt};
 await db().prepare('INSERT INTO order_invoices(order_id,number,snapshot,created_at) VALUES(?,?,?,?)').run(orderId,snapshot.number,JSON.stringify(snapshot),issuedAt);await operationAudit(ownerActor,'invoice.issued',orderId,{number:snapshot.number,total:snapshot.total,tax:snapshot.tax});return snapshot;
 });
}
