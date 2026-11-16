import {build} from 'esbuild';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {POST as setupPost} from '../app/api/sales/setup/route.ts';
import {inviteSeller} from '../lib/sales-auth.ts';
import {salesDb} from '../lib/sales-db.ts';
import {closeDatabase} from '../lib/db.ts';
import {totp} from '../lib/admin-mfa.ts';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {salesQuote} from '../lib/sales-pricing.ts';
const out=process.env.BIGK_ARTIFACT_DIR||'/workspace/scratch/6c89b13ffc0a/sales-review';mkdirSync(out,{recursive:true});
const imagePlugin={name:'next-image-fixture',setup(build){build.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eee8e2"/><path d="M100 80L50 110 70 160 100 145 100 260 220 260 220 145 250 160 270 110 220 80Z" fill="#303536"/></svg>');export default function Image(props){return <img {...props} src={image}/>}`,loader:'jsx',resolveDir:process.cwd()}));}};
async function bundle(entry){return build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Screen from './components/${entry}';createRoot(document.getElementById('root')).render(<Screen/>);`},bundle:true,write:false,outdir:out,platform:'browser',jsx:'automatic',plugins:[imagePlugin],define:{'process.env.NODE_ENV':'"production"'},minify:true});}
const workspaceBundle=await bundle('sales-workspace'),setupBundle=await bundle('sales-setup');
const empty=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:"import React from 'react';import{createRoot}from'react-dom/client';createRoot(document.getElementById('root')).render(<div/>);"},bundle:true,write:false,minify:true,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const full=workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).contents,baseline=empty.outputFiles[0].contents;
writeFileSync(out+'/bundle-size.json',JSON.stringify({method:'Minified standalone component bundle less identical React runtime; indicative, not Next route chunk measurement',addedMinifiedBytes:full.length-baseline.length,addedGzipBytes:gzipSync(full).length-gzipSync(baseline).length},null,2));
const setupDir=mkdtempSync(join(tmpdir(),'bigk-sales-browser-'));Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(setupDir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://setup.example',ADMIN_MFA_KEY:randomBytes(32).toString('hex'),SELLER_PORTAL_ENABLED:'true'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
try{
 for(const [name,width,mobile] of [['desktop',1440,false],['iphone',390,true],['android',412,true]]){
  const page=await browser.newPage({viewport:{width,height:1000},isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const product={id:'variant-m',name:'ALPINE FLEECE',code:'25303101',image:'/fixture.svg',colour:'Black',size:'M',available:100,retailCents:14690,footwear:false,core:true};
  let authenticated=false,orders=[],saves=0,catalogueMissing=false;const customer={id:'10000000-1000-4000-8000-100000000001',name:'Fixture Sport',vat:'BE0123456749',contact:'Fixture',email:'fixture@example.test',phone:'0123456789',address:'Fixturestraat 10, 1000 Brussel',creditApproved:false,hasPaidOrder:false};
  await page.exposeFunction('__salesFixture',async(path,init)=>{const data=init?.body?JSON.parse(init.body):{};
   if(path==='/api/sales/auth'){authenticated=true;return {status:200,body:{ok:true}};}
   if(path==='/api/sales'&&(!init?.method||init.method==='GET'))return {status:authenticated?200:401,body:authenticated?{actor:{id:'seller-1',name:'Nicky',role:'seller'},catalogue:catalogueMissing?[]:[product,{...product,id:'variant-xl',size:'XL',available:0}],customers:[customer],orders}:{error:'Log in met je verkopersaccount.'}};
   if(path==='/api/sales'&&data.action==='order'){saves++;orders=[{id:'20000000-1000-4000-8000-100000000001',version:1,customerId:customer.id,customerName:customer.name,sellerId:'seller-1',sellerName:'Nicky',status:'submitted',terms:'proforma',quote:salesQuote([product],data.data.items,2.5,'proforma',true),earnedCents:0,createdAt:'2026-11-16T10:00:00Z',paymentReference:''}];return {status:200,body:{id:orders[0].id}};}
   throw Error('Unexpected fixture request '+path);
  });
  await page.setContent('<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>');
  await page.addScriptTag({content:`window.fetch=async(path,init)=>{const r=await window.__salesFixture(path,init);return new Response(JSON.stringify(r.body),{status:r.status,headers:{'Content-Type':'application/json'}})};if(!crypto.randomUUID)crypto.randomUUID=()=>('10000000-1000-4000-8000-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>v.toString(16).padStart(2,'0')).join(''));`});
  await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+workspaceBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
  await page.getByLabel('E-mailadres',{exact:true}).fill('rep@example.test');await page.getByLabel('Wachtwoord',{exact:true}).fill('Fixture password 1234');await page.getByLabel('Authenticatorcode').fill('123456');await page.getByRole('button',{name:'Inloggen',exact:true}).click();
  await page.getByRole('heading',{name:'Goed op weg, Nicky.'}).waitFor();if(mobile)await page.getByRole('button',{name:'Bestelling openen of sluiten'}).click();await page.getByLabel('Winkel',{exact:true}).selectOption(customer.id);
  assert.equal(await page.getByLabel('ALPINE FLEECE Black maat XL',{exact:true}).isDisabled(),true);
  await page.getByLabel('ALPINE FLEECE Black maat M',{exact:true}).fill('30');await page.getByText('€ 311,54',{exact:true}).waitFor();
  await page.getByLabel('Presentatiemodus').check();assert.equal(await page.getByText('Jouw verwachte commissie',{exact:true}).count(),0);await page.getByLabel('Presentatiemodus').uncheck();
  if(mobile)await page.getByRole('button',{name:'Bestelling openen of sluiten'}).click();const screenshot=await page.screenshot({path:out+'/sales-'+name+'.png',fullPage:true});if(process.env.CI)console.log('SALES_SCREENSHOT '+name+' '+(await sharp(screenshot).resize({width:Math.min(width,1100)}).webp({quality:70}).toBuffer()).toString('base64'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);
  if(!mobile){catalogueMissing=true;await page.getByRole('button',{name:'Voorraad vernieuwen',exact:true}).click();await page.getByText('Een product in je selectie is niet langer beschikbaar.',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Indienen bij BIG K',exact:true}).isDisabled(),true);catalogueMissing=false;await page.getByRole('button',{name:'Voorraad vernieuwen',exact:true}).click();await page.getByText('€ 311,54',{exact:true}).waitFor();}if(mobile)await page.getByRole('button',{name:'Bestelling openen of sluiten'}).click();await page.getByRole('button',{name:'Indienen bij BIG K',exact:true}).click();await page.getByText('Ingediend · wacht op BIG K',{exact:false}).waitFor();assert.equal(saves,1);await page.getByText('30 × ALPINE FLEECE',{exact:false}).waitFor();assert.deepEqual(errors,[]);await page.close();
 }

 const ownerPage=await browser.newPage();let ownerLogouts=0;
 await ownerPage.exposeFunction('__ownerFixture',async(path,init)=>{
 if(path==='/api/sales'&&init.method==='GET')return {actor:{id:'owner',name:'BIG K',role:'owner'},catalogue:[],customers:[],orders:[],accounts:[]};
 if(path==='/api/admin/logout'&&init.method==='POST'){ownerLogouts++;return {ok:true};}
 throw Error('Unexpected owner auth request '+path);
 });
 await ownerPage.setContent('<html><body><div id="root"></div></body></html>');
 await ownerPage.addScriptTag({content:"window.fetch=async(path,init)=>new Response(JSON.stringify(await window.__ownerFixture(path,init)),{status:200})"});
 await ownerPage.addStyleTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});
 await ownerPage.addScriptTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
 await ownerPage.getByRole('heading',{name:'Goed op weg, BIG K.'}).waitFor();
 await ownerPage.getByRole('button',{name:'Uitloggen',exact:true}).click();
 await ownerPage.getByRole('button',{name:'Inloggen',exact:true}).waitFor();assert.equal(ownerLogouts,1);await ownerPage.close();

 const invitation=await inviteSeller({id:'owner',name:'Owner',role:'owner'},'Fixture Seller','fixture-seller@example.test'),setupToken=invitation.setupPath.split('#')[1];
 const page=await browser.newPage();let htmlResponse=true,secret='',setupCalls=[];
 await page.exposeFunction('__setupRequest',async(path,init)=>{
  assert.equal(path,'/api/sales/setup','The UI must use the actual Next.js setup API route');assert.equal(init.method,'POST');
  const data=JSON.parse(init.body);assert.equal(data.token,setupToken);setupCalls.push(data.action);
  if(htmlResponse)return {status:404,type:'text/html',text:'<!DOCTYPE html><html><body>Not found</body></html>'};
  const response=await setupPost(new Request('https://setup.example'+path,{method:'POST',headers:{origin:'https://setup.example','Content-Type':'application/json'},body:init.body}));
  const text=await response.text();if(response.ok&&data.action==='begin')secret=JSON.parse(text).secret;
  return {status:response.status,type:response.headers.get('content-type'),text};
 });
 await page.setContent('<html><body><div id="root"></div></body></html>');
 await page.addScriptTag({content:"window.location.hash="+JSON.stringify(setupToken)+";history.replaceState=()=>{window.location.hash=''};window.fetch=async(path,init)=>{const r=await window.__setupRequest(path,init);return new Response(r.text,{status:r.status,headers:{'Content-Type':r.type}})}"});
 await page.addStyleTag({content:setupBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:setupBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
 await page.getByRole('button',{name:'Account instellen',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Account instellen is tijdelijk niet beschikbaar.'}).waitFor();
 assert.equal(await page.getByText(/Unexpected token/).count(),0);
 htmlResponse=false;await page.getByRole('button',{name:'Account instellen',exact:true}).click();
 await page.getByLabel('Nieuw wachtwoord, minimaal 16 tekens').fill('Fixture password 1234');
 await page.getByLabel('Authenticatorcode').fill(totp(secret,Math.floor(Date.now()/30000)));
 await page.getByRole('button',{name:'Account activeren'}).click();await page.getByText('Je account is ingesteld.',{exact:true}).waitFor();
 assert.equal(new URL(page.url()).hash,'');assert.deepEqual(setupCalls,['begin','begin','finish']);
 const enrolled=await salesDb().prepare('SELECT password_hash,secret_encrypted,invite_hash FROM seller_accounts WHERE email=?').get('fixture-seller@example.test');assert.ok(enrolled.password_hash);assert.ok(enrolled.secret_encrypted);assert.equal(enrolled.invite_hash,null);
 const reused=await setupPost(new Request('https://setup.example/api/sales/setup',{method:'POST',headers:{origin:'https://setup.example','Content-Type':'application/json'},body:JSON.stringify({action:'begin',token:setupToken})}));assert.equal(reused.status,410);await page.close();
 console.log('PASS: actual seller UI desktop/iPhone/Android: login, catalogue, real variant selection, out-of-stock, live commission, presentation mode, submit once and setup. API calls simulated; backend verified separately.');
}finally{await browser.close();await closeDatabase();rmSync(setupDir,{recursive:true,force:true});}
