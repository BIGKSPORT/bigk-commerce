'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import Image from 'next/image';
import {ChevronLeft,ChevronRight,Expand,ZoomIn,ZoomOut,X,Heart,ShoppingBag,Sparkles} from 'lucide-react';
import type {Product} from '@/lib/types';
import {useSiteLanguage} from './site-language';
import {translateSite} from '@/lib/i18n/site-copy';
import {alpinUI} from '@/lib/i18n/alpin-ui';
import type {AlpinLocale} from '@/lib/alpin-fleece';
export default function ProductGallery({product,saved=false,onSave,onChooseSize,onHelp,showActions=false,locale,imageAlt}:{product:Product;locale?:AlpinLocale;imageAlt?:(index:number)=>string;saved?:boolean;onSave?:()=>void;onChooseSize?:()=>void;onHelp?:()=>void;showActions?:boolean}){
 const {locale:siteLocale}=useSiteLanguage(),selectedLocale=locale??siteLocale,text=alpinUI[selectedLocale];
 const t=(source:string)=>translateSite(selectedLocale,source);
 const [index,setIndex]=useState(0),[hoverZoom,setHoverZoom]=useState(false),[position,setPosition]=useState({x:50,y:50}),[expanded,setExpanded]=useState(false),[zoomed,setZoomed]=useState(false);
 const viewport=useRef<HTMLDivElement>(null),currentIndex=useRef(0);
 const [inlineOnly,setInlineOnly]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),drag=useRef<{x:number;y:number}|null>(null),suppressClick=useRef(false),rail=useRef<HTMLDivElement>(null);
 const images=product.images;
 const choose=(next:number)=>{
  const selected=(next+images.length)%images.length;
  currentIndex.current=selected;setIndex(selected);setHoverZoom(false);setZoomed(false);
  if(matchMedia('(max-width:760px)').matches)viewport.current?.scrollTo({left:selected*viewport.current.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
 };
 useEffect(()=>{
  const sync=()=>{
   const mobile=matchMedia('(max-width:760px)').matches;setInlineOnly(mobile);
   if(mobile){setExpanded(false);const el=viewport.current;el?.scrollTo({left:currentIndex.current*el.clientWidth,behavior:'instant'})}
  };
  sync();window.addEventListener('resize',sync);return()=>window.removeEventListener('resize',sync);
 },[images.length]);
 function scrollPhotos(){
  const el=viewport.current;if(!el||!matchMedia('(max-width:760px)').matches||!el.clientWidth)return;
  const next=Math.max(0,Math.min(images.length-1,Math.round(el.scrollLeft/el.clientWidth)));
  if(next!==currentIndex.current){currentIndex.current=next;setIndex(next);setHoverZoom(false)}
 }
 function openViewer(){if(!matchMedia('(max-width:760px)').matches){setExpanded(true);setHoverZoom(false)}}

 useEffect(()=>{const container=rail.current,thumb=container?.querySelector<HTMLElement>('[aria-current="true"]');if(!container||!thumb||!container.clientHeight)return;const frame=container.getBoundingClientRect(),item=thumb.getBoundingClientRect();if(item.top<frame.top)container.scrollTop+=item.top-frame.top;else if(item.bottom>frame.bottom)container.scrollTop+=item.bottom-frame.bottom;if(item.left<frame.left)container.scrollLeft+=item.left-frame.left;else if(item.right>frame.right)container.scrollLeft+=item.right-frame.right},[index]);
 useEffect(()=>{if(!expanded)return;const el=dialog.current;el?.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{if(el?.open)el.close();document.body.style.overflow=previous}},[expanded]);
 function move(event:PointerEvent<HTMLElement>){if(event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;const box=event.currentTarget.getBoundingClientRect();setPosition({x:Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100)),y:Math.max(0,Math.min(100,(event.clientY-box.top)/box.height*100))});setHoverZoom(true)}
 function down(event:PointerEvent<HTMLElement>){suppressClick.current=false;if(event.pointerType==='mouse'||matchMedia('(max-width:760px)').matches)return;drag.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId)}
 function up(event:PointerEvent<HTMLElement>){if(!drag.current)return;const dx=event.clientX-drag.current.x,dy=event.clientY-drag.current.y;drag.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)&&images.length>1){suppressClick.current=true;choose(index+(dx<0?1:-1))}}
 if(!images.length)return <div className="gallery-pending photo-pending"><img src="/brand/bigk-symbol.svg" alt="" width={70} height={70}/><p>{t('Product photography in review')}</p></div>;
 const thumbnails=(lightbox=false)=><div className={lightbox?'lightbox-thumbs':'thumbnails gallery-thumbnails'} ref={lightbox?undefined:rail} aria-label={text.choosePhoto}>{images.map((src,i)=><button type="button" key={src} className={index===i?'selected':''} aria-current={index===i?'true':undefined} aria-label={text.showPhoto+' '+(i+1)} onClick={()=>choose(i)} onFocus={()=>choose(i)} onPointerEnter={event=>{if(event.pointerType==='mouse'&&matchMedia('(hover: hover)').matches)choose(i)}}><Image src={src} alt="" width={72} height={96} draggable={false}/></button>)}</div>;
 return <><div className="product-gallery" role="region" aria-label={text.photo} aria-roledescription={selectedLocale==='en'?'carousel':'carrousel'} data-active-photo={index+1} tabIndex={0} onKeyDown={e=>{if(images.length<2)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();choose(index+(e.key==='ArrowRight'?1:-1))}if(e.key==='Home'||e.key==='End'){e.preventDefault();choose(e.key==='Home'?0:images.length-1)}}}>
 {images.length>1&&thumbnails()}
 <div className="gallery-stage"><div className="gallery-window detail-image"><div ref={viewport} className={'gallery-enlarge '+(hoverZoom?'is-zoomed':'')} role={inlineOnly?'group':'button'} tabIndex={inlineOnly?-1:0} aria-label={inlineOnly?text.photo:text.enlarge} onScroll={scrollPhotos} onKeyDown={event=>{if(!inlineOnly&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openViewer()}}} onPointerMove={move} onPointerLeave={()=>setHoverZoom(false)} onPointerDown={down} onPointerUp={up} onPointerCancel={()=>{drag.current=null}} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}openViewer()}}>
 <div className="gallery-track" style={{transform:`translateX(-${index*100}%)`}}>{images.map((src,i)=><div className="gallery-slide" key={src} aria-hidden={i!==index}><Image src={src} alt={imageAlt?.(i) || `${product.name} · ${product.description} · ${text.view} ${i+1}`} width={1000} height={1500} sizes="(max-width: 760px) 100vw, 52vw" quality={85} priority={i===0} draggable={false} style={i===index?{transformOrigin:`${position.x}% ${position.y}%`}:undefined}/></div>)}</div>
 </div>
 {images.length>1&&<><button className="gallery-arrow previous" type="button" aria-label={text.previous} onClick={()=>choose(index-1)}><ChevronLeft size={23}/></button><button className="gallery-arrow next" type="button" aria-label={text.next} onClick={()=>choose(index+1)}><ChevronRight size={23}/></button></>}
 {showActions&&<><button className="gallery-help-button" aria-label={t('Open product help')} onClick={onHelp}><Sparkles size={20}/></button><div className="gallery-product-actions"><button aria-label={t(saved?'Unsave this product':'Save this product')} aria-pressed={saved} onClick={onSave}><Heart size={21} fill={saved?'currentColor':'none'}/></button><button className="gallery-bag-action" aria-label={t('Choose size for this product')} onClick={onChooseSize}><ShoppingBag size={21}/></button></div></>}
 <div className="gallery-meter" aria-hidden="true">{images.map((_,i)=><span key={i} className={index===i?'active':''}/>)}</div>
 <span className="gallery-count" aria-live="polite">{index+1} / {images.length}</span><button className="gallery-expand" aria-label={text.fullScreen} onClick={openViewer}><Expand size={19}/></button>
 </div><p className="gallery-hint"><span className="gallery-desktop-hint">{text.desktopHint}</span><span className="gallery-touch-hint">{text.touchHint}</span></p>{images.length>1&&<div className="gallery-dots" aria-label={text.positions}>{images.map((_,i)=><button key={i} aria-label={text.goImage+' '+(i+1)} aria-current={index===i?'true':undefined} onClick={()=>choose(i)}/>)}</div>}</div>
 </div><dialog className="image-viewer" ref={dialog} aria-label={product.name+' '+text.viewer} onKeyDown={e=>{if(images.length>1&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();choose(index+(e.key==='ArrowRight'?1:-1))}}} onCancel={()=>setExpanded(false)}>{expanded&&<><header><span>{product.name}<small>{index+1} / {images.length}</small></span><div><button aria-label={zoomed?text.zoomOut:text.zoomIn} onClick={()=>setZoomed(!zoomed)}>{zoomed?<ZoomOut/>:<ZoomIn/>}</button><button aria-label={text.close} onClick={()=>setExpanded(false)}><X/></button></div></header><div className="lightbox-stage"><button className={'lightbox-image '+(zoomed?'zoomed':'')} aria-label={zoomed?text.zoomOutArea:text.zoomInArea} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}setZoomed(!zoomed)}} onPointerMove={e=>{if(zoomed){const b=e.currentTarget.getBoundingClientRect();setPosition({x:(e.clientX-b.left)/b.width*100,y:(e.clientY-b.top)/b.height*100})}}} onPointerDown={down} onPointerUp={up} onPointerCancel={()=>{drag.current=null}}><Image src={images[index]} alt={imageAlt?.(index) || `${product.name} · ${text.view} ${index+1}`} width={1600} height={2400} sizes="100vw" quality={85} draggable={false} style={{transformOrigin:`${position.x}% ${position.y}%`}}/></button>{images.length>1&&<><button className="gallery-arrow previous" aria-label={text.previousLarge} onClick={()=>choose(index-1)}><ChevronLeft/></button><button className="gallery-arrow next" aria-label={text.nextLarge} onClick={()=>choose(index+1)}><ChevronRight/></button></>}</div>{images.length>1&&thumbnails(true)}</>}</dialog></>;
}

