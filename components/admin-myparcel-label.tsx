'use client';
import {useEffect,useState} from 'react';
import type {AdminTransport} from './admin-types';
import type {Order} from '@/lib/types';
type LabelStatus={enabled:boolean;configured:boolean;state:string;canRetry?:boolean;shipmentId?:string;tracking?:string;trackingUrl?:string;canCreate:boolean;address:{street:string;number:string};diagnostic?:{providerFields?:string[];providerMessages?:string[]}};
const endpoint='/api/admin/shipping/myparcel/orders';
export function MyParcelConnection({transport}:{transport:AdminTransport}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function check(){setBusy(true);setMessage('');try{const r=await transport.request(endpoint);setMessage(r.message+(r.connected&&!r.enabled?' Order label creation is prepared but not enabled yet.':''));}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="bo-inline-actions"><button type="button" className="text-button" onClick={check} disabled={busy}>{busy?'Checking MyParcel…':'Check MyParcel connection'}</button>{message&&<p role="status">{message}</p>}</div>;
}
export default function AdminMyParcelLabel({order,transport,onTracking}:{order:Order;transport:AdminTransport;onTracking:(tracking:string,url:string)=>void}){
 const [status,setStatus]=useState<LabelStatus|null>(null),[street,setStreet]=useState(''),[number,setNumber]=useState(''),[box,setBox]=useState(''),[weight,setWeight]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;transport.request(endpoint+'?orderId='+encodeURIComponent(order.id)).then(r=>{if(active){setStatus(r);setStreet(r.address.street);setNumber(r.address.number);}}).catch(e=>{if(active)setError((e as Error).message)});return()=>{active=false}},[order.id,transport]);
 async function run(refresh=false){setBusy(true);setError('');try{
  const result=await transport.request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(refresh?{action:'refresh',orderId:order.id}:{orderId:order.id,street,number,boxNumber:box,weightGrams:Number(weight),confirmAddress:confirmed})});setStatus(result);if(result.tracking)onTracking(result.tracking,result.trackingUrl||'');
 }catch(e){setError((e as Error).message);try{setStatus(await transport.request(endpoint+'?orderId='+encodeURIComponent(order.id)))}catch{}}
 finally{setBusy(false)}}
 return <section className="bo-panel"><h3>DPD label through MyParcel</h3><p className="bo-hint">Create and print the label here. Tracking can then fill the dispatch form below. Creating a label does not mark the order shipped or send an email.</p>
  {error&&<p role="alert" className="error-message">{error}</p>}
  {!status&&!error&&<p role="status">Loading carrier settings…</p>}
  {status&&<>
   {(!status.configured||!status.enabled)&&<p className="info-message">{!status.configured?'MyParcel API access is not configured.':'Order label creation is not enabled yet.'}</p>}
   {status.state==='not_started'||status.canRetry?<>
    {status.canRetry&&<p>The previous connection check failed before any creation request was sent. Check the connection, then try again.</p>}
    <p>{order.deliveryAddress.name}<br/>{order.deliveryAddress.postal} {order.deliveryAddress.city} · {order.deliveryAddress.country}</p>
    <label className="field">Carrier street<input aria-label="Carrier street" value={street} onChange={e=>{setStreet(e.target.value);setConfirmed(false)}} maxLength={100}/></label>
    <label className="field">Carrier house number<input aria-label="Carrier house number" value={number} onChange={e=>{setNumber(e.target.value);setConfirmed(false)}} maxLength={20}/></label>
    <label className="field">Carrier box / apartment (optional)<input value={box} onChange={e=>{setBox(e.target.value);setConfirmed(false)}} maxLength={20}/></label>
    <label className="field">Measured parcel weight (grams)<input aria-label="Measured parcel weight (grams)" type="number" min={1} max={20000} step={1} value={weight} onChange={e=>setWeight(e.target.value)}/></label>
    <label className="newsletter-consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I checked the delivery address and measured this packed parcel.</label>
    <button type="button" className="button outline full" disabled={busy||!status.enabled||!status.configured||!status.canCreate||!confirmed||!street.trim()||!number.trim()||!Number.isInteger(Number(weight))||Number(weight)<1||Number(weight)>20000} onClick={()=>void run()}>{busy?'Creating label…':'Create DPD label'}</button>
   </>:<>
    <p role="status">Carrier request: {status.state}{status.shipmentId?' · Shipment '+status.shipmentId:''}</p>
    {status.state!=='created'&&<p>Creation is blocked to prevent duplicate labels. Refresh the existing request or check MyParcel using the order reference.</p>}
    <p className="bo-hint">Reference: BIGK-ORDER-{order.id}</p>
    {status.diagnostic?.providerFields?.length? <p>Check carrier fields: {status.diagnostic.providerFields.join(', ')}</p>:null}
    {status.diagnostic?.providerMessages?.map(message=><p key={message}>{message}</p>)}
    <button type="button" className="button outline" disabled={busy} onClick={()=>void run(true)}>Refresh carrier status / tracking</button>
    {status.state==='created'&&<p><a href={endpoint+'?orderId='+encodeURIComponent(order.id)+'&download=1'} target="_blank" rel="noreferrer">Open / print DPD label ↗</a></p>}
    {status.tracking&&<><p>Tracking: <strong>{status.tracking}</strong></p><button type="button" className="text-button" onClick={()=>onTracking(status.tracking!,status.trackingUrl||'')}>Use tracking in dispatch form</button></>}
   </>}
  </>}
 </section>;
}
