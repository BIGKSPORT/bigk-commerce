import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type Stripe from 'stripe';
import {products,closeDatabase} from '../lib/db';
import {operationsDb as db} from '../lib/operations-db';
import {adminSessionHash,totp} from '../lib/admin-mfa';
import {checkoutSchema,createOrder,getOrder} from '../lib/commerce';
import {adminOrderBatch} from '../lib/admin-order-query';
import {inviteStaff,beginStaffSetup,finishStaffSetup,staffLogin,requireStaff,changeStaff} from '../lib/staff-access';
import {shopFeatures,setFeature} from '../lib/shop-features';
import {adjustStock,stockPage} from '../lib/stock-operations';
import {ownerActor} from '../lib/operations-audit';
import {customerDetail} from '../lib/customer-management';
import {sendCustomerMessage} from '../lib/customer-messages';
import {invoiceData,issueInvoice,savedInvoice} from '../lib/order-invoices';
import {GET as stockGET,PATCH as stockPATCH} from '../app/api/staff/stock/route';
import {GET as queueGET} from '../app/api/staff/orders/route';
import {GET as operationsGET,POST as operationsPOST} from '../app/api/admin/operations/route';
const dir=mkdtempSync(join(tmpdir(),'bigk-operations-'));
const testURL=process.env.BIGK_TEST_DATABASE_URL;if(testURL&&(process.env.NODE_ENV!=='test'||!['localhost','127.0.0.1','[::1]'].includes(new URL(testURL).hostname)))throw Error('Only isolated loopback test databases are allowed.');
const testSchema=testURL?'bigk_staging':'bigk';
process.env.DATABASE_URL=testURL||'';process.env.DATABASE_PROVIDER=testURL?'postgres':'sqlite';process.env.DATABASE_PATH=join(dir,'test.sqlite');process.env.APP_URL='https://bigk.example';process.env.ADMIN_MFA_KEY='a'.repeat(64);process.env.ADMIN_MFA_REQUIRED='true';process.env.COMMERCE_MODE='demo';process.env.DATABASE_SCHEMA=testSchema;
const owner='bigk_admin=operations-owner',req=(path:string,cookie='',method='GET',data?:unknown,origin='https://bigk.example')=>new Request('https://bigk.example'+path,{method,headers:{cookie,origin,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
await test('operations foundation protects roles, stock, billing and customer email',async t=>{
 await db().prepare('INSERT INTO sessions(hash,expires_at) VALUES(?,?)').run(adminSessionHash('operations-owner'),'2099-01-01');
 await t.test('flags start off, owner MFA session remains required and origins are checked',async()=>{
  assert(Object.values(await shopFeatures()).every(v=>v===false));assert.equal((await operationsGET(req('/api/admin/operations'))).status,401);
  assert.equal((await operationsPOST(req('/api/admin/operations',owner,'POST',{action:'feature',name:'staff_portal',enabled:true},'https://attacker.example'))).status,403);
  assert.equal((await operationsPOST(req('/api/admin/operations',owner,'POST',{action:'feature',name:'staff_portal',enabled:true}))).status,200);
 });
 let stockCookie='',warehouseCookie='';const staffIds:string[]=[];
 await t.test('staff enrollment is one-time, login needs both factors and TOTP replay is rejected',async()=>{
  for(const role of ['stock_manager','warehouse_manager'] as const){
   const invite=await inviteStaff({name:role,email:role+'@example.test',role});staffIds.push(invite.id);const value=invite.setupPath.split('#')[1],setup=await beginStaffSetup(value),counter=Math.floor(Date.now()/30000);
   await finishStaffSetup(value,'test-only-long-password',totp(setup.secret,counter-1));await assert.rejects(()=>beginStaffSetup(value),/expired or was used/);
   await assert.rejects(()=>staffLogin(role+'@example.test','wrong-password',totp(setup.secret,counter)),/Incorrect/);
   const cookie=(await staffLogin(role+'@example.test','test-only-long-password',totp(setup.secret,counter))).split(';')[0];
   if(role==='stock_manager')stockCookie=cookie;else warehouseCookie=cookie;
   assert.equal((await requireStaff(req('/api/staff/auth',cookie))).role,role);
   await assert.rejects(()=>staffLogin(role+'@example.test','test-only-long-password',totp(setup.secret,counter)),/Incorrect/);
  }
 });
 await t.test('roles cannot cross into owner or each other’s data',async()=>{
  assert.equal((await operationsGET(req('/api/admin/operations',stockCookie))).status,401);
  assert.equal((await stockGET(req('/api/staff/stock',warehouseCookie))).status,403);
  assert.equal((await queueGET(req('/api/staff/orders',stockCookie))).status,403);
  assert.equal((await stockGET(req('/api/staff/stock',stockCookie))).status,200);
  assert.equal((await queueGET(req('/api/staff/orders',warehouseCookie))).status,200);
 });
 await t.test('stock is paginated, preserves reservations and rejects stale counts or price fields',async()=>{
  const list=await stockPage('',1);assert(list.items.length<=25);assert(list.total>25);const item=list.items[0];
  await db().prepare('UPDATE variants SET stock=10,reserved=2 WHERE id=?').run(item.variantId);
  const baseline={variantId:item.variantId,previousStock:10,previousReserved:2,productVersion:item.version,reason:'Physical count verified by warehouse',stock:12};const actor=await requireStaff(req('/api/staff/auth',stockCookie));
  await assert.rejects(()=>adjustStock({...baseline,stock:1},actor),/below reserved/);
  await adjustStock(baseline,actor);await assert.rejects(()=>adjustStock({...baseline,stock:13},actor),/changed since/);
  const row=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(item.variantId);assert.equal(row!.stock,12);assert.equal(row!.reserved,2);
  assert.equal((await stockPATCH(req('/api/staff/stock',stockCookie,'PATCH',{...baseline,price:1}))).status,400);
  const history=await db().prepare("SELECT actor_id,details FROM operations_audit WHERE action='stock.adjusted'").get();assert.equal(history!.actor_id,staffIds[0]);assert.match(String(history!.details),/Physical count/);
 });
 let orderId='',order:NonNullable<Awaited<ReturnType<typeof getOrder>>>;
 await t.test('batched order loading retains the existing order representation',async()=>{
  const p=(await products()).find(p=>p.priceCents&&p.variants.length)!;
  const created=await createOrder(checkoutSchema.parse({items:[{variantId:p.variants[0].id,quantity:1}],email:'customer@example.test',phone:'+32470123456',firstName:'Test',lastName:'Buyer',country:'BE',address:'Test Street 1',postal:'1000',city:'Brussels',consent:true,requestKey:crypto.randomUUID()}));orderId=created.id;
  await db().prepare("UPDATE orders SET status='paid',stripe_session=? WHERE id=?").run('cs_test_invoice',orderId);order=(await getOrder(orderId))!;
  const batch=await adminOrderBatch();assert.deepEqual(JSON.parse(JSON.stringify(batch.find(o=>o.id===orderId))),JSON.parse(JSON.stringify(order)));
 });
 await t.test('customer emails use saved recipients, respect staging rules and retry with a stable provider key',async()=>{
  await setFeature('customer_email',true);process.env.RESEND_API_KEY='test-only';process.env.EMAIL_FROM='BIGK <sender@example.test>';process.env.EMAIL_DELIVERY_ENABLED='true';process.env.VERCEL_ENV='preview';process.env.EMAIL_TEST_RECIPIENT='owner@example.test';
  const id='C-'+(await import('../lib/security')).hash(order.email).slice(0,24);await customerDetail(id);const input={id:crypto.randomUUID(),customerId:id,subject:'Your order question',message:'Thank you for your order question. Here are your details.',purpose:'customer_service' as const};
  await assert.rejects(()=>sendCustomerMessage(input),/disabled/);assert.equal((await db().prepare('SELECT count(*) AS n FROM customer_messages').get())!.n,0);
  process.env.EMAIL_TEST_RECIPIENT=order.email;const original=globalThis.fetch;const keys:string[]=[];let calls=0;
  globalThis.fetch=async(_url,init)=>{calls++;keys.push(new Headers(init?.headers).get('Idempotency-Key')!);const data=JSON.parse(String(init?.body));assert.equal(data.to,order.email);return Response.json({id:'email_test'},{status:calls===1?503:200});};
  try{await assert.rejects(()=>sendCustomerMessage(input),/did not confirm/);await sendCustomerMessage(input);assert.equal((await sendCustomerMessage(input)).reused,true);assert.equal(calls,2);assert.equal(keys[0],keys[1]);await assert.rejects(()=>sendCustomerMessage({...input,message:'Different message content'}),/different content/);}finally{globalThis.fetch=original;}
 });
 const invoiceFixture=()=>({id:'cs_test_invoice',metadata:{orderId},client_reference_id:orderId,status:'complete',payment_status:'paid',livemode:false,currency:'eur',amount_total:order.total,automatic_tax:{status:'complete'},customer_details:{name:'Test Buyer',business_name:null,tax_ids:[],address:{line1:'Test Street 1',line2:null,postal_code:'1000',city:'Brussels',country:'BE'}},shipping_cost:{amount_total:order.shipping,amount_tax:0},total_details:{amount_tax:Math.round(order.total*21/121),breakdown:{taxes:[{amount:Math.round(order.total*21/121),taxable_amount:order.total-Math.round(order.total*21/121),taxability_reason:'standard_rated',rate:{percentage:21,inclusive:true,tax_type:'vat',country:'BE'}}]}}} as unknown as Stripe.Checkout.Session);
 const lineFixture=()=>[{description:'Test product · M',quantity:1,currency:'eur',amount_total:order.total-order.shipping,amount_tax:Math.round(order.total*21/121)}] as Stripe.LineItem[];
 await t.test('invoice validation rejects wrong totals, missing addresses, incomplete VAT and business billing',async()=>{
  const session=invoiceFixture(),lines=lineFixture();assert.equal(invoiceData(order,session,lines).total,order.total);
  assert.throws(()=>invoiceData(order,{...session,amount_total:1},lines),/does not match/);
  assert.throws(()=>invoiceData(order,{...session,customer_details:null},lines),/billing address/);
  assert.throws(()=>invoiceData(order,{...session,total_details:{...session.total_details!,breakdown:undefined}},lines),/VAT breakdown/);
  assert.throws(()=>invoiceData(order,{...session,customer_details:{...session.customer_details!,business_name:'Test company'}},lines),/Business billing/);
 });
 await t.test('issuing an invoice is idempotent, serialised, immutable and test-marked',async()=>{
  await setFeature('invoice_printing',true);process.env.STRIPE_SECRET_KEY='sk_test_fixture';process.env.DATABASE_SCHEMA='bigk_staging';const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url)=>{calls++;return Response.json(String(url).includes('line_items')?{object:'list',data:lineFixture(),has_more:false}:invoiceFixture());};
  try{const [issued,concurrent]=await Promise.all([issueInvoice(orderId),issueInvoice(orderId)]);assert.equal(concurrent.number,issued.number);assert.match(issued.number,/^TEST-BIGK-\d{4}-000001$/);assert.equal(issued.test,true);assert.equal((await issueInvoice(orderId)).number,issued.number);assert.equal(calls,4);assert.deepEqual(await savedInvoice(orderId),issued);await db().prepare('UPDATE orders SET customer=? WHERE id=?').run(JSON.stringify({firstName:'Changed after issue'}),orderId);assert.equal((await savedInvoice(orderId))!.buyer.name,'Test Buyer');}finally{globalThis.fetch=original;process.env.DATABASE_SCHEMA=testSchema;delete process.env.VERCEL_ENV;}
 });
 await t.test('staff disable/reset revokes sessions immediately and flags do not delete data',async()=>{
  await changeStaff(staffIds[0],'disable');await assert.rejects(()=>requireStaff(req('/api/staff/auth',stockCookie)),/sign-in/);
  await changeStaff(staffIds[1],'reset');await assert.rejects(()=>requireStaff(req('/api/staff/auth',warehouseCookie)),/sign-in/);
  await setFeature('staff_portal',false);assert.equal((await stockGET(req('/api/staff/stock',stockCookie))).status,409);
  await setFeature('invoice_printing',false);assert(await savedInvoice(orderId));assert(Number((await db().prepare('SELECT count(*) AS n FROM operations_audit').get())!.n)>0);
 });
});
await closeDatabase();rmSync(dir,{recursive:true,force:true});
