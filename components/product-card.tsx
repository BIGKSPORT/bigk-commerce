'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Heart,Plus,Scale,Check} from 'lucide-react';
import {colourOptions,groupUrl,type ColourOption} from '@/lib/product-groups';
import type {Product} from '@/lib/types';
import {money} from '@/lib/format';
import ProductCardMedia from './product-card-media';
import ProductCardColours from './product-card-colours';
export default function ProductCard({initial,products,mode,savedIds,comparedIds,onSave,onCompare,onQuickView}:{initial:ColourOption;products:Product[];mode:'demo'|'live';savedIds:string[];comparedIds:string[];onSave:(id:string)=>void;onCompare:(id:string)=>void;onQuickView:(p:Product,colour:string)=>void}){
 const [selectedKey,setSelectedKey]=useState(initial.id);const options=colourOptions(products,initial.product);const selected=options.find(option=>option.id===selectedKey)||initial;
 const saved=savedIds.includes(selected.product.id),compared=comparedIds.includes(selected.product.id);
 const p={...selected.product,images:selected.images,variants:selected.variants},href=groupUrl(products,selected);
 return <article className="product-card" data-product-id={initial.product.id} data-card-colour-id={initial.id} data-selected-colour={selected.colour}>
 <div className="product-visual"><ProductCardMedia key={selected.id} product={p} href={href}/><span className="product-code">{selected.article}</span><div className="product-flags"><span>{p.active&&p.approved?'Collection':'Preview'}</span></div><button className={'save-button '+(saved?'is-saved':'')} aria-label={(saved?'Unsave ':'Save ')+p.name} aria-pressed={saved} onClick={()=>onSave(p.id)}><Heart size={18} fill={saved?'currentColor':'none'}/></button><button className="quick-view" onClick={()=>onQuickView(p,selected.colour)}>QUICK VIEW <Plus size={15}/></button></div>
 <div className="product-meta"><div><p>{p.category}</p><Link prefetch={false} href={href}><h3>{p.name}</h3></Link><span>{p.description}</span></div><strong>{p.priceCents===null?'Price pending':money(p.priceCents)}{mode==='demo'&&p.priceCents!==null&&<small>preview price</small>}</strong></div><ProductCardColours product={p} products={products} selectedKey={selected.id} onSelect={setSelectedKey}/><div className="product-bottom"><span>{[...new Set(p.variants.map(v=>v.size))].join(' · ')}</span><button onClick={()=>onCompare(p.id)} aria-pressed={compared}>{compared?<Check size={13}/>:<Scale size={13}/>} Compare</button></div>
 </article>;
}
