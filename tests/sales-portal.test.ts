import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {db,closeDatabase,products} from '../lib/db';
import {salesDb} from '../lib/sales-db';
import {salesQuote} from '../lib/sales-pricing';
import {hash} from '../lib/security';
import {totp} from '../lib/admin-mfa';
import {GET,POST} from '../app/api/sales/route';
import {POST as admin} from '../app/api/sales/admin/route';
import {POST as setup} from '../app/api/sales/setup/route';
import {POST as login,DELETE as logout} from '../app/api/sales/auth/route';
import {salesCatalogue} from '../lib/sales-service';
const dir=mkdtempSync(join(tmpdir(),'bigk-sales-'));Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',ADMIN_MFA_KEY:'a'.repeat(64),SELLER_PORTAL_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const owner='bigk_admin=owner-sales',first='bigk_seller=seller-one',second='bigk_seller=seller-two';
function req(path:string,cookie='',data?:unknown,origin='https://bigk.example'){return new Request('https://bigk.example'+path,{method:data===undefined?'GET':'POST',headers:{cookie,origin,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});}
const write=(cookie:string,action:string,data:unknown)=>POST(req('/api/sales',cookie,{action,data}));
await test('seller portal integration',async t=>{try{
 let sellerId='',customerId='',variantId='',stock=0,retail=0,orderId='';
 await t.test('feature defaults closed and all private data requires login',async()=>{delete process.env.SELLER_PORTAL_ENABLED;assert.equal((await GET(req('/api/sales'))).status,404);process.env.SELLER_PORTAL_ENABLED='true';assert.equal((await GET(req('/api/sales'))).status,401);assert.equal((await admin(req('/api/sales/admin','',{action:'invite',name:'Test',email:'one@example.test'}))).status,403);});
 await t.test('owner invite, MFA enrollment, login and replay protection',async()=>{
 await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('owner-sales'),new Date(Date.now()+600000).toISOString());
 let r=await admin(req('/api/sales/admin',owner,{action:'invite',name:'Seller One',email:'one@example.test'}));assert.equal(r.status,200);const value=(await r.json()).setupPath.split('#')[1];
 r=await setup(req('/api/sales/setup','',{action:'begin',token:value}));assert.equal(r.status,200);const {secret}=await r.json(),counter=Math.floor(Date.now()/30000);
 r=await setup(req('/api/sales/setup','',{action:'finish',token:value,password:'Strong test password 123!',code:totp(secret,counter)}));assert.equal(r.status,200);
 r=await login(req('/api/sales/auth','',{email:'one@example.test',password:'Strong test password 123!',code:totp(secret,counter+1)}));assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')||'',/HttpOnly; SameSite=Strict/);
 assert.equal((await login(req('/api/sales/auth','',{email:'one@example.test',password:'Strong test password 123!',code:totp(secret,counter+1)}))).status,401);
 assert.equal((await setup(req('/api/sales/setup','',{action:'begin',token:value}))).status,410);
 sellerId=String((await salesDb().prepare('SELECT id FROM seller_accounts WHERE email=?').get('one@example.test'))!.id);
 await salesDb().prepare('INSERT INTO seller_sessions VALUES(?,?,?,?)').run(hash('seller:seller-one'),sellerId,2,new Date(Date.now()+600000).toISOString());
 const other=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(other,'Seller Two','two@example.test',new Date().toISOString());await salesDb().prepare('INSERT INTO seller_sessions VALUES(?,?,?,?)').run(hash('seller:seller-two'),other,1,new Date(Date.now()+600000).toISOString());
 });
 await t.test('real catalogue preserves identifiers, prices, colours and available stock',async()=>{await db().prepare('UPDATE products SET price_cents=14690 WHERE id=?').run('P001');await db().prepare('UPDATE variants SET stock=100 WHERE product_id=?').run('P001');const p=(await products()).find(p=>p.id==='P001')!;variantId=p.variants.find(v=>v.stock>=50)!.id;retail=p.priceCents!;stock=p.variants.find(v=>v.id===variantId)!.stock;const catalogue=await salesCatalogue(),v=catalogue.find(v=>v.id===variantId)!;assert.equal(v.name,p.name);assert.equal(v.retailCents,retail);assert.equal(v.available,stock);assert.equal(v.core,true);for(const code of ['25000701','25000702','25000703','25000704','25302101'])for(const item of catalogue.filter(v=>v.code.endsWith(code)))assert.equal(item.core,true);const r=await GET(req('/api/sales',first));assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control')||'',/no-store/);const w=await r.json();assert.equal(w.accounts,undefined);assert.equal(w.actor.id,sellerId);});
 await t.test('server checks customer inputs, roles and cross-seller isolation',async()=>{
 assert.equal((await write(first,'customer',{name:'Test'})).status,400);
 let r=await write(first,'customer',{name:'Test Shop',vat:'BE0123456749',contact:'Test Contact',email:'shop@example.test',phone:'0123456789',address:'Teststraat 10, 1000 Brussel'});assert.equal(r.status,200);customerId=(await r.json()).id;
 assert.equal((await GET(req('/api/sales',second))).status,200);assert.equal((await (await GET(req('/api/sales',second))).json()).customers.length,0);
 assert.equal((await admin(req('/api/sales/admin',first,{action:'credit',id:customerId,approved:true}))).status,403);
 assert.equal((await write(first,'customer',{name:'Test Shop',vat:'BE0123456749',contact:'Test Contact',email:'shop@example.test',phone:'0123456789',address:'Teststraat 10, 1000 Brussel'})).status,409);
 });
 const input=()=>({customerId,items:[{variantId,quantity:30}],factor:2.5,terms:'proforma',submit:true,requestKey:crypto.randomUUID()});
 await t.test('owner preview is seller-scoped, cannot be used by sellers and rejects preview writes',async()=>{
 const counts=async()=>({customers:(await salesDb().prepare('SELECT COUNT(*) AS n FROM seller_customers').get())!.n,orders:(await salesDb().prepare('SELECT COUNT(*) AS n FROM seller_orders').get())!.n,sessions:(await salesDb().prepare('SELECT COUNT(*) AS n FROM seller_sessions').get())!.n});
 const before=await counts(),path='/api/sales?previewSeller='+sellerId;
 let r=await GET(req(path,owner));assert.equal(r.status,200);const view=await r.json();assert.equal(view.actor.id,sellerId);assert.equal(view.actor.role,'seller');assert.equal(view.preview.readOnly,true);assert.equal(view.accounts,undefined);assert.equal(view.customers.length,1);
 assert.equal((await GET(req(path,second))).status,403);assert.equal((await GET(req('/api/sales?previewSeller=bad-id',owner))).status,400);assert.equal((await GET(req('/api/sales?previewSeller='+crypto.randomUUID(),owner))).status,404);
 r=await POST(req(path,owner,{action:'customer',data:{}}));assert.equal(r.status,403);
 assert.equal((await admin(req('/api/sales/admin?previewSeller='+sellerId,owner,{action:'disable',id:sellerId}))).status,403);assert.deepEqual(await counts(),before);
 const normal=await (await GET(req('/api/sales',owner))).json();assert.equal(normal.actor.role,'owner');assert.equal(normal.preview,undefined);
 });
 await t.test('server rejects other sellers, CSRF, stock excess, forged prices, duplicate sizes and unapproved credit',async()=>{
 assert.equal((await write(second,'order',input())).status,404);
 assert.equal((await POST(req('/api/sales',first,{action:'order',data:input()},'https://evil.example'))).status,403);
 assert.equal((await write(first,'order',{...input(),items:[{variantId,quantity:stock+1}]})).status,409);
 assert.equal((await write(first,'order',{...input(),unitCents:1})).status,400);
 assert.equal((await write(first,'order',{...input(),items:[{variantId,quantity:1},{variantId,quantity:1}]})).status,400);
 assert.equal((await write(first,'order',{...input(),terms:'net30'})).status,409);
 assert.equal((await write(first,'order',{...input(),factor:2.7,items:[{variantId,quantity:1}]})).status,409);
 });
 await t.test('minimum applies to submission; draft saves below minimum; idempotent order does not affect webshop stock',async()=>{
 const before=(await db().prepare('SELECT COUNT(*) AS n FROM orders').get())!.n;
 assert.equal((await write(first,'order',{...input(),items:[{variantId,quantity:1}]})).status,409);
 assert.equal((await write(first,'order',{...input(),submit:false,items:[{variantId,quantity:1}]})).status,200);
 const payload=input(),r=await write(first,'order',payload);assert.equal(r.status,200);orderId=(await r.json()).id;
 const again=await write(first,'order',payload);assert.equal(again.status,200);assert.equal((await again.json()).id,orderId);
 assert.equal((await write(first,'order',{...payload,items:[{variantId,quantity:29}]})).status,409);
 const order=await salesDb().prepare('SELECT * FROM seller_orders WHERE id=?').get(orderId),quote=JSON.parse(String(order!.quote));assert.equal(quote.subtotal,Math.round(retail/2.5)*30);assert.equal(order!.earned_cents,0);
 assert.equal((await db().prepare('SELECT stock FROM variants WHERE id=?').get(variantId))!.stock,stock);assert.equal((await db().prepare('SELECT COUNT(*) AS n FROM orders').get())!.n,before);
 });
 await t.test('saved drafts can be edited; stale revisions and excess reserved stock are rejected',async()=>{
 const r=await write(first,'order',{...input(),submit:false,items:[{variantId,quantity:1}]});const id=(await r.json()).id;
 const edit={...input(),submit:false,draftId:id,version:1,items:[{variantId,quantity:2}]};assert.equal((await write(first,'order',edit)).status,200);assert.equal((await write(first,'order',{...edit,requestKey:crypto.randomUUID()})).status,409);
 assert.equal((await write(second,'order',{...edit,requestKey:crypto.randomUUID()})).status,404);
 await db().prepare('UPDATE variants SET reserved=? WHERE id=?').run(stock-1,variantId);assert.equal((await write(first,'order',input())).status,409);await db().prepare('UPDATE variants SET reserved=0 WHERE id=?').run(variantId);
 });
 await t.test('payment is owner-only; opening bonus once per shop; credit requires prior paid order',async()=>{
 assert.equal((await admin(req('/api/sales/admin',first,{action:'paid',id:orderId,reference:'BANK-TEST-1'}))).status,403);
 assert.equal((await admin(req('/api/sales/admin',owner,{action:'paid',id:orderId,reference:'BANK-TEST-1'}))).status,200);
 let row=await salesDb().prepare('SELECT * FROM seller_orders WHERE id=?').get(orderId),q=JSON.parse(String(row!.quote));assert.equal(q.bonus,10000);assert.equal(row!.earned_cents,q.commission);
 const r=await write(first,'order',input());assert.equal(r.status,200);const id=(await r.json()).id;assert.equal((await admin(req('/api/sales/admin',owner,{action:'paid',id,reference:'BANK-TEST-1'}))).status,409);assert.equal((await admin(req('/api/sales/admin',owner,{action:'paid',id,reference:'BANK-TEST-2'}))).status,200);row=await salesDb().prepare('SELECT * FROM seller_orders WHERE id=?').get(id);q=JSON.parse(String(row!.quote));assert.equal(q.bonus,0);
 assert.equal((await admin(req('/api/sales/admin',owner,{action:'credit',id:customerId,approved:true}))).status,200);assert.equal((await write(first,'order',{...input(),terms:'net30'})).status,200);
 assert.equal((await write(first,'status',{id:orderId,action:'cancel'})).status,409);
 });
 await t.test('owner can change a seller email without losing customers or orders; active sessions are revoked',async()=>{
 assert.equal((await admin(req('/api/sales/admin',first,{action:'email',id:sellerId,email:'changed@example.test'}))).status,403);
 assert.equal((await admin(req('/api/sales/admin',owner,{action:'email',id:sellerId,email:'changed@example.test'}))).status,200);
 assert.equal((await GET(req('/api/sales',first))).status,401);const row=await salesDb().prepare('SELECT email,version FROM seller_accounts WHERE id=?').get(sellerId);assert.equal(row!.email,'changed@example.test');assert.ok((await salesDb().prepare('SELECT id FROM seller_orders WHERE seller_id=?').all(sellerId)).length>0);
 await salesDb().prepare('INSERT INTO seller_sessions VALUES(?,?,?,?)').run(hash('seller:seller-one'),sellerId,row!.version,new Date(Date.now()+600000).toISOString());
 });
 await t.test('disable revokes seller sessions immediately and owner-only account list stays private',async()=>{assert.equal((await admin(req('/api/sales/admin',owner,{action:'disable',id:sellerId}))).status,200);assert.equal((await GET(req('/api/sales',first))).status,401);assert.equal((await (await GET(req('/api/sales',owner))).json()).accounts.length,2);});
 await t.test('pure pricing handles threshold, footwear and commission rounding',()=>{const base={id:'x',name:'Core',code:'25301801',image:'',colour:'Black',size:'M',available:10000,retailCents:10000,footwear:false,core:true};let q=salesQuote([base],[{variantId:'x',quantity:50}],2.7,'proforma',true);assert.equal(q.factor,2.7);assert.equal(q.subtotal,Math.round(10000/2.7)*50);assert.equal(q.commission,Math.round(q.subtotal*0.12)+10000);q=salesQuote([{...base,footwear:true}],[{variantId:'x',quantity:1}],2.7,'net30',false);assert.equal(q.factor,2.5);assert.equal(q.subtotal,4545);assert.equal(q.bonus,0);});
 }finally{await closeDatabase();rmSync(dir,{recursive:true,force:true});}});
