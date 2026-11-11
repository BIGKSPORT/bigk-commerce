'use client';
import Image from 'next/image';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent,type ReactNode} from 'react';
import {colourOptions,groupUrl,type ColourOption} from '@/lib/product-groups';
import {bagMedia} from '@/lib/bag-presentation';
import {localizedMoney} from '@/lib/i18n/config';
import {localizePath,type SiteLocale} from '@/lib/i18n/site-routing';
import {seller} from '@/lib/seller';
import type {CartLine,Product} from '@/lib/types';
import type {ExperienceData,Placement,SceneConfig} from '@/lib/experience/types';
import type {ExperienceCopy} from '@/lib/experience/copy';
import {availableQuantity,addExperienceLine,experienceCartKey,experienceTotal,readExperienceCart} from '@/lib/experience/cart';
import placementConfig from '@/lib/experience/placements.json';
import styles from './experience.module.css';
const config=placementConfig as SceneConfig;
const hit=(r:DOMRect,x:number,y:number)=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
type Picker={product:Product;options:ColourOption[]};
type Drag={id:string;target:HTMLButtonElement;x:number;y:number;active:boolean};

function Dialog({title,close,closeLabel,children}:{title:string;close:()=>void;closeLabel:string;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const dialog=ref.current;dialog?.showModal();return()=>{dialog?.close();previous?.focus();};},[]);
 return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={e=>{e.preventDefault();close();}}><div><h2>{title}</h2><button type="button" onClick={close} aria-label={closeLabel}>×</button></div>{children}</dialog>;
}

