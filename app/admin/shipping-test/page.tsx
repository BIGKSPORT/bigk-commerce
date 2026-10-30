'use client';
import {useEffect,useState,type FormEvent} from 'react';
type Result={created?:boolean;shipmentId?:string;labelAvailable?:boolean;notice?:string;error?:string;labelHttpStatus?:number;httpStatus?:number;state?:string;providerFields?:string[];providerCodes?:string[];providerMessages?:string[];diagnostic?:string};
export default function ShippingTestPage(){
 const [checked,setChecked]=useState(false);
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 const [needsLogin,setNeedsLogin]=useState(false);
 const [loaded,setLoaded]=useState(false);
 async function status(){
  try{const r=await fetch('/api/admin/shipping/myparcel/test-label',{cache:'no-store'});const p=await r.json();
   setNeedsLogin(r.status===401);if(r.ok&&p.state!=='not_started')setResult(p);else if(!r.ok&&r.status!==401)setResult(p);
  }catch{setResult({error:'Statuscontrole mislukt; maak geen nieuwe zending aan.'});}finally{setLoaded(true);}
 }
 useEffect(()=>{void status()},[]);
 async function login(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);const form=e.currentTarget;setResult(null);
  try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:new FormData(form).get('password')})});const p=await r.json();
   if(!r.ok){setResult(p);return;}form.reset();setNeedsLogin(false);await status();
  }catch{setResult({error:'Aanmelden mislukt. Probeer later opnieuw.'});}finally{setBusy(false);}
 }
 async function run(){
  if(!checked||busy||!loaded||needsLogin||result?.state)return;
  setBusy(true);setResult(null);setNeedsLogin(false);
  try{
   const res=await fetch('/api/admin/shipping/myparcel/test-label',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({confirmTestShipment:'CREATE_UNUSED_TEST_LABEL'}),
   });
   const payload=await res.json() as Result;
   if(res.status===401){setNeedsLogin(true);setResult({error:'Je bent nog niet aangemeld op deze preview. Meld je hieronder aan en open de DPD-test opnieuw.'});return;}
   setResult(res.ok?payload:{...payload,error:payload.diagnostic||payload.error||'Testlabel niet aangemaakt.'});
  }catch{setResult({error:'Verbinding mislukt. Controleer het verzendoverzicht in MyParcel voordat je opnieuw probeert.'});}
  finally{setBusy(false)}
 }
 return <main id="main" style={{maxWidth:720,margin:'50px auto',padding:24}}>
  <h1>BIG K ® — DPD-testlabel</h1>
  <p><strong>Alleen op de Vercel-preview, met adminlogin.</strong> Deze pagina maakt uitsluitend na bevestiging één DPD-testzending aan. Geen klantorder, e-mail of ophaling.</p>
  <p>Bestemming: <strong>BIGK BV, Theo Verellenlaan 27, 2990 Wuustwezel, België.</strong></p>
  <p>Referentie op label: BIGK-TEST-NIET-VERZENDEN.</p>
  <p>Zie je ‘Sign in to the admin area’? <a href="/admin">Meld je eerst aan via de backoffice</a> en open vervolgens deze pagina opnieuw.</p>
  <label style={{display:'block',margin:'20px 0'}}>
   <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>
   Ik bevestig dat het testlabel niet wordt afgegeven of gescand door een vervoerder.
  </label>
  <button type="button" disabled={!checked||busy||!loaded||needsLogin||!!result?.state} onClick={run}>
   {busy?'Bezig…':'Maak één DPD-testlabel aan'}
  </button>
  {needsLogin&&<form onSubmit={login}><h2>Veilig aanmelden</h2><label>Adminwachtwoord<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button disabled={busy}>Aanmelden</button></form>}
  <p><a href="/admin">Naar de backoffice</a> · <button type="button" disabled={busy} onClick={()=>void status()}>Status vernieuwen (maakt niets aan)</button></p>
  {result&&<section role="status" style={{marginTop:20,padding:16,border:'1px solid #aaa'}}>
   {result.error||!result.created?<><p>{result.error||result.notice||'Testpoging geregistreerd. Er wordt geen nieuwe zending aangemaakt.'}</p>{result.state&&<p>Status: {result.state}</p>}{result.httpStatus&&<p>MyParcel HTTP-status: {result.httpStatus}</p>}{!!result.providerFields?.length&&<p>Velden: {result.providerFields.join(', ')}</p>}{!!result.providerCodes?.length&&<p>Validatiecodes: {result.providerCodes.join(', ')}</p>}{!!result.providerMessages?.length&&<p>MyParcel foutomschrijving: {result.providerMessages.join(' | ')}</p>}</>:<>
    <p>Testzending aangemaakt: <strong>{result.shipmentId}</strong></p>
    <p>Label beschikbaar: {result.labelAvailable?'Ja':'Niet bevestigd'} (HTTP {result.labelHttpStatus})</p>
    <p>{result.notice}</p>
   </>}
  </section>}
 </main>;
}
