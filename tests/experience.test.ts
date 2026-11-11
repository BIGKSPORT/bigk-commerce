import {test} from 'node:test';
import assert from 'node:assert/strict';
import {experienceFixtures} from '../lib/experience/fixtures';
import {experienceEnabled,experienceData,freeDeliveryThreshold} from '../lib/experience/server-policy';
import {experienceCartKey,readExperienceCart,addExperienceLine,experienceTotal,availableQuantity} from '../lib/experience/cart';
import {isFixtureExperience,isExperiencePath} from '../lib/experience/isolation';
import {experienceCopy} from '../lib/experience/copy';
import config from '../lib/experience/placements.json';
import {shipping} from '../lib/commerce';
const products=experienceFixtures();
await test('seven realistic fixture styles have unique, isolated variant IDs and both stock states',()=>{
 assert.equal(products.length,7);const ids=products.flatMap(p=>p.variants.map(v=>v.id));assert.equal(new Set(ids).size,ids.length);assert(ids.every(id=>id.startsWith('EXPERIENCE-')));
 for(const p of products){assert(p.images.every(image=>image.startsWith('/products/')&&image.endsWith('.webp')));assert(p.priceCents!>0);assert(p.variants.some(v=>v.stock>0));assert(p.variants.some(v=>v.stock===0));assert(config.slots.some(s=>s.productId===p.id));}
});
await test('fixture cart cannot overwrite the established cart; quantities, stock and totals agree',()=>{
 assert.notEqual(experienceCartKey('fixture'),'bigk-bag-v2');assert.equal(experienceCartKey('staging'),'bigk-bag-v2');
 const p=products[2],v=p.variants[0];let lines=addExperienceLine([],p,v.id);lines=addExperienceLine(lines,p,v.id);assert.equal(lines[0].quantity,2);assert.equal(experienceTotal(lines,products),p.priceCents!*2);
 assert.throws(()=>addExperienceLine(lines,p,p.variants.at(-1)!.id));lines=addExperienceLine(lines,p,v.id);assert.throws(()=>addExperienceLine(lines,p,v.id));assert.equal(availableQuantity(p,v.id),3);
 assert.equal(readExperienceCart(JSON.stringify(Array.from({length:35},(_,i)=>({variantId:'saved-'+i,quantity:1})))).length,35,'Existing cart lines must not be silently discarded');
 assert.deepEqual(readExperienceCart('broken'),[]);assert.deepEqual(readExperienceCart('[{"variantId":"x","quantity":999}]'),[]);assert.deepEqual(readExperienceCart('[{"variantId":"x","quantity":2},{"variantId":"x","quantity":2}]'),[{variantId:'x',quantity:4}]);
});
await test('sync isolation matches only fixture experience pages',()=>{
 for(const path of ['/experience','/nl/experience','/fr/experience','/en/experience','/es/experience','/it/experience/']){assert(isExperiencePath(path));assert(isFixtureExperience(path,true));assert(!isFixtureExperience(path,false));}
 for(const path of ['/','/nl','/nl/checkout','/admin','/nl/products/experience','/experience-other'])assert(!isFixtureExperience(path,true));
});
await test('NL/FR/EN copy and ES/IT English fallback are complete',()=>{
 const en=experienceCopy('en');for(const locale of ['nl','fr']){const copy=experienceCopy(locale);assert.deepEqual(Object.keys(copy),Object.keys(en));assert.notEqual(copy.title,en.title);}
 assert.deepEqual(experienceCopy('es'),en);assert.deepEqual(experienceCopy('it'),en);
});
await test('flag defaults off, production stays closed, fixture data ignores database credentials',async()=>{
 const keys=['NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED','VERCEL_ENV','EXPERIENCE_STAGING_DATA','DATABASE_PROVIDER','DATABASE_SCHEMA','DATABASE_URL','STRIPE_SECRET_KEY'] as const,old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  for(const k of keys)delete process.env[k];assert(!experienceEnabled());process.env.NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED='true';process.env.VERCEL_ENV='preview';assert(experienceEnabled());
  process.env.DATABASE_PROVIDER='postgres';process.env.DATABASE_SCHEMA='bigk';process.env.DATABASE_URL='postgres://must-not-connect.invalid/production';
  const data=await experienceData('fr');assert.equal(data.mode,'fixture');assert.equal(data.products.length,7);
  process.env.EXPERIENCE_STAGING_DATA='true';await assert.rejects(()=>experienceData('en'),/isolated staging/);
  process.env.DATABASE_SCHEMA='bigk_staging';process.env.STRIPE_SECRET_KEY='sk_live_not_a_real_key';await assert.rejects(()=>experienceData('en'),/live payment/);
  process.env.VERCEL_ENV='production';assert(!experienceEnabled());await assert.rejects(()=>experienceData('en'),/disabled/);
 }finally{for(const k of keys)if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
});
await test('delivery progress derives the exact boundary from the existing shipping policy',()=>{const threshold=freeDeliveryThreshold();assert.equal(shipping(threshold),0);assert(shipping(threshold-1)>0);assert(threshold>0);});
