import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'bigk-cart-test-'));Object.assign(process.env,{NODE_ENV:'test',DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),APP_URL:'http://localhost:3000',NEXT_PUBLIC_CHECKOUT_CONTACT_CAPTURE:'true'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const {db,closeDatabase}=await import('../lib/db');const {getSavedCart,saveSavedCart,savedCartOverview,cleanSavedCarts}=await import('../lib/cart-sessions');
const {GET,POST,PUT}=await import('../app/api/cart/route');
const req=(cookie='')=>new Request('http://localhost:3000/api/cart',{headers:{Origin:'http://localhost:3000',Cookie:cookie}});
const contact=(cookie:string,email:string,consent:boolean)=>new Request('http://localhost:3000/api/cart',{
 method:'PUT',headers:{Origin:'http://localhost:3000',Cookie:cookie,'Content-Type':'application/json'},
 body:JSON.stringify({email,consent,locale:'nl'}),
});
try{
 await db().prepare('UPDATE products SET active=1,approved=1 WHERE id=?').run('P001');
 assert.deepEqual(await getSavedCart(req()),{items:[],hasCart:false});
 await assert.rejects(()=>saveSavedCart(req(),{items:[{variantId:'P001-0',quantity:2,unitPrice:1}],stage:'bag'}),/Invalid saved cart/);
 await assert.rejects(()=>saveSavedCart(req(),{items:[{variantId:'unknown',quantity:1}],stage:'bag'}),/no longer available/);
 const saved=await saveSavedCart(req(),{items:[{variantId:'P001-0',quantity:2}],stage:'bag'});assert(saved.cookie?.includes('HttpOnly'));const cookie=saved.cookie!.split(';')[0];
 assert.deepEqual((await getSavedCart(req(cookie))).items,[{variantId:'P001-0',quantity:2}]);
 const rows=await savedCartOverview();assert.equal(rows.length,1);assert.equal(rows[0].status,'open');assert.equal(rows[0].total,29380);assert(!('email' in rows[0]));assert(!('cookie' in rows[0]));
 assert.equal((await getSavedCart(req('bigk_cart='+'f'.repeat(64)))).hasCart,false);
 await db().prepare('UPDATE cart_sessions SET updated_at=?').run(new Date(Date.now()-31*60*1000).toISOString());assert.equal((await savedCartOverview())[0].status,'open');
 await saveSavedCart(req(cookie),{items:[{variantId:'P001-0',quantity:2}],stage:'checkout'});
 assert.equal((await PUT(contact(cookie,'  SHOPPER@EXAMPLE.TEST  ',true))).status,204);
 const optIn=await db().prepare('SELECT contact_email,marketing_consent,marketing_consent_at,marketing_consent_version,expires_at,updated_at FROM cart_sessions').get();
 assert(optIn);
 assert.equal(optIn.contact_email,'shopper@example.test');assert.equal(optIn.marketing_consent,1);
 assert.equal(optIn.marketing_consent_version,'v1:nl');assert(optIn.marketing_consent_at);
 assert.equal(Math.round((Date.parse(String(optIn.expires_at))-Date.parse(String(optIn.updated_at)))/86400000),30);
 assert.equal((await savedCartOverview())[0].status,'contact_captured');
 const other=await saveSavedCart(req(),{items:[{variantId:'P001-0',quantity:1}],stage:'checkout'});
 const otherCookie=other.cookie!.split(';')[0];
 for(const key of [cookie,otherCookie,'']){
  const response=await GET(req(key));
  assert.deepEqual(Object.keys(await response.json()).sort(),['hasCart','items']);
 }
 const ownSave=await POST(new Request('http://localhost:3000/api/cart', {
  method:'POST',headers:{Origin:'http://localhost:3000',Cookie:cookie,'Content-Type':'application/json'},
  body:JSON.stringify({items:[{variantId:'P001-0',quantity:2}],stage:'checkout'}),
 }));
 assert.equal(ownSave.status,200);
 assert.deepEqual(Object.keys(await ownSave.json()).sort(),['hasCart','items']);
 assert.equal((await PUT(contact('','intruder@example.test',true))).status,409);
 console.log('PASS privacy: public cart GET (same shopper, different shopper, no cookie) and POST return only items and hasCart.');
 await db().prepare("UPDATE cart_sessions SET marketing_consent_at=? WHERE contact_email IS NOT NULL").run('2020-01-01T00:00:00.000Z');
 assert.equal((await PUT(contact(cookie,'shopper@example.test',false))).status,204);
 const withdrawn=await db().prepare("SELECT marketing_consent,marketing_consent_at FROM cart_sessions WHERE contact_email IS NOT NULL").get();
 assert.equal(withdrawn?.marketing_consent,0);assert.notEqual(withdrawn?.marketing_consent_at,'2020-01-01T00:00:00.000Z');assert(withdrawn?.marketing_consent_at);
 await db().prepare("UPDATE cart_sessions SET updated_at=? WHERE contact_email IS NOT NULL").run(new Date(Date.now()-31*60*1000).toISOString());
 assert((await savedCartOverview()).some(row=>row.status==='abandoned'));
 let blocked=false;
 for(let i=0;i<35;i++){
  const response=await PUT(contact(otherCookie,'another@example.test',false));
  if(response.status===429){blocked=true;break}
  assert.equal(response.status,204);
 }
 assert(blocked,'Contact writes are rate limited');
 console.log('PASS rate limiting: repeated checkout contact PUT requests return HTTP 429.');
 await db().prepare("UPDATE cart_sessions SET expires_at=? WHERE contact_email=?").run('2000-01-01T00:00:00.000Z','another@example.test');
 await cleanSavedCarts();
 assert.equal((await savedCartOverview()).length,1);
 console.log('PASS cleanup: an expired contact cart is deleted while an unexpired contact cart is retained.');
 await saveSavedCart(req(cookie),{items:[],stage:'bag'});assert.equal((await savedCartOverview())[0].status,'cleared');
 await db().prepare('UPDATE cart_sessions SET expires_at=?').run('2000-01-01T00:00:00.000Z');await cleanSavedCarts();assert.equal((await savedCartOverview()).length,0);
 console.log('PASS saved carts: authoritative prices, strict input, private cookie access, inactivity estimate, empty bags, retention, consent withdrawal, private responses and rate limiting.');
}finally{await closeDatabase();await rm(dir,{recursive:true,force:true})}
