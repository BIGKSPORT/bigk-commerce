import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {randomBytes,scryptSync} from 'node:crypto';import {mkdtemp,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';import sharp from 'sharp';
const dir=await mkdtemp(join(tmpdir(),'bigk-front-browser-')),origin='http://localhost:3198',password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex'),artifacts=process.env.BIGK_ARTIFACT_DIR||'/workspace/nano-front-review-artifacts';await mkdir(artifacts,{recursive:true});
const env={...process.env,NODE_ENV:'production',PORT:'3198',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_SCHEMA:'bigk_staging',DATABASE_PATH:join(dir,'store.sqlite'),MEDIA_PATH:join(dir,'media'),MEDIA_DRIVER:'database',COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',EMAIL_DELIVERY_ENABLED:'false',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex')};for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];let server,browser,output='';
function run(args){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Fixture command failed')))})}
let productionServer;
try{
 await run(['--import','tsx','tests/fixtures/seed-nano-front.ts']);
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 for(let i=0;i<120;i++){try{if((await fetch(origin+'/admin')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const anonymous=await browser.newContext(),anon=await anonymous.newPage();assert.equal((await anon.request.get(origin+'/products/nandown-jkt-p019')).status(),404);await anon.goto(origin);assert.equal(await anon.getByRole('link',{name:'View Nano Down Jacket',exact:true}).count(),0);await anonymous.close();
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/admin');await page.getByLabel('Admin password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in securely'}).click();await page.getByRole('navigation',{name:'Backoffice navigation'}).waitFor();
  await page.goto(origin+'/#catalog');await page.getByRole('link',{name:'View Nano Down Jacket',exact:true}).waitFor();await page.screenshot({path:join(artifacts,'front-'+width+'.png'),fullPage:true});
  for(const [slug,name,kind,count] of [['nandown-jkt-p019','Nano Down Jacket','jacket',3],['nandown-fz-gillet-p021','Nano Down Gillet','gillet',4],['alpine-gillet-p007','Alpin Gillet','alpin',3]]){
   await page.goto(origin+'/products/'+slug);await page.getByRole('heading',{name,exact:true}).waitFor();const tech=page.locator(kind==='alpin'?'[data-alpin-vest-technology]':'[data-nano-technology]');assert.equal(await tech.locator('article').count(),count);
   assert(await page.getByRole('button',{name:'Add to bag',exact:true}).isDisabled());assert(!/[\u3400-\u9fff]/u.test(await page.locator('body').evaluate(e=>e.outerHTML)));assert.equal(await page.locator('script[type="application/ld+json"]').count(),0);
   for(const img of await tech.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>e.naturalWidth>0))}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(artifacts,kind+'-'+width+'.png'),fullPage:true});
  }
  assert.deepEqual(errors,[]);
  if(width===1440){
   productionServer=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env:{...env,PORT:'3199',VERCEL_ENV:'production'},stdio:'ignore'});
   for(let i=0;i<100;i++){try{if((await fetch('http://localhost:3199/admin')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
   const response=await page.request.get('http://localhost:3199/products/nandown-jkt-p019');assert.equal(response.status(),404,'Even valid staging admin cookies must not expose drafts with production marker');
   const stopped=new Promise(r=>productionServer.once('exit',r));productionServer.kill();await stopped;productionServer=null;
  }
  await context.close();console.log('PASS '+width+'px: real admin login → storefront catalogue → all three draft product pages; optimized images; no Chinese; no cart/JSON-LD; anonymous and production draft access denied.');
 }
 await run(['--import','tsx','tests/fixtures/publish-nano-cart.ts']);
 const shop=await browser.newContext(),p=await shop.newPage();
 for(const [slug,id] of [['nandown-jkt-p019','P019'],['nandown-fz-gillet-p021','P021']]){
  await p.goto(origin+'/products/'+slug);await p.getByRole('button',{name:'S',exact:true}).first().click();await p.getByRole('button',{name:'Add to demo bag',exact:true}).click();await p.getByRole('heading',{name:/Your bag/}).waitFor();assert(await p.evaluate(id=>JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]').some(x=>x.variantId.startsWith(id)&&x.quantity===1),id));await p.reload();assert(await p.evaluate(id=>JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]').some(x=>x.variantId.startsWith(id)&&x.quantity===1),id));
 }
 await shop.close();console.log('PASS both Nano products: selected size → actual demo bag → reload persistence; no hosted order or stock mutation.');

}catch(e){console.error(output.slice(-1500));throw e}finally{await browser?.close();for(const child of [server,productionServer])if(child&&child.exitCode===null){const stop=new Promise(r=>child.once('exit',r));child.kill();await stop}await rm(dir,{recursive:true,force:true})}
