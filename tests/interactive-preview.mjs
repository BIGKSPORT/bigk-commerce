import {mkdirSync} from 'node:fs';
const artifactRoot=process.env.BIGK_ARTIFACT_DIR||'/workspace';mkdirSync(artifactRoot,{recursive:true});
import {chromium} from 'playwright';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=process.env.PREVIEW_OUTPUT||'/workspace/sites/bigk-commerce-preview/dist';
const assets={};for(const folder of ['brand','products/web'])for(const name of readdirSync(root+'/'+folder)){const mime=name.endsWith('.svg')?'image/svg+xml':'image/webp';assets['/'+folder+'/'+name]='data:'+mime+';base64,'+readFileSync(root+'/'+folder+'/'+name).toString('base64')}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-crashpad-for-testing']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<html><head></head><body><div id="root"></div></body></html>');
 await page.addStyleTag({content:readFileSync(root+'/app.css','utf8')});
 await page.evaluate(assets=>{if(!crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:()=> '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16))});for(const name of ['localStorage','sessionStorage']){const data=new Map();Object.defineProperty(window,name,{value:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}})}history.pushState=(_state,_title,url)=>{const target=new URL(String(url),'https://bigk-preview.invalid');location.hash=target.hash};const replace=()=>{for(const img of document.images){const source=img.getAttribute('src');if(assets[source]){img.loading='eager';img.src=assets[source]}}};new MutationObserver(replace).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});},assets);
 await page.addScriptTag({content:readFileSync(root+'/app.js','utf8')});
 await page.getByRole('heading',{name:/Looking good/}).waitFor();
 const search=page.getByRole('textbox',{name:'Search catalogue'});
 // Catalogue hover changes the photograph; the primary link opens a real PDP.
 await search.fill('Velvet');
 const black=page.locator('.product-card').filter({hasText:'black FZ hood'});
 await black.scrollIntoViewIfNeeded();const media=black.locator('.card-photo-carousel');const box=await media.boundingBox();
 await page.mouse.move(box.x+box.width*.8,box.y+box.height*.4);
 assert(Number(await media.getAttribute('data-active-photo'))>1,'Pointer position changes the catalogue photograph');
 await search.hover();assert.equal(await media.getAttribute('data-active-photo'),'1');
 await black.locator('.card-photo-carousel>a').click();
 await page.locator('.pdp-detail h1').waitFor();assert.equal(await page.locator('.hero-section').count(),0);

 // Measure real native scrolling: pinned image, covering sheet, reverse and release.
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  await page.emulateMedia({reducedMotion:'reduce'});
  const metrics=await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});const gallery=document.querySelector('.pdp-detail>.product-gallery'),panel=document.querySelector('.pdp-detail>.detail-info');return {start:gallery.getBoundingClientRect().top,top:parseFloat(getComputedStyle(gallery).top),height:gallery.getBoundingClientRect().height,panel:panel.getBoundingClientRect().top}});
  const pinnedAt=Math.max(0,metrics.start-metrics.top)+30;
  async function sample(y){await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await page.evaluate(()=>new Promise(requestAnimationFrame));return page.evaluate(()=>{const g=document.querySelector('.pdp-detail>.product-gallery').getBoundingClientRect(),p=document.querySelector('.pdp-detail>.detail-info').getBoundingClientRect();return {gallery:g.top,panel:p.top,overflow:document.documentElement.scrollWidth>innerWidth,header:(document.querySelector(innerWidth<=760?'.pdp-mobile-header':'.pdp-desktop-header')).getBoundingClientRect().top}})}
  const a=await sample(pinnedAt),b=await sample(pinnedAt+100);
  assert(Math.abs(a.gallery-metrics.top)<2,'Gallery pins below the header');assert(Math.abs(b.gallery-a.gallery)<2,'Image remains pinned while sheet moves');assert(Math.abs(a.panel-b.panel-100)<2,'Panel tracks native scrolling');assert(!b.overflow);assert(Math.abs(b.header)<2,'Header stays visible');
  const covered=await sample(metrics.panel-metrics.top+10);assert(covered.panel<=metrics.top,'Sheet covers the image');
  assert(await page.evaluate(top=>{const hit=document.elementFromPoint(innerWidth/2,top+30);return !!hit?.closest('.detail-info')},metrics.top),'Information sheet paints above the image');
  const reversed=await sample(pinnedAt);assert(Math.abs(reversed.panel-a.panel)<2,'Upward scroll reverses without jumps');
  await page.locator('.pdp-more').scrollIntoViewIfNeeded();assert((await page.locator('.pdp-detail>.product-gallery').boundingBox()).y<metrics.top,'Gallery releases into remaining content');
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(await page.locator('.product-colour-options a').count(),4);
 const gallery=page.getByRole('region',{name:'Product photos'});
 await page.getByRole('button',{name:'Next product photo',exact:true}).click();assert.equal(await gallery.getAttribute('data-active-photo'),'2');
 await page.getByRole('button',{name:'Show product photo 3',exact:true}).hover();assert.equal(await gallery.getAttribute('data-active-photo'),'3');
 await gallery.focus();await gallery.press('ArrowRight');assert.equal(await gallery.getAttribute('data-active-photo'),'4');
 await gallery.press('Home');assert.equal(await gallery.getAttribute('data-active-photo'),'1');
 const stage=page.getByRole('button',{name:'Enlarge product image',exact:true});const area=await stage.boundingBox();await page.mouse.move(area.x+area.width*.4,area.y+area.height*.4);assert(await stage.evaluate(el=>el.classList.contains('is-zoomed')),'Hover zoom is active');
 await page.getByRole('button',{name:'Open full-screen image viewer'}).click();await page.getByRole('dialog',{name:/image viewer/}).waitFor();
 await page.getByRole('button',{name:'Zoom in image',exact:true}).click();assert(await page.locator('.lightbox-image').evaluate(el=>el.classList.contains('zoomed')));
 await page.getByRole('button',{name:'Next enlarged photo'}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog',{name:/image viewer/}).isVisible(),false);
 await page.getByRole('button',{name:'Open product help',exact:true}).click();await page.getByRole('dialog',{name:'Product help',exact:true}).waitFor();await page.getByRole('button',{name:'Other colours',exact:true}).click();assert.equal(await page.locator('.help-colours a').count(),4);await page.getByRole('textbox',{name:'Ask about this product'}).fill('Is it waterproof?');await page.getByRole('button',{name:'Send product question'}).click();await page.getByText('A waterproof or windproof rating has not been supplied. Water-repellent fabric is not the same as waterproof. I cannot verify performance from photos.').waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.locator('.pdp-detail h1').click();await gallery.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:artifactRoot+'/bigk-product-page-desktop.png'});
 await page.getByRole('link',{name:'Choose cream',exact:true}).click();await page.locator('.pdp-detail h1').waitFor();assert.equal(await gallery.getAttribute('data-active-photo'),'1');assert.equal(await page.locator('.gallery-thumbnails button').count(),4);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const mobileStage=await page.getByRole('button',{name:'Enlarge product image',exact:true}).boundingBox();const y=Math.min(760,mobileStage.y+mobileStage.height*.4),from=mobileStage.x+mobileStage.width*.8,to=mobileStage.x+mobileStage.width*.2;
 assert(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.gallery-enlarge'),{x:from,y}),'Touch starts on the visible image');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from,y,id:1}]});
 for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from+(to-from)*i/5,y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal(await gallery.getAttribute('data-active-photo'),'2','Horizontal touch swipe advances the product image');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await gallery.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});assert(await page.locator('.pdp-mobile-header').isVisible());assert(await page.locator('.gallery-product-actions').isVisible());assert(await page.locator('.gallery-meter').isVisible());assert(await page.getByRole('navigation',{name:'Mobile shopping navigation'}).isVisible());await page.screenshot({path:artifactRoot+'/bigk-product-page-mobile.png'});
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('navigation',{name:'Breadcrumb'}).getByRole('link',{name:'Collection',exact:true}).click();
 const currentSearch=page.getByRole('textbox',{name:'Search catalogue'});await currentSearch.waitFor();

 await search.fill('Velvet');assert.equal(await page.locator('.product-card').count(),4);await page.locator('.product-card').filter({hasText:'black FZ hood'}).locator('.quick-view').click();assert.equal(await page.locator('.thumbnails button').count(),5);await page.getByRole('button',{name:'Show product photo 5'}).click();await page.getByRole('button',{name:'Close dialog'}).click();
 await search.fill('Nano Down Vest');assert.equal(await page.locator('.product-card').count(),1);await page.locator('.quick-view').click();assert.equal(await page.locator('.thumbnails button').count(),7);await page.getByRole('button',{name:'Show product photo 7'}).click();await page.getByRole('button',{name:'Close dialog'}).click();
 await search.fill('Alpin');await page.locator('.product-card').filter({hasText:'preview price'}).first().locator('.quick-view').click();await page.locator('.size-options button').first().click();await page.getByRole('button',{name:'Add to demo bag'}).click();await page.getByRole('link',{name:'Continue to demo checkout'}).click();await page.getByRole('heading',{name:'Your demo checkout.'}).waitFor();await page.locator('input[name="firstName"]').fill('Demo');await page.locator('input[name="lastName"]').fill('Customer');await page.locator('input[name="email"]').fill('demo@example.test');await page.locator('input[name="phone"]').fill('+32470123456');await page.locator('input[name="address"]').fill('Example Street 1');await page.locator('input[name="postal"]').fill('1000');await page.locator('input[name="city"]').fill('Brussels');await page.locator('input[name="consent"]').check();await page.getByRole('button',{name:'Create demo order'}).click();await page.getByRole('heading',{name:'Your demo journey is complete.'}).waitFor().catch(async e=>{console.error('Preview errors:',errors);console.error((await page.locator('body').innerText()).slice(-1800));throw e});assert((await page.evaluate(()=>sessionStorage.getItem('bigk-preview-order'))).includes('demo'));assert(!(await page.evaluate(()=>sessionStorage.getItem('bigk-preview-order'))).includes('demo@example.test'));await page.screenshot({path:artifactRoot+'/bigk-demo-receipt-preview.png'});
 await page.getByRole('link',{name:'Back to the collection'}).click();await page.getByRole('textbox',{name:'Search catalogue'}).fill('Velvet');await page.locator('#catalog').screenshot({path:artifactRoot+'/bigk-velvet-preview.png'});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: isolated interactive preview — catalogue hover, full product page, hover zoom, arrows, thumbnail hover, keyboard gallery, full-screen zoom, recording-style overlay actions, catalogue product help, real touch swipe, four Velvet colours, Nano vest 7-photo gallery, size/bag, demo checkout to receipt, discarded contact details, navigation, mobile overflow. No live services called.');
}finally{await browser.close()}
