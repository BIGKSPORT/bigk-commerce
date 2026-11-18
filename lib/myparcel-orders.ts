import {z} from 'zod';
import {db,transaction,audit} from './db';
import {getOrder} from './commerce';
import {HttpError,hash} from './security';
import {providerDiagnostic} from './myparcel-test';
import type {Order} from './types';

const BASE='https://api.sendmyparcel.be';
import {isCheckoutCountry,isFlatRateInternationalCountry} from './shipping-policy';
function orderCarrier(country:string){return ['AT','ES','IT'].includes(country)?1:4;}
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validId=(v:unknown)=>/^[1-9][0-9]{0,15}$/.test(String(v))?String(v):null;
function recipientHash(value:Record<string,unknown>){return hash(JSON.stringify(['cc','postal_code','city','street','number','box_number','person'].map(key=>String(value[key]||'').trim().replace(/\s+/g,' ').toLowerCase())));}
export const orderLabelSchema=z.object({
 orderId:z.uuid(),street:z.string().trim().min(1).max(100),number:z.string().trim().min(1).max(20),
 boxNumber:z.string().trim().max(20).default(''),weightGrams:z.number().int().min(1).max(20000),
 confirmAddress:z.literal(true),
}).strict();
export type OrderLabelInput=z.infer<typeof orderLabelSchema>;
export const orderLabelReference=(id:string)=>'BIGK-ORDER-'+id;
export function splitShippingAddress(address:string){
 const match=address.trim().match(/^(.+?)\s+(\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?)$/);
 return {street:match?.[1]||address,number:match?.[2]||''};
}
export function orderLabelEnabled(){return process.env.MYPARCEL_ORDER_LABELS_ENABLED==='true';}
function configured(){return Boolean(process.env.MYPARCEL_BE_API_KEY);}
function guard(){
 if(!orderLabelEnabled())throw new HttpError(503,'Order labels are not enabled yet. Use Check connection first.');
 if(!configured())throw new HttpError(503,'MyParcel Belgium API access is not configured.');
 // A preview may never send real orders to a carrier.
 if(process.env.VERCEL_ENV==='preview')throw new HttpError(403,'Preview uses simulated carrier responses only.');
}
async function request(path:string,init:RequestInit={}){
 const key=process.env.MYPARCEL_BE_API_KEY;
 if(!key)throw new HttpError(503,'MyParcel Belgium API access is not configured.');
 return fetch(BASE+path,{...init,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000),headers:{
  Authorization:'bearer '+Buffer.from(key,'utf8').toString('base64'),'User-Agent':'CustomApiCall/2',
  Accept:'application/json;charset=utf-8',...init.headers,
 }});
}
async function readJson(response:Response):Promise<unknown>{
 const reader=response.body?.getReader();if(!reader)throw Error('Empty provider response');
 let bytes=0;const chunks:Uint8Array[]=[];
 try{while(true){const r=await reader.read();if(r.done)break;bytes+=r.value.byteLength;if(bytes>262144)throw Error('Provider response too large');chunks.push(r.value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 finally{await reader.cancel().catch(()=>{});}
}
function shipments(raw:unknown){const data=object(object(raw).data),search=object(data.search_results);return Array.isArray(data.shipments)?data.shipments:Array.isArray(search.shipments)?search.shipments:null;}
export async function checkMyParcelConnection(){
 if(!configured())return {configured:false,connected:false,enabled:orderLabelEnabled(),message:'MyParcel Belgium API access is not configured.'};
 try{
  const response=await request('/shipments?size=1'),raw=await readJson(response);
  const connected=response.status===200&&shipments(raw)!==null;
  return {configured:true,connected,enabled:orderLabelEnabled(),httpStatus:response.status,
   message:connected?'MyParcel authenticated successfully. No shipment or label was created.':response.status===401||response.status===403?'MyParcel rejected the API credentials.':'MyParcel did not return a valid authenticated shipment response.',
   ...(!connected?{diagnostic:providerDiagnostic(response.status,raw)}:{}),writesPerformed:false};
 }catch{return {configured:true,connected:false,enabled:orderLabelEnabled(),message:'MyParcel could not be reached or returned an unreadable response. No label was created.',writesPerformed:false};}
}
export function buildOrderShipment(order:Order,input:OrderLabelInput){
 if(order.status!=='paid')throw new HttpError(409,'Only paid orders can receive a shipping label.');
 if(order.withdrawals?.some(w=>w.status==='requested'))throw new HttpError(409,'Resolve the open withdrawal request before creating a label.');
 if(isFlatRateInternationalCountry(order.deliveryAddress.country))throw new HttpError(400,'Create this international label in MyParcel with the required customs details, then enter the tracking number here.');
 if(!isCheckoutCountry(order.deliveryAddress.country))throw new HttpError(400,'This destination is not enabled for webshop shipping.');
 return {data:{shipments:[{carrier:orderCarrier(order.deliveryAddress.country),reference_identifier:orderLabelReference(order.id),
  recipient:{cc:order.deliveryAddress.country,postal_code:order.deliveryAddress.postal,city:order.deliveryAddress.city,
   street:input.street,number:input.number,box_number:input.boxNumber,person:order.deliveryAddress.name},
  options:{package_type:1,delivery_type:2,label_description:'BIG K '+order.id.slice(0,8).toUpperCase()},
  physical_properties:{weight:input.weightGrams},
 }]}};
}
async function eligibleOrder(id:string){
 const order=await getOrder(id);if(!order)throw new HttpError(404,'Order not found.');
 return order;
}
async function save(reference:string,state:string,id:string|null,diagnostic:unknown={}){
 const previous=await db().prepare('SELECT diagnostic FROM shipping_test_attempts WHERE reference=?').get(reference);
 const saved=previous?.diagnostic?object(JSON.parse(String(previous.diagnostic))):{};
 await db().prepare('UPDATE shipping_test_attempts SET state=?,shipment_id=?,diagnostic=?,updated_at=? WHERE reference=?').run(state,id,JSON.stringify({...saved,...object(diagnostic)}),new Date().toISOString(),reference);
}
export async function orderLabelStatus(orderId:string){
 const order=await eligibleOrder(orderId);
 const row=await db().prepare('SELECT state,shipment_id,diagnostic FROM shipping_test_attempts WHERE reference=?').get(orderLabelReference(orderId));
 const info=object(row?.diagnostic?JSON.parse(String(row.diagnostic)):{});
 return {enabled:orderLabelEnabled(),configured:configured(),state:row?String(row.state):'not_started',
  shipmentId:row?.shipment_id?String(row.shipment_id):undefined,
  tracking:typeof info.tracking==='string'?info.tracking:undefined,
  trackingUrl:typeof info.trackingUrl==='string'?info.trackingUrl:undefined,
  diagnostic:info.diagnostic,canRetry:row?.state==='rejected'&&info.submitted===false,canCreate:order.status==='paid'&&!order.withdrawals?.some(w=>w.status==='requested'),
  address:splitShippingAddress(order.deliveryAddress.address)};
}
function shipmentDetails(raw:unknown,id:string){
 const all=shipments(raw);if(!all)throw Error('Invalid shipment response');
 const s=all.map(object).find(s=>validId(s.id)===id);if(!s)throw Error('Missing shipment');
 const tracking=typeof s.barcode==='string'&&/^[A-Za-z0-9 -]{3,100}$/.test(s.barcode)?s.barcode:undefined;
 const rawUrl=s.tracktrace_url;let trackingUrl: string|undefined;
 if(typeof rawUrl==='string'){try{const u=new URL(rawUrl);if(u.protocol==='https:'&&!u.username&&!u.password)trackingUrl=u.toString();}catch{}}
 return {tracking,trackingUrl};
}
export async function refreshOrderLabel(orderId:string){
 await eligibleOrder(orderId);
 const reference=orderLabelReference(orderId),row=await db().prepare('SELECT state,shipment_id,diagnostic FROM shipping_test_attempts WHERE reference=?').get(reference);
 if(!row)throw new HttpError(409,'No label request exists for this order.');
 const response=await request('/shipments?reference_identifier='+encodeURIComponent(reference)+'&size=100'),raw=await readJson(response);
 if(!response.ok)throw new HttpError(502,'MyParcel status check failed ('+response.status+'). Do not create another label.');
 const all=shipments(raw);if(!all)throw new HttpError(502,'MyParcel status response could not be verified.');
 const matches=all.map(object).filter(s=>s.reference_identifier===reference);
 if(matches.length!==1)throw new HttpError(409,matches.length?'Multiple carrier shipments use this order reference. Check MyParcel.':'No confirmed carrier shipment found yet. Creation stays blocked to avoid duplicates.');
 const id=validId(matches[0].id);
 if(!id||(row.shipment_id&&row.shipment_id!==id))throw new HttpError(409,'Carrier shipment identity does not match this order.');
 const order=await eligibleOrder(orderId),recipient=object(matches[0].recipient);
 if((matches[0].carrier_id??matches[0].carrier)!==orderCarrier(order.deliveryAddress.country)||recipient.cc!==order.deliveryAddress.country||String(recipient.postal_code)!==order.deliveryAddress.postal)throw new HttpError(409,'Carrier shipment destination does not match this order.');
 const expected=object(row.diagnostic?JSON.parse(String(row.diagnostic)):{}).recipientHash;
 if(!expected||recipientHash(recipient)!==expected)throw new HttpError(409,'Carrier address does not match the address reviewed for this label. Check MyParcel.');
 await save(reference,'created',id,shipmentDetails({data:{shipments:matches}},id));
 return orderLabelStatus(orderId);
}
export async function createOrderLabel(input:OrderLabelInput){
 guard();const reference=orderLabelReference(input.orderId);
 const payload=await transaction(async()=>{
  const order=await eligibleOrder(input.orderId),body=buildOrderShipment(order,input);
  const row=await db().prepare('SELECT state,diagnostic FROM shipping_test_attempts WHERE reference=?').get(reference);
  const prior=row?.diagnostic?object(JSON.parse(String(row.diagnostic))):{};
  if(row&&(row.state!=='rejected'||prior.submitted!==false))throw new HttpError(409,'A label request already exists. Refresh its status instead of creating another.');
  const diagnostic=JSON.stringify({recipientHash:recipientHash(body.data.shipments[0].recipient),submitted:false});
  if(row)await db().prepare("UPDATE shipping_test_attempts SET state='checking',diagnostic=?,updated_at=? WHERE reference=?").run(diagnostic,new Date().toISOString(),reference);
  else{
   const result=await db().prepare("INSERT INTO shipping_test_attempts(reference,state,diagnostic,updated_at) VALUES(?,'checking',?,?) ON CONFLICT(reference) DO NOTHING").run(reference,diagnostic,new Date().toISOString());
   if(!result.changes)throw new HttpError(409,'A label request already exists.');
  }
  await audit('shipping.label_requested',input.orderId);return body;
 });
 let submitted=false,id:string|null=null;
 try{
  // Search before creating; also recovers a shipment created by an earlier deployment.
  const prior=await request('/shipments?reference_identifier='+encodeURIComponent(reference)+'&size=100'),raw=await readJson(prior);
  const all=shipments(raw);
  if(!prior.ok||!all){await save(reference,'rejected',null,{diagnostic:providerDiagnostic(prior.status,raw)});throw new HttpError(502,'MyParcel preflight failed. No creation request was sent. Check connection.');}
  const matches=all.map(object).filter(s=>s.reference_identifier===reference);
  if(matches.length){await save(reference,'uncertain',null);return refreshOrderLabel(input.orderId);}
  // Recheck payment/withdrawal immediately before sending. Never auto-fulfil an order.
  buildOrderShipment(await eligibleOrder(input.orderId),input);
  await save(reference,'submitting',null,{submitted:true});submitted=true;
  const response=await request('/shipments',{method:'POST',headers:{'Content-Type':'application/vnd.shipment+json;charset=utf-8'},body:JSON.stringify(payload)});
  const result=await readJson(response);
  if(!response.ok){await save(reference,response.status>=500?'uncertain':'rejected',null,{diagnostic:providerDiagnostic(response.status,result)});throw new HttpError(502,'MyParcel did not confirm the label request. Refresh status; do not create a second label.');}
  const ids=object(object(result).data).ids;
  id=Array.isArray(ids)&&ids.length===1?validId(object(ids[0]).id):null;
  if(!id)throw Error('Invalid carrier ID');
  await save(reference,'created',id);await audit('shipping.label_created',input.orderId);
  return orderLabelStatus(input.orderId);
 }catch(error){
  if(!(error instanceof HttpError))await save(reference,submitted?'uncertain':'rejected',id).catch(()=>{});
  if(error instanceof HttpError)throw error;
  throw new HttpError(502,submitted?'Carrier response is uncertain. Refresh status; no automatic retry was sent.':'Carrier preflight could not finish. No creation request was sent.');
 }
}
export async function orderLabelPdf(orderId:string){
 await eligibleOrder(orderId);
 const row=await db().prepare('SELECT state,shipment_id FROM shipping_test_attempts WHERE reference=?').get(orderLabelReference(orderId));
 const id=validId(row?.shipment_id);
 if(row?.state!=='created'||!id)throw new HttpError(409,'No confirmed shipping label exists for this order.');
 const response=await request('/shipment_labels/'+id+'?format=A6'),raw=await readJson(response);
 const pdfs=object(object(object(raw).data).pdfs);let url:URL;
 try{url=new URL(String(pdfs.url));}catch{throw new HttpError(502,'MyParcel has not returned the label PDF yet. Refresh status.');}
 if(!response.ok||url.protocol!=='https:'||url.hostname!=='api.sendmyparcel.be'||!url.pathname.startsWith('/pdfs/')||url.username||url.password)throw new HttpError(502,'Carrier label URL could not be verified.');
 const pdf=await request(url.pathname+url.search);
 if(!pdf.ok||!pdf.headers.get('content-type')?.toLowerCase().includes('application/pdf'))throw new HttpError(502,'Carrier label PDF is not ready.');
 const reader=pdf.body?.getReader();if(!reader)throw new HttpError(502,'Empty carrier PDF');let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>5242880)throw new HttpError(502,'Carrier PDF is too large');chunks.push(r.value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=Buffer.concat(chunks);if(bytes.subarray(0,5).toString()!=='%PDF-')throw new HttpError(502,'Carrier did not return a PDF.');
 return bytes;
}
