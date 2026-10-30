/**
 * BIG K ® / MyParcel Belgium read-only shipment cost reconciliation.
 * Never creates shipments, fetches labels, or invokes billable methods.
 * API key belongs in a server-only environment variable, not source code.
 */
export type MyParcelCost = {
  shipmentId: string;
  carrierId: number | null;
  destinationCountry: string | null;
  chargedCents: number | null;
  currency: string | null;
  shipmentStatus: number | null;
};
/** Converts provider responses to minimal accounting fields; strips PII. */
export function parseMyParcelCosts(data: unknown): MyParcelCost[] {
  if (!data || typeof data !== 'object') return [];
  const root=data as Record<string, unknown>;
  const nested=root.data && typeof root.data==='object'
    ? root.data as Record<string, unknown> : {};
  const sr=nested.search_results && typeof nested.search_results==='object'
    ? nested.search_results as Record<string, unknown> : {};
  const shipments=Array.isArray(nested.shipments) ? nested.shipments
    : Array.isArray(sr.shipments) ? sr.shipments : [];
  return shipments.flatMap((value: unknown) => {
    if (!value || typeof value!=='object') return [];
    const s=value as Record<string, unknown>;
    const id=s.id;
    if (!(typeof id==='number' && Number.isSafeInteger(id) && id>0)
      && !(typeof id==='string' && /^\d+$/.test(id))) return [];
    const p=s.price && typeof s.price==='object'
      ? s.price as Record<string,unknown> : {};
    const recipient=s.recipient && typeof s.recipient==='object'
      ? s.recipient as Record<string,unknown> : {};
    const amount=p.amount;
    return [{
      shipmentId:String(id),
      carrierId:typeof s.carrier_id==='number' && Number.isSafeInteger(s.carrier_id)
        ? s.carrier_id : null,
      destinationCountry:typeof recipient.cc==='string' && /^[A-Z]{2}$/i.test(recipient.cc)
        ? recipient.cc.toUpperCase() : null,
      chargedCents:typeof amount==='number' && Number.isSafeInteger(amount) && amount>=0
        ? amount : null,
      currency:typeof p.currency==='string' && /^[A-Z]{3}$/.test(p.currency)
        ? p.currency : null,
      shipmentStatus:typeof s.status==='number' && Number.isSafeInteger(s.status)
        ? s.status : null,
    }];
  });
}
export async function readMyParcelCost(shipmentId:string):Promise<MyParcelCost[]> {
  if(!/^\d{1,16}$/.test(shipmentId)) throw new Error('Invalid MyParcel shipment ID.');
  const apiKey=process.env.MYPARCEL_BE_API_KEY;
  if(!apiKey) throw new Error('MyParcel Belgium access is not configured.');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try {
    const response=await fetch('https://api.sendmyparcel.be/shipments/'+shipmentId,{
      method:'GET',
      headers:{
        Authorization:'bearer '+Buffer.from(apiKey,'utf8').toString('base64'),
        'User-Agent':'BIG-K-Commerce/0.2.0 Node/24',
        Accept:'application/json',
      },
      cache:'no-store',
      signal:controller.signal,
    });
    if(!response.ok) throw new Error('MyParcel read-only query failed ('+response.status+').');
    return parseMyParcelCosts(await response.json());
  } finally {clearTimeout(timeout)}
}
