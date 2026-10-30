'use client';
import {useState,type FormEvent} from 'react';

type Task={
 orderId:string;createdAt:string;items:{variantId:string;name:string;size:string;quantity:number}[];
};
type Tasks={account:{name:string;role:string};picking:Task[];returns:{returnId:string;orderId:string;createdAt:string;items:Task['items']}[];readOnly:true;queueStatus:'unassigned_read_only'};
type InspectionResponse={status:'preview_only_not_saved';assessment:{disposition:string;issues:string[]};expected:{variantId:string;size:string;quantity:number}};
export default function WarehousePage(){
 const [id,setId]=useState(''),[password,setPassword]=useState(''),[data,setData]=useState<Tasks|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [inspect,setInspect]=useState<{returnId:string;variantId:string;size:string;quantity:number}|null>(null);
 const [result,setResult]=useState<InspectionResponse|null>(null);
 const [receiptMessage,setReceiptMessage]=useState('');
 async function load(){
  const res=await fetch('/api/warehouse/tasks',{cache:'no-store'});
  if(res.status===401||res.status===403){setData(null);throw new Error('Aanmelden als magazijnmedewerker is vereist.')}
  const payload=await res.json();
  if(!res.ok)throw new Error(payload.error||'Magazijntaken zijn niet beschikbaar.');
  setData(payload);
 }
 async function login(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const res=await fetch('/api/warehouse/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,password})});
   const response=await res.json();
   if(!res.ok)throw new Error(response.error||'Aanmelden mislukt.');
   setPassword('');await load();
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function inspectPreview(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!inspect)return;
  const submitted=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;
  const receive=submitted?.value==='receive';
  if(receive&&!result){setError('Controleer eerst de gegevens.');return;}
  setBusy(true);setError('');setReceiptMessage('');
  if(!receive)setResult(null);
  const fields=new FormData(e.currentTarget);
  if(receive&&fields.get('physicalConfirmed')!=='on'){
   setError('Bevestig de fysieke ontvangst.');setBusy(false);return;
  }
  try{
   const res=await fetch(receive?'/api/warehouse/returns/receive':'/api/warehouse/returns/inspect',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(receive?{
     requestKey:crypto.randomUUID(),returnId:inspect.returnId,variantId:inspect.variantId,
     scannedVariantId:String(fields.get('scannedVariantId')||''),
     scannedSize:String(fields.get('scannedSize')||''),
     receivedQuantity:Number(fields.get('receivedQuantity')),
     triedOnOnly:fields.get('triedOnOnly')==='on',damaged:fields.get('damaged')==='on',
     hygieneOrSafetyConcern:fields.get('hygieneOrSafetyConcern')==='on',
    }:{
     returnId:inspect.returnId,originalVariantId:inspect.variantId,
     scannedVariantId:String(fields.get('scannedVariantId')||''),
     scannedSize:String(fields.get('scannedSize')||''),
     receivedQuantity:Number(fields.get('receivedQuantity')),
     triedOnOnly:fields.get('triedOnOnly')==='on',
     damaged:fields.get('damaged')==='on',
     hygieneOrSafetyConcern:fields.get('hygieneOrSafetyConcern')==='on',
     photosTaken:fields.get('photosTaken')==='on',
    }),
   });
   const response=await res.json();
   if(!res.ok)throw new Error(response.error||'Inspectie niet mogelijk.');
   if(receive){
    setReceiptMessage('Ontvangst geregistreerd: '+response.receiptId+'. In wacht voor inspectie. Geen voorraadmutatie, refund of verzending.');
    setResult(null);
   }else setResult(response);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function logout(){
  await fetch('/api/warehouse/logout',{method:'POST'});
  setData(null);setPassword('');setId('');setResult(null);setReceiptMessage('');setInspect(null);setResult(null);
 }
 return <main id="main" style={{maxWidth:960,margin:'auto',padding:'4rem 1.25rem'}}>
  <h1>BIG K ® · Magazijn</h1>
  <p>Afgescheiden magazijnomgeving. Open, nog niet toegewezen taken — alleen lezen. Voorraad-, retour- en verzendacties zijn nog niet beschikbaar.</p>
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
  {!data?<form onSubmit={login} style={{display:'grid',gap:12,maxWidth:380}}>
   <label>Medewerker-ID<input required autoComplete="username" value={id} onChange={e=>setId(e.target.value)} /></label>
   <label>Wachtwoord<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
   <button type="submit" disabled={busy}>Aanmelden</button>
   <p>Individuele magazijnaccounts moeten eerst beveiligd ingesteld worden. Het adminwachtwoord geeft hier geen toegang.</p>
  </form>:<>
   <p>Ingelogd als <strong>{data.account.name}</strong> ({data.account.role})</p>
   <p><button type="button" onClick={()=>{setBusy(true);load().catch(e=>setError(e.message)).finally(()=>setBusy(false))}} disabled={busy}>Taken vernieuwen</button> <button type="button" onClick={logout}>Afmelden</button></p>
   <section><h2>Open bestellingen ({data.picking.length})</h2><p>Deze bestellingen zijn nog niet aan een medewerker toegewezen. Geen pakket verzenden vanaf dit scherm.</p>
    {data.picking.length===0?<p>Geen toegewezen picktaken.</p>:data.picking.map(t=><article key={t.orderId} style={{border:'1px solid #ddd',padding:16,marginBottom:12}}>
     <h3>Bestelling {t.orderId.slice(0,8)}</h3>
     <ul>{t.items.map((i,j)=><li key={i.variantId+'-'+j}>{i.quantity} × {i.name} · {i.size}</li>)}</ul>
    </article>)}
   </section>
   <section><h2>Open retouraanvragen ({data.returns.length})</h2><p>Een retouraanvraag betekent niet dat het artikel al fysiek ontvangen is.</p>
    {data.returns.length===0?<p>Geen open retourtaken.</p>:data.returns.map(t=><article key={t.returnId} style={{border:'1px solid #ddd',padding:16,marginBottom:12}}>
      <strong>Retour {t.returnId.slice(0,8)}</strong> · bestelling {t.orderId.slice(0,8)}<ul>{t.items.map((i,j)=><li key={i.variantId+'-'+j}>{i.quantity} × {i.name} · maat {i.size}{(data.account.role==='returns'||data.account.role==='lead')&&<> <button type="button" onClick={()=>{setInspect({returnId:t.returnId,variantId:i.variantId,size:i.size,quantity:i.quantity});setResult(null);setError('');setReceiptMessage('')}}>Controle voorbereiden</button></>}</li>)}</ul>
    </article>)}
   </section>
   {inspect&&<section style={{border:'2px solid #333',padding:20,margin:'24px 0'}}>
    <h2>Retourinspectie — voorbeeldcontrole</h2>
    <p><strong>Niet opgeslagen:</strong> deze controle registreert geen fysieke ontvangst, foto, voorraad of goedkeuring. Gebruik het uitsluitend om gegevens te vergelijken.</p>
    <p>Verwacht: maat {inspect.size}, aantal {inspect.quantity}, variant {inspect.variantId}.</p>
    <form key={inspect.returnId+inspect.variantId} onSubmit={inspectPreview} style={{display:'grid',gap:12,maxWidth:450}}>
     <label>Gescande variant-ID<input name="scannedVariantId" defaultValue={inspect.variantId} required /></label>
     <label>Gescande maat<input name="scannedSize" defaultValue={inspect.size} required /></label>
     <label>Ontvangen aantal<input name="receivedQuantity" type="number" min="0" max="100" defaultValue={inspect.quantity} required /></label>
     <label><input name="triedOnOnly" type="checkbox" defaultChecked /> Alleen gepast, geen verder gebruik vastgesteld</label>
     <label><input name="damaged" type="checkbox" /> Schade vastgesteld</label>
     <label><input name="hygieneOrSafetyConcern" type="checkbox" /> Hygiëne-/veiligheidsvraag</label>
     <label><input name="photosTaken" type="checkbox" /> Foto ter plaatse genomen (wordt hier niet opgeslagen)</label>
     <button type="submit" value="preview" disabled={busy}>Controleer gegevens (geen opslag)</button>
     {result&&<><p>Na de fysieke ontvangst kan de medewerker de gecontroleerde feiten vastleggen. Er gebeurt geen automatische vrijgave of voorraadwijziging.</p>
       <label><input type="checkbox" name="physicalConfirmed"/> Ik heb het artikel, de maat en het aantal fysiek gecontroleerd.</label>
       <button type="submit" value="receive" disabled={busy||result.assessment.disposition==='mismatch_investigation'}>Ontvangst registreren (in wacht)</button>
     </>}
    </form>
    {result&&<div role="status" style={{padding:12,border:'1px solid #ddd',marginTop:12}}>
     <strong>Voorlopige beoordeling: {result.assessment.disposition}</strong>
     <p>Geen goederenontvangst geregistreerd. Geen voorraadwijziging of verzendtoestemming.</p>
     {result.assessment.issues.length>0&&<ul>{result.assessment.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>}
    </div>}
    {receiptMessage&&<p role="status">{receiptMessage}</p>}
    <button type="button" onClick={()=>{setInspect(null);setResult(null);setReceiptMessage('')}}>Controle sluiten</button>
   </section>}
   <p>Verzendlabels, terugbetalingen en voorraadwijzigingen zijn in deze eerste versie uitgeschakeld.</p>
  </>}
 </main>
}
