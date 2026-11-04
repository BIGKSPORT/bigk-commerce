import type {Product,CartLine,Variant} from './types';
import {parentId} from './product-groups';
export type CartOffer={product:Product;variants:Variant[];subtotal:number;reason:'complement'|'free_delivery'};
const complementary:Record<string,string[]>={'Sneakers':['Accessories','Pants'],'Jackets & Vests':['Accessories','Fleece','Pants'],Fleece:['Accessories','Jackets & Vests','Pants'],Pants:['Accessories','Fleece','Jackets & Vests'],Accessories:['Fleece','Jackets & Vests','Pants','Sneakers']};
export function cartOffer(catalog:Product[],bag:CartLine[]):CartOffer|null{
 if(!bag.length)return null;
 const owners=bag.map(line=>catalog.find(p=>p.variants.some(v=>v.id===line.variantId))).filter((p):p is Product=>Boolean(p));
 if(!owners.length)return null;
 const occupied=new Set(owners.map(p=>parentId(p,catalog)));
 const subtotal=bag.reduce((sum,line)=>sum+(catalog.find(p=>p.variants.some(v=>v.id===line.variantId))?.priceCents||0)*line.quantity,0),gap=Math.max(0,10000-subtotal);
 const choices=catalog.filter(p=>p.active&&p.approved&&p.priceCents!==null&&p.priceCents>0&&p.images.length&&!occupied.has(parentId(p,catalog))&&!p.tags.some(tag=>tag.startsWith('alias:'))).map(product=>{
 const variants=product.variants.filter(v=>v.stock-v.reserved>0&&!product.content?.trade?.identifiers?.[v.id]?.archived);
 const rank=Math.min(...owners.map(owner=>{const index=(complementary[owner.category]||['Accessories']).indexOf(product.category);return index<0?10:index}));
 const delivery=gap>0&&product.priceCents!>=gap&&product.priceCents!<=gap+2000;
 return {product,variants,rank,delivery};
 }).filter(p=>p.variants.length);
 choices.sort((a,b)=>a.rank-b.rank||Number(b.delivery)-Number(a.delivery)||a.product.priceCents!-b.product.priceCents!||a.product.id.localeCompare(b.product.id));
 const choice=choices[0];return choice?{product:choice.product,variants:choice.variants,subtotal,reason:choice.delivery?'free_delivery':'complement'}:null;
}
