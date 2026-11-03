import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'bigk-cart-test-'));Object.assign(process.env,{NODE_ENV:'test',DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),APP_URL:'http://localhost:3000'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const {db,closeDatabase}=await import('../lib/db');const {getSavedCart,saveSavedCart,savedCartOverview,cleanSavedCarts}=await import('../lib/cart-sessions');
const req=(cookie='')=>new Request('http://localhost:3000/api/cart',{headers:{Origin:'http://localhost:3000',Cookie:cookie}});
try{
 await db().prepare('UPDATE products SET active=1,approved=1 WHERE id=?').run('P001');
 assert.deepEqual(await getSavedCart(req()),{items:[],hasCart:false});
 await assert.rejects(()=>saveSavedCart(req(),{items:[{variantId:'P001-0',quantity:2,unitPrice:1}],stage:'bag'}),/Invalid saved cart/);
 await assert.rejects(()=>saveSavedCart(req(),{items:[{variantId:'unknown',quantity:1}],stage:'bag'}),/no longer available/);
 const saved=await saveSavedCart(req(),{items:[{variantId:'P001-0',quantity:2}],stage:'bag'});assert(saved.cookie?.includes('HttpOnly'));const cookie=saved.cookie!.split(';')[0];
 assert.deepEqual((await getSavedCart(req(cookie))).items,[{variantId:'P001-0',quantity:2}]);
 const rows=await savedCartOverview();assert.equal(rows.length,1);assert.equal(rows[0].status,'open');assert.equal(rows[0].total,29380);assert(!('email' in rows[0]));assert(!('cookie' in rows[0]));
 assert.equal((await getSavedCart(req('bigk_cart='+'f'.repeat(64)))).hasCart,false);
 await db().prepare('UPDATE cart_sessions SET updated_at=?').run(new Date(Date.now()-31*60*1000).toISOString());assert.equal((await savedCartOverview())[0].status,'possibly_abandoned');
 await saveSavedCart(req(cookie),{items:[],stage:'bag'});assert.equal((await savedCartOverview())[0].status,'cleared');
 await db().prepare('UPDATE cart_sessions SET expires_at=?').run('2000-01-01T00:00:00.000Z');await cleanSavedCarts();assert.equal((await savedCartOverview()).length,0);
 console.log('PASS saved carts: authoritative prices, strict input, private cookie access, inactivity estimate, empty bags, retention, no contact collection.');
}finally{await closeDatabase();await rm(dir,{recursive:true,force:true})}
