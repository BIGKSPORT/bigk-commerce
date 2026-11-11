import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {db,closeDatabase} from '../lib/database';
import {createOrder,getOrder} from '../lib/commerce';
import {orderLabelSchema,buildOrderShipment,splitShippingAddress,checkMyParcelConnection,createOrderLabel,orderLabelStatus,refreshOrderLabel,orderLabelPdf,orderLabelReference} from '../lib/myparcel-orders';
import {GET,POST} from '../app/api/admin/shipping/myparcel/orders/route';
const dir=mkdtempSync(join(tmpdir(),'bigk-labels-'));
process.env.DATABASE_PROVIDER='sqlite';process.env.DATABASE_PATH=join(dir,'labels.sqlite');process.env.COMMERCE_MODE='demo';
process.env.MYPARCEL_BE_API_KEY='fixture-not-a-real-key';process.env.MYPARCEL_ORDER_LABELS_ENABLED='true';process.env.APP_URL='https://shop.example';delete process.env.VERCEL_ENV;
const originalFetch=globalThis.fetch;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
let orderId='';
const input=()=>orderLabelSchema.parse({orderId,street:'Example Street',number:'12',boxNumber:'',weightGrams:750,confirmAddress:true});
const shipment=()=>({id:123,carrier_id:4,reference_identifier:orderLabelReference(orderId),recipient:{cc:'BE',postal_code:'2990',city:'Wuustwezel',street:'Example Street',number:'12',box_number:'',person:'Fixture Only'},barcode:'TEST123456',tracktrace_url:'https://tracking.dpd.be/TEST123456'});
async function clear(){await db().prepare('DELETE FROM shipping_test_attempts WHERE reference=?').run(orderLabelReference(orderId));}
try{
 await test('MyParcel paid-order label workflow',async t=>{
  const created=await createOrder({items:[{variantId:'P001-0',quantity:1}],email:'fixture@example.com',phone:'+32470123456',firstName:'Fixture',lastName:'Only',country:'BE',address:'Example Street 12',postal:'2990',city:'Wuustwezel',consent:true,requestKey:crypto.randomUUID()});orderId=created.id;
  await t.test('only paid orders and supported destinations with reviewed parcel data',async()=>{
   const order=(await getOrder(orderId))!;assert.throws(()=>buildOrderShipment(order,input()),/Only paid/);
   await db().prepare("UPDATE orders SET status='paid' WHERE id=?").run(orderId);
   const paid=(await getOrder(orderId))!;
   assert.throws(()=>buildOrderShipment({...paid,withdrawals:[{id:'w',status:'requested',createdAt:'',items:[]}]},input()),/withdrawal/);
   assert.throws(()=>buildOrderShipment({...paid,deliveryAddress:{...paid.deliveryAddress,country:'US'}},input()),/destination/);
   assert(!orderLabelSchema.safeParse({...input(),weightGrams:0}).success);assert(!orderLabelSchema.safeParse({...input(),confirmAddress:false}).success);
   assert.deepEqual(splitShippingAddress('Example Street 12'),{street:'Example Street',number:'12'});
   assert.equal(splitShippingAddress('12 Example Street').number,'');
   const payload=buildOrderShipment(paid,input()).data.shipments[0];assert.equal(payload.carrier,4);assert.equal(payload.options.package_type,1);assert.equal(payload.physical_properties.weight,750);assert(!('email' in payload.recipient));assert(!('phone' in payload.recipient));
  });
  await t.test('a 422 or malformed 200 never claims an authenticated connection',async()=>{
   for(const status of [401,403,404,422]){globalThis.fetch=async()=>json({errors:['private address must not be exposed']},status);const result=await checkMyParcelConnection();assert.equal(result.connected,false);assert(!JSON.stringify(result).includes('private address'));}
   globalThis.fetch=async()=>json({data:{}});assert.equal((await checkMyParcelConnection()).connected,false);
   globalThis.fetch=async()=>json({data:{shipments:[{recipient:{person:'Private customer'}}]}});const result=await checkMyParcelConnection();assert.equal(result.connected,true);assert(!JSON.stringify(result).includes('Private customer'));
  });
  await t.test('feature disabled and previews block creation before any carrier request',async()=>{
   let calls=0;globalThis.fetch=async()=>{calls++;return json({})};process.env.MYPARCEL_ORDER_LABELS_ENABLED='false';await assert.rejects(()=>createOrderLabel(input()),/not enabled/);process.env.MYPARCEL_ORDER_LABELS_ENABLED='true';process.env.VERCEL_ENV='preview';await assert.rejects(()=>createOrderLabel(input()),/Preview/);delete process.env.VERCEL_ENV;assert.equal(calls,0);
  });
  await t.test('concurrent clicks create one shipment; order, stock and email remain untouched',async()=>{
   await clear();let posts=0;const before=await db().prepare('SELECT count(*) n FROM email_outbox').get();const stock=await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get('P001-0');
   globalThis.fetch=async(_url,init)=>{if(init?.method==='POST'){posts++;assert.equal(JSON.parse(String(init.body)).data.shipments[0].reference_identifier,orderLabelReference(orderId));return json({data:{ids:[{id:123}]}})}return json({data:{shipments:[]}})};
   const results=await Promise.allSettled([createOrderLabel(input()),createOrderLabel(input())]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(posts,1);
   assert.equal((await orderLabelStatus(orderId)).shipmentId,'123');assert.equal((await getOrder(orderId))!.status,'paid');assert.deepEqual(await db().prepare('SELECT count(*) n FROM email_outbox').get(),before);assert.deepEqual(await db().prepare('SELECT stock,reserved FROM variants WHERE id=?').get('P001-0'),stock);
   await assert.rejects(()=>createOrderLabel(input()),/already exists/);assert.equal(posts,1);
  });
  await t.test('refresh reuses identity and tracking, but mismatched destinations fail closed',async()=>{
   globalThis.fetch=async()=>json({data:{shipments:[{...shipment(),recipient:{cc:'BE',postal_code:'WRONG'}}]}});await assert.rejects(()=>refreshOrderLabel(orderId),/destination/);
   globalThis.fetch=async()=>json({data:{shipments:[shipment()]}});const result=await refreshOrderLabel(orderId);assert.equal(result.tracking,'TEST123456');assert.equal(result.state,'created');
   globalThis.fetch=async()=>json({data:{shipments:[{...shipment(),recipient:{...shipment().recipient,street:'Other Street'}}]}});await assert.rejects(()=>refreshOrderLabel(orderId),/address does not match/);
  });
  await t.test('PDF is authenticated, size-limited and downloaded only from the carrier origin',async()=>{
   const calls:string[]=[];globalThis.fetch=async url=>{calls.push(String(url));return String(url).includes('/shipment_labels/')?json({data:{pdfs:{url:'https://api.sendmyparcel.be/pdfs/fixture'}}}):new Response('%PDF-1.7 fixture',{headers:{'Content-Type':'application/pdf'}})};
   assert.match((await orderLabelPdf(orderId)).toString(),/^%PDF-/);assert.equal(calls.length,2);
   globalThis.fetch=async()=>json({data:{pdfs:{url:'https://evil.example/private'}}});await assert.rejects(()=>orderLabelPdf(orderId),/verified/);
  });
  await t.test('timeout after POST stays uncertain and never automatically sends a second POST',async()=>{
   await clear();let posts=0;globalThis.fetch=async(_url,init)=>{if(init?.method==='POST'){posts++;throw Error('timeout')}return json({data:{shipments:[]}})};
   await assert.rejects(()=>createOrderLabel(input()),/uncertain/);assert.equal((await orderLabelStatus(orderId)).state,'uncertain');await assert.rejects(()=>createOrderLabel(input()),/already exists/);assert.equal(posts,1);
   globalThis.fetch=async()=>json({data:{shipments:[shipment()]}});assert.equal((await refreshOrderLabel(orderId)).shipmentId,'123');
  });
  await t.test('failed preflight sends no creation request and keeps safe provider validation details',async()=>{
   await clear();let posts=0;globalThis.fetch=async(_url,init)=>{if(init?.method==='POST')posts++;return json({errors:[{field:'recipient.number',message:'Invalid private address'}]},422)};
   await assert.rejects(()=>createOrderLabel(input()),/preflight failed/);assert.equal(posts,0);const s=await orderLabelStatus(orderId);assert.equal(s.state,'rejected');assert.equal(s.canRetry,true);assert(!JSON.stringify(s.diagnostic).includes('private address'));
   globalThis.fetch=async(_url,init)=>{if(init?.method==='POST'){posts++;return json({data:{ids:[{id:123}]}})}return json({data:{shipments:[]}})};
   assert.equal((await createOrderLabel(input())).state,'created');assert.equal(posts,1);
  });
  await t.test('carrier routes require an admin session and reject hostile origins',async()=>{
   assert.equal((await GET(new Request('https://shop.example/api/admin/shipping/myparcel/orders'))).status,401);
   assert.equal((await POST(new Request('https://shop.example/api/admin/shipping/myparcel/orders',{method:'POST',headers:{origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify(input())}))).status,403);
  });
 });
}finally{globalThis.fetch=originalFetch;await closeDatabase();rmSync(dir,{recursive:true,force:true});}
