import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,scryptSync} from 'node:crypto';
import Stripe from 'stripe';
import {db,products,closeDatabase} from '../lib/db';
import {expireReservations,getOrder} from '../lib/commerce';
import {deliverEmails} from '../lib/email';
import {POST as checkout} from '../app/api/checkout/route';
import {POST as webhook} from '../app/api/webhooks/stripe/route';
import {POST as login} from '../app/api/admin/login/route';
import {GET as orders} from '../app/api/admin/orders/route';
import {GET as receipt} from '../app/api/orders/route';
import {POST as accountRequest} from '../app/api/account/request/route';
import {checkoutAttemptKey,checkoutAttemptStorageKey} from '../lib/checkout-attempt';
import {money} from '../lib/format';
// Only the local PGlite socket runner is accepted. All provider traffic is a fixture.
if(process.env.NODE_ENV!=='test'||!['127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL!).hostname))throw Error('Isolated loopback database required.');
const origin='https://bigk-payment-fixture.example';
Object.assign(process.env,{APP_URL:origin,VERCEL_BRANCH_URL:new URL(origin).hostname,ADMIN_CANONICAL_ORIGIN:origin,COMMERCE_MODE:'live',LIVE_COMMERCE_APPROVED:'true',STRIPE_SECRET_KEY:'rk_test_local_fixture_only',STRIPE_WEBHOOK_SECRET:randomBytes(32).toString('hex'),RECEIPT_SECRET:randomBytes(32).toString('hex'),BIGK_CLUB_ENABLED:'false',RESEND_API_KEY:'local-fixture',EMAIL_FROM:'BigK <fixture@example.test>',EMAIL_DELIVERY_ENABLED:'false'});
const password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');process.env.ADMIN_PASSWORD_HASH=salt+':'+scryptSync(password,salt,64).toString('hex');
const req=(path:string,data?:unknown,cookie?:string)=>new Request(origin+path,{method:data===undefined?'GET':'POST',headers:{origin,'Content-Type':'application/json',...(cookie?{cookie}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});
const originalFetch=globalThis.fetch;
const sessions=new Map<string,any>(),keys=new Map<string,string>(),payloads:URLSearchParams[]=[],mails:any[]=[];let creations=0;
globalThis.fetch=async(input,init)=>{
 const url=new URL(String(input));
 if(url.origin==='https://api.stripe.com'){
  const headers=new Headers(init?.headers);
  assert.match(headers.get('authorization')||'',/^Bearer rk_test_/);
  if(init?.method==='POST'&&url.pathname==='/v1/checkout/sessions'){
   const p=new URLSearchParams(String(init.body)),key=headers.get('idempotency-key')!;payloads.push(p);
   let id=keys.get(key);if(!id){id='cs_test_fixture_'+(++creations);keys.set(key,id);sessions.set(id,{id,object:'checkout.session',status:'open',livemode:false,url:'https://checkout.stripe.com/c/pay/'+id,orderId:p.get('client_reference_id')});}
   return Response.json(sessions.get(id));
  }
  if(init?.method==='GET')return Response.json(sessions.get(url.pathname.split('/').pop()!));
 }
 if(url.origin==='https://api.resend.com'){mails.push(JSON.parse(String(init?.body)));return Response.json({id:'local_fixture_email'});}
 throw Error('Unexpected provider request blocked in isolated test');
};
const fixtureProduct=(await products()).find(p=>p.id==='P001')!;
const expectedProductName='Alpin Fleece';
const variant=fixtureProduct.variants[0];
await db().prepare('UPDATE products SET approved=1,active=1 WHERE id=?').run(fixtureProduct.id);
await db().prepare('UPDATE variants SET stock=20,reserved=0 WHERE id=?').run(variant.id);
const inventory=()=>db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variant.id);
const payload=()=>({items:[{variantId:variant.id,quantity:1}],email:'buyer@example.test',phone:'+32470123456',firstName:'Fixture',lastName:'Buyer',country:'BE',address:'Fixture Street 1',postal:'1000',city:'Brussels',consent:true,requestKey:crypto.randomUUID()});
async function event(id:string,order:any,type='checkout.session.completed',overrides:Record<string,unknown>={}){
 const data=JSON.stringify({id,object:'event',livemode:false,type,data:{object:{id:order.stripeSession,object:'checkout.session',livemode:false,metadata:{orderId:order.id},payment_status:'paid',amount_total:order.total,currency:'eur',...overrides}}});
 const signature=new Stripe('rk_test_fixture').webhooks.generateTestHeaderString({payload:data,secret:process.env.STRIPE_WEBHOOK_SECRET!});
 return webhook(new Request(origin+'/api/webhooks/stripe',{method:'POST',headers:{'stripe-signature':signature},body:data}));
}
let cookie='',created:any,order:any;
await test('isolated complete checkout → webhook → inventory → backoffice → confirmation',async t=>{
 await t.test('checkout reload reuses the attempt while changed bags/details get a fresh attempt',async()=>{
  const saved=new Map<string,string>(),storage={getItem:(k:string)=>saved.get(k)||null,setItem:(k:string,v:string)=>{saved.set(k,v)}};
  const original=crypto.randomUUID(),newPage=crypto.randomUUID(),fingerprint=JSON.stringify(payload());
  assert.equal(await checkoutAttemptKey(fingerprint,original,storage),original);
  assert.equal(await checkoutAttemptKey(fingerprint,newPage,storage),original);
  assert.equal(await checkoutAttemptKey(fingerprint+'changed',newPage,storage),newPage);
  assert(!saved.get(checkoutAttemptStorageKey)!.includes('buyer@example.test'));
  assert.equal(await checkoutAttemptKey(fingerprint,newPage,{getItem:()=>{throw Error('disabled')},setItem:()=>{throw Error('disabled')}}),newPage);
 });
 await t.test('actual admin login and strict checkout reject unauthorised data',async()=>{
  const r=await login(req('/api/admin/login',{password}));assert.equal(r.status,200);cookie=r.headers.get('set-cookie')!.split(';')[0];
  assert.equal((await orders(req('/api/admin/orders'))).status,401);
  assert.equal((await checkout(req('/api/checkout',{...payload(),total:1}))).status,400);
 });
 await t.test('server prices reach Stripe; duplicate checkout reuses one session and reservation',async()=>{
  const input=payload(),r=await checkout(req('/api/checkout',input));assert.equal(r.status,200);created=await r.json();order=await getOrder(created.id);
  assert.equal(order.status,'pending');assert.equal(order.items[0].name,expectedProductName);assert.equal(order.items[0].unitPrice,fixtureProduct.priceCents);assert.equal((await inventory())!.reserved,1);
  const params=payloads[0];assert.equal(Number(params.get('line_items[0][price_data][unit_amount]')),fixtureProduct.priceCents);
  assert.equal(params.get('locale'),'en');assert.equal(params.get('cancel_url'),origin+'/en/checkout?cancelled=1');assert.equal(params.get('adaptive_pricing[enabled]'),'false');assert.equal(params.get('automatic_tax[enabled]'),'true');assert.equal(params.get('metadata[orderId]'),order.id);assert.equal(params.get('payment_method_types[0]'),null);
  assert.equal(params.get('success_url'),origin+'/en/order#'+created.id+'.'+created.receiptToken);
  const duplicate=await (await checkout(req('/api/checkout',input))).json();assert.equal(duplicate.id,created.id);assert.equal(duplicate.url,created.url);assert.equal(creations,1);assert.equal((await inventory())!.reserved,1);
  assert.equal((await db().prepare('SELECT COUNT(*) AS n FROM email_outbox').get())!.n,0);
 });
 await t.test('unpaid async completion and invalid signature do not mark orders paid',async()=>{
  assert.equal((await webhook(new Request(origin+'/api/webhooks/stripe',{method:'POST',headers:{'stripe-signature':'forged'},body:'{}'}))).status,400);
  assert.equal((await event('evt_unpaid',order,'checkout.session.completed',{payment_status:'unpaid'})).status,200);
  assert.equal((await getOrder(order.id))!.status,'pending');assert.equal((await inventory())!.stock,20);assert.equal((await inventory())!.reserved,1);
 });
 await t.test('signed successful payment deducts once and queues exactly one confirmation',async()=>{
  assert.equal((await event('evt_paid',order,'checkout.session.async_payment_succeeded')).status,200);
  assert.equal((await event('evt_paid',order,'checkout.session.async_payment_succeeded')).status,200);
  assert.equal((await event('evt_paid_retry',order)).status,200);
  assert.equal((await getOrder(order.id))!.status,'paid');assert.equal((await inventory())!.stock,19);assert.equal((await inventory())!.reserved,0);
  assert.equal((await db().prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE order_id=? AND kind='confirmation'").get(order.id))!.n,1);
 });
 await t.test('paid order appears in protected backoffice and private receipt',async()=>{
  const data=await (await orders(req('/api/admin/orders',undefined,cookie))).json();assert(data.orders.some((o:any)=>o.id===order.id&&o.status==='paid'));
  assert.equal((await receipt(req('/api/orders?id='+order.id))).status,404);
  const r=await receipt(new Request(origin+'/api/orders?id='+order.id,{headers:{authorization:'Bearer '+created.receiptToken}}));assert.equal(r.status,200);assert.equal((await r.json()).status,'paid');
 });
 await t.test('staging sends no email and does not claim jobs or mint sign-in tokens',async()=>{
  const result=await deliverEmails();assert.equal(result.sent,0);assert.equal(result.blocked,true);assert.equal(mails.length,0);
  const row=await db().prepare('SELECT attempts,lease_until,sent_at FROM email_outbox WHERE order_id=?').get(order.id);assert.equal(row!.attempts,0);assert.equal(row!.lease_until,0);assert.equal(row!.sent_at,null);
  assert.equal((await accountRequest(req('/api/account/request',{email:'buyer@example.test'}))).status,503);assert.equal((await db().prepare('SELECT COUNT(*) AS n FROM login_tokens').get())!.n,0);
 });
 await t.test('confirmation content is verified through a mocked approved test inbox only',async()=>{
  process.env.EMAIL_DELIVERY_ENABLED='true';process.env.EMAIL_TEST_RECIPIENT='other@example.test';assert.equal((await deliverEmails()).sent,0);assert.equal(mails.length,0);
  process.env.EMAIL_TEST_RECIPIENT='buyer@example.test';assert.equal((await deliverEmails()).sent,1);assert.equal(mails.length,1);
  assert.equal(mails[0].to,'buyer@example.test');assert(mails[0].text.includes(expectedProductName));assert(mails[0].text.includes(order.items[0].name));assert(mails[0].text.includes('Total: '+money(order.total)));assert(mails[0].text.includes('Delivery: '+money(order.shipping)));assert(!mails[0].text.includes(created.receiptToken));
  assert.equal((await deliverEmails()).sent,0);assert.equal(mails.length,1);process.env.EMAIL_DELIVERY_ENABLED='false';
 });
 await t.test('cancelled and expired payments release reservations without affecting paid inventory',async()=>{
  const a=await (await checkout(req('/api/checkout',payload()))).json(),cancelled=(await getOrder(a.id))!;
  assert.equal((await event('evt_cancelled',cancelled,'checkout.session.async_payment_failed')).status,200);assert.equal((await event('evt_cancelled',cancelled,'checkout.session.async_payment_failed')).status,200);assert.equal((await getOrder(a.id))!.status,'cancelled');assert.equal((await inventory())!.reserved,0);
  const b=await (await checkout(req('/api/checkout',payload()))).json();await db().prepare('UPDATE orders SET expires_at=? WHERE id=?').run(new Date(Date.now()-60000).toISOString(),b.id);await expireReservations();assert.equal((await getOrder(b.id))!.status,'expired');assert.equal((await inventory())!.reserved,0);assert.equal((await inventory())!.stock,19);
 });
 await t.test('incorrect paid amount is held for review, never fulfilled or mailed',async()=>{
  const a=await (await checkout(req('/api/checkout',payload()))).json(),bad=(await getOrder(a.id))!;
  assert.equal((await event('evt_bad_amount',bad,'checkout.session.completed',{amount_total:bad.total+1})).status,200);assert.equal((await getOrder(a.id))!.status,'payment_review');assert.equal((await inventory())!.stock,19);assert.equal((await inventory())!.reserved,0);
  assert.equal((await db().prepare('SELECT COUNT(*) AS n FROM email_outbox WHERE order_id=?').get(a.id))!.n,0);
 });
 await t.test('checkout language is snapshotted independently of country and passed to Stripe and return links',async()=>{
  for(const locale of ['nl','fr'] as const){const r=await checkout(req('/api/checkout',{...payload(),email:locale+'.fixture@example.test',country:'BE',locale}));assert.equal(r.status,200);const created=await r.json(),record=(await getOrder(created.id))!,params=payloads.at(-1)!;assert.equal(record.language,locale);assert.equal(record.items[0].name,expectedProductName);assert.equal(params.get('locale'),locale);assert.equal(params.get('success_url'),origin+'/'+locale+'/order#'+created.id+'.'+created.receiptToken);assert.equal(params.get('cancel_url'),origin+'/'+locale+'/checkout?cancelled=1');assert.equal((await event('evt_locale_cancel_'+locale,record,'checkout.session.async_payment_failed')).status,200)}
 });
});
globalThis.fetch=originalFetch;await closeDatabase();
