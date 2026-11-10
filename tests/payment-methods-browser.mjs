import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=await mkdtemp(join(tmpdir(),'bigk-payment-methods-')),origin='http://127.0.0.1:3221';
const env={...process.env,APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(root,'store.sqlite'),DATABASE_SCHEMA:'bigk',COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',EMAIL_DELIVERY_ENABLED:'false',REVOLUT_MERCHANT_ENABLED:'false'};
for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];
let server,browser;
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3221'],{env,stdio:'inherit'});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/catalog')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage(),external=[];
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin+'/'))external.push(r.url())});
 const dir=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(dir,{recursive:true});
 for(const [locale,title] of [['en','Payment options'],['nl','Betaalmogelijkheden'],['fr','Moyens de paiement']]){
  await page.goto(origin+'/'+locale);const badges=page.locator('[data-payment-methods="footer"]');await badges.scrollIntoViewIfNeeded();assert.equal(await badges.getAttribute('aria-label'),title);
  assert.equal(await badges.locator('img').count(),8);assert.equal(await badges.locator('li').count(),9);assert.equal(await badges.getByText('Link',{exact:true}).count(),1);
  for(const name of ['Visa','Mastercard','Bancontact','Apple Pay','Google Pay','Revolut Pay','Klarna','Amazon Pay']){const image=badges.getByRole('img',{name,exact:true});await image.evaluate(i=>i.decode());assert(await image.evaluate(i=>i.naturalWidth>0));}
  assert(!(await badges.innerText()).includes('PayPal'));assert.equal(await badges.locator('img[alt="iDEAL"]').count(),0);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await badges.evaluate(el=>{const box=el.getBoundingClientRect();return box.left>=-1&&box.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1}),'Payment row fits '+width+'px');if(width>=390)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.setViewportSize({width:390,height:844});await badges.screenshot({path:join(dir,'payment-methods-'+locale+'-mobile.png')});
  await page.setViewportSize({width:1440,height:900});await badges.screenshot({path:join(dir,'payment-methods-'+locale+'-desktop.png')});
 }
 await page.evaluate(()=>document.documentElement.dataset.paymentMethods='off');assert.equal(await page.locator('[data-payment-methods="footer"]').isVisible(),false);
 const catalog=await (await fetch(origin+'/api/catalog')).json(),product=catalog.products.find(p=>p.priceCents&&p.variants.length);
 assert(product);await page.route('**/api/catalog',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...catalog,mode:'live',paymentEnvironment:'live',ready:true})}));
 await page.evaluate(id=>localStorage.setItem('bigk-bag-v2',JSON.stringify([{variantId:id,quantity:1}])),product.variants[0].id);
 await page.goto(origin+'/en/checkout');const checkout=page.locator('[data-payment-methods="checkout"]');await checkout.waitFor();await checkout.scrollIntoViewIfNeeded();assert.equal(await checkout.locator('img').count(),8);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await checkout.screenshot({path:join(dir,'payment-methods-checkout-mobile.png')});
 assert.equal(external.length,0,'Payment badges must not contact external services');assert.equal((await fetch(origin+'/api/admin/payments/readiness')).status,401);
 console.log('PASS: verified payment badges, local artwork, EN/NL/FR, 320–1440px layout, off switch, checkout display and protected preparation status. No payment created.');
}catch(error){if(browser){let i=0;const output=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(output,{recursive:true});for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:join(output,'payment-methods-failure-'+(++i)+'.png'),fullPage:true}).catch(()=>{});}throw error;}finally{await browser?.close();server?.kill('SIGTERM');await rm(root,{recursive:true,force:true});}
