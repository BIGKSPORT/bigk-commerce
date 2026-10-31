import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {randomBytes,scryptSync} from 'node:crypto';import {mkdtemp,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';import sharp from 'sharp';
const dir=await mkdtemp(join(tmpdir(),'bigk-vest-browser-')),origin='http://localhost:3197',password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex'),artifacts=process.env.BIGK_ARTIFACT_DIR||'/workspace/alpin-vest-review-artifacts';await mkdir(artifacts,{recursive:true});
const env={...process.env,NODE_ENV:'production',PORT:'3197',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_SCHEMA:'bigk_staging',DATABASE_PATH:join(dir,'store.sqlite'),MEDIA_PATH:join(dir,'media'),MEDIA_DRIVER:'database',COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',EMAIL_DELIVERY_ENABLED:'false',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex')};for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];let server,browser,output='';
function run(args){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Fixture command failed')))})}
try{
 await run(['--import','tsx','tests/fixtures/seed-alpin-vest.ts']);
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(origin+'/admin')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}assert(ready,'Next did not start');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/products/alpine-gillet-p007');await page.getByRole('heading',{name:'Alpin Vest Pro',exact:true}).waitFor();
  const tech=page.locator('[data-alpin-vest-technology]');assert.equal(await tech.locator('article').count(),3);assert.equal(await page.locator('[data-alpin-technology]').count(),0);
  for(const section of ['Technology & Construction','Construction & Layering','Materials & Fit','Size guide','Care'])await tech.getByRole('heading',{name:section,exact:true}).waitFor();
  for(const summary of ['Details','Material & care','Size & fit'])await page.locator('summary').filter({hasText:summary}).click();
  const text=await page.locator('body').innerText();assert(!/[\u3400-\u9fff]/u.test(await page.locator('body').evaluate(e=>e.outerHTML)));assert(!/THUMB LOOP|thumb openings|cuffs|100% polyester|185 cm|78 kg|non-stretch|roomy fit|30°C/i.test(text));assert(text.includes('not included'));assert(text.includes('€133.90'));
  for(const img of await tech.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert(await img.evaluate(el=>el.naturalWidth>0))}
  const cards=tech.locator('article');const third=await cards.nth(2).boundingBox(),first=await cards.nth(0).boundingBox();if(width===1440)assert(third.width>first.width*1.9);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const summary of ['Details','Material & care','Size & fit'])await page.locator('summary').filter({hasText:summary}).click();
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(artifacts,'alpin-vest-'+width+'.png'),fullPage:true});
  await page.getByRole('button',{name:'S',exact:true}).first().click();await page.getByRole('button',{name:'Add to demo bag',exact:true}).click();await page.getByRole('heading',{name:'Your bag (1)',exact:true}).waitFor();
  let bag=await page.evaluate(()=>JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]'));assert.equal(bag[0].quantity,1);assert(bag[0].variantId.startsWith('P007'));await page.reload();bag=await page.evaluate(()=>JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]'));assert.equal(bag[0].quantity,1);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS '+width+'px: vest-specific three-card layout, source images, no Chinese or fleece-only specs, separate base layer, actual size/bag persistence.');
 }
}catch(e){console.error(output.slice(-2000));throw e}finally{await browser?.close();if(server&&server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped}await rm(dir,{recursive:true,force:true})}
