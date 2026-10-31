import type {Product} from './types';
import {canonicalGtin} from './product-identifiers';
/** Suggest only exact numeric identifiers or complete SKU prefixes, never product-name guesses. */
export function photoProductCandidates(filename:string,products:Product[]):string[]{
 const stem=filename.replace(/\.[^.]+$/,'');const tokens=[...stem.matchAll(/(?:^|[^0-9])(\d{8}|\d{12,14})(?=[^0-9]|$)/g)].map(m=>m[1]);
 return products.filter(p=>!p.tags.some(t=>t.startsWith('alias:'))).filter(p=>{
  const code=p.code.match(/\d{8}$/)?.[0];if(code&&tokens.includes(code))return true;
  return Object.values(p.content?.trade?.identifiers||{}).some(id=>(id.gtin&&tokens.some(token=>canonicalGtin(token)===canonicalGtin(id.gtin)))||(id.sku&&(stem===id.sku||stem.startsWith(id.sku+'_')||stem.startsWith(id.sku+'-'))));
 }).map(p=>p.id);
}
