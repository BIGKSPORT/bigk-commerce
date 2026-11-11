import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.BIGK_ARTIFACT_DIR||'/tmp/bigk-shipping-review';mkdirSync(out,{recursive:true});
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {AdminOrders} from './components/admin-orders';
const order={id:'10000000-1000-4000-8000-100000000001',status:'paid',subtotal:14690,shipping:0,total:14690,currency:'EUR',email:'fixture@example.com',phone:'+32470123456',createdAt:'2026-11-11T10:00:00Z',expiresAt:'2026-11-11T11:00:00Z',stripeSession:null,tracking:null,deliveryAddress:{name:'Fixture Only',address:'Example Street 12',postal:'2990',city:'Wuustwezel',country:'BE'},items:[{name:'ALPINE FLEECE',size:'M',quantity:1,unitPrice:14690}]};
let state='not_started';window.shippingFixture={creates:0,fulfils:0};
const status=()=>({enabled:true,configured:true,state,shipmentId:state==='created'?'123':undefined,canCreate:true,address:{street:'Example Street',number:'12'}});
const transport={async request(path,init){if(path.includes('/shipping/myparcel/orders')){if(!init?.method){return path.includes('orderId=')?status():{connected:true,enabled:true,message:'MyParcel authenticated successfully. No shipment or label was created.'}}const data=JSON.parse(init.body);if(data.action==='refresh')return {...status(),tracking:'TEST123456',trackingUrl:'https://tracking.dpd.be/TEST123456'};window.shippingFixture.creates++;state='created';return status();}if(path==='/api/admin/orders'){window.shippingFixture.fulfils++;return {ok:true}}throw Error('Unexpected fixture request: '+path)}};
createRoot(document.getElementById('root')).render(<AdminOrders orders={[order]} transport={transport} onSaved={async()=>{}} club={null}/>);
`},bundle:true,write:false,outdir:out,platform:'browser',jsx:'automatic',alias:{'next/image':resolve('preview/image.tsx'),'next/link':resolve('preview/link.tsx')},define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},minify:true});
const js=bundle.outputFiles.find(f=>f.path.endsWith('.js'))?.text||bundle.outputFiles[0].text;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html lang="en"><body><div class="admin-shell"><div id="root"></div></div></body></html>');
  await page.addStyleTag({content:readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/identity.css','utf8')+'\n'+(bundle.outputFiles.find(f=>f.path.endsWith('.css'))?.text||'')});
  await page.addScriptTag({content:js});
  await page.getByRole('button',{name:'Check MyParcel connection'}).click();await page.getByText('MyParcel authenticated successfully.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Manage order'}).click();const dialog=page.getByRole('dialog');
  const create=dialog.getByRole('button',{name:'Create DPD label',exact:true});await create.waitFor();assert.equal(await create.isEnabled(),false);
  assert.equal(await dialog.getByLabel('Carrier street',{exact:true}).inputValue(),'Example Street');assert.equal(await dialog.getByLabel('Carrier house number',{exact:true}).inputValue(),'12');
  await dialog.getByLabel('Measured parcel weight (grams)',{exact:true}).fill('750');await dialog.getByRole('checkbox',{name:'I checked the delivery address and measured this packed parcel.'}).check();
  await create.click();await dialog.getByRole('link',{name:'Open / print DPD label ↗'}).waitFor();assert.equal(await page.evaluate(()=>window.shippingFixture.creates),1);assert.equal(await page.evaluate(()=>window.shippingFixture.fulfils),0);
  await dialog.getByRole('button',{name:'Refresh carrier status / tracking'}).click();await page.waitForFunction(()=>document.querySelector('input[name="tracking"]')?.value==='TEST123456');
  assert.equal(await dialog.getByLabel('Carrier',{exact:true}).inputValue(),'DPD');assert.equal(await dialog.getByLabel('HTTPS tracking link (optional)',{exact:true}).inputValue(),'https://tracking.dpd.be/TEST123456');
  await dialog.screenshot({path:out+'/myparcel-order-label-'+width+'.png'});
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await dialog.getByRole('checkbox',{name:'I checked sizes and quantities and the parcel is ready to hand over.'}).check();await dialog.getByRole('button',{name:'Mark fulfilled',exact:true}).click();await dialog.getByText('Order marked fulfilled.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>window.shippingFixture.fulfils),1);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: real order component at desktop and 390px: connection, reviewed address/weight, one label, print link, tracking autofill, separate fulfilment. Carrier and order writes were simulated.');
}finally{await browser.close()}
