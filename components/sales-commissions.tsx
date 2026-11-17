'use client';
import type {CommissionStatement} from '@/lib/sales-commissions';
import styles from './sales-workspace.module.css';
const money=(n:number)=>new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(n/100);
function download(s:CommissionStatement){
 const cell=(v:string|number)=>'"'+(typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?"'"+v:String(v)).replaceAll('"','""')+'"';
 const rows:(string|number)[][]=[['Verkoper','Maand','Order','Winkel','Klantbetaling','Omzet excl. btw EUR','Commissie EUR','Bonus EUR'],...s.lines.map(l=>[s.sellerName,s.month,l.orderId,l.customerName,l.paidAt,(l.netCents/100).toFixed(2),(l.commissionCents/100).toFixed(2),(l.bonusCents/100).toFixed(2)]),['Totaal vergoeding excl. eventuele btw',(s.totalCents/100).toFixed(2)],['Status',s.payout?'Uitbetaling geregistreerd':'Nog niet uitbetaald'],['Betalingsreferentie',s.payout?.reference||'']];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='BIGK-commissie-'+s.month+'-'+s.sellerId+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function SalesCommissions({statements,owner,readOnly,busy,onRecord}:{statements:CommissionStatement[];owner:boolean;readOnly:boolean;busy:boolean;onRecord:(statement:CommissionStatement,reference:string)=>Promise<void>}){
 const earned=statements.reduce((n,s)=>n+s.totalCents,0),paid=statements.filter(s=>s.payout).reduce((n,s)=>n+s.totalCents,0);
 return <section><h2>Maandelijkse commissieafrekening</h2><p>Voorraadorders tellen mee zodra BIG K de volledige klantbetaling heeft geregistreerd. De openingsbonus geldt één keer per nieuwe winkel. Afrekening per kalendermaand, met betaling uiterlijk de 10e van de volgende maand.</p><p className={styles.muted}>Bedragen zijn vergoedingen excl. eventuele btw op de agentfactuur. Dit overzicht is geen factuur en voert geen bankbetaling uit. Pre-orders en voorschotten worden hier nog niet verwerkt; daarvoor is een afzonderlijke betalingsregistratie en juridisch bevestigde regeling nodig.</p>
 <dl className={styles.totals} aria-live="polite"><div><dt>Totaal verdiend</dt><dd>{money(earned)}</dd></div><div><dt>Uitbetaling geregistreerd</dt><dd>{money(paid)}</dd></div><div><dt>Nog uit te betalen, inclusief lopende maand</dt><dd>{money(earned-paid)}</dd></div></dl>
 {!statements.length&&<p>Nog geen commissie op volledig betaalde orders.</p>}
 {statements.map(s=><article className={styles.panel} key={s.sellerId+':'+s.month}><h3>{s.sellerName} · {s.month}</h3><p><strong>{money(s.totalCents)}</strong> · {s.payout?'Uitbetaling geregistreerd':s.closed?'Klaar voor afrekening':'Lopende maand'}</p><p>Geplande betaaldatum: {s.dueDate}</p>{s.payout&&<p>Referentie: {s.payout.reference} · geregistreerd op {new Date(s.payout.recordedAt).toLocaleDateString('nl-BE')}</p>}
 <details><summary>{s.lines.length} betaalde orders bekijken</summary><ul className={styles.cartLines}>{s.lines.map(l=><li key={l.orderId}><span>{l.customerName}<small>{l.orderId} · klantbetaling {new Date(l.paidAt).toLocaleDateString('nl-BE')}</small><small>Commissie {money(l.commissionCents)} · bonus {money(l.bonusCents)}</small></span><strong>{money(l.commissionCents+l.bonusCents)}</strong></li>)}</ul></details>
 <button className={styles.secondary} onClick={()=>download(s)}>Download maandafrekening CSV</button>
 {owner&&!s.payout&&s.closed&&s.totalCents>0&&<form onSubmit={e=>{e.preventDefault();const reference=String(new FormData(e.currentTarget).get('reference'));if(window.confirm('Bevestig dat '+money(s.totalCents)+' commissie aan '+s.sellerName+' is betaald. Eventuele btw op de agentfactuur wordt apart verwerkt.'))void onRecord(s,reference);}}><label>Referentie uitgevoerde commissiebetaling<input name="reference" minLength={4} maxLength={150} required disabled={busy||readOnly}/></label><button disabled={busy||readOnly}>Uitgevoerde betaling registreren</button></form>}
 </article>)}
 </section>;
}