export default function Experience({products,mode,freeDeliveryCents,locale,copy,children}:ExperienceData&{locale:SiteLocale;copy:ExperienceCopy;children:ReactNode}){
 const fixture=mode==='fixture',money=(v:number)=>localizedMoney(v,locale),key=experienceCartKey(mode);
 const [enhanced,setEnhanced]=useState(false),[loaded,setLoaded]=useState(false),[bag,setBag]=useState<CartLine[]>([]),[notice,setNotice]=useState(''),[storageError,setStorageError]=useState(false),[picker,setPicker]=useState<Picker|null>(null),[optionId,setOptionId]=useState(''),[variantId,setVariantId]=useState(''),[overBag,setOverBag]=useState(false),[review,setReview]=useState(false);
 const viewport=useRef<HTMLDivElement>(null),bagTarget=useRef<HTMLDivElement>(null),bagPanel=useRef<HTMLElement>(null),drag=useRef<Drag|null>(null),skipClick=useRef(false),request=useRef(0);
 useEffect(()=>{
  try{setBag(readExperienceCart(localStorage.getItem(key)));}catch{setStorageError(true);}
  setLoaded(true);setEnhanced(true);
  const restore=()=>{try{setBag(readExperienceCart(localStorage.getItem(key)));}catch{setStorageError(true);}};
  const storage=(event:StorageEvent)=>{if(event.key===key)restore();};
  window.addEventListener('storage',storage);if(!fixture)window.addEventListener('bigk-cart-restored',restore);
  if(viewport.current&&matchMedia('(max-width:700px)').matches)viewport.current.scrollLeft=(viewport.current.scrollWidth-viewport.current.clientWidth)/2;
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener('bigk-cart-restored',restore);cancelAnimationFrame(request.current);};
 },[key,fixture]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
 function changeBag(next:CartLine[]){
  setBag(next);try{localStorage.setItem(key,JSON.stringify(next));if(!fixture)window.dispatchEvent(new Event('bigk-cart-change'));}catch{setStorageError(true);}
 }
 const subtotal=experienceTotal(bag,products),count=bag.reduce((sum,line)=>sum+line.quantity,0),remaining=Math.max(0,freeDeliveryCents-subtotal);
 const unknown=bag.some(line=>!products.some(p=>p.variants.some(v=>v.id===line.variantId)));
 function open(product:Product){
  const options=colourOptions(products,product);if(!options.length)return;
  setOptionId(options.find(o=>o.product.id===product.id)?.id||options[0].id);setVariantId('');setNotice('');setPicker({product,options});
 }
 function add(){
  const selected=picker?.options.find(o=>o.id===optionId);if(!selected||!variantId)return;
  try{changeBag(addExperienceLine(bag,selected.product,variantId));setNotice(copy.added.replace('{name}',picker!.product.name));setPicker(null);}catch{setNotice(copy.limit);}
 }
 function resetDrag(){if(drag.current){drag.current.target.style.transform='';drag.current.target.removeAttribute('data-dragging');}drag.current=null;setOverBag(false);cancelAnimationFrame(request.current);}
 function pointerDown(event:PointerEvent<HTMLButtonElement>,product:Product){if(event.button!==0)return;skipClick.current=false;drag.current={id:product.id,target:event.currentTarget,x:event.clientX,y:event.clientY,active:false};}
 function pointerMove(event:PointerEvent<HTMLButtonElement>){
  const d=drag.current;if(!d)return;const dx=event.clientX-d.x,dy=event.clientY-d.y;
  if(!d.active&&Math.hypot(dx,dy)<8)return;
  if(!d.active){d.active=true;d.target.setPointerCapture(event.pointerId);d.target.setAttribute('data-dragging','true');}
  event.preventDefault();const x=event.clientX,y=event.clientY;
  cancelAnimationFrame(request.current);request.current=requestAnimationFrame(()=>{if(drag.current!==d)return;d.target.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;setOverBag(Boolean(bagTarget.current&&hit(bagTarget.current.getBoundingClientRect(),x,y)||bagPanel.current&&hit(bagPanel.current.getBoundingClientRect(),x,y)));});
 }
 function pointerUp(event:PointerEvent<HTMLButtonElement>,product:Product){
  const d=drag.current;if(!d)return;
  const dropped=d.active&&Boolean(bagTarget.current&&hit(bagTarget.current.getBoundingClientRect(),event.clientX,event.clientY)||bagPanel.current&&hit(bagPanel.current.getBoundingClientRect(),event.clientX,event.clientY));
  if(d.active){skipClick.current=true;event.preventDefault();if(d.target.hasPointerCapture(event.pointerId))d.target.releasePointerCapture(event.pointerId);}
  resetDrag();if(dropped)open(product);
 }
 const option=picker?.options.find(o=>o.id===optionId);
 const imageFor=(p:Product,fallback?:string,variant?:string)=>{const colour=variant?p.content?.trade?.identifiers?.[variant]?.colour:p.content?.trade?.colour;return (variant&&config.images[variant])||config.images[p.id+':'+colour]||config.images[p.id]||fallback||p.images[0];};
 const productFor=(slot:Placement)=>products.find(p=>p.id===slot.productId)||products.find(p=>p.group?.id===slot.productId);
 return <div className={styles.root} data-enhanced={enhanced?'true':'false'}>
  <p className={styles.previewNotice}>{fixture?copy.fixture:copy.staging}</p>
  <p className={styles.instructions}>{copy.hint}</p>
  <div className={styles.viewport} ref={viewport} tabIndex={0} role="region" aria-label={copy.pan}>
   <div className={styles.scene}>
    <picture className={styles.background}>
     <source media="(max-width:700px)" type="image/avif" srcSet={config.mobile.avif}/><source media="(max-width:700px)" type="image/webp" srcSet={config.mobile.webp}/><source type="image/avif" srcSet={config.desktop.avif}/>
     <img src={config.desktop.webp} width={config.desktop.width} height={config.desktop.height} alt="" fetchPriority="high" decoding="async"/>
    </picture>
    <div className={styles.headline}><span>{copy.label}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div>
    <div className={styles.totalSign} aria-hidden="true"><span>{copy.bag}</span><strong>{money(subtotal)}</strong><small>{count} {copy.items}</small></div>
    <div ref={bagTarget} className={styles.dropTarget} data-over={overBag} style={{left:config.bag.x+'%',top:config.bag.y+'%',width:config.bag.width+'%',height:config.bag.height+'%'}} aria-hidden="true"><span>{copy.drop}</span><div className={styles.packed}>{bag.slice(0,4).map((line,i)=>{const p=products.find(p=>p.variants.some(v=>v.id===line.variantId));const media=p&&bagMedia(p,line.variantId);return p&&media?<Image key={line.variantId} src={imageFor(p,media.image,line.variantId)} alt="" width={70} height={80} sizes="70px" loading="lazy" style={{transform:`rotate(${i%2?8:-8}deg)`}}/>:null;})}</div></div>
    <div className={styles.products} aria-label={copy.room}>{config.slots.map(slot=>{const p=productFor(slot);if(!p)return null;const style={left:slot.x+'%',top:slot.y+'%',width:slot.width+'%',height:slot.height+'%',zIndex:slot.zIndex} as CSSProperties;return <button key={slot.productId} type="button" className={styles.product} style={style} aria-label={`${p.name} · ${p.priceCents===null?'—':money(p.priceCents)}`} disabled={!loaded} onPointerDown={e=>pointerDown(e,p)} onPointerMove={pointerMove} onPointerUp={e=>pointerUp(e,p)} onPointerCancel={resetDrag} onClick={event=>{if(skipClick.current&&event.detail>0){skipClick.current=false;return;}skipClick.current=false;open(p);}}><span className={styles.productPhoto}><Image src={imageFor(p)} alt={p.name} fill sizes={`(max-width:700px) calc(max(420px,62svh) * ${slot.width*16/900}), (max-width:1600px) ${slot.width}vw, ${slot.width*16}px`} loading="lazy" draggable={false}/></span><span className={styles.productLabel}>{p.name}<small>{p.priceCents===null?'—':money(p.priceCents)}</small></span></button>;})}</div>
   </div>
  </div>
  <aside ref={bagPanel} className={styles.bag} data-over={overBag} aria-label={copy.bag}>
   <div className={styles.bagHeading}><h2>{copy.bag}</h2><span>{count} {copy.items}</span></div>
   {!loaded?<p>{copy.loading}</p>:!bag.length?<p>{copy.empty}</p>:<ul className={styles.lines}>{bag.map(line=>{const p=products.find(p=>p.variants.some(v=>v.id===line.variantId));const media=p&&bagMedia(p,line.variantId);return <li key={line.variantId}>{p&&media?<><Image src={imageFor(p,media.image,line.variantId)} alt="" width={40} height={46} sizes="40px" loading="lazy"/><div><strong>{p.name}</strong><small>{media.colour} · {media.size} · ×{line.quantity}</small></div><span>{money((p.priceCents||0)*line.quantity)}</span></>:<span>{copy.missing}</span>}<button type="button" aria-label={copy.remove.replace('{name}',p?.name||line.variantId)} onClick={()=>changeBag(bag.filter(v=>v.variantId!==line.variantId))}>×</button></li>;})}</ul>}
   <p className={styles.total} aria-live="polite" aria-atomic="true"><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></p>
   <progress value={Math.min(subtotal,freeDeliveryCents)} max={freeDeliveryCents} aria-label={remaining?copy.progress.replace('{amount}',money(remaining)):copy.free}/><p className={styles.delivery}>{remaining?copy.progress.replace('{amount}',money(remaining)):copy.free}</p>
   {fixture?<button className={styles.primary} type="button" disabled={!bag.length||!loaded} onClick={()=>setReview(true)}>{copy.previewAction} ↗</button>:<a className={styles.primary} href={localizePath('/checkout',locale)} aria-disabled={!bag.length} onClick={e=>{if(!bag.length)e.preventDefault();}}>{copy.checkout} ↗</a>}
   {unknown&&<p role="alert">{copy.missing}</p>}{storageError&&<p role="status">{copy.storage}</p>}
  </aside>
  <div className={styles.afterScene}><a href={(fixture?seller.origin:'')+localizePath('/#catalog',locale)}>{copy.catalogue} ↗</a><p>{copy.delivery}</p></div>
  {children}
  <div className={styles.toast} role="status" aria-live="polite">{notice}</div>
  {picker&&option&&<Dialog title={copy.picker} closeLabel={copy.close} close={()=>setPicker(null)}><p className={styles.pickerTitle}>{picker.product.name}</p><fieldset><legend>{copy.colour}</legend><div className={styles.choices}>{picker.options.map(o=><button key={o.id} type="button" aria-pressed={optionId===o.id} onClick={()=>{setOptionId(o.id);setVariantId('');}}>{o.colour}</button>)}</div></fieldset><fieldset><legend>{copy.chooseSize}</legend><div className={styles.choices}>{option.variants.map(v=>{const available=availableQuantity(option.product,v.id)-(bag.find(line=>line.variantId===v.id)?.quantity||0);return <button key={v.id} type="button" disabled={available<=0} aria-label={v.size+(available<=0?' · '+copy.soldOut:'')} aria-pressed={variantId===v.id} onClick={()=>setVariantId(v.id)}>{v.size}</button>;})}</div></fieldset><p>{option.product.priceCents===null?'—':money(option.product.priceCents)}</p><button type="button" className={styles.primary} disabled={!variantId} onClick={add}>{copy.add}</button><a className={styles.productLink} href={(fixture?seller.origin:'')+localizePath(groupUrl(products,option),locale)}>{copy.details} ↗</a></Dialog>}
  {review&&<Dialog title={copy.previewTitle} closeLabel={copy.close} close={()=>setReview(false)}><p>{copy.previewCopy}</p><p className={styles.total}><span>{copy.subtotal}</span><strong>{money(subtotal)}</strong></p><button type="button" className={styles.primary} onClick={()=>setReview(false)}>{copy.continue}</button></Dialog>}
 </div>;
}
