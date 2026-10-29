'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import type {Product} from '@/lib/types';
export default function ProductCardMedia({product}:{product:Product}){
 const [index,setIndex]=useState(0),drag=useRef<{x:number;y:number}|null>(null),swiped=useRef(false);const count=product.images.length;
 const choose=(n:number)=>setIndex((n+count)%count);
 return <div className="card-photo-carousel" data-active-photo={index+1} onPointerLeave={e=>{if(e.pointerType==='mouse')setIndex(0)}}><Link href={'/products/'+product.slug} aria-label={'View '+product.name} onPointerMove={e=>{if(count>1&&e.pointerType==='mouse'&&matchMedia('(hover: hover) and (pointer: fine)').matches){const b=e.currentTarget.getBoundingClientRect();choose(Math.min(count-1,Math.max(0,Math.floor((e.clientX-b.left)/b.width*count))))}}} onPointerDown={e=>{swiped.current=false;if(e.pointerType!=='mouse'){drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}}} onPointerUp={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;drag.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)&&count>1){swiped.current=true;choose(index+(dx<0?1:-1))}}} onPointerCancel={()=>{drag.current=null}} onClick={e=>{if(swiped.current){e.preventDefault();swiped.current=false}}} onKeyDown={e=>{if(count>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();choose(index+(e.key==='ArrowRight'?1:-1))}}}>
 {count?<Image src={product.images[index]} alt={product.name+' · '+product.description+' · view '+(index+1)} width={500} height={650} sizes="(max-width: 580px) 45vw, (max-width: 1150px) 30vw, 22vw" quality={85} draggable={false}/>:<div className="photo-pending"><img className="pending-symbol" src="/brand/bigk-symbol.svg" alt="" width={64} height={64}/><span>PRODUCT PHOTOGRAPHY</span><small>Product photography in review</small></div>}
 </Link>{count>1&&<><button className="card-photo-arrow previous" aria-label={'Previous photo of '+product.name} onClick={()=>choose(index-1)}><ChevronLeft size={18}/></button><button className="card-photo-arrow next" aria-label={'Next photo of '+product.name} onClick={()=>choose(index+1)}><ChevronRight size={18}/></button><div className="card-photo-progress" aria-hidden="true">{product.images.map((_,i)=><span key={i} className={index===i?'active':''}/>)}</div></>}
 </div>;
}
