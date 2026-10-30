import {z} from 'zod';
import {db} from './database';
import {HttpError} from './security';
export const TEST_REFERENCE='BIGK-TEST-NIET-VERZENDEN';
const BASE='https://api.sendmyparcel.be';
const idSchema=z.union([z.number().int().positive().safe(),z.string().regex(/^[1-9][0-9]{0,15}$/)]).transform(String);
const shipmentSchema=z.object({data:z.object({shipments:z.tuple([z.object({
 carrier:z.literal(4),
 recipient:z.object({cc:z.literal('BE'),postal_code:z.literal('2990'),city:z.literal('Wuustwezel'),street:z.literal('Theo Verellenlaan'),number:z.literal('27'),person:z.literal('BIGK BV')}).strict(),
 options:z.object({package_type:z.literal(1)}).strict(),
 reference_identifier:z.literal(TEST_REFERENCE),
}).strict()])}).strict()}).strict();
// Exact minimal domestic DPD payload from MyParcel Belgium's official example.
// No pickup/delivery extras, guessed weight, recipient email or notification flags.
export function testShipmentPayload(){return shipmentSchema.parse({data:{shipments:[{
 carrier:4,recipient:{cc:'BE',postal_code:'2990',city:'Wuustwezel',street:'Theo Verellenlaan',number:'27',person:'BIGK BV'},
 options:{package_type:1},reference_identifier:TEST_REFERENCE,
}]}})}
export type Diagnostic={httpStatus:number;providerCodes:string[];providerMessages:string[];providerFields:string[]};
export function providerDiagnostic(status:number,raw:unknown):Diagnostic{
 const codes=new Set<string>(),fields=new Set<string>(),messages=new Set<string>();
 // Never return arbitrary provider prose: it can quote addresses, API keys or PII.
 // Read only code/field keys and translate a closed set of validation rules.
 const rules:[RegExp,string][]=[[/required|mandatory|verplicht|must not be empty|cannot be empty/i,'Verplicht veld ontbreekt.'],[/not supported|unsupported|not allowed|niet ondersteund/i,'Veld of optie wordt niet ondersteund.'],[/invalid|not valid|ongeldig/i,'Veldwaarde is ongeldig.'],[/not found|unknown|not exist/i,'Instelling of optie is niet gevonden.'],[/maximum|too long|max length/i,'Veld overschrijdt de toegestane lengte.']];
 const fieldNames=new Set(['data','shipments','shipment','recipient','options','physical_properties','carrier','carrier_id','shop_id','account_id','cc','postal_code','city','street','number','box_number','person','company','phone','email','package_type','delivery_type','weight','height','width','length','reference_identifier','sender']);
 function field(value:string){
  const parts=value.replace(/\[/g,'.').replace(/\]/g,'').split('.').filter(Boolean);
  if(parts.length&&parts.length<=12&&parts.every(p=>fieldNames.has(p)||/^\d{1,4}$/.test(p)))fields.add(value.slice(0,140));
 }
 let visited=0;
 function walk(v:unknown,depth=0,context=''){
  if(depth>10||visited++>300)return;
  if(typeof v==='string'){
   // Some APIs return arrays of strings or JSON encoded inside `message`.
   if(!/error|message|human|detail|description|title|field|property|parameter|attribute|violation/i.test(context))return;
   const text=v.slice(0,12000);
   if(/^[\s]*[\[{]/.test(text)){try{walk(JSON.parse(text),depth+1,context)}catch{}}
   if(/field|property|parameter|attribute|path/i.test(context))field(text);
   for(const match of text.matchAll(/\b(?:data\.)?(?:shipments?(?:\[\d+\]|\.\d+)?\.)?(?:recipient|options|physical_properties)\.[a-z_]+\b/g))field(match[0]);
   for(const [pattern,label] of rules)if(pattern.test(text)){messages.add(label);break;}
   return;
  }
  if(!v||typeof v!=='object')return;
  if(Array.isArray(v)){v.slice(0,12).forEach(e=>walk(e,depth+1,context));return;}
  for(const [k,x] of Object.entries(v).slice(0,30)){
   if(/^(code|error_code|errorCode)$/.test(k)&&(typeof x==='number'||typeof x==='string')&&/^[A-Z_0-9.-]{1,40}$/i.test(String(x))&&!Object.entries(process.env).some(([name,secret])=>/KEY|TOKEN|PASSWORD/.test(name)&&secret&&String(x)===secret))codes.add(String(x));
   // Field-keyed maps (including errors[field] -> string[]) are also common.
   if(/error|field|violation/i.test(context))field(k);
   walk(x,depth+1,context+'.'+k);
  }
 }
 walk(raw);
 if(!codes.size&&!fields.size&&!messages.size)messages.add('MyParcel gaf geen herkenbare validatiedetails; de oorzaak is nog niet vastgesteld.');
 return {httpStatus:status,providerCodes:[...codes].slice(0,8),providerMessages:[...messages].slice(0,6),providerFields:[...fields].slice(0,8)};
}
function headers(){const key=process.env.MYPARCEL_BE_API_KEY;if(!key)throw new HttpError(503,'MyParcel API-sleutel niet ingesteld.');return {Authorization:'bearer '+Buffer.from(key,'utf8').toString('base64'),'User-Agent':'CustomApiCall/2',Accept:'application/json;charset=utf-8'}}
async function request(path:string,init:RequestInit={}){
 return fetch(BASE+path,{...init,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000),headers:{...headers(),...init.headers}});
}
async function json(response:Response):Promise<unknown>{
 const reader=response.body?.getReader();if(!reader)throw Error('Empty provider response');let n=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>262144)throw Error('Provider response too large');chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}finally{await reader.cancel().catch(()=>{});}
}
function object(v:unknown):Record<string,unknown>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}}
function validId(v:unknown){const r=idSchema.safeParse(v);return r.success?r.data:null;}
export async function labelStatus(id:string){
 if(!validId(id))throw new HttpError(502,'Ongeldig verzend-ID.');
 try{
  const response=await request('/shipment_labels/'+id);
  if(!response.ok){await response.body?.cancel();return {labelAvailable:false,labelHttpStatus:response.status};}
  const root=object(await json(response)),data=object(root.data),pdfs=object(data.pdfs);
  // 200 alone is not proof. Only accept the documented PDF URL response shape.
  let available=false;
  if(typeof pdfs.url==='string'){try{const url=new URL(pdfs.url);available=url.protocol==='https:'&&url.hostname==='api.sendmyparcel.be'&&url.pathname.startsWith('/pdfs/')&&!url.username&&!url.password;}catch{}}
  return {labelAvailable:available,labelHttpStatus:response.status};
 }catch{return {labelAvailable:false,labelHttpStatus:null};}
}
async function previousShipment(){
 const response=await request('/shipments?reference_identifier='+encodeURIComponent(TEST_REFERENCE)+'&size=100');
 const root=await json(response);
 if(!response.ok)return {error:providerDiagnostic(response.status,root)};
 const data=object(object(root).data),search=object(data.search_results);
 const shipments=Array.isArray(data.shipments)?data.shipments:Array.isArray(search.shipments)?search.shipments:null;
 if(!shipments)return {error:providerDiagnostic(502,{})};
 const matches=shipments.map(object).filter(s=>s.reference_identifier===TEST_REFERENCE);
 if(matches.length>1)throw new HttpError(409,'Meerdere bestaande testzendingen gevonden. Nieuwe creatie geblokkeerd.');
 if(!matches.length)return {id:null};
 const s=matches[0],r=object(s.recipient);
 // Fail closed if this reference was used for a different carrier/destination.
 if((s.carrier_id??s.carrier)!==4||r.cc!=='BE'||String(r.postal_code)!=='2990'||r.street!=='Theo Verellenlaan'||String(r.number)!=='27')throw new HttpError(409,'Bestaande referentie wijkt af. Nieuwe creatie geblokkeerd.');
 const id=validId(s.id);if(!id)throw new HttpError(502,'Bestaande zending heeft geen geldig ID.');return {id};
}
export function testGuard(){
 if(process.env.VERCEL_ENV!=='preview'||process.env.DATABASE_PROVIDER!=='postgres'||process.env.DATABASE_SCHEMA!=='bigk_staging'||process.env.COMMERCE_MODE==='live')throw new HttpError(403,'Testzendingen vereisen duurzame geïsoleerde staging.');
 if(process.env.MYPARCEL_TEST_LABEL_ENABLED!=='true')throw new HttpError(403,'Testlabels zijn niet ingeschakeld.');
}
export async function testStatus(){
 const row=await db().prepare('SELECT state,shipment_id,diagnostic FROM shipping_test_attempts WHERE reference=?').get(TEST_REFERENCE);
 if(!row)return {created:false,state:'not_started'};
 const diagnostic=row.diagnostic?JSON.parse(String(row.diagnostic)):{};
 return {created:row.state==='created',state:String(row.state),shipmentId:row.shipment_id?String(row.shipment_id):undefined,...diagnostic};
}
export async function runTestShipment(){
 testGuard();const payload=testShipmentPayload();headers();
 // Atomic once-only claim is durable across deployments and concurrent instances.
 const claimed=await db().prepare("INSERT INTO shipping_test_attempts(reference,state,updated_at) VALUES(?,'checking',?) ON CONFLICT(reference) DO NOTHING").run(TEST_REFERENCE,new Date().toISOString());
 if(!claimed.changes){const result=await testStatus();if(result.created&&result.shipmentId)return {...result,...await labelStatus(result.shipmentId),reused:true};throw new HttpError(409,'Er bestaat al een testpoging. Statuscontrole vereist; er wordt geen tweede zending aangemaakt.');}
 let submitted=false;
 try{
  const prior=await previousShipment();
  if(prior.error){await save('rejected',null,prior.error);return {created:false,state:'rejected',...prior.error,diagnostic:'Voorafgaande controle geweigerd; er is niets aangemaakt.'};}
  let id=prior.id;
  if(!id){
   await save('submitting',null);submitted=true;
   // Never retry this POST: timeout/5xx may mean creation succeeded remotely.
   const response=await request('/shipments',{method:'POST',headers:{'Content-Type':'application/vnd.shipment+json;charset=utf-8'},body:JSON.stringify(payload)});
   const raw=await json(response);
   if(!response.ok){const diagnostic=providerDiagnostic(response.status,raw);const state=response.status>=500?'uncertain':'rejected';await save(state,null,diagnostic);return {created:false,state,...diagnostic,diagnostic:'MyParcel heeft de aanvraag niet bevestigd. Nieuwe creatie is geblokkeerd.'};}
   const ids=object(object(raw).data).ids;id=Array.isArray(ids)&&ids.length===1?validId(object(ids[0]).id):null;
   if(!id)throw Error('Invalid shipment ID');
  }
  await save('created',id);
  const label=await labelStatus(id);
  await save('created',id,label);
  return {created:true,state:'created',shipmentId:id,reused:!submitted,...label,notice:'Niet afgeven of scannen. Geen klantmail, ophaling of orderwijziging.',orderUpdated:false,customerNotified:false,pickupBooked:false};
 }catch(error){
  await save('uncertain',null).catch(()=>{});
  if(error instanceof HttpError)throw error;
  throw new HttpError(502,submitted?'MyParcel-resultaat is onzeker. Nieuwe creatie geblokkeerd; controleer de bestaande referentie.':'Voorafgaande MyParcel-controle mislukt. Er is geen creatieverzoek verstuurd.');
 }
}
async function save(state:string,id:string|null,diagnostic?:Diagnostic|{labelAvailable:boolean;labelHttpStatus:number|null}){await db().prepare('UPDATE shipping_test_attempts SET state=?,shipment_id=?,diagnostic=?,updated_at=? WHERE reference=?').run(state,id,diagnostic?JSON.stringify(diagnostic):null,new Date().toISOString(),TEST_REFERENCE);}
