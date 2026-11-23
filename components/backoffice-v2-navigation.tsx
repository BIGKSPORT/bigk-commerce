'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,BarChart3,BookOpen,ChevronDown,ChevronRight,ClipboardList,Globe,Home,LayoutDashboard,LockKeyhole,Megaphone,Package,Search,Settings,ShoppingBag,Store,Tag,Ticket,Users,X,Warehouse,Images,Layers} from 'lucide-react';
import type {Product,Order} from '@/lib/types';
import styles from './backoffice-v2-navigation.module.css';

type CustomerResult={id:string;email:string;firstName:string;lastName:string;company:string;tags:string[]};
type SearchResult={kind:'product'|'order'|'customer';id:string;title:string;subtitle:string;product?:Product;order?:Order};
type Props={
 activeTab:string;
 products:Product[];
 orders:Order[];
 salesAvailable:boolean;
 onNavigate:(tab:string)=>void;
 onProductSelect:(product:Product)=>void;
 onOrderSelect:(order:Order)=>void;
 onCustomerSelect:(id:string)=>void;
};
type NavItem={label:string;icon:typeof Home;tab?:string;href?:string;disabled?:boolean;hint?:string};
type NavGroup={label:string;icon:typeof Home;items:NavItem[]};
const groups:NavGroup[]=[
 {label:'Home',icon:Home,items:[{label:'Home',tab:'Overview',icon:LayoutDashboard}]},
 {label:'Orders',icon:ShoppingBag,items:[
  {label:'All orders',tab:'Orders',icon:ShoppingBag},
  {label:'Draft orders',disabled:true,hint:'Planned for Phase 3',icon:ClipboardList},
  {label:'Shipping labels',tab:'Shipping labels',icon:Package},
  {label:'Abandoned checkouts',tab:'Abandoned checkouts',icon:Activity},
 ]},
 {label:'Products',icon:Package,items:[
  {label:'All products',tab:'Products',icon:Package},
  {label:'Categories',tab:'Categories',icon:Layers},
  {label:'Inventory',tab:'Inventory',icon:Warehouse},
 ]},
 {label:'Customers',icon:Users,items:[
  {label:'All customers',tab:'Customers',icon:Users},
  {label:'B2B customers',tab:'B2B',icon:Store},
 ]},
 {label:'Marketing',icon:Megaphone,items:[
  {label:'Campaigns',tab:'Marketing',icon:Megaphone},
  {label:'BIG K Club',tab:'BigK Club',icon:Users},
  {label:'Partners',tab:'Ambassadors',icon:Users},
  {label:'Events',tab:'Events',icon:Ticket},
 ]},
 {label:'Discounts',icon:Tag,items:[{label:'Discount codes',tab:'Discounts',icon:Tag}]},
 {label:'Content',icon:BookOpen,items:[
  {label:'Online store',tab:'Storefront',icon:Store},
  {label:'Blog',tab:'Blog',icon:BookOpen},
  {label:'Media library',tab:'Media library',icon:Images},
 ]},
 {label:'Markets',icon:Globe,items:[{label:'Markets',disabled:true,hint:'Not configured yet',icon:Globe}]},
 {label:'Analytics',icon:BarChart3,items:[{label:'Sales reports',tab:'Analytics',icon:BarChart3}]},
 {label:'Sales channels',icon:Store,items:[
  {label:'Stock & channels',tab:'Voorraad & kanalen',icon:Warehouse},
  {label:'Connections',tab:'Connections',icon:Layers},
  {label:'TikTok catalogue',href:'/admin/tiktok-catalogue',icon:Store},
 ]},
 {label:'Settings',icon:Settings,items:[
  {label:'Operations & staff',tab:'Operations',icon:Settings},
  {label:'Activity log',tab:'Activity',icon:Activity},
  {label:'Access & security',href:'/admin/access',icon:LockKeyhole},
  {label:'Shipping test tools',href:'/admin/shipping-test',icon:Package},
 ]},
];
export default function BackofficeV2Navigation({activeTab,products,orders,salesAvailable,onNavigate,onProductSelect,onOrderSelect,onCustomerSelect}:Props){
 const [expanded,setExpanded]=useState<string[]>(['Orders','Products','Content']);
 const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(''),[customers,setCustomers]=useState<CustomerResult[]>([]),[customersLoaded,setCustomersLoaded]=useState(false),[customerError,setCustomerError]=useState(''),[loadingCustomers,setLoadingCustomers]=useState(false);
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true)}if(event.key==='Escape')setSearchOpen(false)};
  window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
 },[]);
 useEffect(()=>{if(!searchOpen||customersLoaded||loadingCustomers)return;let active=true;setLoadingCustomers(true);fetch('/api/admin/customers',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Customer search is unavailable.');if(active){setCustomers(Array.isArray(d.customers)?d.customers:[]);setCustomersLoaded(true)}}).catch(e=>{if(active)setCustomerError(e instanceof Error?e.message:'Customer search is unavailable.')}).finally(()=>{if(active)setLoadingCustomers(false)});return()=>{active=false}},[searchOpen,customersLoaded]);
 const results=useMemo<SearchResult[]>(()=>{
  const q=query.trim().toLowerCase();if(!q)return [];
  const found:SearchResult[]=[];
  for(const p of products){if((p.name+' '+p.code+' '+p.description+' '+p.category+' '+p.tags.join(' ')).toLowerCase().includes(q))found.push({kind:'product',id:p.id,title:p.name,subtitle:'Product · '+p.code,product:p})}
  for(const o of orders){if((o.id+' '+o.email+' '+o.deliveryAddress.name+' '+o.deliveryAddress.city).toLowerCase().includes(q))found.push({kind:'order',id:o.id,title:'Order #'+o.id.slice(0,8).toUpperCase(),subtitle:'Order · '+o.email+' · '+o.status,order:o})}
  for(const c of customers){if((c.email+' '+c.firstName+' '+c.lastName+' '+c.company+' '+(c.tags||[]).join(' ')).toLowerCase().includes(q))found.push({kind:'customer',id:c.id,title:[c.firstName,c.lastName].filter(Boolean).join(' ')||c.email,subtitle:'Customer · '+c.email})}
  return found.slice(0,18);
 },[query,products,orders,customers]);
 function choose(result:SearchResult){setSearchOpen(false);setQuery('');if(result.kind==='product'&&result.product)onProductSelect(result.product);else if(result.kind==='order'&&result.order)onOrderSelect(result.order);else if(result.kind==='customer')onCustomerSelect(result.id)}
 return <>
  <aside className={styles.sidebar} aria-label="BIG K backoffice">
   <div className={styles.brand}><strong>BIG K</strong><span>BACKOFFICE</span></div>
   <button className={styles.searchButton} type="button" onClick={()=>setSearchOpen(true)}><Search size={16}/><span>Search orders, products, customers</span><kbd>⌘ K</kbd></button>
   <nav className={styles.navigation} aria-label="Backoffice navigation">
    {groups.map(group=>{const active=group.items.some(item=>item.tab===activeTab);const open=expanded.includes(group.label)||active;return <section className={styles.group} key={group.label}>
     {group.items.length===1&&group.items[0].tab==='Overview'?<button type="button" className={active?styles.active:styles.groupButton} onClick={()=>onNavigate('Overview')}><group.icon size={17}/><span>{group.label}</span></button>:<button type="button" className={active?styles.activeGroup:styles.groupButton} aria-expanded={open} onClick={()=>setExpanded(old=>old.includes(group.label)?old.filter(x=>x!==group.label):[...old,group.label])}><group.icon size={17}/><span>{group.label}</span>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>}
     {open&&group.items.length>1&&<div className={styles.children}>{group.items.map(item=>{const Icon=item.icon;const selected=item.tab===activeTab&&(group.label!=='Orders'||item.label==='All orders');return item.disabled?<div className={styles.disabled} key={item.label} title={item.hint}><Icon size={15}/><span>{item.label}</span><small>Later</small></div>:item.href?<a className={styles.childLink} href={item.href} key={item.label}><Icon size={15}/><span>{item.label}</span></a>:<button type="button" key={item.label} className={selected?styles.childActive:styles.childLink} onClick={()=>onNavigate(item.tab!)}><Icon size={15}/><span>{item.label}</span></button>})}{group.label==='Sales channels'&&salesAvailable&&<a className={styles.childLink} href="/staff/sales"><Users size={15}/><span>Seller portal</span></a>}</div>}
    </section>})}
   </nav>
   <div className={styles.footer}><span>BIG K · Store admin</span></div>
  </aside>
  {searchOpen&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="Search your store"><div className={styles.searchInput}><Search size={19}/><input autoFocus type="search" placeholder="Search orders, products and customers…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="Close search" onClick={()=>setSearchOpen(false)}><X size={18}/></button></div><div className={styles.results}>{!query.trim()?<p>Start typing a name, product code, order number, email or customer tag.</p>:results.length?results.map(result=><button type="button" key={result.kind+result.id} onClick={()=>choose(result)}><span className={styles.resultIcon}>{result.kind==='product'?<Package size={16}/>:result.kind==='order'?<ShoppingBag size={16}/>:<Users size={16}/>}</span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ChevronRight size={16}/></button>):<p>{loadingCustomers?'Searching customers…':'No matching records found.'}</p>}{customerError&&<p className={styles.error}>{customerError}</p>}</div><footer><span>Searches existing store records only</span><kbd>ESC</kbd></footer></section></div>}
 </>;
}
