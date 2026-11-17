import {build} from 'esbuild';
import {chromium} from 'playwright';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {db,products,closeDatabase} from '../lib/db.ts';
import {hash} from '../lib/security.ts';
import {GET,POST} from '../app/api/admin/channels/route.ts';
const dir=mkdtempSync(join(tmpdir(),'bigk-channel-browser-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://channels.example',CHANNEL_STOCK_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import Screen from './components/admin-channel-stock';const transport={request:async(path,init)=>{const r=await window.__channelApi(path,init||{method:'GET'});if(r.status>=400)throw Object.assign(Error(r.body.error),{status:r.status});return r.body;}};createRoot(document.getElementById('root')).render(<Screen transport={transport}/>);`},bundle:true,write:false,outdir:dir,platform:'browser',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
const oldFetch=globalThis.fetch;let externalCalls=0;globalThis.fetch=async()=>{externalCalls++;throw Error('No external service is permitted during channel preparation.');};
try{
 await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('channel-browser-owner'),new Date(Date.now()+3600000).toISOString());
 const p=(await products()).find(p=>p.id==='P001'),variantId=p.variants[0].id,ean='1234567890128',content={...p.content,trade:{...p.content?.trade,identifiers:{...p.content?.trade?.identifiers,[variantId]:{sku:'TEST-INTERNAL',gtin:ean,verified:true,colour:'Black'},[p.variants[1].id]:{sku:'MISSING-TEST',gtin:'',verified:false,colour:'Black'}}}};
 await db().prepare('UPDATE product_content SET content=? WHERE product_id=?').run(JSON.stringify(content),'P001');await db().prepare('UPDATE variants SET stock=20,reserved=3 WHERE id=?').run(variantId);
 const before=await db().prepare('SELECT name,description,price_cents FROM products WHERE id=?').get('P001');
 for(const width of [1440,390,412]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.exposeFunction('__channelApi',async(path,init)=>{assert.equal(path,'/api/admin/channels');const method=init?.method||'GET',req=new Request('https://channels.example'+path,{method,headers:{cookie:'bigk_admin=channel-browser-owner',origin:'https://channels.example','Content-Type':'application/json'},...(init?.body?{body:init.body}:{})}),r=await(method==='GET'?GET(req):POST(req));return {status:r.status,body:await r.json()};});
  await page.setContent('<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>');
  await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+bundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:bundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
  await page.getByRole('heading',{name:'Voorraad & kanalen',exact:true}).waitFor();await page.getByLabel('Zoek EAN, SKU, artikel of variant',{exact:true}).fill(ean);const row=page.locator('tbody tr').filter({hasText:ean});assert.equal(await row.count(),1);
  await row.getByRole('button',{name:'Kanaal koppelen',exact:true}).click();await page.getByLabel('Kanaalaccount / markt',{exact:true}).fill('account-'+width);await page.getByLabel('Platformartikel-ID',{exact:true}).fill('BOL-OFFER-'+width);await page.getByLabel('EAN zoals op het platform',{exact:true}).fill(ean);await page.getByLabel('Platformtitel ter herkenning (optioneel)',{exact:true}).fill('Bol SEO performance title '+width);await page.getByLabel('Ik heb gecontroleerd dat dit platformartikel',{exact:false}).check();await page.getByRole('button',{name:'Lokale koppeling opslaan',exact:true}).click();await page.getByText('Platformtitel: Bol SEO performance title '+width,{exact:true}).waitFor();
  await row.getByRole('button',{name:'Buffer plannen',exact:true}).click();await page.getByLabel('Geplande veiligheidsbuffer',{exact:true}).fill('5');await page.getByLabel('Reden',{exact:true}).fill('Voorbereiding van kanaalvoorraad');await page.getByRole('button',{name:'Bufferplanning opslaan',exact:true}).click();await page.getByText('Bufferplanning opgeslagen. De actuele voorraad is niet gewijzigd.',{exact:true}).waitFor();
  const card=page.locator('article').filter({hasText:'BOL-OFFER-'+width});await card.getByRole('button',{name:'Lokale koppeling pauzeren',exact:true}).click();await card.getByRole('button',{name:'Lokale koppeling hervatten',exact:true}).waitFor();await card.getByRole('button',{name:'Lokale koppeling verwijderen',exact:true}).click();await page.getByText('Lokale koppeling verwijderd.',{exact:true}).waitFor();assert.equal(await page.getByText('Platformtitel: Bol SEO performance title '+width,{exact:true}).count(),0);
  await page.getByLabel('Zoek EAN, SKU, artikel of variant',{exact:true}).fill('');await page.getByLabel('Controlefilter',{exact:true}).selectOption('missing');const blocked=await page.getByRole('button',{name:'Kanaal koppelen',exact:true}).all();assert.ok(blocked.length>0);assert.ok((await Promise.all(blocked.map(b=>b.isDisabled()))).every(Boolean));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);assert.deepEqual(errors,[]);assert.deepEqual(await db().prepare('SELECT name,description,price_cents FROM products WHERE id=?').get('P001'),before);const stock=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get(variantId);assert.equal(stock.stock,20);assert.equal(stock.reserved,3);await page.close();console.log('CHANNEL_STOCK_BROWSER_PASS '+width);
 }
 assert.equal(externalCalls,0);
}finally{globalThis.fetch=oldFetch;await browser.close();await closeDatabase();rmSync(dir,{recursive:true,force:true});}
