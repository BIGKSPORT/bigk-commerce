import {z} from 'zod';
import {seller} from '@/lib/seller';
import {requireAdmin,checkOrigin,body,failure,HttpError,rateLimit} from '@/lib/security';
export const runtime='nodejs';
const schema=z.object({
 confirmTestShipment:z.literal('CREATE_UNUSED_TEST_LABEL'),
}).strict();
/**
 * Manual admin-only test. No e-mail or collection request is submitted.
 * Creates a DPD shipment, then requests its label URL. Do not ship/scan.
 */
export async function POST(req:Request){
 try{
  checkOrigin(req);
  await requireAdmin(req);
  await rateLimit('admin-myparcel-test-label',2,86400);
  if(process.env.VERCEL_ENV!=='preview'||process.env.COMMERCE_MODE==='live')
   throw new HttpError(403,'Testzendingen zijn alleen toegestaan in staging.');
  if(process.env.MYPARCEL_TEST_LABEL_ENABLED!=='true')
   throw new HttpError(403,'Testlabels zijn nog niet afzonderlijk ingeschakeld.');
  const p=schema.safeParse(await body(req));
  if(!p.success)throw new HttpError(400,'Bevestiging voor een testlabel vereist.');
  const key=process.env.MYPARCEL_BE_API_KEY;
  if(!key)throw new HttpError(503,'MyParcel API-sleutel niet ingesteld.');
  const headers={
   Authorization:'bearer '+Buffer.from(key,'utf8').toString('base64'),
   'User-Agent':'CustomApiCall/2',
  };
  const destination={cc:'BE',postal_code:seller.postal,city:seller.city,street:seller.address.replace(/\s+\d+$/, ''),number:seller.address.match(/\d+$/)?.[0]||'',box_number:'',person:seller.name};
  if(destination.postal_code!=='2990'||destination.city!=='Wuustwezel'||destination.street!=='Theo Verellenlaan'||destination.number!=='27')throw new HttpError(503,'Magazijnadres is gewijzigd; testlabel geblokkeerd.');
  const shipment={data:{shipments:[{
   carrier:4,
   recipient:destination,
   options:{package_type:1},
   reference_identifier:'BIGK-TEST-NIET-VERZENDEN',
  }]}};
  const control=new AbortController();
  const timeout=setTimeout(()=>control.abort(),12000);
  try{
   const response=await fetch('https://api.sendmyparcel.be/shipments',{
    method:'POST',cache:'no-store',signal:control.signal,
    headers:{...headers,'Content-Type':'application/vnd.shipment+json;charset=utf-8'},
    body:JSON.stringify(shipment),
   });
   if(!response.ok){
    // Only safe, bounded provider error codes and field paths; never echo external
    // text or responses, which may contain customer data or credentials.
    const raw=await response.text();
    let providerCodes:string[]=[];
    try{
      const parsed=JSON.parse(raw) as {errors?:unknown;error?:unknown};
      const errors=Array.isArray(parsed.errors)?parsed.errors:[parsed.error];
      providerCodes=errors.flatMap((entry):string[]=>{
        if(!entry||typeof entry!=='object')return [];
        const e=entry as Record<string,unknown>;
        return [e.code,e.field,e.property,e.parameter].filter(
          (v):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_.-]{1,72}$/.test(v)
        );
      }).slice(0,10);
    }catch{/* Unknown remote error format */}
    return Response.json({
      created:false,
      httpStatus:response.status,
      providerCodes,
      diagnostic:response.status===422
       ?'MyParcel keurt één of meer zendingsvelden af. Er is geen verzend-ID ontvangen.'
       :'MyParcel-aanvraag geweigerd; controleer API-toegang en zendingsvoorwaarden.',
      retrySafely:response.status===422,
    },{status:502,headers:{'Cache-Control':'no-store'}});
   }
   const json=await response.json() as {data?:{ids?:Array<{id?:number}>}};
   const id=json.data?.ids?.[0]?.id;
   if(!Number.isSafeInteger(id)||!id||id<1)
    throw new HttpError(502,'MyParcel gaf geen geldig verzend-ID terug. Controleer MyParcel dashboard.');
   const labelResponse=await fetch('https://api.sendmyparcel.be/shipment_labels/'+id,{
    method:'GET',cache:'no-store',signal:control.signal,
    headers:{...headers,Accept:'application/json'},
   });
   // Avoid returning unverified remote URLs to the frontend.
   return Response.json({
    created:true,shipmentId:String(id),
    labelAvailable:labelResponse.ok,labelHttpStatus:labelResponse.status,
    notice:'TESTZENDING. Niet afgeven, niet scannen. Er is geen klantmail of ophaling geboekt.',
    orderUpdated:false,customerNotified:false,pickupBooked:false,
   },{headers:{'Cache-Control':'no-store'}});
  }finally{clearTimeout(timeout)}
 }catch(e){return failure(e)}
}
