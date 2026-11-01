import Image from 'next/image';
import Link from 'next/link';
import type {Product} from '@/lib/types';
import {productFamily,colourLabel} from '@/lib/product-family';

type Option={key:string;label:string;image?:string;href:string;selected:boolean};
export function cardColourOptions(product:Product,products:Product[],labelFor:(p:Product)=>string=colourLabel):Option[]{
 const identifiers=product.content?.trade?.identifiers||{};
 const variants=product.variants.filter(v=>!identifiers[v.id]?.archived);
 const colours=[...new Set(variants.map(v=>identifiers[v.id]?.colour).filter((colour):colour is string=>Boolean(colour)))];
 if(colours.length>1)return colours.map((colour,index)=>{
  const variant=variants.find(v=>identifiers[v.id]?.colour===colour&&identifiers[v.id]?.images?.length);
  return {key:colour,label:colour,image:variant?identifiers[variant.id].images?.[0]:undefined,href:'/products/'+product.slug+'?colour='+encodeURIComponent(colour),selected:index===0};
 });
 return productFamily(products,product).map(option=>({key:option.id,label:labelFor(option),image:option.images[0],href:'/products/'+option.slug,selected:option.id===product.id}));
}
export default function ProductCardColours({product,products,labelFor}:{product:Product;products:Product[];labelFor?:(p:Product)=>string}){
 const options=cardColourOptions(product,products,labelFor);
 if(options.length<2)return null;
 return <div className="product-card-colours" aria-label={'Available colours for '+product.name}><span className="product-card-colour-count">{options.length} colours</span><div className="product-card-swatch-rail">{options.map(option=><Link key={option.key} href={option.href} title={option.label} aria-label={'View '+product.name+' in '+option.label} className={'product-card-swatch'+(option.selected?' selected':'')} data-colour={option.label} aria-current={option.selected?'true':undefined}>{option.image?<Image src={option.image} alt="" width={44} height={44} sizes="44px"/>:<span className="product-card-swatch-placeholder" aria-hidden="true">{option.label.split(/[\s-]+/).map(word=>word[0]).slice(0,2).join('')}</span>}{option.selected&&<span className="sr-only">Current colour</span>}</Link>)}</div></div>;
}
