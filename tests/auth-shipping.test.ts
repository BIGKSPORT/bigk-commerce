import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,scryptSync} from 'node:crypto';
import {db,closeDatabase} from '../lib/database';
import {passwordMatches,requireAdmin,checkOrigin,hash} from '../lib/security';
import {POST as login} from '../app/api/admin/login/route';
import {POST as logout} from '../app/api/admin/logout/route';
import {GET as status,POST as shipping} from '../app/api/admin/shipping/myparcel/test-label/route';
import {GET as master} from '../app/api/admin/master/route';
import {TEST_REFERENCE,providerDiagnostic,testShipmentPayload} from '../lib/myparcel-test';
const origin='https://bigk-commerce-git-fix-catalogue-colour-options-hello-35126091.vercel.app';
process.env.ADMIN_CANONICAL_ORIGIN=origin;
process.env.APP_URL=origin;
process.env.VERCEL_BRANCH_URL=new URL(origin).hostname;
process.env.VERCEL_URL='bigk-immutable-old.vercel.app';
process.env.MYPARCEL_TEST_LABEL_ENABLED='true';
process.env.MYPARCEL_BE_API_KEY='test-only-provider-fixture';
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
process.env.ADMIN_PASSWORD_HASH=salt+':'+scryptSync(password,salt,64).toString('hex');
let cookie='';
const req=(path:string,data?:unknown,auth=true,requestOrigin=origin)=>new Request(origin+path,{method:data===undefined?'GET':'POST',headers:{origin:requestOrigin,...(auth?{cookie}:{}),'Content-Type':'application/json'},...(data!==undefined?{body:JSON.stringify(data)}:{})});
const clear=()=>db().prepare('DELETE FROM shipping_test_attempts').run();
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const noShipments={data:{shipments:[]}};
const originalFetch=globalThis.fetch;
await test('durable authentication and safe DPD test workflow',async t=>{
 await t.test('correct password authenticates; incorrect and malformed config are distinct',async()=>{
  assert(passwordMatches(password));assert(!passwordMatches('incorrect-password'));
  const invalid=await login(req('/api/admin/login',{password:'incorrect-password'},false));assert.equal(invalid.status,401);
  const r=await login(req('/api/admin/login',{password},false));assert.equal(r.status,200);
  const set=r.headers.get('set-cookie')!;assert.match(set,/HttpOnly; SameSite=Strict; Path=\/; Max-Age=28800/);cookie=set.split(';')[0];
  const stored=await db().prepare('SELECT hash FROM sessions').all();assert(stored.every(row=>!String(row.hash).includes(cookie.split('=')[1])));
  const before=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH='invalid-configuration';assert.throws(()=>passwordMatches(password),/configuration is invalid/);process.env.ADMIN_PASSWORD_HASH=before;
 });
 await t.test('session survives new DB connection and deployment hostname changes; navigation remains authenticated',async()=>{
  await closeDatabase();process.env.VERCEL_URL='bigk-immutable-new.vercel.app';
  await requireAdmin(req('/admin'));await requireAdmin(req('/admin/shipping-test'));
  assert.equal((await master(req('/api/admin/master'))).status,200);
  assert.equal((await status(req('/api/admin/shipping/myparcel/test-label'))).status,200);
  checkOrigin(req('/api/admin/login',{}));
  assert.throws(()=>checkOrigin(req('/api/admin/login',{},false,'https://evil.example')),/origin rejected/);
  await assert.rejects(()=>requireAdmin(req('/admin',undefined,false)),/Sign in/);
 });
 await t.test('all shipping mutations require authentication, confirmation and staging',async()=>{
  const r=await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'},false));assert.equal(r.status,401);
  assert.equal((await shipping(req('/api/admin/shipping/myparcel/test-label',{}))).status,400);
  process.env.VERCEL_ENV='production';assert.equal((await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))).status,403);process.env.VERCEL_ENV='preview';
 });
 await t.test('exact documented Belgian DPD payload; nested errors do not expose PII or credentials',()=>{
  const p=testShipmentPayload().data.shipments[0];assert.equal(p.carrier,4);assert.deepEqual(p.options,{package_type:1});assert.equal(p.recipient.number,'27');assert(!('email' in p.recipient));
  const d=providerDiagnostic(422,{errors:[{code:3210,fields:[{field:'data.shipments.0.options.delivery_type',human:'Invalid value "PRIVATE NAME" test@example.com SECRET',code:'INVALID'}]}]});
  assert(d.providerFields.includes('data.shipments.0.options.delivery_type'));assert(d.providerMessages.includes('Veldwaarde is ongeldig.'));assert(!JSON.stringify(d).includes('SECRET'));assert(!JSON.stringify(d).includes('PRIVATE'));
 });
 await t.test('field-keyed maps, string arrays and encoded messages retain safe validation details',()=>{
  for(const raw of [
   {errors:{'recipient.number':['The field is required: PRIVATE NAME']}},
   {message:JSON.stringify({errors:[{propertyPath:'options.delivery_type',message:'Unsupported value PRIVATE'}]})},
   {errors:['recipient.postal_code is invalid: PRIVATE']},
  ]){const d=providerDiagnostic(422,raw);assert(d.providerFields.length>0);assert(d.providerMessages.length>0);assert(!JSON.stringify(d).includes('PRIVATE'));}
  const unknown=providerDiagnostic(422,{response:'PRIVATE'});assert.equal(unknown.providerMessages.length,1);assert(unknown.providerMessages[0].includes('niet vastgesteld'));
 });
 await t.test('422 is sanitized and durable; repeated POST never creates another shipment',async()=>{
  await clear();let posts=0;
  globalThis.fetch=async(_url,init)=>{if(init?.method==='POST'){posts++;return response({errors:[{code:3210,fields:[{field:'recipient.number',human:'Invalid value PRIVATE NAME'}]}]},422)}return response(noShipments)};
  const r=await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}));assert.equal(r.status,502);const p=await r.json();assert.equal(p.httpStatus,422);assert.deepEqual(p.providerFields,['recipient.number']);assert(!JSON.stringify(p).includes('PRIVATE'));
  assert.equal((await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))).status,409);assert.equal(posts,1);
 });
 await t.test('prior successful creation is reused; no POST is sent; label 200 without PDF URL is not available',async()=>{
  await clear();let posts=0;
  globalThis.fetch=async(url,init)=>{if(init?.method==='POST')posts++;return String(url).includes('shipment_labels')?response({data:{}}):response({data:{shipments:[{id:123,carrier_id:4,reference_identifier:TEST_REFERENCE,recipient:{cc:'BE',postal_code:'2990',street:'Theo Verellenlaan',number:'27'}}]}})};
  const r=await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}));const p=await r.json();assert.equal(r.status,200);assert.equal(p.shipmentId,'123');assert.equal(p.reused,true);assert.equal(p.labelAvailable,false);assert.equal(posts,0);
 });
 await t.test('concurrent requests create at most one shipment and verify documented label shape',async()=>{
  await clear();let posts=0;
  globalThis.fetch=async(url,init)=>{if(init?.method==='POST'){posts++;assert.deepEqual(JSON.parse(String(init.body)),testShipmentPayload());return response({data:{ids:[{id:456}]}})}return String(url).includes('shipment_labels')?response({data:{pdfs:{url:'https://api.sendmyparcel.be/pdfs/fixture'}}}):response(noShipments)};
  const results=await Promise.all([1,2].map(()=>shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))));
  assert.equal(posts,1);const bodies=await Promise.all(results.map(r=>r.json()));assert(bodies.some(p=>p.shipmentId==='456'&&p.labelAvailable===true));
  const persisted=await (await status(req('/api/admin/shipping/myparcel/test-label'))).json();assert.equal(persisted.labelAvailable,true);assert.equal(persisted.labelHttpStatus,200);
  const reused=await (await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))).json();assert.equal(reused.shipmentId,'456');assert.equal(posts,1);
 });
 await t.test('timeout after POST is uncertain and blocks retries, including a fresh DB connection',async()=>{
  await clear();let posts=0;
  globalThis.fetch=async(_url,init)=>{if(init?.method==='POST'){posts++;throw new DOMException('timeout','TimeoutError')}return response(noShipments)};
  assert.equal((await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))).status,502);
  await closeDatabase();assert.equal((await status(req('/api/admin/shipping/myparcel/test-label'))).status,200);
  assert.equal((await shipping(req('/api/admin/shipping/myparcel/test-label',{confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}))).status,409);assert.equal(posts,1);
 });
 await t.test('logout revokes the durable session',async()=>{assert.equal((await logout(req('/api/admin/logout',{}))).status,200);await assert.rejects(()=>requireAdmin(req('/admin')),/Sign in/);});
});
globalThis.fetch=originalFetch;await closeDatabase();
