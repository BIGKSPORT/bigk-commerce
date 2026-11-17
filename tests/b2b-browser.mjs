import {build} from 'esbuild';
import {chromium} from 'playwright';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {db,closeDatabase} from '../lib/db.ts';
import {hash} from '../lib/security.ts';
import {b2bDb} from '../lib/b2b-db.ts';
import {b2bWorkspace} from '../lib/b2b-service.ts';
import {GET,POST} from '../app/api/b2b/route.ts';
import {GET as authGet,POST as authPost,DELETE as authDelete} from '../app/api/b2b/auth/route.ts';
import {GET as adminGet,POST as adminPost} from '../app/api/b2b/admin/route.ts';
const dir=mkdtempSync(join(tmpdir(),'bigk-b2b-browser-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://b2b.example',B2B_PORTAL_ENABLED:'true',SELLER_PORTAL_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const imagePlugin={name:'b2b-test-image',setup(build){build.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eee8e2"/><path d="M100 80L50 110 70 160 100 145 100 260 220 260 220 145 250 160 270 110 220 80Z" fill="#303536"/></svg>');export default function Image({fill,priority,...props}){return <img {...props} src={image}/>}`,loader:'jsx',resolveDir:process.cwd()}));}};
async function bundle(admin){return build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import Screen from './components/${admin?'admin-b2b':'b2b-portal'}';const transport={request:async(path,init)=>{const r=await window.__b2bApi(path,init||{method:'GET'});if(r.status>=400)throw Object.assign(Error(r.body.error),{status:r.status});return r.body;}};createRoot(document.getElementById('root')).render(<Screen ${admin?'transport={transport}':''}/>);`},bundle:true,write:false,outdir:dir,platform:'browser',jsx:'automatic',minify:true,plugins:[imagePlugin],define:{'process.env.NODE_ENV':'"production"'}});}
const [buyerBundle,adminBundle]=await Promise.all([bundle(false),bundle(true)]);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
try{
 await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('b2b-browser-owner'),new Date(Date.now()+3600000).toISOString());
 await db().prepare('UPDATE products SET price_cents=10000 WHERE id=?').run('P001');await db().prepare('UPDATE variants SET stock=500,reserved=0 WHERE product_id=?').run('P001');
 async function pageFor(isAdmin,width,fragment=''){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];let cookie=isAdmin?'bigk_admin=b2b-browser-owner':'';
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('https://b2b.example/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>'}));
  await page.exposeFunction('__b2bApi',async(path,init)=>{
   const method=init?.method||'GET',req=new Request('https://b2b.example'+path,{method,headers:{cookie,origin:'https://b2b.example','Content-Type':'application/json'},...(init?.body?{body:init.body}:{})});
   const handler=path==='/api/b2b/admin'?(method==='GET'?adminGet:adminPost):path==='/api/b2b/auth'?(method==='DELETE'?authDelete:method==='GET'?authGet:authPost):path==='/api/b2b'?(method==='GET'?GET:POST):null;
   assert.ok(handler,'unexpected endpoint '+path);const response=await handler(req),setCookie=response.headers.get('Set-Cookie');if(setCookie)cookie=setCookie.split(';')[0];return {status:response.status,body:await response.json()};
  });
  await page.goto('https://b2b.example/'+(isAdmin?'admin':'b2b')+fragment);
  await page.addScriptTag({content:"window.fetch=async(path,init)=>{const r=await window.__b2bApi(path,init||{method:'GET'});return new Response(JSON.stringify(r.body),{status:r.status,headers:{'Content-Type':'application/json'}})};if(!crypto.randomUUID)crypto.randomUUID=()=>('10000000-1000-4000-8000-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>v.toString(16).padStart(2,'0')).join(''));"});
  const b=isAdmin?adminBundle:buyerBundle;await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+(b.outputFiles.find(f=>f.path.endsWith('.css'))?.text||'')});await page.addScriptTag({content:b.outputFiles.find(f=>f.path.endsWith('.js')).text});return {page,errors};
 }
 for(const [index,width] of [1440,390,412].entries()){
  const {page:owner,errors:ownerErrors}=await pageFor(true,width),name='Direct Sport '+width,base=12340000+index,vat='BE'+String(base).padStart(8,'0')+String(97-base%97).padStart(2,'0');
  await owner.getByLabel('Juridische bedrijfsnaam',{exact:true}).fill(name);await owner.getByLabel('Belgisch btw-nummer',{exact:true}).fill(vat);await owner.getByLabel('Zakelijk e-mailadres',{exact:true}).fill('buyer-'+width+'@example.test');await owner.getByLabel('Contactpersoon',{exact:true}).fill('Buyer');await owner.getByLabel('Telefoon',{exact:true}).fill('0123456789');await owner.getByLabel('Straat en huisnummer',{exact:true}).fill('Teststraat 10');await owner.getByLabel('Postcode',{exact:true}).fill('1000');await owner.getByLabel('Gemeente',{exact:true}).fill('Brussel');await owner.getByLabel('Ik heb KBO/btw-nummer',{exact:false}).check();await owner.getByLabel('Ik bevestig dat dit een rechtstreeks',{exact:false}).check();await owner.getByRole('button',{name:'B2B-toegang goedkeuren',exact:true}).click();
  const card=owner.locator('article').filter({has:owner.getByRole('heading',{name,exact:true})});await card.getByRole('button',{name:'Persoonlijke aanmeldlink',exact:true}).click();const link=await owner.getByLabel('Aanmeldlink',{exact:true}).inputValue();assert.ok(link.includes('/b2b#'));
  const {page:buyer,errors:buyerErrors}=await pageFor(false,width,'#'+link.split('#')[1]);await buyer.getByRole('button',{name:'Aanmelden bevestigen',exact:true}).click();await buyer.getByRole('heading',{name,exact:true}).waitFor();assert.equal(await buyer.evaluate(()=>window.location.hash),'');
  const account=await b2bDb().prepare('SELECT id FROM b2b_accounts WHERE email=?').get('buyer-'+width+'@example.test'),w=await b2bWorkspace(String(account.id)),p=w.catalogue.find(p=>p.modelId==='P001');
  await buyer.getByLabel('Zoek in de collectie',{exact:true}).fill(p.name);await buyer.getByLabel(p.name+' '+p.colour+' maat '+p.size,{exact:true}).fill('30');
  if(width<650)await buyer.getByRole('button',{name:'Bestelling openen of sluiten',exact:true}).click();
  await buyer.getByRole('button',{name:'Bestelling controleren',exact:true}).click();await buyer.getByLabel('Ik bestel zakelijk op proforma.',{exact:false}).check();await buyer.getByRole('button',{name:'Bestelaanvraag plaatsen',exact:true}).click();await buyer.getByRole('heading',{name:'Aanvraag ontvangen',exact:true}).waitFor();
  const row=await b2bDb().prepare('SELECT id FROM b2b_orders WHERE account_id=?').get(account.id);assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(p.id)).reserved,0);
  await owner.getByRole('button',{name:'B2B-overzicht vernieuwen',exact:true}).click();const order=owner.locator('article').filter({hasText:String(row.id)});await order.getByLabel('Factuur/proformareferentie',{exact:true}).fill('PRO-'+width);await order.getByLabel('Betaalinstructies en bevestigde levering',{exact:true}).fill('Betaal de volledige proforma. Levering volgt na ontvangst op het goedgekeurde adres.');await order.getByRole('button',{name:'Bevestigen en voorraad reserveren',exact:true}).click();await order.getByText('Bevestigd / voorraad gereserveerd',{exact:false}).waitFor();
  await buyer.getByRole('button',{name:'Vernieuwen',exact:true}).click();await buyer.getByRole('heading',{name:'Bevestigd · wacht op betaling',exact:true}).waitFor();await buyer.getByText('Betaal de volledige proforma.',{exact:false}).waitFor();assert.equal((await db().prepare('SELECT reserved FROM variants WHERE id=?').get(p.id)).reserved,30);
  await order.getByLabel('Referentie ontvangen volledige betaling',{exact:true}).fill('BANK-'+width);await order.getByRole('button',{name:'Volledige betaling registreren',exact:true}).click();await order.getByLabel('Vervoerder en trackingreferentie',{exact:true}).fill('DPD TRACK-'+width);await order.getByRole('button',{name:'Verzending registreren',exact:true}).click();
  await buyer.getByRole('button',{name:'Vernieuwen',exact:true}).click();await buyer.getByRole('heading',{name:'Verzonden',exact:true}).waitFor();await buyer.getByText('Verzending: DPD TRACK-'+width,{exact:true}).waitFor();assert.equal((await db().prepare('SELECT stock FROM variants WHERE id=?').get(p.id)).stock,500-(index+1)*30);
  assert.equal(await buyer.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);assert.deepEqual(buyerErrors,[]);assert.deepEqual(ownerErrors,[]);
  await buyer.getByRole('button',{name:'Uitloggen',exact:true}).click();await buyer.getByRole('button',{name:'Aanmeldlink aanvragen',exact:true}).waitFor();await buyer.close();await owner.close();console.log('B2B_LOGIN_TO_SALE_PASS '+width);
 }
}finally{await browser.close();await closeDatabase();rmSync(dir,{recursive:true,force:true});}
