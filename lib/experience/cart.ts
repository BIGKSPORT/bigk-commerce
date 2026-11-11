import type {CartLine,Product} from '../types';
import type {ExperienceMode} from './types';
export const fixtureCartKey='bigk-experience-fixture-bag-v1';
export function experienceCartKey(mode:ExperienceMode){return mode==='fixture'?fixtureCartKey:'bigk-bag-v2';}
export function readExperienceCart(raw:string|null):CartLine[]{
 try{const rows:unknown=JSON.parse(raw||'[]');if(!Array.isArray(rows))return [];
  const merged=new Map<string,number>();
  for(const row of rows)if(row&&typeof row.variantId==='string'&&Number.isInteger(row.quantity)&&row.quantity>0&&row.quantity<=5)merged.set(row.variantId,Math.min(5,(merged.get(row.variantId)||0)+row.quantity));
  return [...merged].map(([variantId,quantity])=>({variantId,quantity}));
 }catch{return [];}
}
export function availableQuantity(product:Product,variantId:string){const v=product.variants.find(v=>v.id===variantId);return !v||!product.active||!product.approved||product.priceCents===null||product.content?.trade?.identifiers?.[variantId]?.archived?0:Math.max(0,Math.min(5,v.stock-v.reserved));}
export function addExperienceLine(lines:CartLine[],product:Product,variantId:string):CartLine[]{
 const previous=lines.find(line=>line.variantId===variantId),quantity=(previous?.quantity||0)+1;
 if(quantity>availableQuantity(product,variantId)||!previous&&lines.length>=30)throw Error('quantity');
 return previous?lines.map(line=>line.variantId===variantId?{...line,quantity}:line):[...lines,{variantId,quantity}];
}
export function experienceTotal(lines:CartLine[],products:Product[]){return lines.reduce((sum,line)=>sum+(products.find(p=>p.variants.some(v=>v.id===line.variantId))?.priceCents||0)*line.quantity,0);}
