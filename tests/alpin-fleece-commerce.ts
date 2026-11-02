import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'bigk-alpin-commerce-'));
process.env.DATABASE_PROVIDER='sqlite';process.env.DATABASE_SCHEMA='bigk_staging';process.env.DATABASE_PATH=join(dir,'test.sqlite');process.env.COMMERCE_MODE='demo';process.env.EMAIL_DELIVERY_ENABLED='false';
const {db,products,closeDatabase}=await import('../lib/db');
const {createOrder,getOrder}=await import('../lib/commerce');
const {default:sitemap}=await import('../app/sitemap');
try {
 await db().prepare("UPDATE products SET name='Alpin Fleece Pro',price_cents=14690,active=1,approved=1,images=? WHERE id IN ('P001','P002')").run(JSON.stringify(['/products/web/alpin-fleece-pro-25303101-1.webp']));
 await db().prepare('INSERT INTO variants(id,product_id,size,stock,reserved) VALUES(?,?,?,?,?)').run('historic-xs','P001','XS',10,0);
 const input={items:[{variantId:'historic-xs',quantity:1}],email:'fixture@example.test',phone:'+32470123456',firstName:'Test',lastName:'Buyer',country:'BE' as const,address:'Test Street 1',postal:'1000',city:'Brussels',consent:true as const,requestKey:crypto.randomUUID()};
 await assert.rejects(createOrder(input),/no longer has an available price/);
 const variant=(await products()).find(p=>p.id==='P001')!.variants.find(v=>v.size==='S')!;
 const order=await createOrder({...input,requestKey:crypto.randomUUID(),items:[{variantId:variant.id,quantity:1}]});
 const saved=await getOrder(order.id);assert.equal(saved?.items[0].name,'Alpin Fleece');assert.equal(saved?.items[0].variantId,variant.id);assert.equal(saved?.items[0].unitPrice,14690);
 assert((await products()).find(p=>p.id==='P001')!.variants.some(v=>v.id==='historic-xs'));
 assert.deepEqual(await sitemap(),[]);
 process.env.INDEXING_ENABLED='true';process.env.COMMERCE_MODE='live';process.env.LIVE_COMMERCE_APPROVED='true';
 const entries=await sitemap();assert.equal(entries.filter(entry=>entry.url.includes('/products/')).length,3);assert(!entries.some(entry=>/apline-fleece-p001|alpine-fz-p002/.test(entry.url)));for(const locale of ['en','nl','fr'])assert(entries.some(entry=>entry.url.startsWith('https://bigk.be/'+locale+'/products/')));
 console.log('PASS server rejects historical XS, keeps order ID/price with invariant product name, preserves history, and gates canonical multilingual sitemap.');
} finally {await closeDatabase();await rm(dir,{recursive:true,force:true})}
