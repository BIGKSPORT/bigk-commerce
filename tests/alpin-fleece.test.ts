import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Product} from '../lib/types';
import {alpinPublicProduct,alpinMappingIssues,alpinVariantMapping,alpinSize,alpinCopy,alpinPaths,alpinLocales} from '../lib/alpin-fleece';
import {alpinMetadata,alpinStructuredData} from '../lib/alpin-fleece-seo';
const data=JSON.parse(readFileSync('docs/catalog-review/alpin-fleece-pro-review.json','utf8'));
const family:Product[]=data.colours.map((colour:any)=>({id:colour.productId,code:colour.code,name:'Alpin Fleece Pro',slug:colour.productId,version:1,description:colour.colour,active:true,approved:true,featured:false,category:'Fleece',priceCents:14690,images:colour.images.map((i:any)=>i.webPath),tags:[],variants:colour.variants.map((v:any,i:number)=>({id:colour.productId+'-'+i,size:alpinSize(v.size),stock:v.receivedMaster,reserved:i===0?1:0,reported:null}))}));
test('owner GTIN mapping matches twelve source size rows without changing stock, IDs or prices',()=>{
 assert.deepEqual(alpinMappingIssues(family),[]);const mappings=family.flatMap(alpinVariantMapping);assert.equal(mappings.length,12);assert.equal(new Set(mappings.map(v=>v.gtin)).size,12);assert.equal(new Set(mappings.map(v=>v.sku)).size,12);
 const original=structuredClone(family);for(const p of family){const result=alpinPublicProduct(p);assert.equal(result.name,'Alpin Fleece');assert.deepEqual(result.variants,p.variants);assert.equal(result.priceCents,p.priceCents);assert.equal(result.images,p.images);assert.equal(result.id,p.id);}
 assert.deepEqual(family,original);
});
test('public XS exclusion preserves historical source records and accepts backend 3XL',()=>{
 const source=structuredClone(family[0]);source.variants[5].size='3XL';source.variants.push({id:'historic-xs',size:'XS',stock:4,reserved:0,reported:null});const result=alpinPublicProduct(source);assert.equal(result.variants.length,6);assert(!result.variants.some(v=>v.size==='XS'));assert.equal(source.variants.length,7);assert.equal(result.variants[5].id,source.variants[5].id);
});
test('conflicts block page validation instead of changing transactional pricing or identifiers',()=>{
 const source=structuredClone(family);source[0].priceCents=15000;assert(alpinMappingIssues(source).some(issue=>issue.includes('Price conflict')));assert.equal(alpinPublicProduct(source[0]).priceCents,15000);
 source[0].content={composition:'',care:'',fit:'',details:'',trade:{identifiers:{'P001-0':{sku:'existing-sku',gtin:'6957919564823'}}}};assert(alpinMappingIssues(source).some(issue=>issue.includes('Conflicting stored GTIN')));assert.equal(alpinPublicProduct(source[0]).content?.trade?.identifiers?.['P001-0'].gtin,'6957919564823');
});
test('all languages share product identity and twelve live stock-based offers, canonical and reciprocal alternates',()=>{
 for(const locale of alpinLocales){const json=alpinStructuredData(locale,family),group=json['@graph'][0] as any;assert.equal(group.name,'Alpin Fleece');assert.equal(group.productGroupID,'ALPIN-FLEECE');assert.equal(group.hasVariant.length,12);for(const v of group.hasVariant){assert.equal(v.name,'Alpin Fleece');assert.equal(v.offers.price,'146.90');assert.equal(v.offers.priceCurrency,'EUR');assert(v.url.startsWith('https://bigk.be'+alpinPaths[locale]));assert(v.url.includes('size='));assert.equal(typeof v.gtin13,'string')}
 const metadata=alpinMetadata(locale,family,false);assert.equal(metadata.alternates?.canonical,'https://bigk.be'+alpinPaths[locale]);assert.equal(Object.keys(metadata.alternates?.languages||{}).length,4);assert.equal((metadata.robots as any).index,false);assert(!/[\u3400-\u9fff]|2025|Alpin Fleece Pro/.test(JSON.stringify(alpinCopy(locale))));assert(!/"XS"/.test(JSON.stringify(json)));}
 const out=structuredClone(family);out[0].variants[0].reserved=out[0].variants[0].stock;assert.equal((alpinStructuredData('en',out)['@graph'][0] as any).hasVariant[0].offers.availability,'https://schema.org/OutOfStock');
});
test('vest and other garments stay untouched',()=>{const vest={...family[0],id:'P007',code:'25303202',name:'Alpin Vest Pro'};assert.equal(alpinPublicProduct(vest),vest)});
