import {requireAdmin,rateLimit,failure,HttpError} from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
/** Safe MyParcel BE API connectivity probe. Never writes, labels or returns customer data. */
export async function GET(req:Request){
 try {
  await requireAdmin(req);
  await rateLimit('admin-myparcel-connection-test',5,300);
  const key=process.env.MYPARCEL_BE_API_KEY;
  if(!key)throw new HttpError(503,'MyParcel Belgium API key is not configured.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try {
   const res=await fetch('https://api.sendmyparcel.be/shipments/0',{
    method:'GET',cache:'no-store',signal:controller.signal,
    headers:{
     Authorization:'bearer '+Buffer.from(key,'utf8').toString('base64'),
     'User-Agent':'BIG-K-Commerce/0.2.0',
     Accept:'application/json',
    },
   });
   // A missing shipment can return 404 or 422 even with valid credentials.
   const authenticated=res.status===200||res.status===404||res.status===422;
   return Response.json({
    connected:authenticated,
    httpStatus:res.status,
    result:authenticated?'API bereikbaar; autorisatie vereist bevestiging met een bestaande zending.':
      res.status===401||res.status===403?'API-authenticatie geweigerd.':'API bereikbaar, respons moet gecontroleerd worden.',
    writesPerformed:false,labelCreated:false,invoiceGenerated:false
   },{headers:{'Cache-Control':'no-store'}});
  }finally{clearTimeout(timer)}
 }catch(e){return failure(e)}
}
