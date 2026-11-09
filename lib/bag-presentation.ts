import {parentId,colourOptions,type ColourOption} from './product-groups';
import type {Product,CartLine} from './types';
export function bagMedia(product:Product,variantId:string){
 const identity=product.content?.trade?.identifiers?.[variantId];
 return {image:identity?.images?.[0]||product.images[0]||'',colour:identity?.colour||product.content?.trade?.colour||'',size:product.variants.find(v=>v.id===variantId)?.size||''};
}
/** Catalogue-only suggestions; never reserve stock or add a size without a choice. */
export function bagSuggestions(products:Product[],bag:CartLine[]):ColourOption[]{
 if(!bag.length)return [];
 const inBag=products.filter(p=>bag.some(line=>p.variants.some(v=>v.id===line.variantId))),excluded=new Set(inBag.map(p=>parentId(p,products)));
 if(!inBag.length)return [];
 const outerwear=inBag.some(p=>['Jackets & Vests','Fleece','Long sleeves','Thermal'].includes(p.category));
 const ranked=products.filter(p=>p.active&&p.approved&&p.priceCents!==null&&p.priceCents>0&&!excluded.has(parentId(p,products))).sort((a,b)=>{
  const rank=(p:Product)=>outerwear?(p.category==='Pants'?0:p.category==='Accessories'?1:2):(p.category==='Accessories'?0:p.category==='Jackets & Vests'?1:2);
  return rank(a)-rank(b);
 });
 const seen=new Set<string>(),result:ColourOption[]=[];
 for(const p of ranked){const id=parentId(p,products);if(seen.has(id))continue;const option=colourOptions(products,p).find(o=>o.product.id===p.id&&o.images.length&&o.variants.some(v=>!o.product.content?.trade?.identifiers?.[v.id]?.archived&&v.stock-v.reserved>0));if(option){seen.add(id);result.push(option);}if(result.length===2)break;}
 return result;
}
