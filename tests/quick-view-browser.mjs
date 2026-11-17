import {build} from 'esbuild';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#eee"/></svg>');
const product={id:'QV',slug:'quick-view-test',name:'Quick view test',description:'Performance layer',code:'QV-TEST',category:'Tops',priceCents:7990,approved:true,active:true,featured:true,images:[image,image+'#2'],tags:[],version:1,variants:[{id:'QV-S',size:'S',stock:4,reserved:0},{id:'QV-M',size:'M',stock:0,reserved:0},{id:'QV-BLUE-S',size:'S',stock:3,reserved:0}],content:{trade:{identifiers:{'QV-S':{colour:'Black'},'QV-M':{colour:'Black'},'QV-BLUE-S':{colour:'Blue'}}}}};
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import Screen from './components/storefront';import{SiteLanguageProvider}from './components/site-language';createRoot(document.getElementById('root')).render(<SiteLanguageProvider locale="en"><Screen products={${JSON.stringify([product])}} mode="live" ready={true}/></SiteLanguageProvider>);`},bundle:true,write:false,outdir:'/tmp/quick-view-bundle',platform:'browser',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'next-fixture',setup(build){build.onResolve({filter:/^next\/(image|link|navigation)$/},args=>({path:args.path,namespace:'next-fixture'}));build.onLoad({filter:/.*/,namespace:'next-fixture'},({path})=>({resolveDir:process.cwd(),loader:'jsx',contents:path==='next/navigation'?`export const usePathname=()=>'/en';export const useRouter=()=>({push:()=>{},refresh:()=>{}});`:`import React from 'react';export const getImageProps=props=>({props});export default function Fixture({priority,quality,fill,prefetch,loading,...props}){return React.createElement('${path==='next/image'?'img':'a'}',props);}`}));}}]});
const css=['app/globals.css','app/identity.css','app/storefront-polish.css'].map(p=>readFileSync(p,'utf8')).join('\n')+'\n'+bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const viewport of [{width:390,height:844},{width:412,height:915},{width:375,height:667},{width:1440,height:1000}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>');
  await page.evaluate(()=>{const values=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}})});
  await page.addStyleTag({content:css});await page.addScriptTag({content:bundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
  await page.locator('.quick-view').first().click();const dialog=page.locator('dialog.quick-view-modal[open]');await dialog.waitFor();
  assert.equal(await dialog.evaluate(el=>getComputedStyle(el).overflowY),'auto');
  await dialog.locator('.size-options').scrollIntoViewIfNeeded();assert.equal(await dialog.locator('.size-options button').filter({hasText:/^M$/}).isDisabled(),true);
  if(viewport.width<=760)assert.ok(await dialog.locator('.detail-image').evaluate(el=>el.getBoundingClientRect().height<=300));
  else assert.equal(await dialog.locator('.quick-product-detail').evaluate(el=>getComputedStyle(el).display),'grid');
  await dialog.getByRole('button',{name:'Choose colour Blue',exact:true}).click();
  await dialog.locator('.size-options button').filter({hasText:/^S$/}).click();
  const buy=dialog.getByRole('button',{name:'Add to bag',exact:true});await buy.scrollIntoViewIfNeeded();
  assert.ok(await buy.evaluate(el=>{const r=el.getBoundingClientRect(),d=el.closest('dialog').getBoundingClientRect();return r.top>=d.top&&r.bottom<=d.bottom+1}));
  await buy.click();await page.waitForTimeout(150);console.log(JSON.stringify({width:viewport.width,errors,cart:await page.evaluate(()=>localStorage.getItem("bigk-bag-v2")),dialogs:await page.locator("dialog").evaluateAll(nodes=>nodes.map(n=>({open:n.open,text:n.innerText.slice(0,1000)})))}));await page.locator('[data-bag-variant="QV-BLUE-S"]').waitFor({timeout:5000});
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('bigk-bag-v2'))),[{variantId:'QV-BLUE-S',quantity:1}]);
  assert.ok((await page.getByRole('link',{name:'Secure checkout',exact:true}).getAttribute('href')).endsWith('/checkout'));
  assert.deepEqual(errors,[]);console.log('QUICK_VIEW_PURCHASE_PASS '+viewport.width+'x'+viewport.height);await page.close();
 }
}finally{await browser.close()}
