'use client';
import {useEffect,useState} from 'react';
type Portal={ambassador:boolean;profile?:Record<string,unknown>;summary?:Record<string,unknown>[];commissions?:Record<string,unknown>[];payouts?:Record<string,unknown>[]};
const money=(n:unknown)=>new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(Number(n||0)/100);
const date=(v:unknown)=>{if(!v)return '—';const d=new Date(String(v));return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('nl-BE',{dateStyle:'medium'}).format(d)};
const statusLabel=(v:unknown)=>({active:'Actief',paused:'Gepauzeerd',pending:'In behandeling',approved:'Goedgekeurd',paid:'Uitbetaald',held:'In wacht',reversed:'Teruggedraaid',cancelled:'Geannuleerd',draft:'Concept'} as Record<string,string>)[String(v)]||String(v||'—');
const panel:React.CSSProperties={background:'#fff',border:'1px solid #e7e7e7',borderRadius:8,padding:22};
export default function AmbassadorDashboard(){
 const [data,setData]=useState<Portal|null>(null),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{fetch('/api/ambassadors/me',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Log in om je ambassadeursdashboard te openen.');setData(d)}).catch(e=>setError(e instanceof Error?e.message:'Dashboard niet beschikbaar.'))},[]);
 const commissions=data?.commissions||[],payouts=data?.payouts||[],profile=data?.profile||{};
 const code=String(profile.discount_code||'');
 const total=commissions.reduce((sum,c)=>sum+Number(c.commission_cents||0),0);
 async function copyCode(){try{await navigator.clipboard.writeText(code);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}}
 const page:React.CSSProperties={minHeight:'100vh',background:'#f5f5f3',color:'#171717',fontFamily:'Arial,Helvetica,sans-serif'};
 const wrap:React.CSSProperties={maxWidth:1120,margin:'0 auto',padding:'0 22px'};
 const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:2,textTransform:'uppercase',color:'#E4002B'};
 const title:React.CSSProperties={fontSize:'clamp(34px,5vw,54px)',letterSpacing:-2.5,lineHeight:1,margin:'12px 0',fontWeight:950};
 const table:React.CSSProperties={width:'100%',borderCollapse:'collapse',textAlign:'left',fontSize:13};
 const th:React.CSSProperties={padding:'13px 10px',borderBottom:'1px solid #ddd',fontSize:11,textTransform:'uppercase',letterSpacing:1,color:'#777'};
 const td:React.CSSProperties={padding:'15px 10px',borderBottom:'1px solid #eee'};
 return <main style={page}>
  <header style={{background:'#2D2926',color:'#fff'}}>
   <div style={{...wrap,height:76,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <a href="/" style={{fontSize:24,fontWeight:950,letterSpacing:-1.5,color:'#fff',textDecoration:'none'}}>BIG K<span style={{color:'#E4002B'}}>®</span></a>
    <span style={{fontSize:11,fontWeight:800,letterSpacing:1.7}}>AMBASSADOR PORTAL</span>
   </div>
  </header>
  <div style={wrap}>
   {error&&<section role="alert" style={{...panel,marginTop:35,borderLeft:'4px solid #E4002B'}}><h1 style={{marginTop:0}}>Log in vereist</h1><p>{error}</p><a href="/account" style={{color:'#E4002B',fontWeight:800}}>Naar mijn account ↗</a></section>}
   {!data&&!error&&<section style={{padding:'90px 0'}}><p style={eyebrow}>BIG K® AMBASSADOR</p><h1 style={title}>Je dashboard<br/>wordt geladen.</h1><p style={{color:'#777'}}>Even geduld…</p></section>}
   {data&&!data.ambassador&&<section style={{...panel,margin:'54px 0',padding:36}}><p style={eyebrow}>BIG K® AMBASSADOR PROGRAM</p><h1 style={title}>Jouw verhaal begint hier.</h1><p style={{color:'#666',lineHeight:1.7}}>Er is nog geen actief ambassadeursprofiel gekoppeld aan je ingelogde klantaccount. Stel je kandidaat en BIGK BV bekijkt je aanvraag persoonlijk.</p><a href="/ambassadors/apply" style={{display:'inline-block',marginTop:12,padding:'15px 20px',background:'#E4002B',color:'#fff',textDecoration:'none',fontWeight:900,borderRadius:4}}>ONTDEK HET PROGRAMMA ↗</a></section>}
   {data?.ambassador&&<>
    <section style={{padding:'48px 0 30px'}}>
     <p style={eyebrow}>JOUW BIG K® PARTNEROMGEVING</p><h1 style={title}>Hey {String(profile.display_name||'ambassador')},<br/>goed je te zien.</h1>
     <p style={{color:'#666',lineHeight:1.6}}>Hier vind je jouw persoonlijke code, commissieoverzicht en uitbetalingsstatus.</p>
    </section>
    <section style={{...panel,background:'#2D2926',color:'#fff',padding:28,display:'grid',gridTemplateColumns:'1fr auto',gap:20,alignItems:'center'}}>
     <div><p style={{...eyebrow,color:'#ff536d',marginTop:0}}>JOUW PERSOONLIJKE CODE</p><div style={{fontSize:'clamp(28px,5vw,44px)',fontWeight:950,letterSpacing:2,overflowWrap:'anywhere'}}>{code||'Nog niet beschikbaar'}</div><p style={{color:'#ccc',fontSize:13,marginBottom:0}}>Geef je community 10% korting bij BIG K®.</p></div>
     {code&&<button onClick={copyCode} style={{padding:'14px 18px',background:'#E4002B',color:'#fff',border:0,borderRadius:4,fontWeight:900,cursor:'pointer'}}>{copied?'GEKOPIEERD ✓':'KOPIEER CODE'}</button>}
    </section>
    <section style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14,margin:'16px 0 30px'}}>
     {[{label:'Commissieregistraties',value:String(commissions.length),note:'Geregistreerde regels'},{label:'Totaal commissiebedrag',value:money(total),note:'Op basis van de getoonde registraties'},{label:'Ambassadeursstatus',value:statusLabel(profile.status),note:'Je actuele programmastatus'}].map(x=><article key={x.label} style={panel}><p style={{...eyebrow,color:'#777',letterSpacing:1}}>{x.label}</p><div style={{fontSize:27,fontWeight:950,letterSpacing:-1,margin:'14px 0 6px',overflowWrap:'anywhere'}}>{x.value}</div><p style={{fontSize:11,color:'#888',margin:0}}>{x.note}</p></article>)}
    </section>
    <section style={{...panel,marginBottom:16}}>
     <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:15,flexWrap:'wrap'}}><div><p style={eyebrow}>COMMISSIEOVERZICHT</p><h2 style={{fontSize:26,letterSpacing:-1,margin:'7px 0 0'}}>Jouw registraties</h2></div><span style={{fontSize:12,color:'#777'}}>Bedragen in euro</span></div>
     <div style={{overflowX:'auto',marginTop:18}}><table style={table}><thead><tr>{['Bestelling','Commissie','Status','Geregistreerd'].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{commissions.length?commissions.map((c,i)=><tr key={String(c.order_id)+i}><td style={td}>#{String(c.order_id||'—').slice(0,8)}</td><td style={{...td,fontWeight:800}}>{money(c.commission_cents)}</td><td style={td}><span style={{display:'inline-block',padding:'5px 9px',borderRadius:99,background:'#f1f1ef',fontSize:11,fontWeight:800}}>{statusLabel(c.status)}</span></td><td style={td}>{date(c.created_at)}</td></tr>):<tr><td style={td} colSpan={4}>Er zijn nog geen commissieregistraties.</td></tr>}</tbody></table></div>
     <p style={{fontSize:12,color:'#777',lineHeight:1.6,marginBottom:0}}>Commissies worden pas definitief na betaling, levering, retourcontrole en handmatige goedkeuring door BIGK BV. Klantgegevens zijn niet zichtbaar.</p>
    </section>
    <section style={{...panel,marginBottom:55}}>
     <p style={eyebrow}>UITBETALINGEN</p><h2 style={{fontSize:26,letterSpacing:-1,margin:'7px 0 18px'}}>Uitbetalingshistoriek</h2>
     {payouts.length?<div style={{overflowX:'auto'}}><table style={table}><thead><tr>{['Periode','Bedrag','Status'].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{payouts.map((p,i)=><tr key={i}><td style={td}>{date(p.period_start)} – {date(p.period_end)}</td><td style={{...td,fontWeight:800}}>{money(p.amount_cents)}</td><td style={td}>{statusLabel(p.status)}</td></tr>)}</tbody></table></div>:<p style={{color:'#777',fontSize:13}}>Er zijn nog geen uitbetalingen geregistreerd.</p>}
    </section>
   </>}
   <footer style={{padding:'25px 0',borderTop:'1px solid #ddd',fontSize:11,color:'#888',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><span>© {new Date().getFullYear()} BIGK BV · BIG K®</span><a href="/info/contact" style={{color:'inherit'}}>Hulp nodig? Contacteer ons</a></footer>
  </div>
  <style jsx>{'@media(max-width:680px){section[style*="grid-template-columns"]{grid-template-columns:1fr!important} button{width:100%}}'}</style>
 </main>;
}
