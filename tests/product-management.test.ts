import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {db,products,closeDatabase} from '../lib/db';import {hash} from '../lib/security';
import {editFromProduct,applyProductBatch,importPlan,readCsv,writeCsv,exportRows} from '../lib/catalog-files';
import {GET as catalog,PATCH as edit} from '../app/api/admin/catalog/route';
import {GET as history,POST as restore} from '../app/api/admin/catalog/history/route';
import {GET as fileExport,POST as fileImport} from '../app/api/admin/catalog/files/route';
import {POST as batch} from '../app/api/admin/catalog/batch/route';
import {POST as recover} from '../app/api/admin/access/route';
import {POST as login} from '../app/api/admin/login/route';
import {randomBytes,scryptSync} from 'node:crypto';
import {GET as publicCatalog} from '../app/api/catalog/route';
import {resolveProduct} from '../lib/catalog-view';
import {suggestMapping,mappedRows,supplierPlan,defaultImportOptions} from '../lib/supplier-import';
import {photoProductCandidates} from '../lib/media-matching';
import {productHistorySchema} from '../lib/backoffice-schema';
const dir=mkdtempSync(join(tmpdir(),'bigk-product-management-'));
const testURL=process.env.BIGK_TEST_DATABASE_URL;if(testURL&&(process.env.NODE_ENV!=='test'||!['127.0.0.1','localhost','[::1]'].includes(new URL(testURL).hostname)))throw Error('Only isolated local databases are permitted.');
process.env.DATABASE_PROVIDER=testURL?'postgres':'sqlite';process.env.DATABASE_URL=testURL||'';process.env.DATABASE_SCHEMA='bigk';process.env.DATABASE_PATH=join(dir,'test.sqlite');process.env.APP_URL='https://bigk.example';process.env.COMMERCE_MODE='demo';
const cookie='bigk_admin=product-management-local-test';
const get=(path:string,auth=true)=>new Request('https://bigk.example'+path,{headers:auth?{cookie}:{}});
const post=(path:string,data:unknown,auth=true,method='POST',origin='https://bigk.example')=>new Request('https://bigk.example'+path,{method,headers:{origin,'Content-Type':'application/json',...(auth?{cookie}:{})},body:JSON.stringify(data)});
function testGtin(n:number){const value='20000000'+String(n).padStart(4,'0');let sum=0;[...value].reverse().forEach((d,i)=>sum+=Number(d)*(i%2===0?3:1));return value+String((10-sum%10)%10)}
try{await db().prepare('INSERT INTO sessions(hash,expires_at) VALUES(?,?)').run(hash('product-management-local-test'),'2099-01-01T00:00:00.000Z');
await test('independent product management',async t=>{
 await t.test('every new operation requires admin and writes require trusted origins',async()=>{
  for(const endpoint of [catalog,history,fileExport])assert.equal((await endpoint(get('/api/admin/catalog',false))).status,401);
  for(const endpoint of [restore,batch,fileImport])assert.equal((await endpoint(post('/api/admin/catalog',{},false))).status,401);
  assert.equal((await batch(post('/api/admin/catalog/batch',{},true,'POST','https://attacker.example'))).status,403);
 });
 let nano=(await products()).find(p=>p.id==='P019')!;assert(nano);const originalVariantIds=nano.variants.map(v=>v.id),originalSlug=nano.slug,initialVersion=nano.version;
 await t.test('Nano name, composition, origin, packaging and EAN links persist after a fresh database read',async()=>{
  const payload=editFromProduct(nano);payload.name='Nano Down Jacket Reviewed';payload.slug='nano-down-jacket-reviewed';payload.content={composition:'Shell: 98% nylon, 2% polyester. Filling: 90% down, 10% feathers (test fixture).',care:'Follow the garment label.',fit:'Regular fit',details:'Local acceptance fixture',trade:{officialName:'Nano Down Jacket',supplierArticle:'25302901',colour:'Black',originCountry:'CN',hsCode:'620140',cnCode:'62014010',customsDescription:'Test fixture woven jacket',weightGrams:550,packageLengthCm:40,packageWidthCm:30,packageHeightCm:10,seoTitle:'Nano Down Jacket | BIG K',seoDescription:'Local test description.',identifiers:Object.fromEntries(nano.variants.map((v,i)=>[v.id,{sku:'NANO-TEST-'+v.size,gtin:testGtin(i),verified:true}]))}};
  assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,200);nano=(await products()).find(p=>p.id===nano.id)!;assert.equal(nano.name,payload.name);assert.equal(nano.content?.composition,payload.content.composition);assert.deepEqual(nano.variants.map(v=>v.id),originalVariantIds);for(const [i,v] of nano.variants.entries())assert.equal(nano.content?.trade?.identifiers?.[v.id].gtin,testGtin(i));assert.equal(resolveProduct(await products(),originalSlug)?.id,nano.id);
 });
 await t.test('drafts are private, published products become visible and unpublish removes them',async()=>{
  assert(!(await (await publicCatalog()).json()).products.some((p:any)=>p.id===nano.id));let payload=editFromProduct(nano);payload.images=['/products/web/nano-test-does-not-exist.webp'];assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,400);
  payload=editFromProduct(nano);payload.images=(await products()).find(p=>p.images.length)!.images;payload.priceCents=9990;payload.approved=true;payload.active=true;assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,200);nano=(await products()).find(p=>p.id===nano.id)!;assert((await (await publicCatalog()).json()).products.some((p:any)=>p.id===nano.id));
 });
 let added='';
 await t.test('add colour/size with permanent ID, reject collisions and archive without deleting',async()=>{
  let payload=editFromProduct(nano);added='V-'+crypto.randomUUID();payload.variants.push({id:added,size:nano.variants[0].size,stock:2});payload.content!.trade!.identifiers![added]={sku:'NANO-GREEN-TEST',gtin:testGtin(100),colour:'Green',verified:true};assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,200);nano=(await products()).find(p=>p.id===nano.id)!;
  payload=editFromProduct(nano);payload.content!.trade!.identifiers![added].colour='Black';assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,409);
  payload=editFromProduct(nano);payload.content!.trade!.identifiers![added].archived=true;assert.equal((await edit(post('/api/admin/catalog',payload,true,'PATCH'))).status,200);nano=(await products()).find(p=>p.id===nano.id)!;assert(nano.variants.some(v=>v.id===added));assert(!(await (await publicCatalog()).json()).products.find((p:any)=>p.id===nano.id).variants.some((v:any)=>v.id===added));
 });
 await t.test('CSV round trip retains leading zero GTINs and quoted/multiline content',async()=>{
  const rows=exportRows([nano]);rows[0].description='A quoted "test"\nsecond line';rows.forEach(row=>row.description=rows[0].description);const reread=readCsv(writeCsv(rows));assert.equal(reread[0].gtin,rows[0].gtin);const operations=await importPlan(reread);const version=nano.version;await applyProductBatch(operations,true);assert.equal((await products()).find(p=>p.id===nano.id)!.version,version);await applyProductBatch(operations,false);nano=(await products()).find(p=>p.id===nano.id)!;assert.equal(nano.description,rows[0].description);
 });
 await t.test('bulk updates roll back every product if a later operation conflicts',async()=>{
  const other=(await products()).find(p=>p.id!==nano.id&&p.variants.length)!;const first=editFromProduct(nano),second=editFromProduct(other);first.name='Must roll back';second.version++;await assert.rejects(()=>applyProductBatch([first,second],false),/changed in another session/);assert.equal((await products()).find(p=>p.id===nano.id)!.name,nano.name);
 });
 await t.test('real XLSX export and preview import preserve string identifiers without changing data',async()=>{
  const response=await fileExport(get('/api/admin/catalog/files?format=xlsx&ids='+nano.id));assert.equal(response.status,200);const file=await response.json(),form=new FormData();form.set('file',new File([Buffer.from(file.data,'base64')],'products.xlsx'));const result=await fileImport(new Request('https://bigk.example/api/admin/catalog/files',{method:'POST',headers:{cookie,origin:'https://bigk.example'},body:form}));assert.equal(result.status,200,await result.clone().text());const preview=await result.json();assert.equal(preview.operations[0].content.trade.identifiers[originalVariantIds[0]].gtin,testGtin(0));assert.equal((await products()).find(p=>p.id===nano.id)!.version,nano.version);
 });
 await t.test('imports reject duplicated rows, conflicting shared composition and outdated exports',async()=>{
  const rows=exportRows([nano]);await assert.rejects(()=>importPlan([...rows,rows[0]]),/repeated/);if(rows.length>1){const conflict=structuredClone(rows);conflict[1].composition='Different material';await assert.rejects(()=>importPlan(conflict),/Conflicting shared/)}rows[0].version='0';await assert.rejects(()=>importPlan(rows),/outdated/);
 });
 await t.test('history shows previous values and restores as a new draft without rolling back stock by default',async()=>{
  const result=await history(get('/api/admin/catalog/history?id='+nano.id));assert.equal(result.status,200);const revisions=(await result.json()).history;assert(revisions.length>=4);const older=revisions.find((r:any)=>r.version===initialVersion);assert(older);const stocks=nano.variants.map(v=>[v.id,v.stock]);const response=await restore(post('/api/admin/catalog/history',{id:nano.id,version:nano.version,revisionId:older.id}));assert.equal(response.status,200,await response.clone().text());nano=(await products()).find(p=>p.id===nano.id)!;assert.equal(nano.name,older.snapshot.name);assert.equal(nano.active,false);for(const [id,stock] of stocks)assert.equal(nano.variants.find(v=>v.id===id)!.stock,stock);assert.equal(nano.content?.trade?.identifiers?.[added]?.archived,true);
 });
 await t.test('supplier column mapping understands Dutch headers, EUR amounts and blank-cell protection',async()=>{
  const headers=['SKU incl maat','Productnaam website','Verkoopprijs incl. btw (€)','Bevestigde ontvangen voorraad','Samenstelling','EAN'];const mapping=suggestMapping(headers);assert.equal(mapping['2'],'priceEUR');
  assert.equal(mappedRows([['China']],{'0':'originCountry'},defaultImportOptions)[0].originCountry,'CN');
  const rows=mappedRows([['99990101-S','Imported Bulk Layer','€ 146,90','3','100% polyester',testGtin(501)],['99990101-M','Imported Bulk Layer','146.90','4','100% polyester',testGtin(502)]],mapping,{...defaultImportOptions,allowNewProducts:true});assert.equal(rows[0].priceCents,'14690');
  const operations=await supplierPlan(rows,{...defaultImportOptions,allowNewProducts:true});assert.equal(operations.length,1);assert.equal(operations[0].variants.length,2);assert.equal(operations[0].createCode,'99990101');
  const count=(await products()).length;await applyProductBatch(operations,true);assert.equal((await products()).length,count);assert(!(await products()).some(p=>p.id===operations[0].id));await applyProductBatch(operations,false);
  const imported=(await products()).find(p=>p.id===operations[0].id)!;assert(!imported.active&&!imported.approved);assert.equal(imported.content?.trade?.originCountry,'CN');assert.equal(imported.variants[1].stock,4);assert.equal(imported.content?.trade?.identifiers?.[imported.variants[1].id]?.gtin,testGtin(502));
  const repeated=await supplierPlan(rows,{...defaultImportOptions,allowNewProducts:true});assert.equal(repeated[0].id,imported.id);assert(!repeated[0].createCode);assert.deepEqual(repeated[0].variants.map(v=>v.id),imported.variants.map(v=>v.id));
  const blank=mappedRows([[testGtin(501),'']],{'0':'gtin','1':'composition'},defaultImportOptions),preserved=await supplierPlan(blank,defaultImportOptions);assert.equal(preserved[0].content?.composition,'100% polyester');
  const clear=mappedRows([[testGtin(501),'']],{'0':'gtin','1':'composition'},{...defaultImportOptions,skipBlank:false});assert.equal((await supplierPlan(clear,defaultImportOptions))[0].content?.composition,'');
 });
 await t.test('supplier imports can add variants, reject ambiguous identities and never publish new products',async()=>{
  const row={productCode:'99990101',size:'L',colour:'Blue',sku:'BULK-L-BLUE',gtin:testGtin(503),stock:'2'};
  await assert.rejects(()=>supplierPlan([row],defaultImportOptions),/Enable adding variants/);
  const ops=await supplierPlan([row],{...defaultImportOptions,allowNewVariants:true});await applyProductBatch(ops,false);const imported=(await products()).find(p=>p.id===ops[0].id)!;assert.equal(imported.variants.length,3);
  await assert.rejects(()=>supplierPlan([{...row,productCode:'99990000'}],defaultImportOptions),/conflicts/);
  const draft=await supplierPlan([{productCode:'99990201',name:'New private draft',size:'S',active:'true',approved:'true'}],{...defaultImportOptions,allowNewProducts:true,includePublication:true});assert(!draft[0].active&&!draft[0].approved);
  const invalid=structuredClone(draft);invalid[0].active=true;const result=await batch(post('/api/admin/catalog/batch',{operations:invalid,dryRun:false}));assert.equal(result.status,400);
  await assert.rejects(()=>supplierPlan([{...row,gtin:'4006381333932'}],{...defaultImportOptions,allowNewVariants:true}),/GTIN/);
 });
 await t.test('file inspect and mapping prepare do not write; new drafts require explicit batch save',async()=>{
  function upload(mode:string){const form=new FormData();form.set('file',new File(['Artikelnummer;Productnaam;Maat;Prijs;Voorraad\n99990301;CSV draft;S;59,90;2'],'supplier.csv'));form.set('mode',mode);return form}
  const inspect=await fileImport(new Request('https://bigk.example/api/admin/catalog/files',{method:'POST',headers:{cookie,origin:'https://bigk.example'},body:upload('inspect')}));assert.equal(inspect.status,200);const data=await inspect.json();assert.equal(data.rowCount,1);assert.equal(data.mapping['3'],'priceEUR');
  const form=upload('prepare');form.set('mapping',JSON.stringify(data.mapping));form.set('options',JSON.stringify({...defaultImportOptions,allowNewProducts:true}));const response=await fileImport(new Request('https://bigk.example/api/admin/catalog/files',{method:'POST',headers:{cookie,origin:'https://bigk.example'},body:form}));assert.equal(response.status,200,await response.clone().text());const prepared=await response.json();assert.equal(prepared.preview.changes[0].action,'create');assert(!(await products()).some(p=>p.id===prepared.operations[0].id));
  assert.equal((await batch(post('/api/admin/catalog/batch',{operations:prepared.operations,dryRun:false}))).status,200);assert((await products()).some(p=>p.id===prepared.operations[0].id));
 });
 await t.test('photo suggestions match exact codes/EANs, never names or a partial numeric identifier',async()=>{
  const catalog=await products(),p=catalog.find(p=>p.code==='99990101')!;assert.deepEqual(photoProductCandidates('99990101-front.png',catalog),[p.id]);assert.deepEqual(photoProductCandidates(testGtin(501)+'-back.jpg',catalog),[p.id]);assert.deepEqual(photoProductCandidates('19999010123456789.jpg',catalog),[]);assert.deepEqual(photoProductCandidates('Imported Bulk Layer.jpg',catalog),[]);
 });
 await t.test('a later stock movement invalidates a prepared data import even if product version is unchanged',async()=>{
  const p=(await products()).find(p=>p.code==='99990101')!,op=editFromProduct(p);op.name='Stale inventory proposal';await applyProductBatch([op],true);await db().prepare('UPDATE variants SET stock=stock+1 WHERE id=?').run(p.variants[0].id);await assert.rejects(()=>applyProductBatch([op],false),/Inventory changed/);assert.equal((await products()).find(x=>x.id===p.id)!.name,p.name);
 });
 await t.test('owner recovery is one-time, revokes old sessions and chosen password authenticates',async t=>{
  if(testURL){t.skip('Production-schema fixture; recovery is limited to development.');return;} // Recovery is disabled for the production schema; SQLite covers development recovery.
  process.env.ADMIN_RECOVERY_CODE=randomBytes(32).toString('base64url');const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');process.env.ADMIN_PASSWORD_HASH=salt+':'+scryptSync('old-test-password',salt,64).toString('hex');
  assert.equal((await recover(post('/api/admin/access',{recoveryCode:'invalid-code-that-is-long-enough',password},false))).status,401);
  const response=await recover(post('/api/admin/access',{recoveryCode:process.env.ADMIN_RECOVERY_CODE,password},false));assert.equal(response.status,200);assert(response.headers.get('set-cookie')?.includes('HttpOnly'));
  assert.equal((await catalog(get('/api/admin/catalog'))).status,401);
  assert.equal((await login(post('/api/admin/login',{password:'wrong-password'},false))).status,401);
  assert.equal((await login(post('/api/admin/login',{password},false))).status,200);
  assert.equal((await recover(post('/api/admin/access',{recoveryCode:process.env.ADMIN_RECOVERY_CODE,password},false))).status,409);
 });
 });
}finally{await closeDatabase();rmSync(dir,{recursive:true,force:true})}
