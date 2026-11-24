import {b10WhiteSlug,isB10White,publicProductSlug,preserveProductQuery,publicUrlReserved} from './product-public-urls';
import type {Product} from './types';
import {colourOptions,parentId,normalizedSize,groupUrl,type ColourOption} from './product-groups';
import {resolveProduct} from './catalog-view';
export function resolveGroupSelection(raw:Product[],visible:Product[],slug:string,query:{colour?:string;colourId?:string;size?:string}){
 const direct=resolveProduct(raw,slug);
 const whitePage=!direct&&slug===b10WhiteSlug;
 const requested=whitePage?raw.find(p=>p.id==='B10'):direct;if(!requested)return;
 const rootId=parentId(requested,raw),root=raw.find(p=>p.id===rootId);if(!root)return;
 const options=colourOptions(visible,visible.find(p=>parentId(p,raw)===rootId)||root).filter(option=>parentId(option.product,raw)===rootId);
 if(!options.length)return;
 let selected:ColourOption|undefined;
 if(whitePage)selected=options.find(option=>isB10White(option.product.id,option.colour));
 else if(query.colourId)selected=options.find(o=>o.product.id===query.colourId&&(!query.colour||o.colour.toLowerCase()===query.colour.toLowerCase()));
 else if(query.colour)selected=options.find(o=>o.colour.toLowerCase()===query.colour!.toLowerCase());
 else selected=options.find(o=>o.product.id===requested.id)||options[0];
 if(!selected)return;
 const size=query.size?selected.variants.find(v=>normalizedSize(v.size)===normalizedSize(query.size!))?.size:undefined;
 const dedicatedWhite=(!direct||direct.id==='B10')&&isB10White(rootId,selected.colour)&&
  !publicUrlReserved(b10WhiteSlug,raw,rootId);
 const groupSlug=publicProductSlug(root,raw);
 const publicSlug=dedicatedWhite?b10WhiteSlug:groupSlug;
 const redirect=requested.id!==root.id||slug!==publicSlug||query.colourId!==undefined||(dedicatedWhite&&query.colour!==undefined);
 return {root,selected,options,size,groupSlug,canonical:'/products/'+publicSlug,redirect:redirect?preserveProductQuery(groupUrl(raw,selected,size),query):undefined};
}
