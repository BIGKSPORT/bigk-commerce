import {visibleProducts,resolveProduct} from '../lib/catalog-view';
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Storefront from '../components/storefront';
import Checkout from '../app/checkout/page';
import Receipt from '../app/order/page';
import {SimpleHeader} from '../components/simple-header';
import {Footer} from '../components/brand';
import Link from './link';
import seed from '../lib/catalog.json';
import type {Product} from '../lib/types';
const allProducts=seed.products.map(p=>({...p,version:0,variants:p.variants.map(v=>({...v,reserved:0}))})) as Product[];
const products=visibleProducts(allProducts);
const originalFetch=window.fetch.bind(window);
const previewOrigin=location.origin==='null'?'https://bigk-preview.invalid':location.origin;
window.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,previewOrigin+'/');
 if(url.origin===previewOrigin&&url.pathname==='/api/catalog')return Response.json({products,mode:'demo',ready:false});
 if(url.origin===previewOrigin&&url.pathname==='/api/checkout'){
  try{
   const data=JSON.parse(String(init?.body||'{}'));
   if(!Array.isArray(data.items)||!data.items.length||data.items.length>30)return Response.json({error:'Your demo bag is empty or invalid.'},{status:400});
   const seen=new Set<string>();
   const items=data.items.map((line:{variantId:string;quantity:number})=>{const p=products.find(p=>p.variants.some(v=>v.id===line.variantId));const v=p?.variants.find(v=>v.id===line.variantId);if(!p||!v||!p.priceCents||seen.has(v.id)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>5)throw Error('A demo bag item is invalid.');seen.add(v.id);return{name:p.name,size:v.size,quantity:line.quantity,unitPrice:p.priceCents}});
   const subtotal=items.reduce((n:number,item:{quantity:number;unitPrice:number})=>n+item.quantity*item.unitPrice,0),shipping=subtotal>=10000?0:695;
   const id=crypto.randomUUID(),receiptToken=crypto.randomUUID();
   // Store only the demo summary. Contact/delivery form values are discarded.
   sessionStorage.setItem('bigk-preview-order',JSON.stringify({id,receiptToken,status:'demo',items,subtotal,shipping,total:subtotal+shipping,createdAt:new Date().toISOString()}));
   return Response.json({id,receiptToken,mode:'demo'});
  }catch{return Response.json({error:'Unable to create this local demo order.'},{status:400})}
 }
 if(url.origin===previewOrigin&&url.pathname==='/api/orders'){
  try{const o=JSON.parse(sessionStorage.getItem('bigk-preview-order')||'null');const token=new Headers(init?.headers).get('authorization');if(!o||o.id!==url.searchParams.get('id')||token!=='Bearer '+o.receiptToken)return Response.json({error:'This demo receipt is available only in the browser tab where it was created.'},{status:404});const {receiptToken,...summary}=o;return Response.json(summary)}catch{return Response.json({error:'Demo receipt unavailable.'},{status:404})}
 }
 if(url.origin===previewOrigin&&url.pathname.startsWith('/api/'))return Response.json({error:'This service is unavailable in the interactive preview.'},{status:503});
 return originalFetch(input,init);
};
function App(){
 const [route,setRoute]=useState(location.pathname+location.search);
 useEffect(()=>{const navigate=(event:Event)=>{const destination=(event as CustomEvent<string>).detail;history.pushState({},'',destination);const target=new URL(destination,previewOrigin);setRoute(target.pathname+target.search);window.scrollTo(0,0)};const pop=()=>setRoute(location.pathname+location.search);window.addEventListener('bigk-preview-navigate',navigate);window.addEventListener('popstate',pop);return()=>{window.removeEventListener('bigk-preview-navigate',navigate);window.removeEventListener('popstate',pop)}},[]);
 useEffect(()=>{if(!route.startsWith('/checkout'))return;const demo:Record<string,string>={firstName:'Demo',lastName:'Customer',email:'demo@example.test',phone:'+32470123456',address:'Example Street 1',postal:'1000',city:'Brussels'};const fill=()=>{for(const [name,value] of Object.entries(demo)){const field=document.querySelector<HTMLInputElement>('input[name="'+name+'"]');if(field&&!field.value)field.value=value}};const timer=setInterval(fill,200);return()=>clearInterval(timer)},[route]);
 const path=route.split('?')[0];let content;
 if(path==='/checkout')content=<Checkout/>;
 else if(path==='/order')content=<Receipt/>;
 else if(path==='/account'||path==='/admin')content=<><SimpleHeader/><main id="main" className="page-container policy-page"><span className="eyebrow">INTERACTIVE PREVIEW</span><h1>{path==='/account'?'Your BigK account.':'Store management.'}</h1><p className="page-intro">Sign-in and account management are not connected in this preview. You can explore products, save favourites, compare items and try the demo shopping bag.</p><Link href="/" className="button dark">Back to the collection</Link></main><Footer/></>;
 else if(path.startsWith('/info/')){const title:Record<string,string>={about:'Looking good. Moving fast.',delivery:'Delivery & returns',contact:'Contact BigK',privacy:'Privacy',terms:'Terms'};content=<><SimpleHeader/><main id="main" className="page-container policy-page"><span className="eyebrow">BIGK / PREVIEW</span><h1>{title[path.split('/')[2]]||'BigK'}</h1><p className="page-intro">This is a private demonstration of the BigK website. Final business details, delivery policies and legal notices are awaiting approval. No payments, shipments or real purchase orders are created.</p><Link href="/" className="button dark">Explore the collection</Link></main><Footer/></>}
 else{const slug=path.startsWith('/products/')?path.split('/')[2]:null;content=<Storefront products={products} mode="demo" ready={false} initialSavedOnly={new URLSearchParams(route.split('?')[1]).get('saved')==='1'} initialCategory={new URLSearchParams(route.split('?')[1]).get('category')||undefined} initialProduct={slug?resolveProduct(allProducts,slug)?.id:undefined}/>}
 return <><div className="preview-notice">INTERACTIVE PREVIEW · Payments disabled · Use fictional details only</div><div key={route}>{content}</div></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
