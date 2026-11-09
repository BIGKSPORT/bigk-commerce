import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=await mkdtemp(join(tmpdir(),'bigk-merch-browser-')),origin='http://127.0.0.1:3218';
const env={...process.env,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(root,'test.sqlite'),DATABASE_SCHEMA:'bigk',COMMERCE_MODE:'demo',APP_URL:origin,ADMIN_MFA_REQUIRED:'true',ADMIN_MFA_KEY:'b'.repeat(64),EMAIL_DELIVERY_ENABLED:'false',OPERATIONS_FIXTURE_PATH:join(root,'fixture.json')};delete env.VERCEL;delete env.VERCEL_ENV;delete env.ADMIN_CANONICAL_ORIGIN;
let server,browser;
try{
 const seeded=await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['--import','tsx','tests/fixtures/seed-merchandising.ts'],{env,stdio:'inherit'});c.once('error',reject);c.once('exit',resolve);});assert.equal(seeded,0);
 const fixture=JSON.parse(await readFile(env.OPERATIONS_FIXTURE_PATH,'utf8'));
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3218'],{env,stdio:'inherit'});
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/admin')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'Server did not start');
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const owner=await browser.newContext();await owner.addCookies([{name:'bigk_admin',value:'operations-browser-owner',url:origin,httpOnly:true,sameSite:'Strict'}]);
 const page=await owner.newPage();await page.goto(origin+'/admin');await page.getByRole('button',{name:'Storefront',exact:true}).click();await page.getByRole('heading',{name:'Your homepage, in your hands.'}).waitFor();
 await page.getByRole('button',{name:'Create an organized draft from my categories'}).click();await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. The public shop has not changed.').waitFor();
 const visitor=await browser.newContext(),shop=await visitor.newPage();await shop.goto(origin+'/en');assert.equal(await shop.locator('details.homepage-catalog').getAttribute('data-curated'),null);
 await page.getByRole('button',{name:'Publish saved draft'}).click();await page.getByText('Storefront published. Refresh the public shop to see it.').waitFor();await shop.reload();assert.equal(await shop.locator('details.homepage-catalog').getAttribute('data-curated'),'true');assert.equal(await shop.locator('details.homepage-catalog').getAttribute('open'),null);
 await shop.getByText('Browse all products',{exact:false}).last().click();assert.notEqual(await shop.locator('details.homepage-catalog').getAttribute('open'),null);
 // Exercise real editor saving, image selection and outfit product placement.
 await page.getByLabel('Use a custom main banner').check();await page.getByLabel('Desktop banner photo',{exact:true}).selectOption(fixture.productImage);
 const banner=page.locator('details').filter({has:page.getByRole('heading',{name:'Campaign banner',exact:true})});
 await banner.getByLabel('Heading / announcement text',{exact:true}).fill('Built for your next move.');await banner.getByLabel('Button text',{exact:true}).fill('Explore BIG K');await banner.getByLabel('Image description',{exact:true}).fill('BIG K campaign photo showing a performance layer');
 await page.getByRole('button',{name:'Add a look',exact:true}).click();const look=page.locator('details').filter({has:page.getByLabel('Show look',{exact:true})}).last();
 await look.getByLabel('Show look',{exact:true}).check();await look.getByLabel('Outfit photo',{exact:true}).selectOption(fixture.productImage);await look.getByLabel('Heading / announcement text',{exact:true}).fill('Everyday layers.');await look.getByLabel('Image description',{exact:true}).fill('BIG K outfit photo with a linked performance layer');await look.getByLabel('Add a product',{exact:true}).selectOption(fixture.productId);
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. The public shop has not changed.').waitFor();await page.getByRole('button',{name:'Publish saved draft'}).click();await page.getByText('Storefront published. Refresh the public shop to see it.').waitFor();
 await shop.reload();await shop.getByRole('heading',{name:'Built for your next move.'}).waitFor();await shop.getByRole('heading',{name:'Everyday layers.'}).waitFor();assert.equal((await visitor.request.get(origin+'/api/admin/storefront')).status(),401);
 const hotspot=shop.locator('button').filter({hasText:/^1$/}).last();await hotspot.click();await shop.getByRole('dialog',{name:'Product details'}).waitFor();await shop.getByRole('button',{name:'Close dialog',exact:true}).click();
 const dir=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(dir,{recursive:true});await shop.screenshot({path:join(dir,'merchandising-desktop.png'),fullPage:true});await shop.setViewportSize({width:390,height:844});await shop.screenshot({path:join(dir,'merchandising-mobile.png'),fullPage:true});assert(await shop.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile overflow');
 await page.getByRole('button',{name:'Switch off custom homepage'}).click();await page.getByText('Custom storefront switched off. Your saved content is retained.').waitFor();await shop.reload();assert.equal(await shop.getByRole('heading',{name:'Built for your next move.'}).count(),0);assert.equal(await shop.locator('details.homepage-catalog').getAttribute('data-curated'),null);
 console.log('PASS: real admin draft/publish, curated category shelves, banner image/copy, shop-the-look hotspot and existing product dialog, mobile width, private API and rollback.');
}catch(error){if(browser){const dir=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(dir,{recursive:true});let i=0;for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:join(dir,'merchandising-failure-'+(++i)+'.png'),fullPage:true}).catch(()=>{});}throw error;}finally{await browser?.close();server?.kill('SIGTERM');await rm(root,{recursive:true,force:true});}
