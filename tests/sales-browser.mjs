import {build} from 'esbuild';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {salesQuote} from '../lib/sales-pricing.ts';
const out=process.env.BIGK_ARTIFACT_DIR||'/workspace/scratch/6c89b13ffc0a/sales-review';mkdirSync(out,{recursive:true});
const imagePlugin={name:'next-image-fixture',setup(build){build.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"import React from 'react';export default function Image(props){return <img {...props}/>}",loader:'jsx',resolveDir:process.cwd()}));}};
async function bundle(entry){return build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Screen from './components/${entry}';createRoot(document.getElementById('root')).render(<Screen/>);`},bundle:true,write:false,outdir:out,platform:'browser',jsx:'automatic',plugins:[imagePlugin],define:{'process.env.NODE_ENV':'"production"'},minify:true});}
const workspaceBundle=await bundle('sales-workspace'),setupBundle=await bundle('sales-setup');
const empty=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:"import React from 'react';import{createRoot}from'react-dom/client';createRoot(document.getElementById('root')).render(<div/>);"},bundle:true,write:false,minify:true,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const full=workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).contents,baseline=empty.outputFiles[0].contents;
writeFileSync(out+'/bundle-size.json',JSON.stringify({method:'Minified standalone component bundle less identical React runtime; indicative, not Next route chunk measurement',addedMinifiedBytes:full.length-baseline.length,addedGzipBytes:gzipSync(full).length-gzipSync(baseline).length},null,2));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
try{
 for(const [name,width,mobile] of [['desktop',1440,false],['iphone',390,true],['android',412,true]]){
  const page=await browser.newPage({viewport:{width,height:1000},isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const product={id:'variant-m',name:'ALPINE FLEECE',code:'25303101',image:'/fixture.svg',colour:'Black',size:'M',available:100,retailCents:14690,footwear:false,core:true};
  let authenticated=false,orders=[],saves=0;const customer={id:'10000000-1000-4000-8000-100000000001',name:'Fixture Sport',vat:'BE0123456749',contact:'Fixture',email:'fixture@example.test',phone:'0123456789',address:'Fixturestraat 10, 1000 Brussel',creditApproved:false,hasPaidOrder:false};
  await page.route('https://sales.example/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;let data={};if(request.method()==='POST')data=request.postDataJSON();
   if(path==='/api/sales/auth')return route.fulfill({json:{ok:true},status:(authenticated=true,200)});
   if(path==='/api/sales'&&request.method()==='GET')return route.fulfill({status:authenticated?200:401,json:authenticated?{actor:{id:'seller-1',name:'Nicky',role:'seller'},catalogue:[product,{...product,id:'variant-xl',size:'XL',available:0}],customers:[customer],orders}:{error:'Log in met je verkopersaccount.'}});
   if(path==='/api/sales'&&request.method()==='POST'&&data.action==='order'){saves++;orders=[{id:'20000000-1000-4000-8000-100000000001',version:1,customerId:customer.id,customerName:customer.name,sellerId:'seller-1',sellerName:'Nicky',status:'submitted',terms:'proforma',quote:salesQuote([product],data.data.items,2.5,'proforma',true),earnedCents:0,createdAt:'2026-11-16T10:00:00Z',paymentReference:''}];return route.fulfill({json:{id:orders[0].id}});}
   if(path==='/fixture.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#eee8e2"/><path d="M100 80L50 110 70 160 100 145 100 260 220 260 220 145 250 160 270 110 220 80Z" fill="#303536"/></svg>'});
   if(path==='/staff/sales')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div></body></html>'});
   throw Error('Unexpected request '+path);
  });
  await page.goto('https://sales.example/staff/sales');await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+workspaceBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:workspaceBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
  await page.getByLabel('E-mailadres',{exact:true}).fill('rep@example.test');await page.getByLabel('Wachtwoord',{exact:true}).fill('Fixture password 1234');await page.getByLabel('Authenticatorcode').fill('123456');await page.getByRole('button',{name:'Inloggen',exact:true}).click();
  await page.getByRole('heading',{name:'Goed op weg, Nicky.'}).waitFor();await page.getByLabel('Winkel',{exact:true}).selectOption(customer.id);
  assert.equal(await page.getByLabel('ALPINE FLEECE Black maat XL',{exact:true}).isDisabled(),true);
  await page.getByLabel('ALPINE FLEECE Black maat M',{exact:true}).fill('30');await page.getByText('€ 311,54',{exact:true}).waitFor();
  await page.getByLabel('Presentatiemodus').check();assert.equal(await page.getByText('Jouw verwachte commissie',{exact:true}).count(),0);await page.getByLabel('Presentatiemodus').uncheck();
  await page.screenshot({path:out+'/sales-'+name+'.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);
  await page.getByRole('button',{name:'Indienen bij BIG K',exact:true}).click();await page.getByText('Ingediend · wacht op BIG K',{exact:false}).waitFor();assert.equal(saves,1);await page.getByText('30 × ALPINE FLEECE',{exact:false}).waitFor();assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage();await page.route('https://sales.example/**',async route=>{const path=new URL(route.request().url()).pathname;if(path==='/api/sales/setup'){const data=route.request().postDataJSON();return route.fulfill({json:data.action==='begin'?{secret:'FIXTURESECRET',qr:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'}:{ok:true}});}return route.fulfill({contentType:'text/html',body:'<html><body><div id="root"></div></body></html>'});});await page.goto('https://sales.example/staff/sales/setup#fixture-token');await page.addStyleTag({content:setupBundle.outputFiles.find(f=>f.path.endsWith('.css')).text});await page.addScriptTag({content:setupBundle.outputFiles.find(f=>f.path.endsWith('.js')).text});await page.getByRole('button',{name:'Account instellen',exact:true}).click();await page.getByLabel('Nieuw wachtwoord, minimaal 16 tekens').fill('Fixture password 1234');await page.getByLabel('Authenticatorcode').fill('123456');await page.getByRole('button',{name:'Account activeren'}).click();await page.getByText('Je account is ingesteld.',{exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');await page.close();
 console.log('PASS: actual seller UI desktop/iPhone/Android: login, catalogue, real variant selection, out-of-stock, live commission, presentation mode, submit once and setup. API calls simulated; backend verified separately.');
}finally{await browser.close();}
