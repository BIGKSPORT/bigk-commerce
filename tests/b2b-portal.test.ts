import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {db,closeDatabase} from '../lib/db';
import {b2bDb} from '../lib/b2b-db';
import {salesDb} from '../lib/sales-db';
import {hash} from '../lib/security';
import {b2bInvitation} from '../lib/b2b-auth';
import {b2bQuote} from '../lib/b2b-pricing';
import {b2bWorkspace,b2bAccountInput} from '../lib/b2b-service';
import {GET,POST} from '../app/api/b2b/route';
import {GET as authGet,POST as auth,DELETE as logout} from '../app/api/b2b/auth/route';
import {GET as adminGet,POST as admin} from '../app/api/b2b/admin/route';
import {createSalesCustomer} from '../lib/sales-service';
import {commissionStatements} from '../lib/sales-commissions';
const dir=mkdtempSync(join(tmpdir(),'bigk-b2b-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',B2B_PORTAL_ENABLED:'true',SELLER_PORTAL_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
function req(path:string,cookie='',data?:unknown,origin='https://bigk.example'){return new Request('https://bigk.example'+path,{method:data===undefined?'GET':'POST',headers:{cookie,origin,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});}
const owner='bigk_admin=b2b-owner',write=(data:unknown,cookie=owner)=>admin(req('/api/b2b/admin',cookie,data));
const company={name:'Direct Sport',vat:'BE0123456749',email:'direct@example.test',contact:'Buyer',phone:'0123456789',address:'Teststraat 10',postal:'1000',city:'Brussel',verified:true,directAccount:true};
await test('direct B2B portal integration',async t=>{let accountId='',secondId='',cookie='',otherCookie='',variant='',otherVariant='',orderId='',orderVersion=1;try{
 await t.test('closed by default; admin and buyer access remain separate',async()=>{
  delete process.env.B2B_PORTAL_ENABLED;assert.equal((await GET(req('/api/b2b'))).status,404);process.env.B2B_PORTAL_ENABLED='true';
  assert.equal((await GET(req('/api/b2b'))).status,401);assert.equal((await adminGet(req('/api/b2b/admin'))).status,401);assert.equal((await GET(req('/api/b2b',owner))).status,401);
  await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('b2b-owner'),new Date(Date.now()+600000).toISOString());
 });
 await t.test('owner approves verified direct business; rejects invalid VAT, duplicate email/VAT and assigned agent clients',async()=>{
  assert.equal((await write({action:'create',data:{...company,verified:false}})).status,400);assert.equal((await write({action:'create',data:{...company,vat:'BE0000000000'}})).status,400);
  let r=await write({action:'create',data:company});assert.equal(r.status,200);accountId=(await r.json()).id;
  assert.equal((await write({action:'create',data:company})).status,409);
  assert.equal((await write({action:'create',data:{...company,email:'second@example.test',vat:'BE0451515303'}})).status,200);
  secondId=String((await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE email=?').get('second@example.test'))!.id);
  const sellerId=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(sellerId,'Agent','agent@example.test',new Date().toISOString());
  await assert.rejects(()=>createSalesCustomer({id:sellerId,name:'Agent',role:'seller'},{name:company.name,vat:'0123456749',contact:company.contact,email:company.email,phone:company.phone,address:company.address}),/rechtstreeks B2B/);
  await salesDb().prepare('INSERT INTO seller_customers(id,seller_id,name,vat,contact,email,phone,address,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),sellerId,'Agent Shop','0201541452','Buyer','assigned@example.test','0123456789','Teststraat',new Date().toISOString());
  assert.equal((await write({action:'create',data:{...company,email:'assigned@example.test',vat:'BE0201541452'}})).status,409);
 });
 await t.test('invitation requires owner; scanners do not consume; one-use links create only a scoped B2B session',async()=>{
  const invite=await write({action:'invite',id:accountId});assert.equal(invite.status,200);const value=(await invite.json()).setupPath.split('#')[1];
  assert.equal((await authGet(req('/api/b2b/auth?token='+value))).status,401);assert.ok(await b2bDb().prepare('SELECT hash FROM b2b_links WHERE hash=?').get(hash('b2b-link:'+value)));
  let r=await auth(req('/api/b2b/auth','',{action:'consume',token:value}));assert.equal(r.status,200);cookie=r.headers.get('Set-Cookie')!.split(';')[0];assert.match(r.headers.get('Set-Cookie')!,/HttpOnly; SameSite=Strict/);
  assert.equal((await auth(req('/api/b2b/auth','',{action:'consume',token:value}))).status,410);
  const link=await b2bInvitation(secondId);r=await auth(req('/api/b2b/auth','',{action:'consume',token:link.setupPath.split('#')[1]}));otherCookie=r.headers.get('Set-Cookie')!.split(';')[0];
  assert.equal((await write({action:'invite',id:accountId},cookie)).status,401);
 });
 await t.test('expired links/sessions are rejected; login mail is scoped and failures remove unusable links',async()=>{
  const expired=await b2bInvitation(secondId),value=expired.setupPath.split('#')[1];await b2bDb().prepare('UPDATE b2b_links SET expires_at=? WHERE hash=?').run('2000-01-01',hash('b2b-link:'+value));assert.equal((await auth(req('/api/b2b/auth','',{action:'consume',token:value}))).status,410);
  const sessionHash=hash('b2b-session:'+otherCookie.split('=')[1]);await b2bDb().prepare('UPDATE b2b_sessions SET expires_at=? WHERE hash=?').run('2000-01-01',sessionHash);assert.equal((await GET(req('/api/b2b',otherCookie))).status,401);await b2bDb().prepare('UPDATE b2b_sessions SET expires_at=? WHERE hash=?').run(new Date(Date.now()+600000).toISOString(),sessionHash);
  const oldFetch=globalThis.fetch;let sends=0;Object.assign(process.env,{RESEND_API_KEY:'test-only',EMAIL_FROM:'BIG K <test@example.test>',EMAIL_DELIVERY_ENABLED:'true'});
  try{globalThis.fetch=async(_url,init)=>{sends++;const mail=JSON.parse(String(init!.body));assert.equal(mail.to,company.email);assert.ok(mail.text.includes('/b2b#'));return new Response('{}',{status:200});};
   const unknown=await auth(req('/api/b2b/auth','',{action:'request',email:'unknown@example.test'})),known=await auth(req('/api/b2b/auth','',{action:'request',email:company.email}));assert.equal(known.status,200);assert.deepEqual(await known.json(),await unknown.json());assert.equal(sends,1);
   globalThis.fetch=async()=>new Response('{}',{status:502});assert.equal((await auth(req('/api/b2b/auth','',{action:'request',email:company.email}))).status,502);assert.equal((await b2bDb().prepare('SELECT hash FROM b2b_links WHERE account_id=?').all(accountId)).length,0);
  }finally{globalThis.fetch=oldFetch;delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;delete process.env.EMAIL_DELIVERY_ENABLED;}
 });
 await t.test('real variants, colour/size catalogue and owner prices are used; no commissions or other account data',async()=>{
  await db().prepare('UPDATE products SET price_cents=10000 WHERE id=?').run('P001');await db().prepare('UPDATE variants SET stock=200,reserved=0 WHERE product_id=?').run('P001');
  const w=await b2bWorkspace(accountId);variant=w.catalogue.find(p=>p.modelId==='P001')!.id;otherVariant=w.catalogue.find(p=>p.modelId==='P001'&&p.id!==variant)!.id;
  const r=await GET(req('/api/b2b',cookie));assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control')!,/no-store/);const v=await r.json();assert.equal(v.account.id,accountId);assert.equal(v.accounts,undefined);assert.equal(v.commissions,undefined);assert.equal(v.orders.length,0);
 });
 async function quote(quantity=30){const r=await POST(req('/api/b2b',cookie,{action:'quote',items:[{variantId:variant,quantity}]}));assert.equal(r.status,200);return r.json();}
 await t.test('server rejects forged price/terms, below-minimum submission, excess stock, stale prices and CSRF',async()=>{
  let r=await POST(req('/api/b2b',cookie,{action:'quote',items:[{variantId:variant,quantity:30}],factor:2.7}));assert.equal(r.status,400);
  assert.equal((await POST(req('/api/b2b',cookie,{action:'quote',items:[{variantId:variant,quantity:201}]}))).status,409);
  assert.equal((await POST(req('/api/b2b',cookie,{action:'quote',items:[{variantId:variant,quantity:1},{variantId:variant,quantity:1}]}))).status,400);
  const q=await quote(1);r=await POST(req('/api/b2b',cookie,{action:'order',data:{items:[{variantId:variant,quantity:1}],quoteKey:q.key,requestKey:crypto.randomUUID(),accepted:true}}));assert.equal(r.status,409);
  const old=await quote();await db().prepare('UPDATE products SET price_cents=10100 WHERE id=?').run('P001');r=await POST(req('/api/b2b',cookie,{action:'order',data:{items:[{variantId:variant,quantity:30}],quoteKey:old.key,requestKey:crypto.randomUUID(),accepted:true}}));assert.equal(r.status,409);await db().prepare('UPDATE products SET price_cents=10000 WHERE id=?').run('P001');
  assert.equal((await POST(req('/api/b2b',cookie,{action:'quote',items:[{variantId:variant,quantity:30}]},'https://evil.example'))).status,403);
 });
 await t.test('order request is idempotent and isolated; no stock reservation, retail order or agent commission is created',async()=>{
  const q=await quote(),requestKey=crypto.randomUUID(),data={items:[{variantId:variant,quantity:30}],quoteKey:q.key,requestKey,accepted:true},before=(await db().prepare('SELECT COUNT(*) AS n FROM orders').get())!.n;
  const results=await Promise.all([POST(req('/api/b2b',cookie,{action:'order',data})),POST(req('/api/b2b',cookie,{action:'order',data}))]);assert.ok(results.every(r=>r.status===200));const ids=await Promise.all(results.map(r=>r.json()));assert.equal(ids[0].id,ids[1].id);orderId=ids[0].id;
  assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(variant))!.reserved,0);assert.equal((await db().prepare('SELECT COUNT(*) AS n FROM orders').get())!.n,before);assert.equal((await salesDb().prepare('SELECT COUNT(*) AS n FROM seller_orders').get())!.n,0);
  assert.equal((await POST(req('/api/b2b',otherCookie,{action:'order',data}))).status,409);
  assert.equal((await POST(req('/api/b2b',otherCookie,{action:'cancel',id:orderId,version:1}))).status,404);
  assert.equal((await (await GET(req('/api/b2b',otherCookie))).json()).orders.length,0);
 });
 await t.test('owner confirmation reserves atomically, customer cannot mark paid, stale owner requests fail',async()=>{
  const data={action:'confirm',id:orderId,version:1,invoiceReference:'PRO-001',paymentInstructions:'Betaal het volledige bedrag op de rekening op de factuur.',paymentUrl:''};
  assert.equal((await write(data,cookie)).status,401);assert.equal((await write({...data,paymentUrl:'javascript:alert(1)'})).status,400);
  assert.equal((await write(data)).status,200);orderVersion=2;assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(variant))!.reserved,30);assert.equal((await write(data)).status,409);
  assert.equal((await POST(req('/api/b2b',cookie,{action:'paid',id:orderId,version:2,reference:'FAKE'}))).status,400);
  assert.equal((await write({action:'fulfil',id:orderId,version:2,tracking:'DPD TEST'})).status,409);
 });
 await t.test('payment consumes stock exactly once, fulfilment cannot deduct again, first paid order enables reorder minimum only',async()=>{
  const data={action:'paid',id:orderId,version:orderVersion,reference:'BANK-001'};const results=await Promise.all([write(data),write(data)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const row=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variant);assert.equal(row!.stock,170);assert.equal(row!.reserved,0);
  assert.equal((await write({action:'fulfil',id:orderId,version:3,tracking:'DPD TRACK-001'})).status,200);assert.equal((await db().prepare('SELECT stock FROM variants WHERE id=?').get(variant))!.stock,170);
  const w=await b2bWorkspace(accountId);assert.equal(w.account.hasPaidOrder,true);assert.equal(w.orders[0].tracking,'DPD TRACK-001');
  const sellerOne=crypto.randomUUID(),sellerTwo=crypto.randomUUID(),now=new Date().toISOString();
  await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(sellerOne,'Seller One','one@agents.test',now);
  await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(sellerTwo,'Seller Two','two@agents.test',now);
  await salesDb().prepare('INSERT INTO seller_b2b_assignments(account_id,seller_id,assigned_at) VALUES(?,?,?)').run(accountId,sellerOne,now);
  const repeatQuote=await quote(8),repeatRequest={items:[{variantId,quantity:8}],quoteKey:repeatQuote.key,requestKey:crypto.randomUUID(),accepted:true};
  const repeatResponse=await POST(req('/api/b2b',cookie,{action:'order',data:repeatRequest}));assert.equal(repeatResponse.status,200);const repeatId=(await repeatResponse.json()).id;
  await salesDb().prepare('UPDATE seller_b2b_assignments SET seller_id=?,assigned_at=? WHERE account_id=?').run(sellerTwo,new Date(Date.now()+1000).toISOString(),accountId);
  assert.equal((await write({action:'confirm',id:repeatId,version:1,invoiceReference:'PRO-REPEAT',paymentInstructions:'Betaal op de rekening van de factuur.',paymentUrl:''})).status,200);
  assert.equal((await write({action:'paid',id:repeatId,version:2,reference:'BANK-REPEAT'})).status,200);
  const commissionOrder=await b2bDb().prepare('SELECT commission_seller_id,commission_rate,commission_cents,commission_bonus_cents FROM b2b_orders WHERE id=?').get(repeatId);
  assert.equal(commissionOrder!.commission_seller_id,sellerOne);assert.equal(Number(commissionOrder!.commission_rate),0.08);assert.equal(Number(commissionOrder!.commission_cents),2560);assert.equal(Number(commissionOrder!.commission_bonus_cents),0);
  const statement=(await commissionStatements({id:sellerOne,name:'Seller One',role:'seller'})).flatMap(x=>x.lines).find(x=>x.orderId===repeatId);assert.equal(statement?.commissionCents,2560);
  assert.equal((await commissionStatements({id:sellerTwo,name:'Seller Two',role:'seller'})).flatMap(x=>x.lines).some(x=>x.orderId===repeatId),false);
  const q=await quote(8);assert.equal(q.quote.minimum,30000);assert.equal(q.quote.subtotal,32000);assert.equal(q.quote.shipping,1250);assert.equal(q.quote.vat,6983);
 });
 await t.test('cancelling confirmed orders releases only their reservation and cannot cancel paid sales',async()=>{
  const q=await quote(8),r=await POST(req('/api/b2b',cookie,{action:'order',data:{items:[{variantId:variant,quantity:8}],quoteKey:q.key,requestKey:crypto.randomUUID(),accepted:true}})),id=(await r.json()).id;
  assert.equal((await write({action:'confirm',id,version:1,invoiceReference:'PRO-002',paymentInstructions:'Betaal op de rekening van de echte factuur.',paymentUrl:''})).status,200);
  await db().prepare('UPDATE variants SET reserved=reserved+3 WHERE id=?').run(variant);assert.equal((await write({action:'cancel',id,version:2})).status,200);assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(variant))!.reserved,3);await db().prepare('UPDATE variants SET reserved=0 WHERE id=?').run(variant);
  assert.equal((await write({action:'cancel',id:orderId,version:4})).status,409);
 });
 await t.test('multi-line failed reservation rolls back all prior lines',async()=>{
  const items=[{variantId:variant,quantity:4},{variantId:otherVariant,quantity:4}],q=await (await POST(req('/api/b2b',cookie,{action:'quote',items}))).json();const r=await POST(req('/api/b2b',cookie,{action:'order',data:{items,quoteKey:q.key,requestKey:crypto.randomUUID(),accepted:true}})),id=(await r.json()).id;
  await db().prepare('UPDATE variants SET reserved=stock WHERE id=?').run(otherVariant);assert.equal((await write({action:'confirm',id,version:1,invoiceReference:'PRO-FAIL',paymentInstructions:'Betaal op de rekening van de echte factuur.',paymentUrl:''})).status,409);assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(variant))!.reserved,0);assert.equal((await b2bDb().prepare('SELECT status FROM b2b_orders WHERE id=?').get(id))!.status,'requested');
 });
 await t.test('account changes revoke links and sessions; old legal/order snapshots stay unchanged',async()=>{
  const before=String((await b2bDb().prepare('SELECT customer FROM b2b_orders WHERE id=?').get(orderId))!.customer),link=await b2bInvitation(accountId);
  assert.equal((await write({action:'update',id:accountId,version:1,data:{...company,email:'changed@example.test'},active:false})).status,200);
  assert.equal((await GET(req('/api/b2b',cookie))).status,401);assert.equal((await auth(req('/api/b2b/auth','',{action:'consume',token:link.setupPath.split('#')[1]}))).status,410);
  assert.equal((await write({action:'update',id:accountId,version:1,data:company,active:true})).status,409);assert.equal(String((await b2bDb().prepare('SELECT customer FROM b2b_orders WHERE id=?').get(orderId))!.customer),before);
  assert.equal((await logout(new Request('https://bigk.example/api/b2b/auth',{method:'DELETE',headers:{origin:'https://bigk.example',cookie:otherCookie}}))).status,200);assert.equal((await GET(req('/api/b2b',otherCookie))).status,401);
 });
 await t.test('freight threshold and footwear factor are independent of consumer VAT',()=>{
  const p={id:'x',name:'Test',code:'x',image:'',colour:'Black',size:'M',available:100,retailCents:10000,footwear:false,core:true};let q=b2bQuote([p],[{variantId:'x',quantity:1}],true);assert.equal(q.subtotal,4000);assert.equal(q.shipping,1250);q=b2bQuote([{...p,retailCents:125000}],[{variantId:'x',quantity:1}],true);assert.equal(q.subtotal,50000);assert.equal(q.shipping,0);q=b2bQuote([{...p,footwear:true}],[{variantId:'x',quantity:1}],false);assert.equal(q.subtotal,4545);
 });
}finally{await closeDatabase();rmSync(dir,{recursive:true,force:true});}});
