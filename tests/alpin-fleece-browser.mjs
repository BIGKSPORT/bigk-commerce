import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {randomBytes,scryptSync} from 'node:crypto';
import {mkdtemp,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'bigk-alpin-browser-')),origin='http://127.0.0.1:3196',password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex'),artifacts=process.env.BIGK_ARTIFACT_DIR||'/workspace/alpin-fleece-preview';await mkdir(artifacts,{recursive:true});
const env={...process.env,NODE_ENV:'production',PORT:'3196',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_SCHEMA:'bigk_staging',DATABASE_PATH:join(dir,'store.sqlite'),MEDIA_PATH:join(dir,'media'),MEDIA_DRIVER:'database',COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',EMAIL_DELIVERY_ENABLED:'false',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex')};for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];let server,browser,output='';
function run(args){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env,stdio:['ignore','pipe','pipe']});let text='';child.stdout.on('data',d=>text+=d);child.stderr.on('data',d=>text+=d);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Fixture command failed: '+text)))})}
const routes={en:'/en/products/alpin-fleece-jacket',nl:'/nl/products/alpin-fleecejas',fr:'/fr/products/veste-polaire-alpin'};
const language={en:'English',nl:'Nederlands',fr:'Français'};
const labels={en:{colour:'Dusty Blue',add:'Add to demo bag',close:'Close bag',technology:'Technology & Construction',photo:'Product photos'},nl:{colour:'Vergrijsd blauw',add:'In demowinkelmand',close:'Winkelmand sluiten',technology:'Technologie & constructie',photo:'Productfoto’s'},fr:{colour:'Bleu grisé',add:'Ajouter au panier de démonstration',close:'Fermer le panier',technology:'Technologie & construction',photo:'Photos du produit'}};
const checks=[];
try{
 await run(['--import','tsx','tests/fixtures/seed-alpin.ts']);
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(origin+'/admin')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}assert(ready,'Next did not start');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390])for(const locale of ['en','nl','fr']){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+routes[locale]);await page.getByRole('heading',{name:'Alpin Fleece',exact:true}).waitFor();await page.getByRole('heading',{name:labels[locale].technology,exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
  assert.equal(await page.locator('[data-alpin-technology] article').count(),4);
  const care=page.locator('#care-instructions');assert.equal(await care.locator('[data-care-symbol]').count(),5);assert.equal(await care.locator('[data-iron-dot]').count(),1);assert.equal(await care.locator('[data-dryer-square]').count(),1);assert.equal(await care.getAttribute('data-care-locale'),locale);const boxes=await care.locator('li').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y}}));if(width>700)assert(boxes.every(box=>Math.abs(box.y-boxes[0].y)<1));else {assert(Math.abs(boxes[0].y-boxes[1].y)<1);assert(boxes[2].y>boxes[0].y)}

  const text=await page.locator('body').innerText(),html=await page.content();assert(!/[\u3400-\u9fff]|\bXS\b|2025|Alpin Fleece Pro/.test(text));assert(!/[\u3400-\u9fff]/.test(html));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://bigk.be'+routes[locale]);assert.equal(await page.locator('link[hreflang]').count(),4);
  assert((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
  const data=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()),group=data['@graph'][0];assert.equal(group.hasVariant.length,12);assert(group.hasVariant.every(v=>v.offers.price==='146.90'&&v.name==='Alpin Fleece'&&v.gtin13.length===13));
  await page.getByRole('link',{name:(locale==='en'?'Colour':locale==='nl'?'Kleur':'Couleur')+': '+labels[locale].colour,exact:true}).click();
  await page.getByRole('button',{name:'XXXL',exact:true}).click();assert(new URL(page.url()).searchParams.get('size')==='XXXL');
  assert.equal(await page.locator('.gallery-track img').first().getAttribute('alt'),locale==='en'?'Big K Alpin Fleece jacket in Dusty Blue, front view':locale==='nl'?'Big K Alpin fleecejas in vergrijsd blauw, vooraanzicht':'Veste polaire Alpin Big K, bleu grisé, vue de face');
  await page.getByRole('button',{name:labels[locale].add,exact:true}).click();await page.getByRole('dialog').waitFor();const bag=await page.evaluate(()=>JSON.parse(localStorage.getItem('bigk-bag-v2')));assert.equal(bag[0].variantId,'P002-5');assert.equal(bag[0].quantity,1);await page.getByRole('button',{name:labels[locale].close,exact:true}).click();
  const next=locale==='en'?'nl':'en';await page.getByRole('link',{name:language[next],exact:true}).click();await page.getByRole('heading',{name:'Alpin Fleece',exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.get('colour'),'Dusty Blue');assert.equal(new URL(page.url()).searchParams.get('size'),'XXXL');assert.equal(await page.getByRole('button',{name:'XXXL',exact:true}).getAttribute('aria-pressed'),'true');
  await page.goto(origin+routes[locale]+'?colour=Dusty+Blue&size=XXXL');
  const gallery=page.getByRole('region',{name:labels[locale].photo,exact:true});await gallery.focus();await gallery.press('ArrowRight');assert.equal(await gallery.getAttribute('data-active-photo'),'2');await gallery.press('Home');
  for(const image of await page.locator('main img').all()){if(await image.isVisible())await image.scrollIntoViewIfNeeded();await image.evaluate(el=>{el.loading='eager';return el.decode()});assert(await image.evaluate(el=>el.naturalWidth>0))}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow '+locale+' '+width);await page.getByRole('heading',{name:'Alpin Fleece',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(artifacts,`alpin-fleece-${locale}-${width}.png`),fullPage:true});await care.screenshot({path:join(artifacts,`care-${locale}-${width}.png`)});
  assert.deepEqual(errors,[]);checks.push({locale,width,status:'PASS'});console.log('PASS',locale,width,'metadata, twelve GTIN offers, selection, bag, language persistence, images, no Chinese/XS/overflow');await context.close();
 }
 for(const [path,destination] of [['/products/apline-fleece-p001?size=M',routes.en+'?colour=Black&size=M'],['/products/alpine-fz-p002?size=3XL',routes.en+'?colour=Dusty+Blue&size=XXXL'],['/fr/products/alpine-fz-p002?size=S',routes.fr+'?colour=Dusty+Blue&size=S']]){const response=await fetch(origin+path,{redirect:'manual'});assert.equal(response.status,308);assert.equal(response.headers.get('location'),destination)}
 // Draft visibility: use actual authentication, and ensure public pages don't expose drafts.
 await run(['--import','tsx','tests/fixtures/archive-alpin.ts']);
 const hidden=await fetch(origin+routes.en);assert.equal(hidden.status,404);
 const context=await browser.newContext(),page=await context.newPage();await page.goto(origin+'/admin');await page.locator('input[type="password"]').fill(password);await page.getByRole('button',{name:/sign in/i}).click();await page.getByRole('navigation',{name:'Backoffice navigation'}).waitFor();await page.goto(origin+routes.fr);await page.getByRole('heading',{name:'Alpin Fleece',exact:true}).waitFor();assert(await page.getByRole('button',{name:labels.fr.add,exact:true}).isDisabled());assert.equal(await page.locator('script[type="application/ld+json"]').count(),0);await context.close();
 await writeFile(join(artifacts,'validation.json'),JSON.stringify({checks,redirects:'PASS',privatePreview:'PASS',externalRichResultsTest:'NOT VERIFIED'},null,2));console.log('PASS redirects and authenticated draft preview');
}catch(e){console.error(output.slice(-2500));throw e}finally{await browser?.close();if(server&&server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped}await rm(dir,{recursive:true,force:true})}
