import type {Product} from './types';
import {colourOptions,parentId,normalizedSize,groupUrl,type ColourOption} from './product-groups';
import {resolveProduct} from './catalog-view';
export function resolveGroupSelection(raw:Product[],visible:Product[],slug:string,query:{colour?:string;colourId?:string;size?:string}){
 const requested=resolveProduct(raw,slug);if(!requested)return;
 const rootId=parentId(requested,raw),root=raw.find(p=>p.id===rootId);if(!root)return;
 const options=colourOptions(visible,visible.find(p=>parentId(p,raw)===rootId)||root).filter(option=>parentId(option.product,raw)===rootId);
 if(!options.length)return;
 let selected:ColourOption|undefined;
 if(query.colourId)selected=options.find(o=>o.product.id===query.colourId&&(!query.colour||o.colour.toLowerCase()===query.colour.toLowerCase()));
 else if(query.colour)selected=options.find(o=>o.colour.toLowerCase()===query.colour!.toLowerCase());
 else selected=options.find(o=>o.product.id===requested.id)||options[0];
 if(!selected)return;
 const size=query.size?selected.variants.find(v=>normalizedSize(v.size)===normalizedSize(query.size!))?.size:undefined;
 return {root,selected,options,size,canonical:'/products/'+root.slug,redirect:requested.id!==root.id||slug!==root.slug?groupUrl(raw,selected,size):undefined};
}
