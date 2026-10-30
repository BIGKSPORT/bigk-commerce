import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'bigk-checkout-browser-')),origin='http://localhost:3188';
const env={...process.env,NODE_ENV:'production',PORT:'3188',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',RESEND_API_KEY:'',EMAIL_DELIVERY_ENABLED:'false',BIGK_CLUB_ENABLED:'false'};
for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];
let server,browser;
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','ignore','ignore']});
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/api/catalog')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'Next server did not start');
 const {products}=await(await fetch(origin+'/api/catalog')).json(),product=products.find(p=>p.priceCents&&p.images.length);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();let firstKey='',calls=0;
  await page.goto(origin+'/checkout');await page.evaluate(id=>localStorage.setItem('bigk-bag-v2',JSON.stringify([{variantId:id,quantity:1}])),product.variants[0].id);await page.reload();
  await page.route('**/api/checkout',async route=>{
   const data=route.request().postDataJSON();calls++;
   if(calls===1){firstKey=data.requestKey;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary fixture failure.'})});}
   else{assert.equal(data.requestKey,firstKey,'Checkout reload created a new attempt');await route.continue();}
  });
  async function fill(){for(const [name,value] of Object.entries({firstName:'Fixture',lastName:'Buyer',email:'buyer@example.test',phone:'+32470123456',address:'Fixture Street 1',postal:'1000',city:'Brussels'}))await page.locator('input[name="'+name+'"]').fill(value);await page.locator('select[name="country"]').selectOption('BE');await page.locator('input[name="consent"]').check();}
  await fill();await page.getByRole('button',{name:'Create demo order'}).click();await page.getByRole('alert').filter({hasText:'Temporary fixture failure.'}).waitFor();
  const stored=await page.evaluate(()=>sessionStorage.getItem('bigk-checkout-attempt-v1'));assert(stored&&!stored.includes('buyer@example.test')&&!stored.includes('Fixture Street'));
  await page.reload();await fill();await page.getByRole('button',{name:'Create demo order'}).click();await page.getByRole('heading',{name:'Your demo journey is complete.'}).waitFor({timeout:15000});
  assert.equal(calls,2);assert.equal(await page.evaluate(()=>localStorage.getItem('bigk-bag-v2')),null);assert(await page.locator('.order-line').filter({hasText:product.name}).count()>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await context.close();console.log('PASS '+width+'px actual checkout retry across reload → private demo receipt; no payment or email sent.');
 }
}finally{await browser?.close();server?.kill();await rm(dir,{recursive:true,force:true});}
