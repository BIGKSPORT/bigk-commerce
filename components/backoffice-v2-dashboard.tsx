'use client';
import {useMemo,useState} from 'react';
import type {Order,Product} from '@/lib/types';
import {money} from '@/lib/format';
import styles from './backoffice-v2-dashboard.module.css';
type Cart={id:string;items:{name:string;size:string;quantity:number;unitPrice:number}[];total:number;createdAt:string;updatedAt:string;orderId:string|null;status:string};
type Range='7d'|'30d'|'90d'|'365d';
export default function BackofficeV2Dashboard({orders,products,carts,onNavigate}:{orders:Order[];products:Product[];carts:Cart[];onNavigate:(tab:string)=>void}){
 const [range,setRange]=useState<Range>('30d');
 const stats=useMemo(()=>{
  const days=range==='7d'?7:range==='30d'?30:range==='90d'?90:365;
  const end=new Date();end.setHours(23,59,59,999);
  const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-days+1);
  const previousEnd=new Date(start.getTime()-1),previousStart=new Date(previousEnd);previousStart.setDate(previousStart.getDate()-days+1);previousStart.setHours(0,0,0,0);
  const paid=(o:Order)=>o.status==='paid'||o.status==='fulfilled';
  const inRange=(o:Order,from:Date,to:Date)=>{const t=Date.parse(o.createdAt);return t>=from.getTime()&&t<=to.getTime()};
  const current=orders.filter(o=>paid(o)&&inRange(o,start,end)),previous=orders.filter(o=>paid(o)&&inRange(o,previousStart,previousEnd));
  const total=(rows:Order[])=>rows.reduce((n,o)=>n+o.total,0);
  const delta=(a:number,b:number)=>b===0?(a===0?0:null):((a-b)/b)*100;
  const abandoned=carts.filter(c=>c.status==='possibly_abandoned'||c.status==='unpaid_checkout');
  const lowStock=products.filter(p=>p.active&&p.approved).flatMap(p=>p.variants.map(v=>({product:p,variant:v}))).filter(x=>x.variant.stock-x.variant.reserved<=2);
  const unpaid=orders.filter(o=>['pending','expired','cancelled','payment_review'].includes(o.status));
  const ship=orders.filter(o=>o.status==='paid');
  return {days,currentSales:total(current),previousSales:total(previous),salesChange:delta(total(current),total(previous)),currentOrders:current.length,previousOrders:previous.length,orderChange:delta(current.length,previous.length),unpaid:unpaid.length,ship:ship.length,abandoned:abandoned.length,lowStock:lowStock.length,lowStockItems:lowStock.slice(0,5),checkout:carts.filter(c=>c.status==='checkout_started'||c.status==='unpaid_checkout').length,paidCount:current.length,paidUnits:current.reduce((n,o)=>n+o.items.reduce((s,i)=>s+i.quantity,0),0)};
 },[orders,products,carts,range]);
 const fmt=(n:number|null)=>n===null?'—':(n>0?'+':'')+n.toFixed(1)+'%';
 return <div className={styles.root}>
  <div className={styles.toolbar}><div><h2>Store overview</h2><p>Compare paid sales and order activity with the previous period</p></div><div className={styles.ranges}>{([['7d','7 days'],['30d','30 days'],['90d','90 days'],['365d','12 months']] as [Range,string][]).map(([key,label])=><button key={key} type="button" aria-pressed={range===key} className={range===key?styles.rangeActive:styles.range} onClick={()=>setRange(key)}>{label}</button>)}</div></div>
  <div className={styles.kpis}>
   <article><span>Total sales</span><strong>{money(stats.currentSales)}</strong><small>vs previous period <b>{fmt(stats.salesChange)}</b></small></article>
   <article><span>Orders</span><strong>{stats.currentOrders}</strong><small>vs previous period <b>{fmt(stats.orderChange)}</b></small></article>
   <article><span>Conversion rate</span><strong>Not available</strong><small>Session analytics is not connected</small></article>
   <article><span>Sessions</span><strong>Not available</strong><small>Visitor tracking is not connected</small></article>
  </div>
  <div className={styles.grid}>
   <section className={styles.card}><div className={styles.cardHead}><div><h3>Live view</h3><p>Visitors and active carts right now</p></div><span className={styles.unavailable}>Not connected</span></div><div className={styles.live}><strong>—</strong><span>Live visitors</span><strong>{stats.checkout}</strong><span>Saved carts at checkout stage</span></div><p className={styles.note}>Real-time visitor tracking is not currently available. Cart counts are saved-cart records, not live visitors.</p></section>
   <section className={styles.card}><div className={styles.cardHead}><div><h3>Conversion funnel</h3><p>Available saved-cart and paid-order signals</p></div></div><div className={styles.funnel}><div><span>Saved carts at checkout</span><b>{stats.checkout}</b></div><div><span>Paid orders in selected period</span><b>{stats.paidCount}</b></div><div><span>Items in paid orders</span><b>{stats.paidUnits}</b></div></div><p className={styles.note}>This is not a full session-to-purchase funnel: add-to-cart and session events are not recorded in the current data.</p></section>
   <section className={styles.card}><div className={styles.cardHead}><h3>Needs attention</h3><button type="button" onClick={()=>onNavigate('Orders')}>Open orders ↗</button></div><button className={styles.task} onClick={()=>onNavigate('Orders')}><span>Unpaid / payment review</span><b>{stats.unpaid}</b></button><button className={styles.task} onClick={()=>onNavigate('Orders')}><span>Orders to ship</span><b>{stats.ship}</b></button><button className={styles.task} onClick={()=>onNavigate('Orders')}><span>Possibly abandoned checkouts</span><b>{stats.abandoned}</b></button><button className={styles.task} onClick={()=>onNavigate('Inventory')}><span>Low-stock variants (2 or fewer available)</span><b>{stats.lowStock}</b></button></section>
   <section className={styles.card}><div className={styles.cardHead}><h3>Low stock to review</h3><button type="button" onClick={()=>onNavigate('Inventory')}>Inventory ↗</button></div>{stats.lowStockItems.length?stats.lowStockItems.map(x=><div className={styles.stockRow} key={x.variant.id}><span>{x.product.name}<small>{x.product.code} · {x.variant.size}</small></span><b>{x.variant.stock-x.variant.reserved} available</b></div>):<p className={styles.note}>No variants at or below the low-stock threshold.</p>}</section>
  </div>
  <p className={styles.disclaimer}>Sales and order comparisons use the order records currently loaded by the backoffice (up to 200 most recent orders). Sales include order totals for paid and fulfilled orders. Sessions, live visitors and a complete conversion rate require an analytics integration that is not currently connected.</p>
 </div>
}
