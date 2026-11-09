import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=await mkdtemp(join(tmpdir(),'bigk-organization-browser-')),origin='http://127.0.0.1:3220';
const env={...process.env,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(root,'store.sqlite'),DATABASE_SCHEMA:'bigk_staging',COMMERCE_MODE:'demo',APP_URL:origin,ADMIN_MFA_REQUIRED:'true',ADMIN_MFA_KEY:'b'.repeat(64),EMAIL_DELIVERY_ENABLED:'false',OPERATIONS_FIXTURE_PATH:join(root,'fixture.json')};delete env.VERCEL;delete env.VERCEL_ENV;delete env.ADMIN_CANONICAL_ORIGIN;
let server,browser;
try{
 const seed=await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['--import','tsx','tests/fixtures/seed-store-organization.ts'],{env,stdio:'inherit'});c.once('error',reject);c.once('exit',resolve);});assert.equal(seed,0);
 const fixture=JSON.parse(await readFile(env.OPERATIONS_FIXTURE_PATH,'utf8'));
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3220'],{env,stdio:'inherit'});let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/admin')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const owner=await browser.newContext();await owner.addCookies([{name:'bigk_admin',value:'operations-browser-owner',url:origin,httpOnly:true,sameSite:'Strict'}]);const page=await owner.newPage();await page.goto(origin+'/admin');
 const catalog=async()=>((await(await owner.request.get(origin+'/api/admin/catalog')).json()).products),before=await catalog();
 await page.getByRole('button',{name:'Categories',exact:true}).click();await page.getByRole('heading',{name:'Organize products by category',exact:true}).waitFor();await page.getByLabel('Find a style',{exact:true}).fill(fixture.moveName);await page.getByLabel('Destination for '+fixture.moveName,{exact:true}).selectOption('Thermal');const assignment=page.locator('tr').filter({has:page.getByLabel('Destination for '+fixture.moveName,{exact:true})});await assignment.getByRole('button',{name:'Review category change',exact:true}).click();await page.getByRole('region',{name:'Review category move'}).waitFor();assert.deepEqual(await catalog(),before);await page.getByRole('button',{name:'Move style',exact:true}).click();await page.getByText(fixture.moveName+' moved to Thermal layers.',{exact:true}).waitFor();
 const after=await catalog();for(const p of after){const old=before.find(o=>o.id===p.id);if(['P006','P007'].includes(p.id)){assert.equal(p.category,'Thermal');assert.equal(p.version,old.version+1);assert.deepEqual(p.variants,old.variants);assert.equal(p.priceCents,old.priceCents);assert.equal(p.slug,old.slug);}else assert.deepEqual(p,old);}
 await page.getByRole('button',{name:'Storefront',exact:true}).click();await page.getByRole('heading',{name:'Category and product display order',exact:true}).waitFor();await page.getByLabel('Hide the fixed B10 feature on the homepage',{exact:true}).check();await page.getByLabel('Keep the homepage compact: up to four styles per category',{exact:true}).check();
 const up=page.getByRole('button',{name:'Move Pants category up',exact:true});while(!await up.isDisabled())await up.click();await page.getByLabel('Category to organize',{exact:true}).selectOption('Pants');await page.getByRole('button',{name:'Move '+fixture.pinName+' style up',exact:true}).click();
 await page.getByRole('button',{name:'Preview current draft',exact:true}).click();await page.locator('[data-category-discovery]').waitFor();assert.equal(await page.locator('[data-category-discovery] a[data-category]').first().getAttribute('data-category'),'Pants');await page.getByRole('button',{name:'Close preview',exact:true}).click();
 const banner=page.locator('details').filter({has:page.getByRole('heading',{name:'Campaign banner',exact:true})});await banner.getByLabel('Heading / announcement text',{exact:true}).fill('PRIVATE UNSAVED BANNER');
 const visitor=await browser.newContext({hasTouch:true}),shop=await visitor.newPage();await shop.goto(origin+'/en');assert.equal(await shop.locator('[data-category-discovery]').count(),0);assert.equal(await shop.locator('.catalog-category-heading').first().textContent(),'Fleece');assert.equal(await shop.locator('.catalog-category-heading').last().textContent(),'Accessories');assert.equal(await shop.locator('.site-header nav a,.site-header nav button').filter({hasText:/^Fleece$/}).count(),0);


 for(const width of [1440,390]){
  await shop.setViewportSize({width,height:844});
  await shop.locator('.b10-feature').waitFor();
  const spacing=await shop.locator('.b10-feature').evaluate(section=>{
   const frame=section.querySelector('.b10-feature-image').getBoundingClientRect(),image=section.querySelector('.b10-feature-image>img').getBoundingClientRect();
   return {background:getComputedStyle(section).backgroundColor,left:image.left-frame.left,right:frame.right-image.right,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert.equal(spacing.background,'rgb(238, 236, 232)','B10 campaign background retained');
  const shoe=shop.locator('.product-card[data-product-id="B10"] .card-photo-carousel img').first();
  const presentation=await shoe.evaluate(image=>({fit:getComputedStyle(image).objectFit,padding:parseFloat(getComputedStyle(image).paddingLeft),background:getComputedStyle(image).backgroundColor}));
  assert.equal(presentation.fit,'contain');assert(presentation.padding>=14);assert.equal(presentation.background,'rgb(255, 255, 255)');
  const hero=shop.locator('.hero-image');
  assert(decodeURIComponent(await hero.locator('img').getAttribute('src')).includes(before.find(p=>p.id==='P007').images[0]));
  assert.equal(await shop.locator('.section-number,.finder-number,.hero-detail strong').count(),0);
  if(width===390){await shop.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));const layout=await shop.evaluate(()=>({hero:document.querySelector('.hero-image').getBoundingClientRect().top,header:document.querySelector('.site-header').getBoundingClientRect().bottom,title:document.querySelector('.hero-title').getBoundingClientRect().height}));assert(layout.hero<=layout.header+60,'Mobile starts at the hero image');assert(layout.title<=2,'Slogan does not consume mobile space');}
  assert.equal(spacing.overflow,false);
  const screenshots=process.env.BIGK_ARTIFACT_DIR||root;
  await shop.locator('.b10-feature').screenshot({path:join(screenshots,'clean-b10-home-'+width+'.png')});
 }
 await shop.setViewportSize({width:1280,height:844});
 const b10=before.find(p=>p.id==='B10'),green=b10.variants.find(v=>b10.content.trade.identifiers[v.id].colour==='Green');
 await shop.evaluate(id=>localStorage.setItem('bigk-bag-v2',JSON.stringify([{variantId:id,quantity:1}])),green.id);
 await shop.goto(origin+'/en');
 await shop.locator('.header-actions button[aria-label^="Open bag"]').click();
 const greenRow=shop.locator('[data-bag-variant="'+green.id+'"]');
 await greenRow.locator('img').evaluate(img=>img.decode());
 assert(decodeURIComponent(await greenRow.locator('img').getAttribute('src')).includes('green-'));
 assert.equal(await shop.locator('[data-bag-suggestions]').count(),1);
 assert(await shop.locator('[data-bag-suggestions] a').count()<=2);
 assert(!(await shop.locator('[data-bag-suggestions]').innerHTML()).includes('/products/b10-sneakers'));
 await shop.screenshot({path:join(process.env.BIGK_ARTIFACT_DIR||root,'bag-green-shoe-with-suggestions.png')});
 const blue=before.find(p=>p.id==='P002');
 await shop.evaluate(ids=>localStorage.setItem('bigk-bag-v2',JSON.stringify(ids.map(variantId=>({variantId,quantity:1})))),blue.variants.slice(3,5).map(v=>v.id));
 await shop.goto(origin+'/en/products/alpin-fleece-jacket?colour=Dusty%20Blue');
 await shop.locator('header.simple-header>button').click();
 await shop.locator('[data-bag-variant="'+blue.variants[3].id+'"] img').evaluate(img=>img.decode());
 assert.equal(await shop.locator('[data-bag-variant]').count(),2);
 await shop.locator('[data-bag-suggestions]').waitFor();
 assert(!(await shop.locator('[data-bag-suggestions]').innerHTML()).includes('alpin-fleece-jacket'));
 await shop.screenshot({path:join(process.env.BIGK_ARTIFACT_DIR||root,'alpin-bag-photos-and-suggestions.png')});
 await shop.evaluate(()=>localStorage.removeItem('bigk-bag-v2'));
 await shop.goto(origin+'/en');

 assert.equal(await shop.locator('[data-catalogue-overview]').count(),0,'Full catalogue is the default');
 const unauthorized=await visitor.request.post(origin+'/api/admin/storefront',{headers:{Origin:origin},data:{action:'organization',version:0,organization:{}}});assert.equal(unauthorized.status(),401);await page.getByRole('button',{name:'Apply display settings to live shop',exact:true}).click();await page.getByText('Display settings applied to the live shop. Other campaign drafts remain private.',{exact:true}).first().waitFor();assert.equal(await banner.getByLabel('Heading / announcement text',{exact:true}).inputValue(),'PRIVATE UNSAVED BANNER');assert(await page.getByRole('button',{name:'Save draft',exact:true}).isEnabled());await shop.reload();assert(!(await shop.content()).includes('PRIVATE UNSAVED BANNER'));
 const previewNames=await shop.locator('.product-grid .product-meta h3').allTextContents();
 assert.equal(new Set(previewNames).size,previewNames.length,'Homepage introduces each model once');
 assert.equal(await shop.locator('[data-catalogue-overview]').count(),1);
 const overviewCount=await shop.locator('.product-grid .product-card').count();
 await shop.locator('a.button').filter({hasText:'View all styles and colours'}).click();
 await shop.waitForFunction(()=>!document.querySelector('[data-catalogue-overview]'));
 assert(await shop.locator('.product-grid .product-card').count()>overviewCount,'All colours remain accessible');
 await shop.goto(origin+'/en');
 await shop.getByRole('link',{name:'View category · Pants',exact:true}).click();
 await shop.waitForURL(/category=Pants/);
 assert.equal(await shop.locator('[data-catalogue-overview]').count(),0);
 await shop.goto(origin+'/en');

 assert.equal(await shop.locator('[data-category-discovery] a[data-category]').first().getAttribute('data-category'),'Pants');assert.equal(await shop.locator('[data-category-discovery] a[data-category="Long sleeves"]').count(),0);assert.equal(await shop.locator('.catalog-category-heading').first().textContent(),'Pants');
 await shop.locator('[data-category-discovery] a[data-category="Pants"]').click();await shop.waitForURL(/category=Pants/);assert.equal(await shop.locator('.product-grid .product-card').first().getByRole('heading').textContent(),fixture.pinName);assert.equal((await visitor.request.post(origin+'/api/admin/catalog/organization',{headers:{Origin:origin},data:{}})).status(),401);
 const dir=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(dir,{recursive:true});await page.getByRole('heading',{name:'Category and product display order',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(dir,'store-organization-editor.png'),fullPage:true});await shop.goto(origin+'/nl');await shop.setViewportSize({width:390,height:844});await shop.screenshot({path:join(dir,'store-organization-mobile.png'),fullPage:true});assert(await shop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');

 // Product entry from deep catalogue positions must show photos, not details/footer.
 for(const locale of ['en','nl','fr']){
  await shop.goto(origin+'/'+locale+'#catalog');
  const link=shop.locator('.product-card .product-meta a').last();
  await link.scrollIntoViewIfNeeded();
  const destination=await link.getAttribute('href');
  assert(await shop.evaluate(()=>scrollY>200),'Start well down the collection');
  await link.tap();
  await shop.waitForURL(url=>url.pathname===new URL(destination,origin).pathname);
  await shop.locator('.pdp-detail .product-gallery,.pdp-detail .gallery-pending').waitFor();
  await shop.waitForFunction(()=>scrollY<5&&document.querySelector('.pdp-detail .product-gallery,.pdp-detail .gallery-pending')?.getBoundingClientRect().top<200);
  await shop.screenshot({path:join(dir,'product-photo-entry-'+locale+'.png')});
  const size=shop.locator('.size-options button:not(:disabled)').first();
  if(await size.count()){
   await size.scrollIntoViewIfNeeded();await size.click();
   assert(await shop.evaluate(()=>scrollY>200),'Size selection must stay at the size controls');
  }
  await shop.goBack();
  await shop.waitForURL(url=>!url.pathname.includes('/products/'));
  await shop.waitForFunction(()=>scrollY>200);
 }


 await page.getByLabel('Keep the homepage compact: up to four styles per category',{exact:true}).uncheck();
 await page.getByRole('button',{name:'Apply display settings to live shop',exact:true}).click();
 await page.getByText('Display settings applied to the live shop. Other campaign drafts remain private.',{exact:true}).first().waitFor();
 await shop.goto(origin+'/en');
 assert.equal(await shop.locator('[data-catalogue-overview]').count(),0,'Owner can restore full grid');
 assert(await shop.locator('.product-grid .product-card').count()>overviewCount);
 assert(!(await shop.content()).includes('PRIVATE UNSAVED BANNER'));

 // A logo click is a fresh localized homepage, including when already on the shop.
 for(const locale of ['en','nl','fr']){
  await shop.goto(origin+'/'+locale+'?category=Pants#catalog');
  await shop.locator('#catalog').scrollIntoViewIfNeeded();
  await shop.locator('footer .brand').click();
  await shop.waitForURL(url=>url.pathname==='/'+locale&&!url.search&&!url.hash);
  await shop.waitForFunction(()=>scrollY<5);
  assert.equal(await shop.locator('.collection-tabs button.active').textContent(),locale==='nl'?'Alle producten':locale==='fr'?'Tous les produits':'All products');
  await shop.locator('#catalog').scrollIntoViewIfNeeded();
  await Promise.all([shop.waitForEvent('domcontentloaded'),shop.locator('.site-header .brand').click()]);
  await shop.waitForFunction(()=>scrollY<5);
 }

 await page.getByRole('button',{name:'Switch off custom homepage',exact:true}).click();await page.getByText('Custom storefront switched off. Your saved content is retained.',{exact:true}).waitFor();await shop.reload();assert.equal(await shop.locator('[data-category-discovery]').count(),0);
 console.log('PASS: reviewed whole-style category move, unchanged inventory/identifiers/URLs, private layout draft, ordered category discovery, pinned style order, category links, empty category hiding, mobile and off switch.');
}catch(error){if(browser){const dir=process.env.BIGK_ARTIFACT_DIR||join(root,'screenshots');await mkdir(dir,{recursive:true});let i=0;for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:join(dir,'store-organization-failure-'+(++i)+'.png'),fullPage:true}).catch(()=>{});}throw error;}finally{await browser?.close();server?.kill('SIGTERM');await rm(root,{recursive:true,force:true});}
