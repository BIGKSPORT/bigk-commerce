'use client';
import {useState} from 'react';
type Result={created?:boolean;shipmentId?:string;labelAvailable?:boolean;notice?:string;error?:string;labelHttpStatus?:number};
export default function ShippingTestPage(){
 const [checked,setChecked]=useState(false);
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 async function run(){
  if(!checked||busy)return;
  setBusy(true);setResult(null);
  try{
   const res=await fetch('/api/admin/shipping/myparcel/test-label',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}),
   });
   const payload=await res.json() as Result;
   setResult(res.ok?payload:{error:payload.error||'Testlabel niet aangemaakt.'});
  }catch{setResult({error:'Verbinding mislukt. Controleer het verzendoverzicht in MyParcel voordat je opnieuw probeert.'});}
  finally{setBusy(false)}
 }
 return <main id="main" style={{maxWidth:720,margin:'50px auto',padding:24}}>
  <h1>BIG K ® — DPD-testlabel</h1>
  <p><strong>Alleen op de Vercel-preview, met adminlogin.</strong> Deze pagina maakt uitsluitend na bevestiging één DPD-testzending aan. Geen klantorder, e-mail of ophaling.</p>
  <p>Bestemming: <strong>BIGK BV, Theo Verellenlaan 27, 2990 Wuustwezel, België.</strong></p>
  <p>Referentie op label: BIGK-TEST-NIET-VERZENDEN.</p>
  <label style={{display:'block',margin:'20px 0'}}>
   <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>
   Ik bevestig dat het testlabel niet wordt afgegeven of gescand door een vervoerder.
  </label>
  <button type="button" disabled={!checked||busy||!!result?.created} onClick={run}>
   {busy?'Bezig…':'Maak één DPD-testlabel aan'}
  </button>
  {result&&<section role="status" style={{marginTop:20,padding:16,border:'1px solid #aaa'}}>
   {result.error?<p>{result.error}</p>:<>
    <p>Testzending aangemaakt: <strong>{result.shipmentId}</strong></p>
    <p>Label beschikbaar: {result.labelAvailable?'Ja':'Nog niet'} (HTTP {result.labelHttpStatus})</p>
    <p>{result.notice}</p>
   </>}
  </section>}
 </main>;
}
