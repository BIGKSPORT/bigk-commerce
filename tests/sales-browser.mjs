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
const imagePlugin={name:'next-image-fixture',setup(build){build.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eee8e2"/><path d="M100 80L50 110 70 160 100 145 100 260 220 260 220 145 250 160 270 110 220 80Z" fill="#303536"/></svg>');export default function Image(props){return <img {...props} data-source={props.src} src={image}/>}`,loader:'jsx',resolveDir:process.cwd()}));}};
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


 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let version=0,writes=0;
  const response=()=>{
   const name=version?'ALPINE UPDATED':'ALPINE FLEECE',categoryLabel=version?'Nieuwe fleececategorie':'Fleece';
   const rows=[{id:'bm',modelId:'fleece',name,code:'25303101',image:version?'/changed.webp':'/front.webp',colour:'Black',size:'M',available:version?7:50,retailCents:version?15990:14690,footwear:false,core:true},{id:'bl',modelId:'fleece',name,code:'25303101',image:'/front.webp',colour:'Black',size:'L',available:0,retailCents:14690,footwear:false,core:true},{id:'dm',modelId:'fleece',name,code:'25303102',image:'/blue.webp',colour:'Dusty Blue',size:'M',available:20,retailCents:14690,footwear:false,core:true},{id:'pants',modelId:'pants',name:'CORE PANTS',code:'25302701',image:'/pants.webp',colour:'Black',size:'M',available:30,retailCents:9390,footwear:false,core:true}];
   const base={productId:'P001',category:'Fleece',categoryLabel,categoryActive:true,description:version?'Nieuwe beschrijving uit de backoffice.':'Productinformatie uit de backoffice.',composition:'Geverifieerde materiaalinformatie',fit:'Regular fit uit de backoffice',care:'Onderhoud uit de backoffice',details:'Geverifieerde productdetails',sizeGuide:'Maatadvies uit de backoffice',sizeTable:'Maat\tBorst\nM\t100',features:[]};
   const models=[{...base,id:'fleece',name,colours:[{id:'black',name:'Black',article:'25303101',images:[version?'/changed.webp':'/front.webp','/back.webp'],variantIds:['bm','bl']},{id:'blue',name:'Dusty Blue',article:'25303102',images:['/blue.webp'],variantIds:['dm']}]},{...base,id:'pants',productId:'P010',name:'CORE PANTS',category:'Pants',categoryLabel:'Broeken',colours:[{id:'pants-black',name:'Black',article:'25302701',images:['/pants.webp'],variantIds:['pants']}]}];
   return {actor:{id:'fixture',name:'Catalogus',role:'seller'},catalogue:rows,models,customers:[],orders:[]};
  };
  await page.exposeFunction('__catalogueFixture',async(path,init)=>{assert.equal(path,'/api/sales');if(init.method!=='GET'){writes++;throw Error('No writes expected');}return response();});
  await page.setContent('<html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>');
  await page.addScriptTag({content:"window.fetch=async(path,init)=>new Response(JSON.stringify(await window.__catalogueFixture(path,init)),{status:200,headers:{'Content-Type':'application/json'}})"});
  await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+workspaceBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
  await page.getByRole('heading',{name:'ALPINE FLEECE',exact:true}).waitFor({timeout:10000}).catch(async e=>{console.log('CATALOGUE_RENDER_DEBUG '+JSON.stringify({width,errors,body:(await page.locator('body').innerText()).slice(0,5000)}));throw e;});assert.equal(await page.getByRole('heading',{name:'ALPINE FLEECE',exact:true}).count(),1);
  const categories=page.getByRole('navigation',{name:'Productcategorieën'});
  await categories.getByRole('button',{name:/Broeken/}).click();assert.equal(await page.getByRole('heading',{name:'ALPINE FLEECE',exact:true}).count(),0);
  await categories.getByRole('button',{name:/Alle producten/}).click();
  await page.getByLabel('Filter op kleur',{exact:true}).selectOption('Dusty Blue');assert.equal(await page.getByRole('heading',{name:'CORE PANTS',exact:true}).count(),0);
  await page.getByLabel('Filter op maat',{exact:true}).selectOption('L');await page.getByRole('heading',{name:'Geen producten gevonden'}).waitFor();
  await page.getByRole('button',{name:'Filters wissen',exact:true}).click();
  await page.getByLabel('Sorteer producten',{exact:true}).selectOption('price');
  const names=await page.locator('article h2').allTextContents();assert.deepEqual(names,['CORE PANTS','ALPINE FLEECE']);
  await page.getByLabel('ALPINE FLEECE Black maat M',{exact:true}).fill('3');
  await page.getByRole('button',{name:'Bekijk ALPINE FLEECE',exact:true}).click();const dialog=page.getByRole('dialog');
  await dialog.getByText('Regular fit uit de backoffice',{exact:true}).waitFor();await dialog.getByText('Geverifieerde materiaalinformatie',{exact:true}).waitFor();
  assert.equal(await dialog.getByLabel('ALPINE FLEECE Black maat L',{exact:true}).isDisabled(),true);
  await dialog.getByLabel('ALPINE FLEECE Dusty Blue maat M',{exact:true}).fill('2');
  await dialog.evaluate(el=>{el.scrollTop=0;});await dialog.getByRole('button',{name:'Productfoto 2',exact:true}).click();assert.equal(await dialog.locator('img').first().getAttribute('data-source'),'/back.webp');
  await page.screenshot({path:out+'/catalogue-detail-'+width+'.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);
  await dialog.getByRole('button',{name:'Productdetails sluiten'}).click();assert.equal(await page.getByLabel('ALPINE FLEECE Black maat M',{exact:true}).inputValue(),'3');
  version=1;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('heading',{name:'ALPINE UPDATED',exact:true}).waitFor();
  assert.equal(await page.getByLabel('ALPINE UPDATED Black maat M',{exact:true}).inputValue(),'3');
  await categories.getByRole('button',{name:/Nieuwe fleececategorie/}).waitFor();
  const card=page.locator('article').filter({has:page.getByRole('heading',{name:'ALPINE UPDATED',exact:true})});assert.equal(await card.locator('img').first().getAttribute('data-source'),'/changed.webp');
  await card.getByText('€ 159,90',{exact:true}).waitFor();assert.equal(await page.getByLabel('ALPINE UPDATED Black maat M',{exact:true}).getAttribute('max'),'7');
  const screenshot=await page.screenshot({path:out+'/catalogue-'+width+'.png',fullPage:true});if(process.env.CI)console.log('CATALOGUE_SCREENSHOT '+width+' '+(await sharp(screenshot).resize({width:Math.min(width,1100)}).webp({quality:70}).toBuffer()).toString('base64'));
  assert.equal(writes,0);assert.deepEqual(errors,[]);await page.close();
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


 const previewPage=await browser.newPage();let previewWrites=0;
 await previewPage.exposeFunction('__sellerPreviewFixture',async(path,init)=>{
 if(init.method!=='GET'){previewWrites++;throw Error('Preview must not write');}
 assert.equal(path,'/api/sales?previewSeller=10000000-1000-4000-8000-100000000001');
 return {actor:{id:'10000000-1000-4000-8000-100000000001',name:'Kenny Endels',role:'seller'},preview:{sellerId:'10000000-1000-4000-8000-100000000001',sellerName:'Kenny Endels',readOnly:true},catalogue:[{id:'preview-m',name:'ALPINE FLEECE',code:'25303101',image:'/fixture.svg',colour:'Black',size:'M',available:100,retailCents:14690,footwear:false,core:true}],customers:[],orders:[]};
 });
 await previewPage.setContent('<html><body><div id="root"></div></body></html>');
 await previewPage.addScriptTag({content:"const OriginalParams=window.URLSearchParams;window.URLSearchParams=class extends OriginalParams{constructor(v){super(v||'previewSeller=10000000-1000-4000-8000-100000000001')}};window.fetch=async(path,init)=>new Response(JSON.stringify(await window.__sellerPreviewFixture(path,init)),{status:200})"});
 await previewPage.addStyleTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await previewPage.addScriptTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
 await previewPage.getByText('Voorbeeldweergave van Kenny Endels',{exact:true}).waitFor();
 assert.equal(await previewPage.getByRole('button',{name:'Verkopers',exact:true}).count(),0);
 await previewPage.getByLabel('ALPINE FLEECE Black maat M',{exact:true}).fill('30');
 assert.equal(await previewPage.getByRole('button',{name:'Indienen bij BIG K',exact:true}).isDisabled(),true);
 assert.equal(await previewPage.getByRole('button',{name:'Bewaar concept',exact:true}).isDisabled(),true);
 await previewPage.getByRole('button',{name:'Winkels',exact:true}).click();assert.equal(await previewPage.getByRole('button',{name:'Winkel opslaan',exact:true}).isDisabled(),true);
 assert.ok(await previewPage.getByRole('link',{name:'Terug naar mijn beheer'}).count()>0);assert.equal(previewWrites,0);await previewPage.close();
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
