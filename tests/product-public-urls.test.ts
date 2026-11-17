import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicProductSlug,preserveProductQuery,publicUrlReserved} from '../lib/product-public-urls';
import {resolveProduct} from '../lib/catalog-view';
import {resolveGroupSelection} from '../lib/product-group-routing';
import {colourOptions,groupUrl,sharedProducts} from '../lib/product-groups';
import type {Product} from '../lib/types';
const make=(id:string,slug:string,colour='Black',parentProductId?:string):Product=>({id,slug,name:id,description:'Approved product description',code:id==='P003'?'25301801':id==='P004'?'25301802':id,category:'Tops',priceCents:6690,active:true,approved:true,featured:false,images:['/products/example.webp'],tags:[],version:1,content:{composition:'',care:'',fit:'',details:'',trade:{colour,parentProductId}},variants:[{id:id+'-S',size:'S',stock:12,reserved:2,reported:null}]});
const source=()=>sharedProducts([make('P003','core-2-p003'),make('P004','core-2-dusty-blue-p004','Dusty Blue','P003')]);
test('clean root links omit internal IDs and old slugs and colour IDs preserve exact variant and attribution',()=>{
 const catalog=source(),before=structuredClone(catalog),option=colourOptions(catalog,catalog[0]).find(o=>o.product.id==='P004')!;
 const link=new URL(groupUrl(catalog,option,'S'),'https://bigk.be');assert.equal(link.pathname,'/products/core-2');assert.equal(link.searchParams.get('colour'),'Dusty Blue');assert.equal(link.searchParams.has('colourId'),false);
 for(const slug of ['core-2-p003','core-2-dusty-blue-p004','core-2']){
  const selected=resolveGroupSelection(catalog,catalog,slug,{colourId:'P004',size:'S',utm_source:'test'} as any)!;
  assert.equal(selected.selected.product.id,'P004');assert.equal(selected.size,'S');assert.equal(selected.canonical,'/products/core-2');assert.equal(new URL(selected.redirect!,'https://bigk.be').searchParams.get('utm_source'),'test');
 }
 const clean=resolveGroupSelection(catalog,catalog,'core-2',{colour:'Dusty Blue',size:'S'})!;assert.equal(clean.redirect,undefined);
 assert.equal(resolveGroupSelection(catalog,catalog,'core-2',{colour:'Unknown'}),undefined);assert.equal(resolveGroupSelection(catalog,[catalog[0]],'core-2',{colourId:'P004'}),undefined);
 assert.deepEqual(catalog,before);
});
test('clean addresses and historical clean aliases resolve without deriving URLs from editable names',()=>{
 const catalog=source();assert.equal(resolveProduct(catalog,'core-2')?.id,'P003');
 const renamed=catalog.map(p=>({...p,name:'New display name'}));assert.equal(groupUrl(renamed,colourOptions(renamed,renamed[0])[0]).split('?')[0],'/products/core-2');
 const moved=source();moved[0].slug='expedition-top';moved[0].group={id:'P003',slug:'expedition-top',version:1};moved[0].content!.trade!.previousSlugs=['core-2-p003'];
 assert.equal(resolveProduct(moved,'core-2')?.id,'P003');assert.equal(resolveProduct(moved,'core-2-p003')?.id,'P003');
});
test('reviewed Nano and CORELOSSE addresses and future UUID IDs use readable public names',()=>{
 for(const [id,from,to] of [['P019','nandown-jkt-p019','nano-down-jacket'],['P021','nandown-fz-gillet-p021','nano-down-vest'],['P015','corelosse-2-thermal-long-sleeve-jersey','corelosse-2'],['RIBS-LOW-WHITE','ribs-low-white-socks','ribs-low-socks'],['P-12345678-abc','new-layer-p-12345678-abc','new-layer']]){
  const p=make(id,from);assert.equal(publicProductSlug(p,[p]),to);
 }
});
test('colliding public/current/historical addresses are reserved, never silently assigned to another product',()=>{
 const catalog=source();assert(publicUrlReserved('core-2',catalog));assert(!publicUrlReserved('core-2',catalog,'P003'));
 const other=make('OTHER','core-2');assert.equal(publicProductSlug(catalog[0],[...catalog,other]),'core-2-p003');assert.equal(resolveProduct([...catalog,other],'core-2')?.id,'OTHER');
 const historical=source();historical[0].content!.trade!.previousSlugs=['original-layer-p003'];assert(publicUrlReserved('original-layer',historical));
 assert.equal(publicProductSlug(make('CUSTOM','my-p003'),[make('CUSTOM','my-p003')]),'my-p003');
});
test('non-product query values survive exactly and cannot change the redirect origin',()=>{
 const target=preserveProductQuery('/products/core-2?colour=Black&size=S',{colourId:'P004',colour:'Blue',size:'M',utm_source:'email',tag:['one','two'],next:'https://untrusted.example'});
 const url=new URL(target,'https://bigk.be');assert.equal(url.origin,'https://bigk.be');assert.equal(url.searchParams.get('colour'),'Black');assert.equal(url.searchParams.get('size'),'S');assert.deepEqual(url.searchParams.getAll('tag'),['one','two']);assert.equal(url.searchParams.get('utm_source'),'email');assert(!url.searchParams.has('colourId'));
});
