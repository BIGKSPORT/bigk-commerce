import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {products,db,closeDatabase} from '../lib/db';
import {productGroups,sharedProducts,colourOptions,groupUrl,parentId} from '../lib/product-groups';
import {resolveGroupSelection} from '../lib/product-group-routing';
import {groupingPlan} from '../lib/product-group-migration';
import {saveSharedProduct,addProductColour,archiveProductColour,groupEditSchema} from '../lib/admin-product-groups';
import {importB10Draft} from '../lib/b10-import';
import {publicProducts} from '../lib/catalog-view';
import {updateProduct} from '../lib/admin-catalog';
const dir=mkdtempSync(join(tmpdir(),'bigk-groups-'));
process.env.DATABASE_SCHEMA='bigk_staging';process.env.DATABASE_PROVIDER='sqlite';process.env.DATABASE_PATH=join(dir,'test.sqlite');process.env.DATABASE_URL='';process.env.APP_URL='https://bigk.example';process.env.COMMERCE_MODE='demo';
const stock=(catalog:Awaited<ReturnType<typeof products>>)=>catalog.flatMap(p=>p.variants.map(v=>[p.id,v.id,v.size,v.stock,v.reserved]));
try{
 await test('catalogue groups preserve independent colour identities and inventory',async t=>{
  const before=await products();const plan=groupingPlan(before);
  await t.test('reviewed migration preserves every existing variant and stock, adds unavailable confirmed sizes only, and is repeatable',()=>{
   for(const p of before)for(const v of p.variants)assert.deepEqual(plan.catalog.find(next=>next.id===p.id)!.variants.find(next=>next.id===v.id),v);
   assert.equal(plan.catalog.find(p=>p.id==='P006')!.name,'ALPIN VEST');assert.equal(plan.catalog.find(p=>p.id==='P012')!.name,'ALPIN HOOD GILLET');
   assert.equal(plan.added.length,1);assert.equal(plan.added[0].code,'25301703');assert(plan.added[0].variants.every(v=>v.stock===0&&v.reserved===0));assert.equal(plan.added[0].images.length,0);assert.equal(plan.added[0].active,false);
   const second=groupingPlan(plan.catalog);assert.equal(second.added.length,0);assert.equal(second.updated.length,0);
   assert.notEqual(parentId(plan.catalog.find(p=>p.id==='P006')!,plan.catalog),parentId(plan.catalog.find(p=>p.id==='P012')!,plan.catalog));
   for(const id of ['P017','P018','P026','P027'])assert.equal(parentId(plan.catalog.find(p=>p.id===id)!,plan.catalog),id);
  });
  await t.test('one parent row per reviewed style; B10 retains three independently selectable colours; no historical alias rows',()=>{
   const groups=productGroups(sharedProducts(plan.catalog));assert.equal(groups.filter(g=>g.id==='P001').length,1);assert.equal(groups.find(g=>g.id==='P003')!.colours.length,3);assert(!groups.some(g=>g.id==='P013'||g.id==='P020'));
  });
  await t.test('colour links resolve to their own variants; invalid explicit colour never defaults; legacy links keep selected colour',()=>{
   const source=sharedProducts(plan.catalog),root=source.find(p=>p.id==='P003')!,child=source.find(p=>p.id==='P004')!,option=colourOptions(source,root).find(c=>c.product.id===child.id)!;
   const link=new URL(groupUrl(source,option,'M'),'https://bigk.example');assert.equal(link.searchParams.get('colourId'),child.id);
   const resolved=resolveGroupSelection(source,source,root.slug,{colourId:child.id,size:'M'})!;assert.equal(resolved.selected.product.id,child.id);assert.equal(resolved.canonical,'/products/'+root.slug);
   assert.equal(resolveGroupSelection(source,source,root.slug,{colour:'does-not-exist'}),undefined);assert.equal(resolveGroupSelection(source,source,child.slug,{})!.selected.product.id,child.id);
   const publicChildOnly=source.filter(p=>p.id===child.id);assert(new URL(groupUrl(publicChildOnly,colourOptions(publicChildOnly,child)[0]),'https://bigk.example').searchParams.get('colourId')===child.id);
  });
  let root=before.find(p=>p.id==='P003')!;
  await t.test('shared edits reach all grouped colours without touching prices, photos, IDs, EANs or physical/reserved stock',async()=>{
   const oldStock=stock(await products()),siblings=before.filter(p=>parentId(p,before)===root.id);await saveSharedProduct(groupEditSchema.parse({id:root.id,versions:Object.fromEntries(siblings.map(p=>[p.id,p.version])),name:root.name,description:'Owner-reviewed shared description.',category:root.category,content:{...root.content,composition:'92% polyamide, 8% elastane',care:'Care policy',fit:'Reviewed fit',details:'Shared product details',translations:{nl:{description:'Gedeelde productomschrijving.'}}}}));
   const after=await products();assert.deepEqual(stock(after),oldStock);const effective=sharedProducts(after);for(const sibling of siblings){const p=effective.find(p=>p.id===sibling.id)!;assert.equal(p.description,'Owner-reviewed shared description.');assert.equal(p.priceCents,sibling.priceCents);assert.deepEqual(p.images,sibling.images);assert.deepEqual(p.content?.trade?.identifiers,sibling.content?.trade?.identifiers)}
   await assert.rejects(()=>saveSharedProduct({id:root.id,versions:Object.fromEntries(siblings.map(p=>[p.id,p.version])),name:root.name,description:'stale',category:root.category as any,content:root.content!}),/changed in another session/);root=after.find(p=>p.id===root.id)!;
  });
  await t.test('explicit colour overrides survive later shared edits and names cannot be changed on a child',async()=>{
   let catalog=await products();const child=sharedProducts(catalog).find(p=>p.id==='P004')!;await updateProduct({id:child.id,version:child.version,name:child.name,priceCents:child.priceCents,approved:child.approved,active:child.active,variants:child.variants.map(v=>({id:v.id,size:v.size,stock:v.stock})),content:{...child.content!,composition:'Explicit colour-specific composition'}});
   catalog=await products();assert(catalog.find(p=>p.id===child.id)!.content?.trade?.sharedOverrides?.includes('composition'));
   const members=catalog.filter(p=>parentId(p,catalog)===root.id);root=catalog.find(p=>p.id===root.id)!;await saveSharedProduct({id:root.id,versions:Object.fromEntries(members.map(p=>[p.id,p.version])),name:root.name,description:root.description,category:root.category as any,content:{...root.content!,composition:'Updated shared composition'}});
   assert.equal(sharedProducts(await products()).find(p=>p.id===child.id)!.content?.composition,'Explicit colour-specific composition');
   const latest=(await products()).find(p=>p.id===child.id)!;await assert.rejects(()=>updateProduct({id:latest.id,version:latest.version,groupVersion:root.version,priceCents:latest.priceCents,active:false,approved:false,variants:latest.variants}),/Shared product information changed/);await assert.rejects(()=>updateProduct({id:latest.id,version:latest.version,name:'A separate name',priceCents:latest.priceCents,active:false,approved:false,variants:latest.variants}),/name is shared/);
  });
  await t.test('new colour inherits shared information, starts draft at zero stock, rejects duplicate colours and archives without deleting variants',async()=>{
   root=(await products()).find(p=>p.id===root.id)!;const before=stock(await products());const payload={parentId:root.id,version:root.version,colour:'Owner confirmed test colour',article:'99993456',sizes:['S','M'],priceCents:root.priceCents,images:[]};const id=await addProductColour(payload);const catalog=await products(),added=catalog.find(p=>p.id===id)!;assert.equal(parentId(added,catalog),root.id);assert(added.variants.every(v=>v.stock===0));assert.equal(added.active,false);assert.equal(sharedProducts(catalog).find(p=>p.id===id)!.description,root.description);for(const row of before)assert(stock(catalog).some(value=>JSON.stringify(value)===JSON.stringify(row)));
   await assert.rejects(()=>addProductColour(payload),/already exists/);await archiveProductColour({parentId:root.id,colourId:id,version:added.version,archived:true});const archived=(await products()).find(p=>p.id===id)!;assert.equal(archived.variants.length,2);assert.equal(colourOptions(await products(),root).some(o=>o.product.id===id),false);
  });
  await t.test('adding a colour to a published B10 keeps the new colour private and preserves all 33 original identifiers',async()=>{
   await importB10Draft();let p=(await products()).find(p=>p.id==='B10')!;await updateProduct({id:p.id,version:p.version,priceCents:p.priceCents,approved:true,active:true,variants:p.variants});p=(await products()).find(p=>p.id==='B10')!;const identifiers=structuredClone(p.content?.trade?.identifiers);
   const id=await addProductColour({parentId:p.id,version:p.version,colour:'Reviewed fourth colour',article:'99998888',sizes:['40','41'],images:[],priceCents:12999});const catalog=await products(),added=catalog.find(p=>p.id===id)!;assert.equal(added.active,false);assert.equal(added.approved,false);assert.equal(added.priceCents,12999);assert(added.variants.every(v=>v.stock===0));assert(!publicProducts(catalog).some(p=>p.id===id));assert.equal(catalog.find(p=>p.id==='B10')!.variants.length,33);assert.deepEqual(catalog.find(p=>p.id==='B10')!.content?.trade?.identifiers,identifiers);
  });
  await t.test('translation schema rejects translated names or commercial data',()=>{const payload={id:root.id,versions:{},name:root.name,description:root.description,category:root.category,content:{...root.content,translations:{nl:{name:'Translated name',priceCents:1}}}};assert.equal(groupEditSchema.safeParse(payload).success,false)});
 });
}finally{await closeDatabase();rmSync(dir,{recursive:true,force:true})}
