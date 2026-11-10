import {createHash} from 'node:crypto';
import type {Product} from './types';
import {publicProducts} from './catalog-view';
import {productGroups,groupUrl} from './product-groups';
import {validGtin,canonicalGtin} from './product-identifiers';
import {seller} from './seller';
import {localizePath} from './i18n/site-routing';
export type FeedItem={id:string;item_group_id:string;title:string;description:string;link:string;image_link:string;additional_image_link:string[];availability:'in_stock'|'out_of_stock';price:string;brand:string;gtin:string;color:string;size:string;gender:string;age_group:string;condition:string;product_type:string};
export type FeedIssue={productId:string;sourceId:string;variantId:string;name:string;size:string;missing:string[]};
export function feedItemId(id:string){return id.length<=50?id:'v_'+createHash('sha256').update(id).digest('hex').slice(0,40)}
function photoUrl(path:string){try{const url=new URL(path,seller.origin);return url.origin===seller.origin&&/^\/(?:api\/media\/|products\/web\/)/.test(url.pathname)?url.href:''}catch{return ''}}
const clean=(text:string,max:number)=>text.replace(/<[^>]*>/g,' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
export function catalogueFeed(raw:Product[]){
 const catalog=publicProducts(raw),items:FeedItem[]=[],issues:FeedIssue[]=[];
 const groups=productGroups(catalog);
 const candidates=groups.flatMap(group=>group.colours.flatMap(option=>option.variants.map(variant=>({group,option,variant}))));
 const gtins=new Map<string,number>();
 for(const {option,variant} of candidates){const gtin=option.product.content?.trade?.identifiers?.[variant.id]?.gtin||'';if(validGtin(gtin))gtins.set(canonicalGtin(gtin),(gtins.get(canonicalGtin(gtin))||0)+1)}
 for(const {group,option,variant} of candidates){
  const p=option.product,trade=p.content?.trade,parent=group.parent.content?.trade,identifier=trade?.identifiers?.[variant.id],gtin=identifier?.gtin||'';
  const gender=trade?.gender||parent?.gender||'',age=trade?.ageGroup||parent?.ageGroup||'',condition=trade?.condition||parent?.condition||'';
  const images=option.images.map(photoUrl).filter(Boolean),title=clean(group.parent.name,150),description=clean(p.content?.details||p.description,5000);
  const missing:string[]=[];
  if(!title)missing.push('title');if(!description)missing.push('description');
  if(p.priceCents===null||!Number.isInteger(p.priceCents)||p.priceCents<=0)missing.push('price');
  if(!images.length)missing.push('photo');if(!option.colour||/confirm|unknown/i.test(option.colour))missing.push('colour');
  if(!variant.size.trim())missing.push('size');if(!validGtin(gtin))missing.push('valid GTIN');
  else if(gtins.get(canonicalGtin(gtin))!==1)missing.push('unique GTIN');
  if(!gender)missing.push('gender');if(!age)missing.push('age group');if(!condition)missing.push('condition');
  if(missing.length){issues.push({productId:group.id,sourceId:p.id,variantId:variant.id,name:group.parent.name,size:variant.size,missing});continue}
  items.push({id:feedItemId(variant.id),item_group_id:group.id,title:clean([title,option.colour,variant.size].join(' · '),150),description,
   link:seller.origin+localizePath(groupUrl(catalog,option,variant.size),'en'),image_link:images[0],additional_image_link:images.slice(1,11),
   availability:variant.stock-variant.reserved>0?'in_stock':'out_of_stock',price:(p.priceCents!/100).toFixed(2)+' EUR',brand:'BIG K',gtin,color:option.colour,size:variant.size,gender,age_group:age,condition,product_type:p.category});
 }
 return {items,issues,publicProducts:catalog.length,styles:groups.length,variants:candidates.length};
}
const xml=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function googleFeedXml(items:FeedItem[]){
 const fields=['id','item_group_id','title','description','link','image_link','availability','price','brand','gtin','color','size','gender','age_group','condition','product_type'] as const;
 return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>BIG K product catalogue</title><link>'+seller.origin+'</link><description>Validated public catalogue, EUR including VAT</description>'+items.map(item=>'<item>'+fields.map(field=>'<g:'+field+'>'+xml(item[field])+'</g:'+field+'>').join('')+item.additional_image_link.map(image=>'<g:additional_image_link>'+xml(image)+'</g:additional_image_link>').join('')+'</item>').join('')+'</channel></rss>';
}
export function metaFeedCsv(items:FeedItem[]){
 const fields=['id','title','description','availability','condition','price','link','image_link','brand','gtin','item_group_id','color','size','gender','age_group'] as const;
 const quote=(value:string)=>'"'+value.replace(/"/g,'""')+'"';
 return fields.join(',')+'\r\n'+items.map(item=>fields.map(field=>quote(field==='availability'?item.availability.replaceAll('_',' '):item[field])).join(',')).join('\r\n')+'\r\n';
}
