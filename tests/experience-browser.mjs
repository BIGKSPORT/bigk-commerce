import {chromium,devices} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=await mkdtemp(join(tmpdir(),'bigk-experience-')),origin='http://127.0.0.1:3340',artifacts=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(artifacts,{recursive:true});
const env={...process.env,NODE_ENV:'production',PORT:'3340',APP_URL:origin,NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED:'true',DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(root,'never-created.sqlite'),COMMERCE_MODE:'demo',EMAIL_DELIVERY_ENABLED:'false'};
for(const k of ['VERCEL','VERCEL_ENV','DATABASE_URL','DATABASE_SCHEMA','EXPERIENCE_STAGING_DATA','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'])delete env[k];
let server,browser,logs='';
const normalBag=JSON.stringify([{variantId:'P001-0',quantity:1}]);
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/en/experience')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert(ready,logs);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const [name,device] of [['desktop',{viewport:{width:1440,height:1000}}],['iphone',devices['iPhone 13']],['android',devices['Pixel 7']]]){
  const context=await browser.newContext({...device}),page=await context.newPage(),calls=[],errors=[];
  await context.addInitScript(value=>{if(localStorage.getItem('bigk-bag-v2')===null)localStorage.setItem('bigk-bag-v2',value);},normalBag);
  page.on('request',r=>{if(/\/api\//.test(r.url()))calls.push(r.url());});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  await page.goto(origin+'/en/experience');await page.locator('[data-enhanced=true]').waitFor();
  const product=page.getByRole('button',{name:/^VELVET WMS HOOD ·/});await product.scrollIntoViewIfNeeded();if(name==='desktop')await product.click();else await product.tap();
  let dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Cream',exact:true}).click();assert(await dialog.getByRole('button',{name:'2XL · Out of stock',exact:true}).isDisabled());
  await dialog.getByRole('button',{name:'M',exact:true}).click();await dialog.getByRole('button',{name:'Add to your bag',exact:true}).click();await dialog.waitFor({state:'detached'});
  await page.getByRole('status').filter({hasText:'VELVET WMS HOOD added'}).waitFor();
  const bag=page.getByRole('complementary',{name:'Your bag',exact:true});assert((await bag.innerText()).includes('Cream · M'));assert((await bag.innerText()).includes('79.90'));
  if(name==='desktop'){
   const source=page.getByRole('button',{name:/^B10 SNEAKERS ·/}),target=page.locator('[class*=dropTarget]').first();const s=await source.boundingBox(),t=await target.boundingBox();assert(s&&t);
   await page.mouse.move(s.x+s.width/2,s.y+s.height/2);await page.mouse.down();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:20});await page.mouse.up();
   dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'40',exact:true}).click();await dialog.getByRole('button',{name:'Add to your bag',exact:true}).click();await dialog.waitFor({state:'detached'});
   assert((await bag.innerText()).includes('Free delivery unlocked'));
  }else{
   assert.equal(await bag.evaluate(e=>getComputedStyle(e).position),'fixed');assert(await page.locator('[class*=viewport]').evaluate(e=>e.scrollWidth>e.clientWidth));
   const bottom=await bag.boundingBox();assert(bottom.y+bottom.height<=page.viewportSize().height+1);
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('bigk-bag-v2')),normalBag);
  await bag.getByRole('button',{name:'Review preview bag',exact:false}).click();dialog=page.getByRole('dialog');await dialog.getByText('These are sample prices and stock.',{exact:false}).waitFor();await dialog.getByRole('button',{name:'Keep exploring',exact:true}).click();
  await page.reload();await page.locator('[data-enhanced=true]').waitFor();assert((await bag.innerText()).includes('Cream · M'));
  await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('nl');await page.getByRole('heading',{name:'Pak je volgende avontuur.',exact:true}).waitFor();
  await page.getByRole('combobox').first().selectOption('fr');await page.getByRole('heading',{name:'Préparez votre prochaine aventure.',exact:true}).waitFor();
  await page.getByRole('combobox').first().selectOption('it');await page.getByRole('heading',{name:'Pack your next move.',exact:true}).waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await product.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:join(artifacts,'experience-'+name+'.png'),fullPage:true});
  await page.getByRole('button',{name:'Remove VELVET WMS HOOD',exact:true}).click();assert(!(await page.getByRole('complementary').innerText()).includes('Cream · M'));
  assert.deepEqual(calls,[],'Fixture mode must never call any /api endpoint');assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(origin+'/fr/experience');assert.equal(await page.locator('article').count(),7);await page.getByRole('heading',{name:'Parcourir les mêmes produits',exact:true}).waitFor();await page.screenshot({path:join(artifacts,'experience-no-js.png'),fullPage:true});await context.close();
 const keyboard=await browser.newContext({viewport:{width:1440,height:1000}}),kp=await keyboard.newPage();await kp.goto(origin+'/en/experience');await kp.getByRole('button',{name:/^CORE.2 ·/}).focus();await kp.keyboard.press('Enter');const d=kp.getByRole('dialog');await d.getByRole('button',{name:'S',exact:true}).focus();await kp.keyboard.press('Enter');await d.getByRole('button',{name:'Add to your bag',exact:true}).focus();await kp.keyboard.press('Enter');await d.waitFor({state:'detached'});assert((await kp.getByRole('complementary').innerText()).includes('CORE.2'));await keyboard.close();
 assert(!existsSync(env.DATABASE_PATH),'Fixture browsing must not initialise a database');
 console.log('PASS experience: desktop drag, iPhone/Android tap + horizontal room/fixed bag, real variant mapping, disabled stock, removal/totals/free delivery, isolated persistence, NL/FR/EN + IT fallback, keyboard, reduced motion, no-JS grid, no API calls and no database creation.');
}catch(error){console.error(logs.slice(-3000));if(browser)for(const [i,c] of browser.contexts().entries())for(const [j,p] of c.pages().entries())await p.screenshot({path:join(artifacts,`experience-failure-${i}-${j}.png`),fullPage:true}).catch(()=>{});throw error;}finally{await browser?.close();server?.kill('SIGTERM');await rm(root,{recursive:true,force:true});}
