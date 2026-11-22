'use client';
import {useState,type FormEvent} from 'react';

type FormState={fullName:string;email:string;socialUrl:string;partnerType:'ambassador'|'club'|'coach'|'creator'|'team_leader';organizationName:string;organizationType:string;audienceNote:string;motivation:string;privacyAccepted:boolean;termsAccepted:boolean};
const initial:FormState={fullName:'',email:'',socialUrl:'',partnerType:'ambassador',organizationName:'',organizationType:'',audienceNote:'',motivation:'',privacyAccepted:false,termsAccepted:false};
const benefits=[
 {n:'01',title:'Jouw community wint',copy:'Geef je community 10% korting met een persoonlijke BIG K®-code.'},
 {n:'02',title:'Jij verdient mee',copy:'Start met 10% commissie op goedgekeurde, in aanmerking komende productverkopen. Groei door op basis van echte resultaten.'},
 {n:'03',title:'Persoonlijke opvolging',copy:'Een echt team beoordeelt je aanvraag en helpt je op weg na goedkeuring.'}
];
const steps=[
 {n:'01',title:'Vertel ons jouw verhaal',copy:'Dien je profiel in en vertel wie je bereikt.'},
 {n:'02',title:'BIGK BV beoordeelt',copy:'We bekijken of er een goede match is. Deelname start pas na onze schriftelijke goedkeuring.'},
 {n:'03',title:'Deel jouw code',copy:'Na activatie krijg je een persoonlijke kortingscode en toegang tot je partnerdashboard.'}
];
export default function AmbassadorApplyPage(){
 const [form,setForm]=useState<FormState>(initial);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[success,setSuccess]=useState(false);
 function update(key:keyof FormState,value:string|boolean){setForm(old=>({...old,[key]:value}));}
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setMessage('');setSuccess(false);
  try{const r=await fetch('/api/ambassadors/apply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Je aanvraag kon niet worden verstuurd. Probeer het opnieuw.');setSuccess(true);setMessage('Bedankt voor je aanvraag! BIGK BV bekijkt je gegevens. Je ontvangt bericht zodra er een beslissing is.');setForm(initial);}
  catch(e){setMessage(e instanceof Error?e.message:'Er ging iets mis. Probeer het later opnieuw.');}
  finally{setBusy(false);}
 }
 const s:Record<string,React.CSSProperties>={
  page:{background:'#f4f4f0',color:'#111',fontFamily:'Arial,Helvetica,sans-serif',minHeight:'100vh'},
  wrap:{width:'min(1160px, calc(100% - 40px))',margin:'0 auto'},
  nav:{height:76,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #ddd'},
  logo:{fontSize:23,fontWeight:950,letterSpacing:-1.5},
  pill:{display:'inline-flex',alignItems:'center',border:'1px solid #aaa',borderRadius:99,padding:'8px 13px',fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase'},
  hero:{padding:'76px 0 70px',display:'grid',gridTemplateColumns:'1.15fr .85fr',gap:42,alignItems:'center'},
  eyebrow:{fontSize:12,fontWeight:800,letterSpacing:2.2,textTransform:'uppercase',margin:'0 0 20px'},
  h1:{fontSize:'clamp(48px,7vw,88px)',lineHeight:.91,letterSpacing:-5,fontWeight:950,margin:'0 0 25px',maxWidth:700},
  lead:{fontSize:18,lineHeight:1.6,color:'#444',maxWidth:580,margin:'0 0 28px'},
  cta:{display:'inline-flex',padding:'16px 23px',background:'#E4002B',color:'#111',borderRadius:5,fontWeight:900,textDecoration:'none',fontSize:14},
  visual:{background:'#2D2926',color:'#fff',borderRadius:8,padding:30,minHeight:360,display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'},
  big:{fontSize:104,lineHeight:.85,letterSpacing:-8,fontWeight:950,color:'#E4002B'},
  section:{padding:'68px 0'},
  sectionTitle:{fontSize:'clamp(34px,4.5vw,54px)',letterSpacing:-2.5,lineHeight:1,margin:'0 0 16px',fontWeight:950},
  muted:{color:'#666',lineHeight:1.6,maxWidth:620},
  card:{background:'#fff',border:'1px solid #e2e2dc',borderRadius:7,padding:25},
  label:{display:'grid',gap:8,fontWeight:750,fontSize:13,marginBottom:17},
  input:{width:'100%',padding:'14px 13px',border:'1px solid #d0d0c9',borderRadius:4,font:'inherit',fontSize:15,background:'#fbfbf9',color:'#111',boxSizing:'border-box'},
  submit:{width:'100%',padding:17,border:0,borderRadius:4,background:'#E4002B',color:'#111',fontWeight:900,fontSize:15,cursor:'pointer'},
  footer:{borderTop:'1px solid #ddd',padding:'28px 0',fontSize:12,color:'#666'}
 };
 const grid3:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14};
 return <main style={s.page}>
  <div style={s.wrap}>
   <header style={s.nav}><a href="/" style={{...s.logo,color:'inherit',textDecoration:'none'}}>BIG K<span style={{color:'#E4002B'}}>®</span></a><a href="#aanmelden" style={{...s.cta,padding:'11px 17px'}}>WORD PARTNER <span aria-hidden>↗</span></a></header>
   <section style={s.hero}>
    <div><p style={s.eyebrow}>BIG K® PARTNERPROGRAMMA</p><h1 style={s.h1}>JOUW STIJL.<br/>JOUW COMMUNITY.<br/><span style={{color:'#E4002B'}}>JOUW REWARD.</span></h1><p style={s.lead}>Maak deel uit van BIG K®. Deel wat je graag draagt, geef je community een mooi voordeel en verdien mee met elke goedgekeurde verkoop via jouw persoonlijke code.</p><a href="#aanmelden" style={s.cta}>STEL JE KANDIDAAT <span style={{marginLeft:12}}>↗</span></a><p style={{fontSize:12,color:'#777',marginTop:17}}>Open voor aanvragen · Persoonlijke selectie door BIGK BV</p></div>
    <div style={s.visual}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,fontWeight:800,letterSpacing:2}}>THE BIG K® DEAL</span><span style={{...s.pill,borderColor:'#666',color:'#E4002B'}}>PARTNER</span></div><div><div style={{fontSize:13,color:'#bbb',fontWeight:700,letterSpacing:2}}>JOUW COMMUNITY KRIJGT</div><div style={s.big}>10%</div><div style={{fontSize:23,fontWeight:900,marginTop:5}}>KORTING</div><div style={{height:1,background:'#555',margin:'23px 0'}}/><div style={{fontSize:13,color:'#bbb',fontWeight:700,letterSpacing:2}}>JIJ START MET</div><div style={{fontSize:65,lineHeight:1,fontWeight:950,color:'#fff'}}>10% <span style={{fontSize:17,color:'#E4002B'}}>COMMISSIE</span></div></div><div style={{fontSize:11,color:'#999'}}>ONE COMMUNITY. ONE CODE. BIG K® ENERGY.</div><div aria-hidden style={{position:'absolute',right:-35,top:110,width:180,height:180,border:'1px solid #444',borderRadius:'50%'}}/></div>
   </section>
   <section style={{...s.section,paddingTop:28}}><p style={s.eyebrow}>MEER DAN EEN CODE</p><h2 style={s.sectionTitle}>Goed voor jouw volgers.<br/>Goed voor jou.</h2><p style={s.muted}>Of je nu sporter, coach, creator of sportclub bent: we bouwen samen aan een community die BIG K® ontdekt, gebruikt en aanbeveelt.</p><div style={{...grid3,marginTop:28}}>{benefits.map(b=><article key={b.n} style={s.card}><div style={{fontSize:12,fontWeight:900,color:'#E4002B',letterSpacing:2,marginBottom:35}}>{b.n} / BIG K®</div><h3 style={{fontSize:22,letterSpacing:-.7,margin:'0 0 10px'}}>{b.title}</h3><p style={{margin:0,color:'#666',lineHeight:1.6,fontSize:14}}>{b.copy}</p></article>)}</div></section>
   <section style={{...s.section,background:'#2D2926',color:'#fff',padding:'64px 34px',borderRadius:8}}><p style={{...s.eyebrow,color:'#E4002B'}}>ZO WERKT HET</p><h2 style={s.sectionTitle}>Van aanvraag<br/>tot partner.</h2><div style={{...grid3,marginTop:35}}>{steps.map((step,i)=><article key={step.n} style={{borderTop:'1px solid #555',paddingTop:18}}><div style={{fontSize:34,fontWeight:950,color:'#E4002B',marginBottom:22}}>{step.n}</div><h3 style={{fontSize:20,margin:'0 0 10px'}}>{step.title}</h3><p style={{fontSize:14,lineHeight:1.65,color:'#bbb',margin:0}}>{step.copy}</p></article>)}</div></section>
   <section id="aanmelden" style={{...s.section,display:'grid',gridTemplateColumns:' .8fr 1.2fr',gap:40,alignItems:'start'}}>
    <div><p style={s.eyebrow}>LET'S TALK</p><h2 style={s.sectionTitle}>Klaar om<br/>BIG K® te<br/>vertegenwoordigen?</h2><p style={s.muted}>Vertel ons wie je bent, waar je community je volgt en waarom BIG K® bij jou past. We nemen elke aanvraag persoonlijk door.</p><div style={{marginTop:25,padding:20,background:'#e8e9e1',borderRadius:6}}><div style={{fontSize:12,fontWeight:900,letterSpacing:1.3,marginBottom:8}}>TRANSPARANT & EERLIJK</div><p style={{fontSize:13,color:'#555',lineHeight:1.6,margin:0}}>10% startcommissie wordt berekend op goedgekeurde netto productverkopen exclusief btw en verzendkosten. Betaling volgt pas na betaling, levering, retourcontrole en handmatige goedkeuring door BIGK BV.</p></div></div>
    <form onSubmit={submit} style={{...s.card,padding:28}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:22}}><div><div style={{fontSize:11,fontWeight:900,letterSpacing:1.5,color:'#E4002B'}}>PARTNER APPLICATION</div><h3 style={{fontSize:25,letterSpacing:-1,margin:'6px 0 0'}}>Jouw aanvraag</h3></div><span style={{...s.pill,fontSize:10}}>01 — 05</span></div>
     <label style={s.label}>Volledige naam<input required minLength={2} maxLength={120} autoComplete="name" style={s.input} placeholder="Je naam" value={form.fullName} onChange={e=>update('fullName',e.target.value)}/></label>
     <label style={s.label}>E-mailadres<input required type="email" maxLength={254} autoComplete="email" style={s.input} placeholder="jij@email.com" value={form.email} onChange={e=>update('email',e.target.value)}/></label>
     <label style={s.label}>Hoe wil je deelnemen?<select style={s.input} value={form.partnerType} onChange={e=>update('partnerType',e.target.value as FormState['partnerType'])}><option value="ambassador">Individuele ambassador</option><option value="club">Sportclub / vereniging</option><option value="coach">Coach / trainer / studio</option><option value="creator">Creator / influencer</option><option value="team_leader">Teamleader / communitybouwer</option></select></label>
     <label style={s.label}>Naam van je club, organisatie of community (optioneel)<input maxLength={160} style={s.input} placeholder="Bijv. FC ... / Studio ..." value={form.organizationName} onChange={e=>update('organizationName',e.target.value)}/></label>
     <label style={s.label}>Type sport of organisatie (optioneel)<input maxLength={60} style={s.input} placeholder="Voetbal, padel, fitness, running…" value={form.organizationType} onChange={e=>update('organizationType',e.target.value)}/></label>
     <label style={s.label}>Website / social profiel<input required type="url" maxLength={500} style={s.input} placeholder="https://..." value={form.socialUrl} onChange={e=>update('socialUrl',e.target.value)}/></label>
     <label style={s.label}>Vertel over je community of leden<textarea required minLength={10} maxLength={1200} rows={3} style={{...s.input,resize:'vertical'}} placeholder="Wie bereik je en wat maakt jouw community bijzonder?" value={form.audienceNote} onChange={e=>update('audienceNote',e.target.value)}/></label>
     <label style={s.label}>Waarom past BIG K® bij jou?<textarea required minLength={20} maxLength={2000} rows={4} style={{...s.input,resize:'vertical'}} placeholder="Vertel ons waarom je graag ambassadeur wilt worden..." value={form.motivation} onChange={e=>update('motivation',e.target.value)}/></label>
     <label style={{display:'flex',gap:10,alignItems:'start',fontSize:12,lineHeight:1.5,color:'#555',margin:'18px 0'}}><input type="checkbox" required checked={form.privacyAccepted} onChange={e=>update('privacyAccepted',e.target.checked)}/><span>Ik heb de <a href="/legal/ambassador-privacy" target="_blank" rel="noreferrer">privacy-informatie</a> gelezen en begrijp hoe BIGK BV mijn gegevens verwerkt.</span></label>
     <label style={{display:'flex',gap:10,alignItems:'start',fontSize:12,lineHeight:1.5,color:'#555',margin:'18px 0'}}><input type="checkbox" required checked={form.termsAccepted} onChange={e=>update('termsAccepted',e.target.checked)}/><span>Ik heb de <a href="/legal/ambassador-terms" target="_blank" rel="noreferrer">ontwerpvoorwaarden</a> gelezen en aanvaard deze als basis voor mijn aanvraag. Ik begrijp dat deelname pas start na schriftelijke goedkeuring.</span></label>
     <button disabled={busy} style={{...s.submit,opacity:busy ? 0.65 : 1}}>{busy?'AANVRAAG VERSTUREN…':'VERSTUUR MIJN AANVRAAG  ↗'}</button>
     {message&&<p role={success?'status':'alert'} style={{padding:14,background:success?'#edf6df':'#fff0ed',borderRadius:4,fontSize:13,lineHeight:1.5}}>{message}</p>}
     <p style={{fontSize:11,color:'#888',lineHeight:1.5,marginBottom:0}}>Je aanvraag is vrijblijvend. Een aanvraag geeft geen automatisch recht op deelname, korting of commissie. BIGK BV beslist over iedere activatie.</p>
    </form>
   </section>
   <section style={{...s.section,paddingTop:0}}><p style={s.eyebrow}>GOOD TO KNOW</p><h2 style={{...s.sectionTitle,fontSize:36}}>Veelgestelde vragen.</h2><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:22}}>{[
    ['Kan iedereen zich aanmelden?','Ja. Aanvragen staan open. BIGK BV beoordeelt elk profiel en beslist persoonlijk over activatie.'],
    ['Hoeveel korting krijgt mijn community?','Na goedkeuring ontvangen je volgers 10% korting via jouw persoonlijke code.'],
    ['Hoeveel commissie verdien ik?','Je start met 10% op in aanmerking komende netto productverkopen, exclusief btw en verzendkosten, na toepassing van de klantkorting. Hogere niveaus zijn afhankelijk van bewezen verkoopresultaten en goedkeuring door BIGK BV.'],
    ['Wanneer wordt commissie uitbetaald?','Na betaling en levering, zodra de retourcontrole is afgerond en BIGK BV de commissie handmatig heeft goedgekeurd. Uitbetalingen gebeuren niet automatisch.']
   ].map(([q,a])=><details key={q} style={{background:'#fff',border:'1px solid #e2e2dc',padding:18,borderRadius:5}}><summary style={{fontWeight:800,cursor:'pointer'}}>{q}</summary><p style={{fontSize:13,color:'#666',lineHeight:1.6,marginBottom:0}}>{a}</p></details>)}</div></section>
   <footer style={s.footer}><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><span>© {new Date().getFullYear()} BIGK BV · BIG K®</span><span><a href="/legal/ambassador-terms" style={{color:'inherit'}}>Voorwaarden</a>　·　<a href="/legal/ambassador-privacy" style={{color:'inherit'}}>Privacy</a>　·　<a href="/info/contact" style={{color:'inherit'}}>Contact</a></span></div></footer>
  </div>
  <style jsx>{'@media(max-width:760px){header{height:64px!important} section[style*="grid-template-columns"]{grid-template-columns:1fr!important} h1{letter-spacing:-3px!important} form{padding:20px!important} } @media(max-width:620px){section[style*="grid-template-columns:repeat(3"]{grid-template-columns:1fr!important} }'}</style>
 </main>;
}
