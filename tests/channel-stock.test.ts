import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {db,products,closeDatabase} from '../lib/db';
import {salesDb} from '../lib/sales-db';
import {operationsDb} from '../lib/operations-db';
import {channelDb} from '../lib/channel-db';
import {channelInventory} from '../lib/channel-inventory';
import {canonicalGtin} from '../lib/product-identifiers';
import {hash} from '../lib/security';
import {GET,POST} from '../app/api/admin/channels/route';
const dir=mkdtempSync(join(tmpdir(),'bigk-channels-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',CHANNEL_STOCK_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const cookie='bigk_admin=channel-owner',ean='1234567890128';
function req(data?:unknown,c=cookie,origin='https://bigk.example'){return new Request('https://bigk.example/api/admin/channels',{method:data?'POST':'GET',headers:{cookie:c,origin,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});}
const read=async()=>{const r=await GET(req());assert.equal(r.status,200);return r.json();};
await test('channel stock and EAN preparation',async t=>{let variantId='',otherId='',content:any,linkId='';try{
 await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('channel-owner'),new Date(Date.now()+600000).toISOString());
 const p=(await products()).find(p=>p.id==='P001')!;variantId=p.variants[0].id;otherId=p.variants[1].id;content={...p.content,trade:{...p.content?.trade,identifiers:{...p.content?.trade?.identifiers,[variantId]:{sku:'INTERNAL-SKU',gtin:ean,verified:true,colour:'Black'},[otherId]:{sku:'OTHER',gtin:'',verified:false}}}};
 await db().prepare('UPDATE product_content SET content=? WHERE product_id=?').run(JSON.stringify(content),'P001');await db().prepare('UPDATE variants SET stock=20,reserved=3 WHERE id=?').run(variantId);
 await t.test('owner auth, feature default-off, no-store and CSRF protections',async()=>{
  assert.equal((await GET(req(undefined,''))).status,401);assert.equal((await GET(req(undefined,'bigk_seller=channel-owner'))).status,401);delete process.env.CHANNEL_STOCK_ENABLED;assert.equal((await GET(req())).status,404);process.env.CHANNEL_STOCK_ENABLED='true';
  const r=await GET(req());assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control')!,/private, no-store/);assert.equal((await POST(req({action:'buffer',variantId,version:0,buffer:5,reason:'Test buffer planning'},cookie,'https://evil.example'))).status,403);
 });
 await t.test('EAN validation detects missing, invalid, duplicate, unverified and archived identifiers; names do not determine identity',()=>{
  const p={...(null as any),id:'p',name:'SEO text',code:'a',description:'SEO description',tags:[],images:[],category:'Tops',version:1,slug:'p',active:true,approved:true,featured:false,priceCents:10000,variants:[{id:'a',size:'S',stock:10,reserved:2,reported:null},{id:'b',size:'M',stock:1,reserved:0,reported:null}],content:{composition:'',fit:'',care:'',details:'',trade:{identifiers:{a:{sku:'a',gtin:ean,verified:true},b:{sku:'b',gtin:'0'+ean,verified:true}}}}};
  let rows=channelInventory([p],[],new Map());assert.ok(rows.every(r=>r.eanState==='duplicate'));assert.equal(rows[0].canonicalEan,canonicalGtin(ean));
  p.content.trade.identifiers.b={sku:'b',gtin:'',verified:false};rows=channelInventory([p],[],new Map());assert.equal(rows.find(r=>r.variantId==='a')!.eanState,'ready');assert.equal(rows.find(r=>r.variantId==='b')!.eanState,'missing');
  p.content.trade.identifiers.a={sku:'a',gtin:'1234567890129',verified:true};assert.equal(channelInventory([p],[],new Map()).find(r=>r.variantId==='a')!.eanState,'invalid');
  p.content.trade.identifiers.a={sku:'a',gtin:ean,verified:false};assert.equal(channelInventory([p],[],new Map()).find(r=>r.variantId==='a')!.eanState,'unverified');
  (p.content.trade.identifiers.a as any).archived=true;assert.equal(channelInventory([p],[],new Map()).find(r=>r.variantId==='a')!.eanState,'archived');
 });
 const link=()=>({action:'link',channel:'bol',accountKey:'bigk-main',externalId:'BOL-OFFER-1',variantId,ean,externalTitle:'Bol SEO title independent of BIG K name',confirmed:true});
 await t.test('buffers change only planned channel quantity; optimistic revisions and audit are enforced',async()=>{
  const before=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variantId);let r=await POST(req({action:'buffer',variantId,version:0,buffer:5,reason:'Prepare future channel safety buffer'}));assert.equal(r.status,200);
  assert.deepEqual(await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variantId),before);const row=(await read()).rows.find((r:any)=>r.variantId===variantId);assert.equal(row.available,17);assert.equal(row.buffer,5);assert.equal(row.plannedChannelAvailable,12);
  assert.equal((await POST(req({action:'buffer',variantId,version:0,buffer:1,reason:'Stale buffer update request'}))).status,409);assert.equal((await POST(req({action:'buffer',variantId,version:1,buffer:-1,reason:'Invalid negative buffer'}))).status,400);
  assert.ok((await operationsDb().prepare("SELECT id FROM operations_audit WHERE action='channel.buffer.changed'").all()).length);
 });
 await t.test('strict unique EAN mapping, permission and concurrency checks; SEO/prices/stock stay untouched',async()=>{
  const before=await db().prepare('SELECT name,description,price_cents FROM products WHERE id=?').get('P001'),stock=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variantId);
  assert.equal((await POST(req({...link(),confirmed:false}))).status,400);assert.equal((await POST(req({...link(),ean:'1234567890129'}))).status,400);assert.equal((await POST(req({...link(),variantId:otherId}))).status,409);assert.equal((await POST(req({...link(),ean:'4006381333931'}))).status,409);
  const results=await Promise.all([POST(req(link())),POST(req(link()))]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const overview=await read();linkId=overview.links[0].id;assert.equal(overview.links[0].ean,'0'+ean);assert.equal(overview.links[0].state,'ready');assert.ok(overview.channels.every((c:any)=>c.connection==='not_connected'&&c.lastSuccessfulSync===null));
  assert.deepEqual(await db().prepare('SELECT name,description,price_cents FROM products WHERE id=?').get('P001'),before);assert.deepEqual(await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variantId),stock);
  assert.equal((await POST(req({...link(),externalId:'BOL-OTHER'}))).status,409);
 });
 await t.test('source EAN changes invalidate a saved mapping; names and descriptions may change independently',async()=>{
  await db().prepare('UPDATE products SET name=?,description=? WHERE id=?').run('Changed local name','New local product description','P001');let l=(await read()).links.find((l:any)=>l.id===linkId);assert.equal(l.state,'ready');assert.equal(l.externalTitle,'Bol SEO title independent of BIG K name');
  const changed=structuredClone(content);changed.trade.identifiers[variantId].gtin='4006381333931';await db().prepare('UPDATE product_content SET content=? WHERE product_id=?').run(JSON.stringify(changed),'P001');l=(await read()).links.find((l:any)=>l.id===linkId);assert.equal(l.state,'stale');assert.equal(l.ean,'0'+ean);
  await db().prepare('UPDATE product_content SET content=? WHERE product_id=?').run(JSON.stringify(content),'P001');
 });
 await t.test('local pause/removal are versioned and do not change offers or inventory',async()=>{
  assert.equal((await POST(req({action:'pause',id:linkId,version:1,paused:true}))).status,200);assert.equal((await read()).links[0].state,'paused');assert.equal((await POST(req({action:'unlink',id:linkId,version:1}))).status,409);assert.equal((await POST(req({action:'unlink',id:linkId,version:2}))).status,200);assert.equal((await read()).links.length,0);assert.equal((await db().prepare('SELECT stock FROM variants WHERE id=?').get(variantId))!.stock,20);
 });
 await t.test('seller order exposure is visible without guessing or double-deducting stock',async()=>{
  const seller=crypto.randomUUID(),customer=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(seller,'Seller','seller@example.test','2026-01-01');await salesDb().prepare('INSERT INTO seller_customers(id,seller_id,name,vat,contact,email,phone,address,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(customer,seller,'Shop','0123456749','Buyer','buyer@example.test','0123456789','Brussels','2026-01-01');
  for(const [status,quantity] of [['submitted',4],['paid',6]] as const)await salesDb().prepare('INSERT INTO seller_orders(id,seller_id,customer_id,status,terms,quote,request_key,request_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),seller,customer,status,'proforma',JSON.stringify({lines:[{id:variantId,quantity}]}),crypto.randomUUID(),'fixture','2026-01-01','2026-01-01');
  const overview=await read();assert.equal(overview.summary.sellerSubmittedUnits,4);assert.equal(overview.summary.sellerPaidUnits,6);assert.equal(overview.rows.find((r:any)=>r.variantId===variantId).available,17);assert.equal((await db().prepare('SELECT stock FROM variants WHERE id=?').get(variantId))!.stock,20);
 });
}finally{await closeDatabase();rmSync(dir,{recursive:true,force:true});}});
