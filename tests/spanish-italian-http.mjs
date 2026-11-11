import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'bigk-es-it-')),origin='http://127.0.0.1:3293';
const env={...process.env,NODE_ENV:'production',PORT:'3293',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',RESEND_API_KEY:'',EMAIL_DELIVERY_ENABLED:'false',BIGK_CLUB_ENABLED:'false'};
for(const k of ['DATABASE_URL','VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL'])delete env[k];
let server,log='';
try{
 await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--import','tsx','--input-type=module','-e',"import {db} from './lib/db.ts';await db().prepare('UPDATE products SET active=1,approved=1 WHERE id IN (?,?,?)').run('P001','P002','P027');"],{env,stdio:['ignore','ignore','pipe']});p.stderr.on('data',d=>log+=d);p.on('exit',n=>n===0?resolve():reject(Error(log)))});
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/catalog')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 const catalog=await(await fetch(origin+'/api/catalog')).json(),p=catalog.products.find(p=>p.id==='P027');assert(p);
 for(const locale of ['es','it']){
  const root=await fetch(origin+'/?category=Fleece',{headers:{'Accept-Language':locale+'-ES,en;q=.5'},redirect:'manual'});assert.equal(root.status,307);assert.equal(new URL(root.headers.get('location'),origin).pathname,'/'+locale);
  for(const path of ['', '/products/'+p.slug,'/products/alpin-fleece-jacket?colour=Black&size=XL','/checkout','/account','/account/confirm?token='+'a'.repeat(40),'/info/delivery','/info/privacy','/newsletter']){
   const r=await fetch(origin+'/'+locale+path);assert.equal(r.status,200,locale+path);const html=await r.text();assert(html.includes('<html lang="'+locale+'"'),locale+path+' HTML language');assert(!html.includes('undefined/products'),locale+path);
   if(!path){assert(html.includes('Español')&&html.includes('Italiano'));assert(html.includes(locale==='es'?'Opciones de pago':'Opzioni di pagamento'));}
  }
  const r=await fetch(origin+'/api/checkout',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({items:[{variantId:p.variants[0].id,quantity:1}],email:locale+'.fixture@example.test',phone:'+32470123456',firstName:'Fixture',lastName:'Buyer',country:'BE',address:'Fixture Street 1',postal:'1000',city:'Brussels',consent:true,locale,requestKey:crypto.randomUUID()})});assert.equal(r.status,200,await r.clone().text());const order=await r.json();
  const receipt=await fetch(origin+'/api/orders?id='+order.id,{headers:{authorization:'Bearer '+order.receiptToken}});assert.equal(receipt.status,200);const body=await receipt.json();assert.equal(body.items[0].name,p.name);assert.equal(body.status,'demo');
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',"import assert from 'node:assert/strict';import {getOrder} from './lib/commerce.ts';assert.equal((await getOrder(process.argv[1])).language,process.argv[2]);",order.id,locale],{env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',d=>log+=d);child.on('exit',n=>n===0?resolve():reject(Error(log)))});
  console.log('PASS '+locale+': negotiation, storefront, generic/ALPIN products, checkout, account, privacy, newsletter and isolated demo order language.');
 }
}catch(e){console.error(log.slice(-2000));throw e}finally{server?.kill();await rm(dir,{recursive:true,force:true})}
