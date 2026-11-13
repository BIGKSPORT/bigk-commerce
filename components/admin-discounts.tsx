'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {AdminTransport} from './admin-types';
import {money} from '@/lib/format';

type CodeRow = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal_cents: number;
  max_redemptions: number | null;
  per_customer_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: number;
  redemption_count: number;
  note: string;
  created_at: string;
};

export function AdminDiscounts({transport}:{transport:AdminTransport}){
  const [codes,setCodes]=useState<CodeRow[]|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({code:'',type:'percent' as 'percent'|'fixed',value:'10',minSubtotal:'0',maxRedemptions:'',perCustomer:'1',note:''});

  async function load(){
    try{
      const d=await transport.request('/api/admin/discounts');
      setCodes(d.codes||[]);
      setError('');
    }catch(e){setError((e as Error).message)}
  }
  useEffect(()=>{void load()},[transport]);

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');setNotice('');
    try{
      const value=form.type==='percent'?Number(form.value):Math.round(Number(form.value)*100);
      await transport.request('/api/admin/discounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        code:form.code.trim().toUpperCase(),
        type:form.type,
        value,
        minSubtotalCents:Math.round(Number(form.minSubtotal||0)*100),
        maxRedemptions:form.maxRedemptions===''?null:Number(form.maxRedemptions),
        perCustomerLimit:form.perCustomer===''?null:Number(form.perCustomer),
        active:true,
        note:form.note,
      })});
      setNotice('Promo code saved.');
      setForm({code:'',type:'percent',value:'10',minSubtotal:'0',maxRedemptions:'',perCustomer:'1',note:''});
      await load();
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }

  async function toggle(code:string,active:boolean){
    setBusy(true);setError('');
    try{
      await transport.request('/api/admin/discounts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,active})});
      await load();
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }

  return <section className="bo-panel" style={{marginTop:16}}>
    <div className="bo-panel-heading"><h2>Promo codes</h2></div>
    <p className="bo-hint">Percent or fixed € off the product subtotal. Cannot be combined with Club points. Shipping is calculated after the discount.</p>
    {error&&<p className="error-message" role="alert">{error}</p>}
    {notice&&<p className="info-message" role="status">{notice}</p>}
    <form className="bo-form" onSubmit={save} style={{display:'grid',gap:12,maxWidth:560}}>
      <label className="field">Code<input required maxLength={32} value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="WELCOME10"/></label>
      <label className="field">Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value as 'percent'|'fixed'})}><option value="percent">Percent %</option><option value="fixed">Fixed € amount</option></select></label>
      <label className="field">{form.type==='percent'?'Percent (1–100)':'Amount in €'}<input required type="number" min={form.type==='percent'?1:0.01} max={form.type==='percent'?100:10000} step={form.type==='percent'?1:0.01} value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
      <label className="field">Minimum product subtotal (€)<input type="number" min={0} step={0.01} value={form.minSubtotal} onChange={e=>setForm({...form,minSubtotal:e.target.value})}/></label>
      <label className="field">Max total uses (blank = unlimited)<input type="number" min={1} value={form.maxRedemptions} onChange={e=>setForm({...form,maxRedemptions:e.target.value})}/></label>
      <label className="field">Max uses per customer (blank = unlimited)<input type="number" min={1} value={form.perCustomer} onChange={e=>setForm({...form,perCustomer:e.target.value})}/></label>
      <label className="field">Internal note<input maxLength={200} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>
      <button className="button dark" disabled={busy} type="submit">{busy?'Saving…':'Save promo code'}</button>
    </form>
    {!codes?<p role="status">Loading codes…</p>:codes.length===0?<p className="bo-hint">No promo codes yet.</p>:
      <div className="table-scroll bo-table-card" style={{marginTop:16}}>
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Offer</th><th>Used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {codes.map(c=>(
              <tr key={c.code}>
                <td><strong>{c.code}</strong>{c.note&&<small>{c.note}</small>}</td>
                <td>{c.type==='percent'?`${c.value}% off`:`${money(c.value)} off`}{c.min_subtotal_cents>0&&<small>Min {money(c.min_subtotal_cents)}</small>}</td>
                <td>{c.redemption_count}{c.max_redemptions!=null?` / ${c.max_redemptions}`:''}</td>
                <td><span className={'bo-status '+(c.active?'paid':'cancelled')}>{c.active?'Active':'Off'}</span></td>
                <td><button type="button" className="text-button" disabled={busy} onClick={()=>toggle(c.code,!c.active)}>{c.active?'Turn off':'Turn on'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
  </section>;
}
