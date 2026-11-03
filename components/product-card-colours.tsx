'use client';
import Image from 'next/image';
import Link from './site-link';
import {useSiteLanguage} from './site-language';
import type {MouseEvent} from 'react';
import type {Product} from '@/lib/types';
import {colourOptions,groupUrl} from '@/lib/product-groups';
export type CardColourOption={key:string;label:string;image?:string;href:string;selected:boolean;productId:string};
export function cardColourOptions(product:Product,products:Product[],_labelFor?:(p:Product)=>string,selectedKey?:string):CardColourOption[]{return colourOptions(products,product).map((option,index)=>({key:option.id,label:option.colour,image:option.images[0],href:groupUrl(products,option),selected:selectedKey?selectedKey===option.id:option.product.id===product.id&&(index===0||colourOptions(products,product).filter(o=>o.product.id===product.id).length===1),productId:option.product.id}))}
export default function ProductCardColours({product,products,labelFor,selectedKey,onSelect}:{product:Product;products:Product[];labelFor?:(p:Product)=>string;selectedKey?:string;onSelect?:(key:string)=>void}){
 const {t}=useSiteLanguage();
 const options=cardColourOptions(product,products,labelFor,selectedKey);if(options.length<2)return null;
 function select(event:MouseEvent<HTMLAnchorElement>,key:string){if(!onSelect||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();onSelect(key)}
 return <div className="product-card-colours" aria-label={t('Available colours for')+' '+product.name}><span className="product-card-colour-count">{options.length} {t("colours")}</span><div className="product-card-swatch-rail">{options.map(option=><Link prefetch={false} key={option.key} href={option.href} title={option.label} onClick={event=>select(event,option.key)} aria-label={t('View')+' '+product.name+' '+t('in')+' '+option.label} className={'product-card-swatch'+(option.selected?' selected':'')} data-colour={option.label} aria-current={option.selected?'true':undefined}>{option.image?<Image src={option.image} alt="" width={44} height={44} sizes="44px"/>:<span className="product-card-swatch-placeholder" aria-hidden="true">{option.label.split(/[\s-]+/).map(word=>word[0]).slice(0,2).join('')}</span>}</Link>)}</div></div>;
}
