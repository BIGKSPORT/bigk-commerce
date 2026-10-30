'use client';
import {useState,type FormEvent} from 'react';

type Task={
 orderId:string;createdAt:string;items:{variantId:string;name:string;size:string;quantity:number}[];
};
type Tasks={account:{name:string;role:string};picking:Task[];returns:{returnId:string;orderId:string;createdAt:string}[];readOnly:true};
export default function WarehousePage(){
 const [id,setId]=useState(''),[password,setPassword]=useState(''),[data,setData]=useState<Tasks|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
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
 async function logout(){
  await fetch('/api/warehouse/logout',{method:'POST'});
  setData(null);setPassword('');setId('');
 }
 return <main id="main" style={{maxWidth:960,margin:'auto',padding:'4rem 1.25rem'}}>
  <h1>BIG K ® · Magazijn</h1>
  <p>Afgescheiden magazijnomgeving. Alleen lezen zolang de fysieke voorraad- en retourregistratie nog niet is vrijgegeven.</p>
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
  {!data?<form onSubmit={login} style={{display:'grid',gap:12,maxWidth:380}}>
   <label>Medewerker-ID<input required autoComplete="username" value={id} onChange={e=>setId(e.target.value)} /></label>
   <label>Wachtwoord<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
   <button type="submit" disabled={busy}>Aanmelden</button>
   <p>Individuele magazijnaccounts moeten eerst beveiligd ingesteld worden. Het adminwachtwoord geeft hier geen toegang.</p>
  </form>:<>
   <p>Ingelogd als <strong>{data.account.name}</strong> ({data.account.role})</p>
   <p><button type="button" onClick={()=>{setBusy(true);load().catch(e=>setError(e.message)).finally(()=>setBusy(false))}} disabled={busy}>Taken vernieuwen</button> <button type="button" onClick={logout}>Afmelden</button></p>
   <section><h2>Bestellingen verzamelen ({data.picking.length})</h2>
    {data.picking.length===0?<p>Geen toegewezen picktaken.</p>:data.picking.map(t=><article key={t.orderId} style={{border:'1px solid #ddd',padding:16,marginBottom:12}}>
     <h3>Bestelling {t.orderId.slice(0,8)}</h3>
     <ul>{t.items.map((i,j)=><li key={i.variantId+'-'+j}>{i.quantity} × {i.name} · {i.size}</li>)}</ul>
    </article>)}
   </section>
   <section><h2>Retours beoordelen ({data.returns.length})</h2>
    {data.returns.length===0?<p>Geen open retourtaken.</p>:data.returns.map(t=><article key={t.returnId} style={{border:'1px solid #ddd',padding:16,marginBottom:12}}>
      Retour {t.returnId.slice(0,8)} · bestelling {t.orderId.slice(0,8)}
    </article>)}
   </section>
   <p>Verzendlabels, terugbetalingen en voorraadwijzigingen zijn in deze eerste versie uitgeschakeld.</p>
  </>}
 </main>
}
